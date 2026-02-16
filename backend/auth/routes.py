"""Authentication routes."""
from datetime import datetime, timezone
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.rate_limit import limiter
from backend.database.models import User, RefreshToken
from .jwt import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from .schemas import (
    UserCreate, UserLogin, TokenResponse, RefreshRequest, UserResponse,
    PasswordChangeRequest
)
from .dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.

    Returns access and refresh tokens upon successful registration.
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email.lower())
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=user_data.email.lower(),
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("New user registered: %s", user.email)

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token, refresh_expires = create_refresh_token(user.id)

    # Store refresh token
    token_record = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=refresh_expires
    )
    db.add(token_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    logger.info("User logged in: %s", user.email)

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token, refresh_expires = create_refresh_token(user.id)

    # Store refresh token
    token_record = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=refresh_expires
    )
    db.add(token_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_tokens(
    request: Request,
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.
    """
    # Decode refresh token
    payload = decode_token(body.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Check expiration
    exp = payload.get("exp")
    if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )

    # Verify token exists and not revoked
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == body.refresh_token,
            RefreshToken.revoked == False
        )
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked"
        )

    # Get user
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled"
        )

    # Revoke old refresh token
    token_record.revoked = True

    # Generate new tokens
    access_token = create_access_token(user.id)
    new_refresh_token, refresh_expires = create_refresh_token(user.id)

    # Store new refresh token
    new_token_record = RefreshToken(
        user_id=user.id,
        token=new_refresh_token,
        expires_at=refresh_expires
    )
    db.add(new_token_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile.
    """
    return current_user


@router.post("/change-password")
@limiter.limit("3/minute")
async def change_password(
    request: Request,
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change the current user's password."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password_hash = get_password_hash(body.new_password)
    await db.commit()

    logger.info("Password changed for user: %s", current_user.email)
    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by revoking all their refresh tokens.
    """
    # Revoke all user's refresh tokens
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        )
    )
    tokens = result.scalars().all()

    for token in tokens:
        token.revoked = True

    await db.commit()

    logger.info("User logged out: %s", current_user.email)

    return {"message": "Successfully logged out"}
