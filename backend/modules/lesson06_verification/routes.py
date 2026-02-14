"""Lesson 6: Verification Tools API routes."""
import logging
from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.database.models import User, Checklist
from backend.auth.dependencies import get_current_user

from .schemas import (
    ChecklistCreate, ChecklistUpdate, ChecklistResponse, ChecklistSummary,
    ChecklistItemResponse, SkipCriteria,
    VerificationSessionCreate, VerificationSessionComplete, VerificationSessionResponse,
    ChecklistStats, VerificationStats,
    DEFAULT_CHECKLISTS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson6", tags=["Lesson 6: Verification Tools"])


# =============================================================================
# Helper Functions
# =============================================================================

def generate_item_id() -> str:
    """Generate a unique ID for checklist items."""
    return str(uuid.uuid4())[:8]


def items_to_json(items: list) -> list:
    """Convert checklist items to JSON-serializable format."""
    result = []
    for i, item in enumerate(items):
        if hasattr(item, 'model_dump'):
            item_dict = item.model_dump()
        elif isinstance(item, dict):
            item_dict = dict(item)
        else:
            item_dict = {'text': str(item), 'category': 'general', 'is_critical': False}
        if 'id' not in item_dict or not item_dict['id']:
            item_dict['id'] = generate_item_id()
        if 'times_checked' not in item_dict:
            item_dict['times_checked'] = 0
        if 'times_caught_issue' not in item_dict:
            item_dict['times_caught_issue'] = 0
        item_dict['order'] = i
        result.append(item_dict)
    return result


def checklist_to_response(checklist: Checklist, session_count: int = 0, avg_time: float = 0.0) -> ChecklistResponse:
    """Convert a Checklist model to ChecklistResponse."""
    items = checklist.items or []
    item_responses = [
        ChecklistItemResponse(
            id=item.get('id', generate_item_id()),
            text=item.get('text', ''),
            category=item.get('category', 'general'),
            is_critical=item.get('is_critical', False),
            order=item.get('order', 0),
            times_checked=item.get('times_checked', 0),
            times_caught_issue=item.get('times_caught_issue', 0)
        )
        for item in items
    ]

    skip_criteria = None
    if checklist.skip_criteria:
        skip_criteria = SkipCriteria(**checklist.skip_criteria)

    return ChecklistResponse(
        id=checklist.id,
        name=checklist.name,
        output_type=checklist.output_type,
        output_type_id=None,  # TODO: Add to model if needed
        description="",  # TODO: Add to model if needed
        items=item_responses,
        skip_criteria=skip_criteria,
        session_count=session_count,
        avg_time_seconds=avg_time,
        created_at=checklist.created_at,
        updated_at=checklist.updated_at
    )


def checklist_to_summary(checklist: Checklist, session_count: int = 0, avg_time: float = 0.0) -> ChecklistSummary:
    """Convert a Checklist model to ChecklistSummary."""
    items = checklist.items or []
    critical_count = sum(1 for item in items if item.get('is_critical', False))

    return ChecklistSummary(
        id=checklist.id,
        name=checklist.name,
        output_type=checklist.output_type,
        item_count=len(items),
        critical_count=critical_count,
        session_count=session_count,
        avg_time_seconds=avg_time,
        has_skip_criteria=checklist.skip_criteria is not None,
        created_at=checklist.created_at
    )


# =============================================================================
# Checklist CRUD
# =============================================================================

@router.post("/checklists", response_model=ChecklistResponse, status_code=201)
async def create_checklist(
    checklist: ChecklistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new verification checklist."""
    db_checklist = Checklist(
        user_id=current_user.id,
        name=checklist.name,
        output_type=checklist.output_type,
        items=items_to_json(checklist.items),
        skip_criteria=checklist.skip_criteria.model_dump() if checklist.skip_criteria else None
    )
    db.add(db_checklist)
    await db.commit()
    await db.refresh(db_checklist)

    logger.info(f"Created checklist '{checklist.name}' for user {current_user.email}")

    return checklist_to_response(db_checklist)


@router.get("/checklists", response_model=list[ChecklistSummary])
async def list_checklists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    output_type: Optional[str] = Query(None, max_length=100)
):
    """List all checklists for the current user."""
    query = select(Checklist).where(Checklist.user_id == current_user.id)

    if output_type:
        query = query.where(Checklist.output_type == output_type)

    query = query.order_by(Checklist.name)

    result = await db.execute(query)
    checklists = result.scalars().all()

    return [checklist_to_summary(c) for c in checklists]


@router.post("/checklists/seed-defaults")
async def seed_default_checklists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create starter checklists for common output types."""
    # Check if user already has checklists
    result = await db.execute(
        select(func.count(Checklist.id)).where(Checklist.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} checklists. Delete them first to reseed."
        )

    created = []
    for checklist_data in DEFAULT_CHECKLISTS:
        db_checklist = Checklist(
            user_id=current_user.id,
            name=checklist_data["name"],
            output_type=checklist_data["output_type"],
            items=items_to_json(checklist_data["items"]),
            skip_criteria=checklist_data.get("skip_criteria")
        )
        db.add(db_checklist)
        created.append(checklist_data["name"])

    await db.commit()

    logger.info(f"Seeded {len(created)} default checklists for user {current_user.email}")
    return {"created": len(created), "checklists": created}


@router.get("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    checklist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single checklist by ID."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)
    return checklist_to_response(checklist)


@router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: str,
    update: ChecklistUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a checklist."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)

    if update.name is not None:
        checklist.name = update.name
    if update.output_type is not None:
        checklist.output_type = update.output_type
    if update.items is not None:
        checklist.items = items_to_json(update.items)
    if update.skip_criteria is not None:
        checklist.skip_criteria = update.skip_criteria.model_dump()

    await db.commit()
    await db.refresh(checklist)

    logger.info(f"Updated checklist {checklist_id}")

    return checklist_to_response(checklist)


@router.delete("/checklists/{checklist_id}")
async def delete_checklist(
    checklist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a checklist."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)
    await db.delete(checklist)
    await db.commit()

    logger.info(f"Deleted checklist {checklist_id}")
    return {"deleted": True, "id": checklist_id}


# =============================================================================
# Skip Criteria
# =============================================================================

@router.put("/checklists/{checklist_id}/skip-criteria", response_model=ChecklistResponse)
async def update_skip_criteria(
    checklist_id: str,
    skip_criteria: SkipCriteria,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update skip criteria for a checklist."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)
    checklist.skip_criteria = skip_criteria.model_dump()

    await db.commit()
    await db.refresh(checklist)

    logger.info(f"Updated skip criteria for checklist {checklist_id}")

    return checklist_to_response(checklist)


@router.delete("/checklists/{checklist_id}/skip-criteria")
async def remove_skip_criteria(
    checklist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove skip criteria from a checklist."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)
    checklist.skip_criteria = None

    await db.commit()

    logger.info(f"Removed skip criteria from checklist {checklist_id}")
    return {"removed": True, "checklist_id": checklist_id}


# =============================================================================
# Verification Sessions (Simplified - stored in memory/JSON for now)
# =============================================================================

# In-memory session storage (for simplicity - would use DB in production)
_verification_sessions: dict = {}


@router.post("/sessions", response_model=VerificationSessionResponse, status_code=201)
async def start_verification_session(
    session: VerificationSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new verification session."""
    # Verify checklist exists
    checklist = await _get_user_checklist(session.checklist_id, current_user.id, db)

    session_id = str(uuid.uuid4())
    session_data = {
        "id": session_id,
        "user_id": current_user.id,
        "checklist_id": session.checklist_id,
        "checklist_name": checklist.name,
        "output_description": session.output_description,
        "is_low_stakes": session.is_low_stakes,
        "is_prototyping": session.is_prototyping,
        "time_seconds": None,
        "overall_passed": None,
        "issues_found": None,
        "completed": False,
        "created_at": datetime.utcnow(),
        "completed_at": None
    }

    _verification_sessions[session_id] = session_data

    logger.info(f"Started verification session {session_id}")

    return VerificationSessionResponse(**session_data)


@router.put("/sessions/{session_id}/complete", response_model=VerificationSessionResponse)
async def complete_verification_session(
    session_id: str,
    completion: VerificationSessionComplete,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Complete a verification session with results."""
    if session_id not in _verification_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = _verification_sessions[session_id]

    if session_data["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_data["completed"]:
        raise HTTPException(status_code=400, detail="Session already completed")

    # Update session
    session_data["time_seconds"] = completion.time_seconds
    session_data["overall_passed"] = completion.overall_passed
    session_data["issues_found"] = completion.issues_found
    session_data["completed"] = True
    session_data["completed_at"] = datetime.utcnow()

    # Update checklist item stats
    checklist = await _get_user_checklist(session_data["checklist_id"], current_user.id, db)
    items = checklist.items or []

    for item_result in completion.item_results:
        for item in items:
            if item.get('id') == item_result.item_id:
                if item_result.was_checked:
                    item['times_checked'] = item.get('times_checked', 0) + 1
                if item_result.caught_issue:
                    item['times_caught_issue'] = item.get('times_caught_issue', 0) + 1
                break

    checklist.items = items
    await db.commit()

    logger.info(f"Completed verification session {session_id}")

    return VerificationSessionResponse(**session_data)


@router.get("/sessions", response_model=list[VerificationSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    checklist_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    """List verification sessions for the current user."""
    user_sessions = [
        s for s in _verification_sessions.values()
        if s["user_id"] == current_user.id
    ]

    if checklist_id:
        user_sessions = [s for s in user_sessions if s["checklist_id"] == checklist_id]

    # Sort by created_at descending
    user_sessions.sort(key=lambda x: x["created_at"], reverse=True)

    return [VerificationSessionResponse(**s) for s in user_sessions[:limit]]


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=VerificationStats)
async def get_verification_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall verification statistics."""
    # Get checklists
    result = await db.execute(
        select(Checklist).where(Checklist.user_id == current_user.id)
    )
    checklists = result.scalars().all()

    # Get sessions
    user_sessions = [
        s for s in _verification_sessions.values()
        if s["user_id"] == current_user.id and s["completed"]
    ]

    # Calculate stats
    total_time = sum(s["time_seconds"] or 0 for s in user_sessions)
    avg_time = total_time / len(user_sessions) if user_sessions else 0

    # Most used checklists
    checklist_usage = {}
    for s in user_sessions:
        cid = s["checklist_id"]
        checklist_usage[cid] = checklist_usage.get(cid, 0) + 1

    most_used = [
        {"checklist_id": cid, "name": next((c.name for c in checklists if c.id == cid), "Unknown"), "count": count}
        for cid, count in sorted(checklist_usage.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    # Most/least effective items
    all_items = []
    for c in checklists:
        for item in (c.items or []):
            times_checked = item.get('times_checked', 0)
            times_caught = item.get('times_caught_issue', 0)
            if times_checked > 0:
                effectiveness = times_caught / times_checked
                all_items.append({
                    "text": item.get('text', ''),
                    "checklist": c.name,
                    "times_checked": times_checked,
                    "times_caught_issue": times_caught,
                    "effectiveness": round(effectiveness * 100, 1)
                })

    # Sort by effectiveness
    all_items.sort(key=lambda x: x["effectiveness"], reverse=True)
    most_effective = all_items[:5]
    least_effective = [i for i in all_items if i["times_checked"] >= 3 and i["effectiveness"] == 0][:5]

    return VerificationStats(
        total_checklists=len(checklists),
        total_sessions=len(user_sessions),
        avg_verification_time=round(avg_time, 1),
        most_used_checklists=most_used,
        most_effective_items=most_effective,
        least_effective_items=least_effective
    )


@router.get("/checklists/{checklist_id}/stats", response_model=ChecklistStats)
async def get_checklist_stats(
    checklist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for a specific checklist."""
    checklist = await _get_user_checklist(checklist_id, current_user.id, db)

    # Get sessions for this checklist
    sessions = [
        s for s in _verification_sessions.values()
        if s["checklist_id"] == checklist_id and s["user_id"] == current_user.id
    ]

    completed = [s for s in sessions if s["completed"]]
    passed = [s for s in completed if s["overall_passed"]]

    total_time = sum(s["time_seconds"] or 0 for s in completed)
    avg_time = total_time / len(completed) if completed else 0
    pass_rate = len(passed) / len(completed) * 100 if completed else 0

    # Per-item stats
    items_stats = []
    for item in (checklist.items or []):
        items_stats.append({
            "id": item.get('id'),
            "text": item.get('text'),
            "is_critical": item.get('is_critical', False),
            "times_checked": item.get('times_checked', 0),
            "times_caught_issue": item.get('times_caught_issue', 0),
            "effectiveness": round(
                (item.get('times_caught_issue', 0) / item.get('times_checked', 1)) * 100, 1
            ) if item.get('times_checked', 0) > 0 else 0
        })

    return ChecklistStats(
        total_sessions=len(sessions),
        completed_sessions=len(completed),
        avg_time_seconds=round(avg_time, 1),
        pass_rate=round(pass_rate, 1),
        items_stats=items_stats
    )


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_checklist(checklist_id: str, user_id: str, db: AsyncSession) -> Checklist:
    """Get a checklist by ID, verifying ownership."""
    result = await db.execute(
        select(Checklist).where(
            Checklist.id == checklist_id,
            Checklist.user_id == user_id
        )
    )
    checklist = result.scalar_one_or_none()

    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    return checklist
