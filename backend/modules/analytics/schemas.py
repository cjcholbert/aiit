"""Pydantic schemas for analytics module."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""
    lesson: Optional[int] = Field(None, ge=1, le=12)
    page: str = Field(max_length=500)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=5000)


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""
    id: str
    user_id: str
    lesson: Optional[int]
    page: str
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PageViewCreate(BaseModel):
    """Schema for tracking page views."""
    page: str = Field(max_length=500)
    lesson: Optional[int] = None


class OverviewStats(BaseModel):
    """Schema for overview statistics."""
    total_sessions: int
    lessons_visited: int
    items_created: int
    avg_session_minutes: int
    current_streak: int
    longest_streak: int
    weekly_activity: List[int]


class LessonStats(BaseModel):
    """Schema for lesson statistics."""
    lesson: int
    title: str
    views: int
    items_created: int
    avg_rating: Optional[float]
    feedback_count: int
