"""Admin API for AI Manager Skills Platform."""
import csv
import io
import json
import logging
import math
import os
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func, or_, asc, desc, text
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


# =============================================================================
# Lesson Table Models (read-only, for analytics queries)
# =============================================================================

class Template(Base):
    __tablename__ = "templates"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class OutputType(Base):
    __tablename__ = "output_types"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class Checklist(Base):
    __tablename__ = "checklists"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class Decomposition(Base):
    __tablename__ = "decompositions"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class Delegation(Base):
    __tablename__ = "delegations"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class IterationTask(Base):
    __tablename__ = "iteration_tasks"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class FeedbackEntry(Base):
    __tablename__ = "feedback_entries"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class StatusReport(Base):
    __tablename__ = "status_reports"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class ContextDoc(Base):
    __tablename__ = "context_docs"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class FrontierZone(Base):
    __tablename__ = "frontier_zones"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class FrontierEncounter(Base):
    __tablename__ = "frontier_encounters"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


class ReferenceCard(Base):
    __tablename__ = "reference_cards"
    id = Column(UUID(as_uuid=False), primary_key=True)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    created_at = Column(DateTime)


# =============================================================================
# Audit Log Model
# =============================================================================

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    admin_note = Column(String(500), nullable=True)
    target_user_id = Column(UUID(as_uuid=False), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=sql_func.now())


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
# Audit Log Helper
# =============================================================================

async def log_admin_action(
    db: AsyncSession,
    action: str,
    target_user_id: Optional[str] = None,
    details: Optional[dict] = None,
    admin_note: Optional[str] = None,
):
    """Write an entry to the admin audit log."""
    entry = AdminAuditLog(
        action=action,
        target_user_id=target_user_id,
        details=details,
        admin_note=admin_note,
    )
    db.add(entry)
    await db.flush()


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
    page: int
    pages: int


class PasswordResetRequest(BaseModel):
    new_password: str


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    users_by_week: dict


class LessonAnalyticsItem(BaseModel):
    lesson: int
    lesson_name: str
    total_items: int
    unique_users: int
    avg_items_per_user: float


class LessonAnalyticsResponse(BaseModel):
    lessons: List[LessonAnalyticsItem]


class AuditLogEntry(BaseModel):
    id: str
    action: str
    admin_note: Optional[str]
    target_user_id: Optional[str]
    details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    entries: List[AuditLogEntry]
    total: int
    page: int
    pages: int


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
    # Create audit log table if it doesn't exist
    async with engine.begin() as conn:
        await conn.run_sync(AdminAuditLog.__table__.create, checkfirst=True)
    logger.info("Audit log table ready")
    yield
    logger.info("Shutting down Admin API...")
    await engine.dispose()


