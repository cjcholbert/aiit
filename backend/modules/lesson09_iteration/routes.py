"""Lesson 9: Iterative Refinement API routes."""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import attributes

from backend.database import get_db
from backend.rate_limit import limiter
from backend.database.models import User, IterationTask
from backend.auth.dependencies import get_current_user

from .schemas import (
    PassFeedback, PassRecordRequest,
    IterationTaskCreate, IterationTaskUpdate,
    IterationTaskResponse, IterationTaskSummary,
    IterationStats,
    PASS_INFO, TRANSITION_TEMPLATES, EXAMPLE_TASKS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson9", tags=["Lesson 9: Iterative Refinement"])


# =============================================================================
# Helper Functions
# =============================================================================

def task_to_response(task: IterationTask) -> IterationTaskResponse:
    """Convert an IterationTask model to IterationTaskResponse."""
    passes = task.passes or []
    pass_feedback_list = [
        PassFeedback(
            pass_number=p.get('pass_number', 1),
            pass_label=p.get('pass_label', '70%'),
            focus=p.get('focus', ''),
            key_question=p.get('key_question', ''),
            key_question_answer=p.get('key_question_answer', ''),
            feedback=p.get('feedback', ''),
            completed_at=datetime.fromisoformat(p['completed_at']) if isinstance(p.get('completed_at'), str) else p.get('completed_at', datetime.now())
        )
        for p in passes
    ]

    current_pass_info = PASS_INFO.get(task.current_pass, PASS_INFO[1])

    return IterationTaskResponse(
        id=task.id,
        task_name=task.task_name,
        target_outcome=task.target_outcome,
        current_pass=task.current_pass,
        current_pass_info=current_pass_info,
        passes=pass_feedback_list,
        is_complete=task.is_complete,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


def task_to_summary(task: IterationTask) -> IterationTaskSummary:
    """Convert an IterationTask model to IterationTaskSummary."""
    passes = task.passes or []
    current_pass_info = PASS_INFO.get(task.current_pass, PASS_INFO[1])

    return IterationTaskSummary(
        id=task.id,
        task_name=task.task_name,
        current_pass=task.current_pass,
        current_pass_label=current_pass_info['label'],
        passes_completed=len(passes),
        is_complete=task.is_complete,
        created_at=task.created_at
    )


# =============================================================================
# Framework Information
# =============================================================================

@router.get("/pass-info")
async def get_pass_info():
    """Get information about the 70-85-95 framework passes."""
    return PASS_INFO


@router.get("/transition-templates")
async def get_transition_templates():
    """Get default transition prompt templates for moving between passes."""
    return TRANSITION_TEMPLATES


# =============================================================================
# Iteration Task CRUD
# =============================================================================

@router.post("/tasks", response_model=IterationTaskResponse, status_code=201)
async def create_task(
    task: IterationTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new iteration task."""
    db_task = IterationTask(
        user_id=current_user.id,
        task_name=task.task_name,
        target_outcome=task.target_outcome,
        notes=task.notes,
        passes=[],
        current_pass=1,
        is_complete=False
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    logger.info(f"Created iteration task '{task.task_name}' for user {current_user.email}")

    return task_to_response(db_task)


@router.get("/tasks", response_model=list[IterationTaskSummary])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    include_completed: bool = Query(True)
):
    """List all iteration tasks for the current user."""
    query = select(IterationTask).where(
        IterationTask.user_id == current_user.id
    )

    if not include_completed:
        query = query.where(IterationTask.is_complete == False)

    query = query.order_by(IterationTask.created_at.desc()).limit(limit)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [task_to_summary(t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=IterationTaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single iteration task by ID."""
    task = await _get_user_task(task_id, current_user.id, db)
    return task_to_response(task)


@router.put("/tasks/{task_id}", response_model=IterationTaskResponse)
async def update_task(
    task_id: str,
    update: IterationTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an iteration task."""
    task = await _get_user_task(task_id, current_user.id, db)

    if update.task_name is not None:
        task.task_name = update.task_name
    if update.target_outcome is not None:
        task.target_outcome = update.target_outcome
    if update.notes is not None:
        task.notes = update.notes

    await db.commit()
    await db.refresh(task)

    logger.info(f"Updated iteration task {task_id}")

    return task_to_response(task)


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an iteration task."""
    task = await _get_user_task(task_id, current_user.id, db)
    await db.delete(task)
    await db.commit()

    logger.info(f"Deleted iteration task {task_id}")
    return {"deleted": True, "id": task_id}


# =============================================================================
# Pass Recording
# =============================================================================

@router.post("/tasks/{task_id}/passes", response_model=IterationTaskResponse)
async def record_pass(
    task_id: str,
    request: PassRecordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Record feedback for the current pass and advance to the next.

    This endpoint:
    1. Records the user's answer to the key question
    2. Records the iteration feedback given to AI
    3. Advances current_pass to the next pass (or marks complete if pass 3)
    """
    task = await _get_user_task(task_id, current_user.id, db)

    if task.is_complete:
        raise HTTPException(
            status_code=400,
            detail="Task is already complete. All three passes have been recorded."
        )

    # Get info for current pass
    pass_info = PASS_INFO.get(task.current_pass, PASS_INFO[1])

    # Create pass feedback record
    pass_feedback = {
        "pass_number": task.current_pass,
        "pass_label": pass_info["label"],
        "focus": pass_info["focus"],
        "key_question": pass_info["key_question"],
        "key_question_answer": request.key_question_answer,
        "feedback": request.feedback,
        "completed_at": datetime.utcnow().isoformat()
    }

    # Add to passes array
    passes = list(task.passes or [])
    passes.append(pass_feedback)
    task.passes = passes

    # Advance to next pass or mark complete
    if task.current_pass >= 3:
        task.is_complete = True
        logger.info(f"Task {task_id} completed all 3 passes")
    else:
        task.current_pass += 1
        logger.info(f"Task {task_id} advanced to pass {task.current_pass}")

    # Flag the JSON field as modified
    attributes.flag_modified(task, 'passes')

    await db.commit()
    await db.refresh(task)

    return task_to_response(task)


# =============================================================================
# AI Feedback Analysis
# =============================================================================

@router.post("/tasks/{task_id}/analyze-feedback")
@limiter.limit("3/minute")
async def analyze_pass_feedback(
    task_id: str,
    request: Request,
    pass_number: int = Query(..., ge=1, le=3, description="Which pass to analyze (1, 2, or 3)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze iteration feedback quality for a specific pass.

    Uses L2's vague-feedback patterns to evaluate whether the feedback is
    specific, actionable, reasoned, objective, and appropriately scoped.
    """
    from .analyzer import analyze_feedback_quality, AnalyzerError

    task = await _get_user_task(task_id, current_user.id, db)

    passes = task.passes or []
    target_pass = None
    for p in passes:
        if p.get('pass_number') == pass_number:
            target_pass = p
            break

    if not target_pass:
        raise HTTPException(
            status_code=404,
            detail=f"Pass {pass_number} not found. Record the pass first."
        )

    feedback_text = target_pass.get('feedback', '')
    if not feedback_text.strip():
        raise HTTPException(status_code=400, detail="No feedback text to analyze")

    try:
        analysis = await analyze_feedback_quality(
            task_name=task.task_name,
            target_outcome=task.target_outcome or "",
            pass_label=target_pass.get('pass_label', ''),
            pass_focus=target_pass.get('focus', ''),
            feedback_text=feedback_text,
            key_question_answer=target_pass.get('key_question_answer', ''),
        )
    except AnalyzerError as e:
        raise HTTPException(status_code=500, detail=str(e))

    logger.info("Analyzed feedback for task %s pass %d, user %s", task_id, pass_number, current_user.email)

    return analysis


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=IterationStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get iteration statistics for the current user."""
    result = await db.execute(
        select(IterationTask).where(IterationTask.user_id == current_user.id)
    )
    tasks = result.scalars().all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_complete)
    in_progress_tasks = total_tasks - completed_tasks

    total_passes = sum(len(t.passes or []) for t in tasks)

    avg_passes = 0.0
    if completed_tasks > 0:
        completed_passes = sum(len(t.passes or []) for t in tasks if t.is_complete)
        avg_passes = round(completed_passes / completed_tasks, 1)

    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)

    # Count tasks by current pass
    tasks_by_pass = {1: 0, 2: 0, 3: 0}
    for t in tasks:
        if not t.is_complete:
            pass_num = t.current_pass
            if pass_num in tasks_by_pass:
                tasks_by_pass[pass_num] += 1

    return IterationStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        total_passes_recorded=total_passes,
        avg_passes_per_completed_task=avg_passes,
        completion_rate=completion_rate,
        tasks_by_current_pass=tasks_by_pass
    )


# =============================================================================
# Seed Examples
# =============================================================================

@router.post("/tasks/seed-examples")
async def seed_example_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create example iteration tasks to learn from."""
    result = await db.execute(
        select(func.count(IterationTask.id)).where(IterationTask.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} tasks. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_TASKS:
        db_task = IterationTask(
            user_id=current_user.id,
            task_name=example["task_name"],
            target_outcome=example["target_outcome"],
            notes=example["notes"],
            passes=[],
            current_pass=1,
            is_complete=False
        )
        db.add(db_task)
        created.append(example["task_name"])

    await db.commit()

    logger.info(f"Seeded {len(created)} example tasks for user {current_user.email}")
    return {"created": len(created), "tasks": created}


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_task(task_id: str, user_id: str, db: AsyncSession) -> IterationTask:
    """Get an iteration task by ID, verifying ownership."""
    result = await db.execute(
        select(IterationTask).where(
            IterationTask.id == task_id,
            IterationTask.user_id == user_id
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Iteration task not found")

    return task
