"""Lesson 7: Task Decomposer API routes."""
import logging
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.rate_limit import limiter
from backend.database.models import User, Decomposition
from backend.auth.dependencies import get_current_user

from .schemas import (
    TaskCreate, TaskUpdate, TaskResponse,
    DecompositionCreate, DecompositionUpdate, DecompositionResponse, DecompositionSummary,
    DecompositionStats,
    TASK_CATEGORIES, EXAMPLE_DECOMPOSITIONS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson7", tags=["Lesson 7: Task Decomposer"])


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


def calculate_categories(tasks: list) -> dict:
    """Calculate category counts from tasks."""
    counts = {"ai_optimal": 0, "collaborative": 0, "human_primary": 0}
    for task in tasks:
        cat = task.get('category') if isinstance(task, dict) else getattr(task, 'category', None)
        if cat in counts:
            counts[cat] += 1
    return counts


def decomposition_to_response(decomp: Decomposition) -> DecompositionResponse:
    """Convert a Decomposition model to DecompositionResponse."""
    tasks = decomp.tasks or []
    task_responses = [
        TaskResponse(
            id=task.get('id', generate_task_id()),
            title=task.get('title', ''),
            description=task.get('description', ''),
            category=task.get('category', 'collaborative'),
            reasoning=task.get('reasoning', ''),
            order=task.get('order', 0),
            dependencies=task.get('dependencies', []),
            is_decision_gate=task.get('is_decision_gate', False),
            parallel_group=task.get('parallel_group'),
            status=task.get('status', 'pending')
        )
        for task in tasks
    ]

    return DecompositionResponse(
        id=decomp.id,
        project_name=decomp.project_name,
        description="",  # Not in model, but useful
        tasks=task_responses,
        categories=decomp.categories or calculate_categories(tasks),
        created_at=decomp.created_at,
        updated_at=decomp.updated_at
    )


def decomposition_to_summary(decomp: Decomposition) -> DecompositionSummary:
    """Convert a Decomposition model to DecompositionSummary."""
    tasks = decomp.tasks or []
    categories = decomp.categories or calculate_categories(tasks)
    completed = sum(1 for t in tasks if t.get('status') == 'completed')

    return DecompositionSummary(
        id=decomp.id,
        project_name=decomp.project_name,
        task_count=len(tasks),
        ai_optimal_count=categories.get('ai_optimal', 0),
        collaborative_count=categories.get('collaborative', 0),
        human_primary_count=categories.get('human_primary', 0),
        completed_count=completed,
        created_at=decomp.created_at
    )


# =============================================================================
# Category Information
# =============================================================================

@router.get("/categories")
async def get_categories():
    """Get information about the three task categories."""
    return TASK_CATEGORIES


# =============================================================================
# Decomposition CRUD
# =============================================================================

@router.post("/decompositions", response_model=DecompositionResponse, status_code=201)
async def create_decomposition(
    decomp: DecompositionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project decomposition."""
    tasks = tasks_to_json(decomp.tasks)
    categories = calculate_categories(tasks)

    db_decomp = Decomposition(
        user_id=current_user.id,
        project_name=decomp.project_name,
        tasks=tasks,
        categories=categories
    )
    db.add(db_decomp)
    await db.commit()
    await db.refresh(db_decomp)

    logger.info(f"Created decomposition '{decomp.project_name}' for user {current_user.email}")

    return decomposition_to_response(db_decomp)


@router.get("/decompositions", response_model=list[DecompositionSummary])
async def list_decompositions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100)
):
    """List all decompositions for the current user."""
    query = select(Decomposition).where(
        Decomposition.user_id == current_user.id
    ).order_by(Decomposition.created_at.desc()).limit(limit)

    result = await db.execute(query)
    decompositions = result.scalars().all()

    return [decomposition_to_summary(d) for d in decompositions]


@router.post("/decompositions/seed-examples")
async def seed_example_decompositions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create example decompositions to learn from."""
    # Check if user already has decompositions
    result = await db.execute(
        select(func.count(Decomposition.id)).where(Decomposition.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} decompositions. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_DECOMPOSITIONS:
        tasks = tasks_to_json(example["tasks"])
        categories = calculate_categories(tasks)

        db_decomp = Decomposition(
            user_id=current_user.id,
            project_name=example["project_name"],
            tasks=tasks,
            categories=categories
        )
        db.add(db_decomp)
        created.append(example["project_name"])

    await db.commit()

    logger.info(f"Seeded {len(created)} example decompositions for user {current_user.email}")
    return {"created": len(created), "decompositions": created}


@router.get("/decompositions/{decomposition_id}", response_model=DecompositionResponse)
async def get_decomposition(
    decomposition_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single decomposition by ID."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)
    return decomposition_to_response(decomp)


@router.put("/decompositions/{decomposition_id}", response_model=DecompositionResponse)
async def update_decomposition(
    decomposition_id: str,
    update: DecompositionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    if update.project_name is not None:
        decomp.project_name = update.project_name
    if update.tasks is not None:
        decomp.tasks = tasks_to_json(update.tasks)
        decomp.categories = calculate_categories(decomp.tasks)

    await db.commit()
    await db.refresh(decomp)

    logger.info(f"Updated decomposition {decomposition_id}")

    return decomposition_to_response(decomp)


@router.delete("/decompositions/{decomposition_id}")
async def delete_decomposition(
    decomposition_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)
    await db.delete(decomp)
    await db.commit()

    logger.info(f"Deleted decomposition {decomposition_id}")
    return {"deleted": True, "id": decomposition_id}


# =============================================================================
# Task Management within Decomposition
# =============================================================================

@router.post("/decompositions/{decomposition_id}/tasks", response_model=DecompositionResponse)
async def add_task(
    decomposition_id: str,
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a task to a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    tasks = decomp.tasks or []
    new_task = task.model_dump()
    new_task['id'] = generate_task_id()
    new_task['order'] = len(tasks)
    tasks.append(new_task)

    decomp.tasks = tasks
    decomp.categories = calculate_categories(tasks)

    await db.commit()
    await db.refresh(decomp)

    return decomposition_to_response(decomp)


@router.put("/decompositions/{decomposition_id}/tasks/{task_id}", response_model=DecompositionResponse)
async def update_task(
    decomposition_id: str,
    task_id: str,
    update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a task within a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    tasks = decomp.tasks or []
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

    decomp.tasks = tasks
    decomp.categories = calculate_categories(tasks)

    await db.commit()
    await db.refresh(decomp)

    return decomposition_to_response(decomp)


@router.delete("/decompositions/{decomposition_id}/tasks/{task_id}", response_model=DecompositionResponse)
async def delete_task(
    decomposition_id: str,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a task from a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    tasks = decomp.tasks or []
    original_count = len(tasks)
    tasks = [t for t in tasks if t.get('id') != task_id]

    if len(tasks) == original_count:
        raise HTTPException(status_code=404, detail="Task not found")

    # Reorder remaining tasks
    for i, task in enumerate(tasks):
        task['order'] = i

    decomp.tasks = tasks
    decomp.categories = calculate_categories(tasks)

    await db.commit()
    await db.refresh(decomp)

    return decomposition_to_response(decomp)


@router.put("/decompositions/{decomposition_id}/reorder", response_model=DecompositionResponse)
async def reorder_tasks(
    decomposition_id: str,
    task_ids: list[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reorder tasks within a decomposition."""
    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    tasks = decomp.tasks or []
    task_map = {t.get('id'): t for t in tasks}

    # Validate all task IDs exist
    for tid in task_ids:
        if tid not in task_map:
            raise HTTPException(status_code=400, detail=f"Task {tid} not found")

    # Reorder based on provided order
    reordered = []
    for i, tid in enumerate(task_ids):
        task = task_map[tid]
        task['order'] = i
        reordered.append(task)

    decomp.tasks = reordered

    await db.commit()
    await db.refresh(decomp)

    return decomposition_to_response(decomp)


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=DecompositionStats)
async def get_decomposition_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall decomposition statistics."""
    result = await db.execute(
        select(Decomposition).where(Decomposition.user_id == current_user.id)
    )
    decompositions = result.scalars().all()

    total_decomps = len(decompositions)
    total_tasks = 0
    category_counts = {"ai_optimal": 0, "collaborative": 0, "human_primary": 0}
    decision_gates = 0
    completed_tasks = 0

    for decomp in decompositions:
        tasks = decomp.tasks or []
        total_tasks += len(tasks)
        for task in tasks:
            cat = task.get('category')
            if cat in category_counts:
                category_counts[cat] += 1
            if task.get('is_decision_gate'):
                decision_gates += 1
            if task.get('status') == 'completed':
                completed_tasks += 1

    # Calculate percentages
    category_percentages = {}
    for cat, count in category_counts.items():
        category_percentages[cat] = round((count / total_tasks * 100) if total_tasks > 0 else 0, 1)

    # Find most common category
    most_common = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else "collaborative"

    return DecompositionStats(
        total_decompositions=total_decomps,
        total_tasks=total_tasks,
        category_distribution=category_counts,
        category_percentages=category_percentages,
        avg_tasks_per_decomposition=round(total_tasks / total_decomps, 1) if total_decomps > 0 else 0,
        most_common_category=most_common,
        decision_gates_count=decision_gates,
        completed_tasks=completed_tasks,
        completion_rate=round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    )


# =============================================================================
# AI Analysis
# =============================================================================

@router.post("/decompositions/{decomposition_id}/analyze")
@limiter.limit("3/minute")
async def analyze_decomposition(
    decomposition_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze task categorizations using AI.

    Evaluates whether tasks are in the right category, identifies borderline
    cases, checks dependency logic, and validates decision gates.
    """
    from .analyzer import analyze_decomposition as run_analysis, AnalyzerError

    decomp = await _get_user_decomposition(decomposition_id, current_user.id, db)

    tasks = decomp.tasks or []
    if not tasks:
        raise HTTPException(status_code=400, detail="No tasks to analyze")

    try:
        analysis = await run_analysis(
            project_name=decomp.project_name,
            tasks=tasks,
        )
    except AnalyzerError as e:
        raise HTTPException(status_code=500, detail=str(e))

    logger.info("Analyzed decomposition %s for user %s", decomposition_id, current_user.email)

    return analysis


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_decomposition(decomposition_id: str, user_id: str, db: AsyncSession) -> Decomposition:
    """Get a decomposition by ID, verifying ownership."""
    result = await db.execute(
        select(Decomposition).where(
            Decomposition.id == decomposition_id,
            Decomposition.user_id == user_id
        )
    )
    decomp = result.scalar_one_or_none()

    if not decomp:
        raise HTTPException(status_code=404, detail="Decomposition not found")

    return decomp
