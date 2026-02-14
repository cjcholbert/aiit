"""Lesson 8: Delegation Tracker API routes."""
import json
import logging
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import attributes

from backend.database import get_db
from backend.database.models import User, Delegation
from backend.auth.dependencies import get_current_user

from .schemas import (
    SequenceTaskCreate, SequenceTaskUpdate, SequenceTaskResponse,
    DelegationCreate, DelegationUpdate, DelegationResponse, DelegationSummary,
    DelegationStats, DelegationReview, AnalyzeRequest,
    TEMPLATE_ELEMENTS, EXAMPLE_TEMPLATES
)
from backend.rate_limit import limiter
from .analyzer import analyze_delegation_output, AnalyzerError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson8", tags=["Lesson 8: Delegation Tracker"])


# =============================================================================
# Helper Functions
# =============================================================================

def generate_task_id() -> str:
    """Generate a unique ID for tasks."""
    return str(uuid.uuid4())[:8]


def tasks_to_json(tasks: list) -> list:
    """Convert tasks to JSON-serializable format with IDs."""
    result = []
    for i, task in enumerate(tasks):
        if hasattr(task, 'model_dump'):
            task_dict = task.model_dump()
        elif isinstance(task, dict):
            task_dict = dict(task)
        else:
            continue

        if 'id' not in task_dict or not task_dict['id']:
            task_dict['id'] = generate_task_id()
        task_dict['order'] = i
        result.append(task_dict)
    return result


def delegation_to_response(deleg: Delegation) -> DelegationResponse:
    """Convert a Delegation model to DelegationResponse."""
    tasks = deleg.task_sequence or []
    task_responses = [
        SequenceTaskResponse(
            id=task.get('id', generate_task_id()),
            title=task.get('title', ''),
            description=task.get('description', ''),
            category=task.get('category', 'ai_optimal'),
            prompt=task.get('prompt', ''),
            expected_output=task.get('expected_output', ''),
            order=task.get('order', 0),
            status=task.get('status', 'pending'),
            output_received=task.get('output_received', ''),
            review_notes=task.get('review_notes', ''),
            is_decision_gate=task.get('is_decision_gate', False),
            success_criteria=task.get('success_criteria', []),
            ai_review=task.get('ai_review')
        )
        for task in tasks
    ]

    return DelegationResponse(
        id=deleg.id,
        name=deleg.name,
        template=deleg.template or "",
        task_sequence=task_responses,
        notes=deleg.notes or "",
        created_at=deleg.created_at,
        updated_at=deleg.updated_at
    )


def delegation_to_summary(deleg: Delegation) -> DelegationSummary:
    """Convert a Delegation model to DelegationSummary."""
    tasks = deleg.task_sequence or []
    completed = sum(1 for t in tasks if t.get('status') == 'completed')

    # Find current task (first non-completed)
    current = next((t.get('title') for t in tasks if t.get('status') != 'completed'), None)

    return DelegationSummary(
        id=deleg.id,
        name=deleg.name,
        task_count=len(tasks),
        completed_count=completed,
        current_task=current,
        has_template=bool(deleg.template and deleg.template.strip()),
        created_at=deleg.created_at
    )


# =============================================================================
# Template Information
# =============================================================================

@router.get("/template-elements")
async def get_template_elements():
    """Get information about delegation template elements."""
    return TEMPLATE_ELEMENTS


# =============================================================================
# Delegation CRUD
# =============================================================================

