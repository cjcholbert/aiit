"""Pydantic schemas for admin module."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# Cohort schemas
class CohortCreate(BaseModel):
    """Schema for creating a cohort."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    organization: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CohortUpdate(BaseModel):
    """Schema for updating a cohort."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    organization: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CohortResponse(BaseModel):
    """Schema for cohort response."""
    id: str
    name: str
    description: Optional[str]
    organization: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    is_active: bool
    member_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CohortMemberAdd(BaseModel):
    """Schema for adding a member to a cohort."""
    user_id: str


class CohortStats(BaseModel):
    """Schema for cohort statistics."""
    cohort_id: str
    cohort_name: str
    total_members: int
    active_members: int  # Members with activity in last 7 days
    avg_lessons_completed: float
    avg_items_created: float
    top_lessons: List[Dict[str, Any]]  # Most visited lessons


# A/B Test schemas
class ExperimentCreate(BaseModel):
    """Schema for creating an A/B test experiment."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    feature_key: str = Field(..., min_length=1, max_length=50)  # e.g., "lesson_3_layout"
    variants: List[str] = Field(..., min_items=2)  # e.g., ["control", "variant_a"]
    traffic_percentage: int = Field(100, ge=1, le=100)  # % of users in experiment


class ExperimentUpdate(BaseModel):
    """Schema for updating an experiment."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    traffic_percentage: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None
    winner: Optional[str] = None  # Winning variant when concluding


class ExperimentResponse(BaseModel):
    """Schema for experiment response."""
    id: str
    name: str
    description: Optional[str]
    feature_key: str
    variants: List[str]
    traffic_percentage: int
    is_active: bool
    winner: Optional[str]
    created_at: datetime
    concluded_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExperimentAssignment(BaseModel):
    """Schema for a user's experiment assignment."""
    experiment_id: str
    feature_key: str
    variant: str


class ExperimentEvent(BaseModel):
    """Schema for tracking experiment events."""
    feature_key: str
    event_type: str  # e.g., "view", "click", "complete"
    metadata: Optional[Dict[str, Any]] = None


class ExperimentStats(BaseModel):
    """Schema for experiment statistics."""
    experiment_id: str
    experiment_name: str
    total_participants: int
    variant_stats: Dict[str, Dict[str, Any]]  # {variant: {views, conversions, rate}}


# Admin user management
class UserAdminView(BaseModel):
    """Schema for admin view of users."""
    id: str
    email: str
    is_active: bool
    is_admin: bool
    cohort_id: Optional[str]
    cohort_name: Optional[str]
    created_at: datetime
    last_activity: Optional[datetime]
    lessons_visited: int
    items_created: int

    class Config:
        from_attributes = True
