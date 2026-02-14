"""API routes for admin module - Cohort tracking and A/B testing."""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.auth import get_current_user, get_current_admin_user
from backend.database.models import (
    User, Cohort, CohortMember, Experiment, ExperimentAssignment as ExperimentAssignmentModel,
    PageView
)
from .schemas import (
    CohortCreate, CohortUpdate, CohortResponse, CohortMemberAdd, CohortStats,
    ExperimentCreate, ExperimentUpdate, ExperimentResponse, ExperimentAssignment,
    ExperimentEvent, ExperimentStats, UserAdminView
)

router = APIRouter(prefix="/admin", tags=["admin"])


# =============================================================================
# Cohort Management
# =============================================================================

@router.post("/cohorts", response_model=CohortResponse)
async def create_cohort(
    cohort: CohortCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    new_cohort = Cohort(
        name=cohort.name,
        description=cohort.description,
        organization=cohort.organization,
        start_date=cohort.start_date,
        end_date=cohort.end_date
    )
    db.add(new_cohort)
    await db.commit()
    await db.refresh(new_cohort)

    return CohortResponse(
        id=new_cohort.id,
        name=new_cohort.name,
        description=new_cohort.description,
        organization=new_cohort.organization,
        start_date=new_cohort.start_date,
        end_date=new_cohort.end_date,
        is_active=new_cohort.is_active,
        member_count=0,
        created_at=new_cohort.created_at
    )


@router.get("/cohorts", response_model=List[CohortResponse])
async def list_cohorts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Single query with LEFT JOIN to get member counts
    query = (
        select(Cohort, func.count(CohortMember.id).label("member_count"))
        .outerjoin(CohortMember, CohortMember.cohort_id == Cohort.id)
        .group_by(Cohort.id)
        .order_by(desc(Cohort.created_at))
    )
    result = await db.execute(query)
    rows = result.all()

    responses = []
    for cohort, member_count in rows:
        responses.append(CohortResponse(
            id=cohort.id,
            name=cohort.name,
            description=cohort.description,
            organization=cohort.organization,
            start_date=cohort.start_date,
            end_date=cohort.end_date,
            is_active=cohort.is_active,
            member_count=member_count,
            created_at=cohort.created_at
        ))

    return responses


@router.get("/cohorts/{cohort_id}", response_model=CohortResponse)
async def get_cohort(
    cohort_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    query = select(Cohort).where(Cohort.id == cohort_id)
    result = await db.execute(query)
    cohort = result.scalar_one_or_none()

    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    count_query = select(func.count(CohortMember.id)).where(
        CohortMember.cohort_id == cohort.id
    )
    member_count = (await db.execute(count_query)).scalar() or 0

    return CohortResponse(
        id=cohort.id,
        name=cohort.name,
        description=cohort.description,
        organization=cohort.organization,
        start_date=cohort.start_date,
        end_date=cohort.end_date,
        is_active=cohort.is_active,
        member_count=member_count,
        created_at=cohort.created_at
    )


@router.put("/cohorts/{cohort_id}", response_model=CohortResponse)
async def update_cohort(
    cohort_id: str,
    updates: CohortUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    query = select(Cohort).where(Cohort.id == cohort_id)
    result = await db.execute(query)
    cohort = result.scalar_one_or_none()

    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cohort, field, value)

    await db.commit()
    await db.refresh(cohort)

    count_query = select(func.count(CohortMember.id)).where(
        CohortMember.cohort_id == cohort.id
    )
    member_count = (await db.execute(count_query)).scalar() or 0

    return CohortResponse(
        id=cohort.id,
        name=cohort.name,
        description=cohort.description,
        organization=cohort.organization,
        start_date=cohort.start_date,
        end_date=cohort.end_date,
        is_active=cohort.is_active,
        member_count=member_count,
        created_at=cohort.created_at
    )


@router.post("/cohorts/{cohort_id}/members")
async def add_cohort_member(
    cohort_id: str,
    member: CohortMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Verify cohort exists
    cohort_query = select(Cohort).where(Cohort.id == cohort_id)
    cohort = (await db.execute(cohort_query)).scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    # Verify user exists
    user_query = select(User).where(User.id == member.user_id)
    user = (await db.execute(user_query)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already a member
    existing = select(CohortMember).where(
        and_(
            CohortMember.cohort_id == cohort_id,
            CohortMember.user_id == member.user_id
        )
    )
    if (await db.execute(existing)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already in cohort")

    new_member = CohortMember(
        cohort_id=cohort_id,
        user_id=member.user_id
    )
    db.add(new_member)
    await db.commit()

    return {"status": "ok", "message": "User added to cohort"}


@router.delete("/cohorts/{cohort_id}/members/{user_id}")
async def remove_cohort_member(
    cohort_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    query = select(CohortMember).where(
        and_(
            CohortMember.cohort_id == cohort_id,
            CohortMember.user_id == user_id
        )
    )
    result = await db.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Membership not found")

    await db.delete(member)
    await db.commit()

    return {"status": "ok", "message": "User removed from cohort"}


@router.get("/cohorts/{cohort_id}/stats", response_model=CohortStats)
async def get_cohort_stats(
    cohort_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Get cohort
    cohort_query = select(Cohort).where(Cohort.id == cohort_id)
    cohort = (await db.execute(cohort_query)).scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    # Get member user IDs
    members_query = select(CohortMember.user_id).where(CohortMember.cohort_id == cohort_id)
    members_result = await db.execute(members_query)
    member_ids = [r[0] for r in members_result.fetchall()]

    if not member_ids:
        return CohortStats(
            cohort_id=cohort_id,
            cohort_name=cohort.name,
            total_members=0,
            active_members=0,
            avg_lessons_completed=0.0,
            avg_items_created=0.0,
            top_lessons=[]
        )

    # Count active members (activity in last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_query = select(func.count(func.distinct(PageView.user_id))).where(
        and_(
            PageView.user_id.in_(member_ids),
            PageView.created_at >= week_ago
        )
    )
    active_members = (await db.execute(active_query)).scalar() or 0

    # Get lesson visit counts
    lesson_query = select(
        PageView.lesson,
        func.count(PageView.id).label('count')
    ).where(
        and_(
            PageView.user_id.in_(member_ids),
            PageView.lesson.isnot(None)
        )
    ).group_by(PageView.lesson).order_by(desc('count')).limit(5)

    lesson_result = await db.execute(lesson_query)
    top_lessons = [
        {"lesson": row[0], "views": row[1]}
        for row in lesson_result.fetchall()
    ]

    return CohortStats(
        cohort_id=cohort_id,
        cohort_name=cohort.name,
        total_members=len(member_ids),
        active_members=active_members,
        avg_lessons_completed=0.0,  # Would require progress tracking
        avg_items_created=0.0,  # Would require aggregation across tables
        top_lessons=top_lessons
    )


# =============================================================================
# A/B Testing (Experiments)
# =============================================================================

@router.post("/experiments", response_model=ExperimentResponse)
async def create_experiment(
    experiment: ExperimentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Check for existing active experiment with same feature key
    existing_query = select(Experiment).where(
        and_(
            Experiment.feature_key == experiment.feature_key,
            Experiment.is_active == True
        )
    )
    existing = (await db.execute(existing_query)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Active experiment already exists for feature '{experiment.feature_key}'"
        )

    new_experiment = Experiment(
        name=experiment.name,
        description=experiment.description,
        feature_key=experiment.feature_key,
        variants=experiment.variants,
        traffic_percentage=experiment.traffic_percentage
    )
    db.add(new_experiment)
    await db.commit()
    await db.refresh(new_experiment)

    return ExperimentResponse(
        id=new_experiment.id,
        name=new_experiment.name,
        description=new_experiment.description,
        feature_key=new_experiment.feature_key,
        variants=new_experiment.variants,
        traffic_percentage=new_experiment.traffic_percentage,
        is_active=new_experiment.is_active,
        winner=new_experiment.winner,
        created_at=new_experiment.created_at,
        concluded_at=new_experiment.concluded_at
    )


@router.get("/experiments", response_model=List[ExperimentResponse])
async def list_experiments(
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    query = select(Experiment)
    if active_only:
        query = query.where(Experiment.is_active == True)
    query = query.order_by(desc(Experiment.created_at))

    result = await db.execute(query)
    experiments = result.scalars().all()

    return [
        ExperimentResponse(
            id=exp.id,
            name=exp.name,
            description=exp.description,
            feature_key=exp.feature_key,
            variants=exp.variants,
            traffic_percentage=exp.traffic_percentage,
            is_active=exp.is_active,
            winner=exp.winner,
            created_at=exp.created_at,
            concluded_at=exp.concluded_at
        )
        for exp in experiments
    ]


@router.put("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: str,
    updates: ExperimentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    query = select(Experiment).where(Experiment.id == experiment_id)
    result = await db.execute(query)
    experiment = result.scalar_one_or_none()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    update_data = updates.model_dump(exclude_unset=True)

    # If setting a winner, conclude the experiment
    if 'winner' in update_data and update_data['winner']:
        update_data['is_active'] = False
        update_data['concluded_at'] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(experiment, field, value)

    await db.commit()
    await db.refresh(experiment)

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        feature_key=experiment.feature_key,
        variants=experiment.variants,
        traffic_percentage=experiment.traffic_percentage,
        is_active=experiment.is_active,
        winner=experiment.winner,
        created_at=experiment.created_at,
        concluded_at=experiment.concluded_at
    )


@router.get("/experiments/assignment", response_model=List[ExperimentAssignment])
async def get_user_assignments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's experiment assignments."""
    # Get all active experiments
    experiments_query = select(Experiment).where(Experiment.is_active == True)
    experiments_result = await db.execute(experiments_query)
    experiments = experiments_result.scalars().all()

    assignments = []
    for experiment in experiments:
        # Check if user is in this experiment's traffic percentage
        user_hash = int(hashlib.md5(
            f"{current_user.id}:{experiment.feature_key}".encode()
        ).hexdigest(), 16)

        if (user_hash % 100) >= experiment.traffic_percentage:
            continue  # User not in experiment

        # Check for existing assignment
        assignment_query = select(ExperimentAssignmentModel).where(
            and_(
                ExperimentAssignmentModel.experiment_id == experiment.id,
                ExperimentAssignmentModel.user_id == current_user.id
            )
        )
        assignment = (await db.execute(assignment_query)).scalar_one_or_none()

        if not assignment:
            # Create deterministic assignment based on user ID
            variant_index = user_hash % len(experiment.variants)
            variant = experiment.variants[variant_index]

            assignment = ExperimentAssignmentModel(
                experiment_id=experiment.id,
                user_id=current_user.id,
                variant=variant
            )
            db.add(assignment)
            await db.commit()
            await db.refresh(assignment)

        assignments.append(ExperimentAssignment(
            experiment_id=experiment.id,
            feature_key=experiment.feature_key,
            variant=assignment.variant
        ))

    return assignments


@router.get("/experiments/{experiment_id}/stats", response_model=ExperimentStats)
async def get_experiment_stats(
    experiment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Get experiment
    exp_query = select(Experiment).where(Experiment.id == experiment_id)
    experiment = (await db.execute(exp_query)).scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Single query to get all variant counts at once
    counts_query = (
        select(
            ExperimentAssignmentModel.variant,
            func.count(ExperimentAssignmentModel.id).label("count")
        )
        .where(ExperimentAssignmentModel.experiment_id == experiment_id)
        .group_by(ExperimentAssignmentModel.variant)
    )
    counts_result = await db.execute(counts_query)
    variant_counts = {row[0]: row[1] for row in counts_result.all()}

    variant_stats = {}
    for variant in experiment.variants:
        variant_stats[variant] = {
            "participants": variant_counts.get(variant, 0),
            "events": 0,  # Would require event tracking table
            "conversion_rate": 0.0
        }

    total = sum(v["participants"] for v in variant_stats.values())

    return ExperimentStats(
        experiment_id=experiment_id,
        experiment_name=experiment.name,
        total_participants=total,
        variant_stats=variant_stats
    )


# =============================================================================
# User Management
# =============================================================================

@router.get("/users", response_model=List[UserAdminView])
async def list_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):

    # Single query with LEFT JOINs and subqueries to avoid N+1
    cohort_sub = (
        select(
            CohortMember.user_id,
            Cohort.id.label("cohort_id"),
            Cohort.name.label("cohort_name")
        )
        .join(Cohort, Cohort.id == CohortMember.cohort_id)
        .distinct(CohortMember.user_id)
        .subquery()
    )

    pageview_sub = (
        select(
            PageView.user_id,
            func.count(func.distinct(PageView.lesson)).label("lessons_visited"),
            func.max(PageView.created_at).label("last_activity")
        )
        .where(PageView.lesson.isnot(None))
        .group_by(PageView.user_id)
        .subquery()
    )

    query = (
        select(
            User,
            cohort_sub.c.cohort_id,
            cohort_sub.c.cohort_name,
            func.coalesce(pageview_sub.c.lessons_visited, 0).label("lessons_visited"),
            pageview_sub.c.last_activity
        )
        .outerjoin(cohort_sub, cohort_sub.c.user_id == User.id)
        .outerjoin(pageview_sub, pageview_sub.c.user_id == User.id)
        .order_by(desc(User.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    responses = []
    for user, cohort_id, cohort_name, lessons_visited, last_activity in rows:
        responses.append(UserAdminView(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_admin=user.is_admin,
            cohort_id=cohort_id,
            cohort_name=cohort_name,
            created_at=user.created_at,
            last_activity=last_activity,
            lessons_visited=lessons_visited,
            items_created=0  # Would require aggregation across tables
        ))

    return responses
