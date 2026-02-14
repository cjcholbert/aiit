"""API routes for analytics module."""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.auth import get_current_user
from backend.database.models import (
    User, PageView, Feedback, Conversation, Template, Prediction,
    Checklist, Decomposition, Delegation, IterationTask, FeedbackEntry,
    WorkflowTemplate, ContextDoc, FrontierZone, FrontierEncounter, ReferenceCard
)
from .schemas import (
    FeedbackCreate, FeedbackResponse, PageViewCreate,
    OverviewStats, LessonStats
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Lesson titles for reference
LESSON_TITLES = {
    1: "Context Tracker",
    2: "Feedback Analyzer",
    3: "Template Builder",
    4: "Context Docs",
    5: "Trust Matrix",
    6: "Verification Tools",
    7: "Task Decomposer",
    8: "Delegation Tracker",
    9: "Iteration Passes",
    10: "Status Reporter",
    11: "Frontier Mapper",
    12: "Reference Card"
}


def get_date_range(range_str: str) -> datetime:
    """Get start date based on range string."""
    now = datetime.utcnow()
    if range_str == "day":
        return now - timedelta(days=1)
    elif range_str == "week":
        return now - timedelta(weeks=1)
    elif range_str == "month":
        return now - timedelta(days=30)
    else:  # all
        return datetime(2000, 1, 1)


@router.post("/feedback", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback for a lesson or page."""
    new_feedback = Feedback(
        user_id=current_user.id,
        lesson=feedback.lesson,
        page=feedback.page,
        rating=feedback.rating,
        comment=feedback.comment
    )
    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)
    return new_feedback


@router.get("/feedback/recent", response_model=List[FeedbackResponse])
async def get_recent_feedback(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent feedback (admin only, or own feedback)."""
    if current_user.is_admin:
        query = select(Feedback).order_by(desc(Feedback.created_at)).limit(limit)
    else:
        query = select(Feedback).where(
            Feedback.user_id == current_user.id
        ).order_by(desc(Feedback.created_at)).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/pageview")
async def track_pageview(
    pageview: PageViewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track a page view."""
    new_view = PageView(
        user_id=current_user.id,
        page=pageview.page,
        lesson=pageview.lesson
    )
    db.add(new_view)
    await db.commit()
    return {"status": "ok"}


@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    range: str = Query("week", regex="^(day|week|month|all)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview statistics for the user."""
    start_date = get_date_range(range)

    # Count page views (sessions approximation)
    views_query = select(func.count(PageView.id)).where(
        and_(
            PageView.user_id == current_user.id,
            PageView.created_at >= start_date
        )
    )
    total_sessions = (await db.execute(views_query)).scalar() or 0

    # Count unique lessons visited
    lessons_query = select(func.count(func.distinct(PageView.lesson))).where(
        and_(
            PageView.user_id == current_user.id,
            PageView.lesson.isnot(None),
            PageView.created_at >= start_date
        )
    )
    lessons_visited = (await db.execute(lessons_query)).scalar() or 0

    # Count items created across all lesson tables
    items_created = 0

    # Count conversations
    conv_query = select(func.count(Conversation.id)).where(
        and_(Conversation.user_id == current_user.id, Conversation.created_at >= start_date)
    )
    items_created += (await db.execute(conv_query)).scalar() or 0

    # Count templates
    tmpl_query = select(func.count(Template.id)).where(
        and_(Template.user_id == current_user.id, Template.created_at >= start_date)
    )
    items_created += (await db.execute(tmpl_query)).scalar() or 0

    # Count predictions
    pred_query = select(func.count(Prediction.id)).where(
        and_(Prediction.user_id == current_user.id, Prediction.created_at >= start_date)
    )
    items_created += (await db.execute(pred_query)).scalar() or 0

    # Count checklists
    check_query = select(func.count(Checklist.id)).where(
        and_(Checklist.user_id == current_user.id, Checklist.created_at >= start_date)
    )
    items_created += (await db.execute(check_query)).scalar() or 0

    # Count decompositions
    decomp_query = select(func.count(Decomposition.id)).where(
        and_(Decomposition.user_id == current_user.id, Decomposition.created_at >= start_date)
    )
    items_created += (await db.execute(decomp_query)).scalar() or 0

    # Count delegations
    deleg_query = select(func.count(Delegation.id)).where(
        and_(Delegation.user_id == current_user.id, Delegation.created_at >= start_date)
    )
    items_created += (await db.execute(deleg_query)).scalar() or 0

    # Count iteration tasks
    iter_query = select(func.count(IterationTask.id)).where(
        and_(IterationTask.user_id == current_user.id, IterationTask.created_at >= start_date)
    )
    items_created += (await db.execute(iter_query)).scalar() or 0

    # Count feedback entries
    fb_query = select(func.count(FeedbackEntry.id)).where(
        and_(FeedbackEntry.user_id == current_user.id, FeedbackEntry.created_at >= start_date)
    )
    items_created += (await db.execute(fb_query)).scalar() or 0

    # Count workflow templates
    wf_query = select(func.count(WorkflowTemplate.id)).where(
        and_(WorkflowTemplate.user_id == current_user.id, WorkflowTemplate.created_at >= start_date)
    )
    items_created += (await db.execute(wf_query)).scalar() or 0

    # Count context docs
    ctx_query = select(func.count(ContextDoc.id)).where(
        and_(ContextDoc.user_id == current_user.id, ContextDoc.created_at >= start_date)
    )
    items_created += (await db.execute(ctx_query)).scalar() or 0

    # Count frontier zones
    zone_query = select(func.count(FrontierZone.id)).where(
        and_(FrontierZone.user_id == current_user.id, FrontierZone.created_at >= start_date)
    )
    items_created += (await db.execute(zone_query)).scalar() or 0

    # Count frontier encounters
    enc_query = select(func.count(FrontierEncounter.id)).where(
        and_(FrontierEncounter.user_id == current_user.id, FrontierEncounter.created_at >= start_date)
    )
    items_created += (await db.execute(enc_query)).scalar() or 0

    # Calculate streak (days with activity)
    # Get all dates with page views
    dates_query = select(func.date(PageView.created_at)).where(
        PageView.user_id == current_user.id
    ).distinct().order_by(desc(func.date(PageView.created_at)))
    dates_result = await db.execute(dates_query)
    activity_dates = [row[0] for row in dates_result.fetchall()]

    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    today = datetime.utcnow().date()

    for i, date in enumerate(activity_dates):
        if i == 0:
            # Check if activity was today or yesterday
            if date == today or date == today - timedelta(days=1):
                temp_streak = 1
            else:
                break
        else:
            prev_date = activity_dates[i - 1]
            if (prev_date - date).days == 1:
                temp_streak += 1
            else:
                break

    current_streak = temp_streak

    # Calculate longest streak
    if activity_dates:
        temp_streak = 1
        for i in range(1, len(activity_dates)):
            if (activity_dates[i - 1] - activity_dates[i]).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

    # Weekly activity (last 7 days, Mon-Sun)
    weekly_activity = [0] * 7
    week_start = today - timedelta(days=today.weekday())

    for date in activity_dates:
        if date >= week_start and date <= today:
            day_idx = (date - week_start).days
            if 0 <= day_idx < 7:
                weekly_activity[day_idx] += 1

    return OverviewStats(
        total_sessions=total_sessions,
        lessons_visited=lessons_visited,
        items_created=items_created,
        avg_session_minutes=15,  # Placeholder - would need session tracking
        current_streak=current_streak,
        longest_streak=longest_streak,
        weekly_activity=weekly_activity
    )


@router.get("/lessons", response_model=List[LessonStats])
async def get_lesson_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for each lesson."""
    stats = []

    for lesson_num in range(1, 13):
        # Count page views for this lesson
        views_query = select(func.count(PageView.id)).where(
            and_(
                PageView.user_id == current_user.id,
                PageView.lesson == lesson_num
            )
        )
        views = (await db.execute(views_query)).scalar() or 0

        # Get feedback for this lesson
        feedback_query = select(
            func.count(Feedback.id),
            func.avg(Feedback.rating)
        ).where(
            and_(
                Feedback.user_id == current_user.id,
                Feedback.lesson == lesson_num
            )
        )
        feedback_result = await db.execute(feedback_query)
        feedback_row = feedback_result.fetchone()
        feedback_count = feedback_row[0] or 0
        avg_rating = float(feedback_row[1]) if feedback_row[1] else None

        # Count items for this lesson (simplified - could be expanded)
        items_created = 0
        if lesson_num == 1:
            q = select(func.count(Conversation.id)).where(Conversation.user_id == current_user.id)
            items_created = (await db.execute(q)).scalar() or 0
        elif lesson_num == 3:
            q = select(func.count(Template.id)).where(Template.user_id == current_user.id)
            items_created = (await db.execute(q)).scalar() or 0
        elif lesson_num == 5:
            q = select(func.count(Prediction.id)).where(Prediction.user_id == current_user.id)
            items_created = (await db.execute(q)).scalar() or 0
        elif lesson_num == 11:
            q = select(func.count(FrontierZone.id)).where(FrontierZone.user_id == current_user.id)
            items_created = (await db.execute(q)).scalar() or 0

        stats.append(LessonStats(
            lesson=lesson_num,
            title=LESSON_TITLES.get(lesson_num, f"Lesson {lesson_num}"),
            views=views,
            items_created=items_created,
            avg_rating=avg_rating,
            feedback_count=feedback_count
        ))

    return stats