app = FastAPI(
    title="AI Manager Skills - Admin API",
    description="Admin API for user management and platform analytics",
    version="1.0.0",
    lifespan=lifespan
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Admin API"}


# =============================================================================
# Users Endpoints
# =============================================================================

@app.get("/admin/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = Query(None, description="Search by email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: str = Query("created_at", description="Sort field: created_at, email"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """List users with search, filter, sort, and pagination."""
    query = select(User)
    count_query = select(func.count(User.id))

    # Search filter
    if search:
        search_filter = User.email.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Active status filter
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    # Sorting
    sort_column = User.email if sort_by == "email" else User.created_at
    order_func = asc if sort_order == "asc" else desc
    query = query.order_by(order_func(sort_column))

    # Pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    pages = math.ceil(total / limit) if limit > 0 else 1
    page = (skip // limit) + 1 if limit > 0 else 1

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        pages=pages,
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
    await log_admin_action(
        db, action="reset-password", target_user_id=user_id,
        details={"email": user.email},
    )
    await db.commit()

    logger.info("Password reset for user %s by admin", user.email)

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
    action = "enabled" if user.is_active else "disabled"
    await log_admin_action(
        db, action="toggle-active", target_user_id=user_id,
        details={"email": user.email, "new_status": action},
    )
    await db.commit()

    logger.info("User %s %s by admin", user.email, action)

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
    await log_admin_action(
        db, action="delete-user", target_user_id=user_id,
        details={"email": email},
    )
    await db.delete(user)
    await db.commit()

    logger.info("User %s deleted by admin", email)

    return {"message": "User deleted", "email": email}


# =============================================================================
# Platform Stats
# =============================================================================

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


# =============================================================================
# Lesson Analytics
# =============================================================================

# Mapping of lesson number -> (name, model class)
LESSON_TABLES = {
    1: ("Context Tracker", Conversation),
    2: ("Template Builder", Template),
    3: ("Trust Matrix", OutputType),
    4: ("Verification Tools", Checklist),
    5: ("Task Decomposer", Decomposition),
    6: ("Delegation Tracker", Delegation),
    7: ("Iteration Passes", IterationTask),
    8: ("Feedback Analyzer", FeedbackEntry),
    9: ("Status Reporter", WorkflowTemplate),
    10: ("Context Docs", ContextDoc),
    11: ("Frontier Mapper", FrontierZone),
    12: ("Reference Card", ReferenceCard),
}


@app.get("/admin/analytics/lessons", response_model=LessonAnalyticsResponse)
async def get_lesson_analytics(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Get per-lesson analytics: item counts, unique users, avg items per user."""
    lessons = []

    for lesson_num, (lesson_name, model) in LESSON_TABLES.items():
        try:
            # Total items
            total_result = await db.execute(select(func.count(model.id)))
            total_items = total_result.scalar() or 0

            # Unique users
            unique_result = await db.execute(
                select(func.count(model.user_id.distinct()))
            )
            unique_users = unique_result.scalar() or 0

            avg_items = round(total_items / unique_users, 2) if unique_users > 0 else 0.0

            lessons.append(LessonAnalyticsItem(
                lesson=lesson_num,
                lesson_name=lesson_name,
                total_items=total_items,
                unique_users=unique_users,
                avg_items_per_user=avg_items,
            ))
        except Exception as e:
            # Table may not exist yet; report zeros
            logger.warning("Could not query lesson %d (%s): %s", lesson_num, lesson_name, e)
            await db.rollback()
            lessons.append(LessonAnalyticsItem(
                lesson=lesson_num,
                lesson_name=lesson_name,
                total_items=0,
                unique_users=0,
                avg_items_per_user=0.0,
            ))

    return LessonAnalyticsResponse(lessons=lessons)


# =============================================================================
# Audit Log
# =============================================================================

@app.get("/admin/audit-log", response_model=AuditLogResponse)
async def get_audit_log(
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = Query(None, description="Filter by action type"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Get admin audit log with pagination and date filtering."""
    query = select(AdminAuditLog)
    count_query = select(func.count(AdminAuditLog.id))

    if action:
        query = query.where(AdminAuditLog.action == action)
        count_query = count_query.where(AdminAuditLog.action == action)

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.where(AdminAuditLog.created_at >= dt_from)
            count_query = count_query.where(AdminAuditLog.created_at >= dt_from)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format, use YYYY-MM-DD")

    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.where(AdminAuditLog.created_at <= dt_to)
            count_query = count_query.where(AdminAuditLog.created_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format, use YYYY-MM-DD")

    query = query.order_by(desc(AdminAuditLog.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    pages = math.ceil(total / limit) if limit > 0 else 1
    page = (skip // limit) + 1 if limit > 0 else 1

    return AuditLogResponse(
        entries=[AuditLogEntry.model_validate(e) for e in entries],
        total=total,
        page=page,
        pages=pages,
    )


# =============================================================================
# Data Export
# =============================================================================

@app.get("/admin/export/users")
async def export_users_csv(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Export all users as CSV."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    def generate():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "email", "is_active", "is_admin", "created_at", "updated_at"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for user in users:
            writer.writerow([
                user.id,
                user.email,
                user.is_active,
                user.is_admin,
                user.created_at.isoformat() if user.created_at else "",
                user.updated_at.isoformat() if user.updated_at else "",
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
