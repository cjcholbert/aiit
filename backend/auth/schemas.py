"""Pydantic schemas for authentication."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Request schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str = Field(max_length=100)


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Request schema for token refresh."""
    refresh_token: str = Field(max_length=1000)


class UserResponse(BaseModel):
    """Response schema for user profile."""
    id: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    """Request schema for password change (admin)."""
    new_password: str = Field(min_length=8, max_length=100)


class PasswordChangeRequest(BaseModel):
    """Request schema for user-initiated password change."""
    current_password: str = Field(max_length=100)
    new_password: str = Field(min_length=8, max_length=100)