@router.post("/delegations", response_model=DelegationResponse, status_code=201)
async def create_delegation(
    deleg: DelegationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new delegation."""
    tasks = tasks_to_json(deleg.task_sequence)

    db_deleg = Delegation(
        user_id=current_user.id,
        name=deleg.name,
        template=deleg.template,
        task_sequence=tasks,
        notes=deleg.notes
    )
    db.add(db_deleg)
    await db.commit()
    await db.refresh(db_deleg)

    logger.info(f"Created delegation '{deleg.name}' for user {current_user.email}")

    return delegation_to_response(db_deleg)


@router.get("/delegations", response_model=list[DelegationSummary])
async def list_delegations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100)
):
    """List all delegations for the current user."""
    query = select(Delegation).where(
        Delegation.user_id == current_user.id
    ).order_by(Delegation.created_at.desc()).limit(limit)

    result = await db.execute(query)
    delegations = result.scalars().all()

    return [delegation_to_summary(d) for d in delegations]


@router.post("/delegations/seed-examples")
async def seed_example_delegations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create example delegation templates to learn from."""
    result = await db.execute(
        select(func.count(Delegation.id)).where(Delegation.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} delegations. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_TEMPLATES:
        tasks = tasks_to_json(example["task_sequence"])

        db_deleg = Delegation(
            user_id=current_user.id,
            name=example["name"],
            template=example["template"],
            task_sequence=tasks,
            notes=""
        )
        db.add(db_deleg)
        created.append(example["name"])

    await db.commit()

    logger.info(f"Seeded {len(created)} example delegations for user {current_user.email}")
    return {"created": len(created), "delegations": created}


@router.get("/delegations/{delegation_id}", response_model=DelegationResponse)
async def get_delegation(
    delegation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single delegation by ID."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)
    return delegation_to_response(deleg)


@router.put("/delegations/{delegation_id}", response_model=DelegationResponse)
async def update_delegation(
    delegation_id: str,
    update: DelegationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a delegation."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)

    if update.name is not None:
        deleg.name = update.name
    if update.template is not None:
        deleg.template = update.template
    if update.task_sequence is not None:
        deleg.task_sequence = tasks_to_json(update.task_sequence)
    if update.notes is not None:
        deleg.notes = update.notes

    await db.commit()
    await db.refresh(deleg)

    logger.info(f"Updated delegation {delegation_id}")

    return delegation_to_response(deleg)


@router.delete("/delegations/{delegation_id}")
async def delete_delegation(
    delegation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a delegation."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)
    await db.delete(deleg)
    await db.commit()

    logger.info(f"Deleted delegation {delegation_id}")
    return {"deleted": True, "id": delegation_id}


# =============================================================================
# Task Management within Delegation
# =============================================================================

@router.post("/delegations/{delegation_id}/tasks", response_model=DelegationResponse)
async def add_task(
    delegation_id: str,
    task: SequenceTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a task to a delegation sequence."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)

    tasks = deleg.task_sequence or []
    new_task = task.model_dump()
    new_task['id'] = generate_task_id()
    new_task['order'] = len(tasks)
    tasks.append(new_task)

    deleg.task_sequence = tasks

    await db.commit()
    await db.refresh(deleg)

    return delegation_to_response(deleg)


@router.put("/delegations/{delegation_id}/tasks/{task_id}", response_model=DelegationResponse)
async def update_task(
    delegation_id: str,
    task_id: str,
    update: SequenceTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a task within a delegation sequence."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)

    tasks = deleg.task_sequence or []
    task_found = False

    for task in tasks:
        if task.get('id') == task_id:
            task_found = True
            update_dict = update.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                task[key] = value
            break

    if not task_found:
        raise HTTPException(status_code=404, detail="Task not found")

    deleg.task_sequence = tasks
    attributes.flag_modified(deleg, 'task_sequence')

    await db.commit()
    await db.refresh(deleg)

    return delegation_to_response(deleg)


@router.delete("/delegations/{delegation_id}/tasks/{task_id}", response_model=DelegationResponse)
async def delete_task(
    delegation_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a task from a delegation sequence."""
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)

    tasks = deleg.task_sequence or []
    original_count = len(tasks)
    tasks = [t for t in tasks if t.get('id') != task_id]

    if len(tasks) == original_count:
        raise HTTPException(status_code=404, detail="Task not found")

    # Reorder remaining tasks
    for i, task in enumerate(tasks):
        task['order'] = i

    deleg.task_sequence = tasks

    await db.commit()
    await db.refresh(deleg)

    return delegation_to_response(deleg)


# =============================================================================
# AI Analysis
# =============================================================================

@router.post("/delegations/{delegation_id}/tasks/{task_id}/analyze", response_model=DelegationReview)
@limiter.limit("3/minute")
async def analyze_task_output(
    delegation_id: str,
    task_id: str,
    request: Request,
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze pasted AI output against task success criteria.

    Uses AI to:
    1. Parse/extract the AI output from raw pasted text
    2. Extract success criteria from template (or use task-level overrides)
    3. Review output against each criterion
    4. Return structured pass/fail assessment
    """
    deleg = await _get_user_delegation(delegation_id, current_user.id, db)

    # Find the task
    tasks = deleg.task_sequence or []
    task = None
    task_index = None
    for i, t in enumerate(tasks):
        if t.get('id') == task_id:
            task = t
            task_index = i
            break

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        review = await analyze_delegation_output(
            raw_output=body.raw_output,
            template=deleg.template or "",
            expected_output=task.get('expected_output', ''),
            task_title=task.get('title', ''),
            task_description=task.get('description', ''),
            task_success_criteria=task.get('success_criteria', []) or None
        )

        # Store the review on the task
        tasks[task_index]['ai_review'] = review.model_dump()
        # Also update output_received with the extracted output
        tasks[task_index]['output_received'] = review.ai_extracted_output

        # Make a copy of the list to ensure SQLAlchemy detects the mutation
        deleg.task_sequence = list(tasks)
        # Also flag as modified to be extra sure
        attributes.flag_modified(deleg, 'task_sequence')

        logger.info(f"Saving ai_review to task {task_id}, overall_pass={review.overall_pass}")
        await db.commit()
        await db.refresh(deleg)
        logger.info(f"Committed changes for task {task_id}")

        logger.info(f"Analyzed task {task_id} in delegation {delegation_id}: overall_pass={review.overall_pass}")

        return review

    except AnalyzerError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except (ValueError, json.JSONDecodeError, ConnectionError) as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=DelegationStats)
async def get_delegation_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall delegation statistics."""
    result = await db.execute(
        select(Delegation).where(Delegation.user_id == current_user.id)
    )
    delegations = result.scalars().all()

    total_delegs = len(delegations)
    total_tasks = 0
    completed_tasks = 0
    with_templates = 0

    for deleg in delegations:
        tasks = deleg.task_sequence or []
        total_tasks += len(tasks)
        completed_tasks += sum(1 for t in tasks if t.get('status') == 'completed')
        if deleg.template and deleg.template.strip():
            with_templates += 1

    pending_tasks = total_tasks - completed_tasks
    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    avg_tasks = round(total_tasks / total_delegs, 1) if total_delegs > 0 else 0

    return DelegationStats(
        total_delegations=total_delegs,
        total_tasks=total_tasks,
        tasks_completed=completed_tasks,
        tasks_pending=pending_tasks,
        completion_rate=completion_rate,
        avg_tasks_per_delegation=avg_tasks,
        delegations_with_templates=with_templates
    )


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_delegation(delegation_id: str, user_id: str, db: AsyncSession) -> Delegation:
    """Get a delegation by ID, verifying ownership."""
    result = await db.execute(
        select(Delegation).where(
            Delegation.id == delegation_id,
            Delegation.user_id == user_id
        )
    )
    deleg = result.scalar_one_or_none()

    if not deleg:
        raise HTTPException(status_code=404, detail="Delegation not found")

    return deleg
