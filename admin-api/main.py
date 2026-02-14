"""Admin API for AI Manager Skills Platform."""
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from sqlalchemy.orm import declarative_base
from passlib.context import CryptContext
from dotenv import load_dotenv

# Import models from backend (shared database)
import sys
sys.path.insert(0, '/app')

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_manager_skills"
    ADMIN_SECRET_KEY: str = "admin_change_me"
    JWT_SECRET_KEY: str = "change_me"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =============================================================================
# Database Setup (Reuse backend models structure)
# =============================================================================

Base = declarative_base()

# Define models inline to avoid import issues
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func as sql_func
import uuid

def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=sql_func.now())
    updated_at = Column(DateTime, server_default=sql_func.now(), onupdate=sql_func.now())


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week = Column(Integer, nullable=False)
    completed_exercises = Column(JSON, default=list)
    last_activity = Column(DateTime, server_default=sql_func.now())


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=sql_func.now())
    raw_transcript = Column(Text, nullable=False)
    analysis = Column(JSON, nullable=False)
    user_edits = Column(JSON, nullable=True)


# Database engine
engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


# =============================================================================
# Schemas
# =============================================================================

class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    conversation_count: int
    last_activity: Optional[datetime]
    progress_by_week: dict


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


class PasswordResetRequest(BaseModel):
    new_password: str


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    users_by_week: dict


# =============================================================================
# Auth Dependency
# =============================================================================

async def verify_admin_key(x_admin_key: str = Header(None)):
    """Verify admin API key."""
    if not x_admin_key or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key"
        )
    return True


# =============================================================================
# Application
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Admin API...")
    yield
    logger.info("Shutting down Admin API...")
    await engine.dispose()


app = FastAPI(
    title="AI Manager Skills - Admin API",
    description="Admin API for user management and platform analytics",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Admin API"}


@app.get("/admin/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """List all users."""
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    users = result.scalars().all()

    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total
    )


@app.get("/admin/users/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Get user details with progress."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get conversation count
    conv_result = await db.execute(
        select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
    )
    conv_count = conv_result.scalar() or 0

    # Get last activity
    last_conv = await db.execute(
        select(Conversation.created_at)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .limit(1)
    )
    last_activity = last_conv.scalar_one_or_none()

    # Get progress by week
    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress_records = progress_result.scalars().all()
    progress_by_week = {
        p.week: {
            "completed_exercises": p.completed_exercises or [],
            "last_activity": p.last_activity.isoformat() if p.last_activity else None
        }
        for p in progress_records
    }

    return UserDetailResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        conversation_count=conv_count,
        last_activity=last_activity,
        progress_by_week=progress_by_week
    )


@app.post("/admin/users/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Reset a user's password (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash = pwd_context.hash(request.new_password)
    await db.commit()

    logger.info(f"Password reset for user {user.email} by admin")

    return {"message": "Password reset successfully"}


@app.post("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Enable/disable a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()

    action = "enabled" if user.is_active else "disabled"
    logger.info(f"User {user.email} {action} by admin")

    return {"message": f"User {action}", "is_active": user.is_active}


@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Delete a user and all their data."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.email
    await db.delete(user)
    await db.commit()

    logger.info(f"User {email} deleted by admin")

    return {"message": "User deleted", "email": email}


@app.get("/admin/stats", response_model=PlatformStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Get platform-wide statistics."""
    # Total users
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0

    # Active users
    active_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = active_result.scalar() or 0

    # Total conversations
    conv_result = await db.execute(select(func.count(Conversation.id)))
    total_conversations = conv_result.scalar() or 0

    # Users with activity per week
    progress_result = await db.execute(
        select(UserProgress.week, func.count(UserProgress.user_id.distinct()))
        .group_by(UserProgress.week)
    )
    users_by_week = {row[0]: row[1] for row in progress_result.all()}

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        total_conversations=total_conversations,
        users_by_week=users_by_week
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
