"""Lesson 4: Context Docs API routes."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.database.models import User, ContextDoc, ContextSession
from backend.auth.dependencies import get_current_user

from .schemas import (
    ContextDocCreate, ContextDocUpdate, ContextDocResponse, ContextDocSummary,
    SessionCreate, SessionUpdate, SessionResponse, SessionSummary,
    ContextDocsStats, GeneratePromptRequest,
    CONTEXT_SECTIONS, CONTEXT_PROMPT_TEMPLATE, EXAMPLE_CONTEXT_DOCS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson4", tags=["Lesson 4: Context Docs"])


# =============================================================================
# Helper Functions
# =============================================================================

def doc_to_summary(doc: ContextDoc, session_count: int = 0, last_session: datetime = None) -> ContextDocSummary:
    """Convert a ContextDoc model to summary response."""
    return ContextDocSummary(
        id=doc.id,
        project_name=doc.project_name,
        description=doc.description,
        is_active=doc.is_active,
        version=doc.version,
        session_count=session_count,
        last_session=last_session,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )


def doc_to_response(doc: ContextDoc, session_count: int = 0) -> ContextDocResponse:
    """Convert a ContextDoc model to full response."""
    return ContextDocResponse(
        id=doc.id,
        project_name=doc.project_name,
        description=doc.description,
        current_state=doc.current_state or {"complete": [], "in_progress": [], "blocked": []},
        key_decisions=doc.key_decisions or [],
        known_issues=doc.known_issues or [],
        lessons_learned=doc.lessons_learned or [],
        next_goals=doc.next_goals or [],
        content=doc.content,
        version=doc.version,
        is_active=doc.is_active,
        session_count=session_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )


def session_to_summary(session: ContextSession, project_name: str = "") -> SessionSummary:
    """Convert a ContextSession model to summary response."""
    return SessionSummary(
        id=session.id,
        context_doc_id=session.context_doc_id,
        project_name=project_name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        accomplishment_count=len(session.accomplishments or []),
        context_quality_rating=session.context_quality_rating,
        continuity_rating=session.continuity_rating
    )


def session_to_response(session: ContextSession, project_name: str = "") -> SessionResponse:
    """Convert a ContextSession model to full response."""
    return SessionResponse(
        id=session.id,
        context_doc_id=session.context_doc_id,
        project_name=project_name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        goals=session.goals or [],
        accomplishments=session.accomplishments or [],
        decisions_made=session.decisions_made or [],
        issues_encountered=session.issues_encountered or [],
        notes=session.notes,
        context_quality_rating=session.context_quality_rating,
        continuity_rating=session.continuity_rating
    )


async def _get_user_doc(doc_id: str, user_id: str, db: AsyncSession) -> ContextDoc:
    """Get a context doc by ID, verifying ownership."""
    result = await db.execute(
        select(ContextDoc).where(
            ContextDoc.id == doc_id,
            ContextDoc.user_id == user_id
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Context document not found")

    return doc


async def _get_user_session(session_id: str, user_id: str, db: AsyncSession) -> ContextSession:
    """Get a session by ID, verifying ownership."""
    result = await db.execute(
        select(ContextSession).where(
            ContextSession.id == session_id,
            ContextSession.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


# =============================================================================
# Reference Information
# =============================================================================

@router.get("/sections")
async def get_sections():
    """Get context document section definitions."""
    return CONTEXT_SECTIONS


@router.get("/examples")
async def get_examples():
    """Get example context documents for reference."""
    from .examples import EXAMPLE_CATEGORIES as EXAMPLE_PROF_CATEGORIES
    from .examples import EXAMPLE_CONTEXT_DOCS as EXAMPLE_PROF_CONTEXT_DOCS
    return {
        "categories": EXAMPLE_PROF_CATEGORIES,
        "examples": EXAMPLE_PROF_CONTEXT_DOCS
    }


# =============================================================================
# Context Documents
# =============================================================================

@router.post("/docs", response_model=ContextDocResponse, status_code=201)
async def create_doc(
    request: ContextDocCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new context document."""
    db_doc = ContextDoc(
        user_id=current_user.id,
        project_name=request.project_name,
        description=request.description,
        current_state=request.current_state.model_dump() if request.current_state else {"complete": [], "in_progress": [], "blocked": []},
        key_decisions=[d.model_dump() for d in request.key_decisions],
        known_issues=[i.model_dump() for i in request.known_issues],
        lessons_learned=[l.model_dump() for l in request.lessons_learned],
        next_goals=[g.model_dump() for g in request.next_goals],
        content=request.content,
        is_active=True,
        version=1
    )
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)

    logger.info("Created context doc '%s' for user %s", request.project_name, current_user.email)

    return doc_to_response(db_doc)


@router.get("/docs", response_model=list[ContextDocSummary])
async def list_docs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(False)
):
    """List user's context documents."""
    query = select(ContextDoc).where(ContextDoc.user_id == current_user.id)

    if active_only:
        query = query.where(ContextDoc.is_active == True)

    query = query.order_by(ContextDoc.updated_at.desc())

    result = await db.execute(query)
    docs = result.scalars().all()

    # Get session info for each doc
    summaries = []
    for doc in docs:
        # Count sessions
        count_result = await db.execute(
            select(func.count(ContextSession.id)).where(ContextSession.context_doc_id == doc.id)
        )
        session_count = count_result.scalar() or 0

        # Get last session
        last_result = await db.execute(
            select(ContextSession.started_at)
            .where(ContextSession.context_doc_id == doc.id)
            .order_by(ContextSession.started_at.desc())
            .limit(1)
        )
        last_session = last_result.scalar_one_or_none()

        summaries.append(doc_to_summary(doc, session_count, last_session))

    return summaries


@router.get("/docs/{doc_id}", response_model=ContextDocResponse)
async def get_doc(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single context document by ID."""
    doc = await _get_user_doc(doc_id, current_user.id, db)

    # Count sessions
    count_result = await db.execute(
        select(func.count(ContextSession.id)).where(ContextSession.context_doc_id == doc.id)
    )
    session_count = count_result.scalar() or 0

    return doc_to_response(doc, session_count)


@router.put("/docs/{doc_id}", response_model=ContextDocResponse)
async def update_doc(
    doc_id: str,
    update: ContextDocUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a context document."""
    doc = await _get_user_doc(doc_id, current_user.id, db)

    # Track if content changed for versioning
    content_changed = False

    if update.project_name is not None:
        doc.project_name = update.project_name
    if update.description is not None:
        doc.description = update.description
    if update.current_state is not None:
        doc.current_state = update.current_state.model_dump()
        content_changed = True
    if update.key_decisions is not None:
        doc.key_decisions = [d.model_dump() for d in update.key_decisions]
        content_changed = True
    if update.known_issues is not None:
        doc.known_issues = [i.model_dump() for i in update.known_issues]
        content_changed = True
    if update.lessons_learned is not None:
        doc.lessons_learned = [l.model_dump() for l in update.lessons_learned]
        content_changed = True
    if update.next_goals is not None:
        doc.next_goals = [g.model_dump() for g in update.next_goals]
        content_changed = True
    if update.content is not None:
        doc.content = update.content
        content_changed = True
    if update.is_active is not None:
        doc.is_active = update.is_active

    # Increment version on content changes
    if content_changed:
        doc.version += 1

    await db.commit()
    await db.refresh(doc)

    logger.info("Updated context doc %s to version %s", doc_id, doc.version)

    # Get session count for response
    count_result = await db.execute(
        select(func.count(ContextSession.id)).where(ContextSession.context_doc_id == doc.id)
    )
    session_count = count_result.scalar() or 0

    return doc_to_response(doc, session_count)


@router.delete("/docs/{doc_id}")
async def delete_doc(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a context document and all its sessions."""
    doc = await _get_user_doc(doc_id, current_user.id, db)

    await db.delete(doc)
    await db.commit()

    logger.info("Deleted context doc %s", doc_id)
    return {"deleted": True, "id": doc_id}


# =============================================================================
# Sessions
# =============================================================================

@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def start_session(
    request: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new work session on a context document."""
    # Verify doc exists and belongs to user
    doc = await _get_user_doc(request.context_doc_id, current_user.id, db)

    # Check for existing open sessions
    open_result = await db.execute(
        select(ContextSession).where(
            ContextSession.context_doc_id == doc.id,
            ContextSession.user_id == current_user.id,
            ContextSession.ended_at.is_(None)
        )
    )
    open_session = open_result.scalar_one_or_none()

    if open_session:
        raise HTTPException(
            status_code=400,
            detail="You have an open session on this project. End it before starting a new one."
        )

    db_session = ContextSession(
        user_id=current_user.id,
        context_doc_id=doc.id,
        goals=request.goals,
        notes=request.notes,
        accomplishments=[],
        decisions_made=[],
        issues_encountered=[]
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)

    logger.info("Started session on '%s' for user %s", doc.project_name, current_user.email)

    return session_to_response(db_session, doc.project_name)


@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    doc_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """List user's work sessions."""
    query = select(ContextSession).where(ContextSession.user_id == current_user.id)

    if doc_id:
        query = query.where(ContextSession.context_doc_id == doc_id)

    query = query.order_by(ContextSession.started_at.desc()).limit(limit)

    result = await db.execute(query)
    sessions = result.scalars().all()

    # Build summaries with project names
    summaries = []
    doc_cache = {}

    for session in sessions:
        if session.context_doc_id not in doc_cache:
            doc_result = await db.execute(
                select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
            )
            doc_cache[session.context_doc_id] = doc_result.scalar_one_or_none() or "Unknown"

        summaries.append(session_to_summary(session, doc_cache[session.context_doc_id]))

    return summaries


@router.get("/sessions/active", response_model=Optional[SessionResponse])
async def get_active_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the currently active (open) session if any."""
    result = await db.execute(
        select(ContextSession).where(
            ContextSession.user_id == current_user.id,
            ContextSession.ended_at.is_(None)
        ).order_by(ContextSession.started_at.desc()).limit(1)
    )
    session = result.scalar_one_or_none()

    if not session:
        return None

    # Get project name
    doc_result = await db.execute(
        select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
    )
    project_name = doc_result.scalar_one_or_none() or "Unknown"

    return session_to_response(session, project_name)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single session by ID."""
    session = await _get_user_session(session_id, current_user.id, db)

    # Get project name
    doc_result = await db.execute(
        select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
    )
    project_name = doc_result.scalar_one_or_none() or "Unknown"

    return session_to_response(session, project_name)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    update: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a session (add accomplishments, end session, etc.)."""
    session = await _get_user_session(session_id, current_user.id, db)

    if update.goals is not None:
        session.goals = update.goals
    if update.accomplishments is not None:
        session.accomplishments = update.accomplishments
    if update.decisions_made is not None:
        session.decisions_made = [d.model_dump() for d in update.decisions_made]
    if update.issues_encountered is not None:
        session.issues_encountered = [i.model_dump() for i in update.issues_encountered]
    if update.notes is not None:
        session.notes = update.notes
    if update.context_quality_rating is not None:
        session.context_quality_rating = update.context_quality_rating
    if update.continuity_rating is not None:
        session.continuity_rating = update.continuity_rating
    if update.ended_at is not None:
        session.ended_at = update.ended_at

    await db.commit()
    await db.refresh(session)

    logger.info("Updated session %s", session_id)

    # Get project name
    doc_result = await db.execute(
        select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
    )
    project_name = doc_result.scalar_one_or_none() or "Unknown"

    return session_to_response(session, project_name)


@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """End a session (mark as complete)."""
    session = await _get_user_session(session_id, current_user.id, db)

    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session already ended")

    session.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)

    logger.info("Ended session %s", session_id)

    # Get project name
    doc_result = await db.execute(
        select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
    )
    project_name = doc_result.scalar_one_or_none() or "Unknown"

    return session_to_response(session, project_name)


@router.post("/sessions/{session_id}/reopen", response_model=SessionResponse)
async def reopen_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reopen a previously ended session."""
    session = await _get_user_session(session_id, current_user.id, db)

    if not session.ended_at:
        raise HTTPException(status_code=400, detail="Session is already open")

    # Check for existing open sessions on the same doc
    open_result = await db.execute(
        select(ContextSession).where(
            ContextSession.context_doc_id == session.context_doc_id,
            ContextSession.user_id == current_user.id,
            ContextSession.ended_at.is_(None)
        )
    )
    open_session = open_result.scalar_one_or_none()

    if open_session:
        raise HTTPException(
            status_code=400,
            detail="You have an open session on this project. End it before reopening another."
        )

    session.ended_at = None
    await db.commit()
    await db.refresh(session)

    logger.info("Reopened session %s", session_id)

    # Get project name
    doc_result = await db.execute(
        select(ContextDoc.project_name).where(ContextDoc.id == session.context_doc_id)
    )
    project_name = doc_result.scalar_one_or_none() or "Unknown"

    return session_to_response(session, project_name)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a session."""
    session = await _get_user_session(session_id, current_user.id, db)

    await db.delete(session)
    await db.commit()

    logger.info("Deleted session %s", session_id)
    return {"deleted": True, "id": session_id}


# =============================================================================
# Prompt Generation
# =============================================================================

@router.post("/generate-prompt")
async def generate_prompt(
    request: GeneratePromptRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a context prompt from a document."""
    doc = await _get_user_doc(request.context_doc_id, current_user.id, db)

    # Build prompt sections
    lines = [f"# Project Context: {doc.project_name}"]

    if doc.description:
        lines.append(f"\n{doc.description}")

    # Current State
    state = doc.current_state or {}
    if any([state.get("complete"), state.get("in_progress"), state.get("blocked")]):
        lines.append("\n## Current State")
        if state.get("complete"):
            lines.append("\n### Completed:")
            for item in state["complete"]:
                lines.append(f"- {item}")
        if state.get("in_progress"):
            lines.append("\n### In Progress:")
            for item in state["in_progress"]:
                lines.append(f"- {item}")
        if state.get("blocked"):
            lines.append("\n### Blocked:")
            for item in state["blocked"]:
                lines.append(f"- {item}")

    # Key Decisions
    if request.include_decisions and doc.key_decisions:
        lines.append("\n## Key Decisions")
        for d in doc.key_decisions:
            lines.append(f"- **{d.get('decision', '')}**: {d.get('reasoning', '')}")

    # Known Issues
    if request.include_issues and doc.known_issues:
        lines.append("\n## Known Issues & Constraints")
        for i in doc.known_issues:
            status = i.get('status', 'open')
            workaround = i.get('workaround', 'No workaround yet')
            lines.append(f"- **{i.get('issue', '')}** ({status}): {workaround}")

    # Lessons Learned
    if request.include_lessons and doc.lessons_learned:
        lines.append("\n## Lessons Learned")
        for l in doc.lessons_learned:
            lines.append(f"- {l.get('lesson', '')}")

    # Next Goals
    if doc.next_goals:
        lines.append("\n## Goals for This Session")
        for g in doc.next_goals:
            priority = g.get('priority', 'medium')
            lines.append(f"- [{priority}] {g.get('goal', '')}")

    # Additional content
    if doc.content:
        lines.append(f"\n## Additional Notes\n{doc.content}")

    # Custom additions
    if request.custom_additions:
        lines.append(f"\n## Additional Context\n{request.custom_additions}")

    prompt = "\n".join(lines)

    return {"prompt": prompt, "project_name": doc.project_name, "version": doc.version}


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=ContextDocsStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get context docs and session statistics."""
    # Get all docs
    docs_result = await db.execute(
        select(ContextDoc).where(ContextDoc.user_id == current_user.id)
    )
    docs = list(docs_result.scalars().all())

    # Get all sessions
    sessions_result = await db.execute(
        select(ContextSession).where(ContextSession.user_id == current_user.id)
    )
    sessions = list(sessions_result.scalars().all())

    total_docs = len(docs)
    active_docs = sum(1 for d in docs if d.is_active)
    total_sessions = len(sessions)

    # Sessions this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = sum(1 for s in sessions if s.started_at >= week_ago)

    # Quality ratings
    quality_ratings = [s.context_quality_rating for s in sessions if s.context_quality_rating]
    continuity_ratings = [s.continuity_rating for s in sessions if s.continuity_rating]

    avg_context_quality = round(sum(quality_ratings) / len(quality_ratings), 1) if quality_ratings else 0.0
    avg_continuity = round(sum(continuity_ratings) / len(continuity_ratings), 1) if continuity_ratings else 0.0

    # Count decisions, lessons, issues
    total_decisions = sum(len(d.key_decisions or []) for d in docs)
    total_lessons = sum(len(d.lessons_learned or []) for d in docs)
    open_issues = sum(
        1 for d in docs
        for i in (d.known_issues or [])
        if i.get("status") == "open"
    )

    # Docs by activity
    doc_activity = []
    for doc in docs:
        doc_sessions = [s for s in sessions if s.context_doc_id == doc.id]
        last_session = max((s.started_at for s in doc_sessions), default=None) if doc_sessions else None
        doc_activity.append({
            "project_name": doc.project_name,
            "session_count": len(doc_sessions),
            "last_session": last_session.isoformat() if last_session else None
        })

    # Sort by session count descending
    doc_activity.sort(key=lambda x: x["session_count"], reverse=True)

    return ContextDocsStats(
        total_docs=total_docs,
        active_docs=active_docs,
        total_sessions=total_sessions,
        sessions_this_week=sessions_this_week,
        avg_context_quality=avg_context_quality,
        avg_continuity_rating=avg_continuity,
        total_decisions=total_decisions,
        total_lessons=total_lessons,
        open_issues=open_issues,
        docs_by_activity=doc_activity[:10]  # Top 10
    )


# =============================================================================
# Seed Examples
# =============================================================================

@router.post("/docs/seed-examples")
async def seed_examples(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Seed example context documents for practice."""
    # Check if user already has docs
    result = await db.execute(
        select(func.count(ContextDoc.id)).where(ContextDoc.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} context docs. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_CONTEXT_DOCS:
        db_doc = ContextDoc(
            user_id=current_user.id,
            project_name=example["project_name"],
            description=example["description"],
            current_state=example["current_state"],
            key_decisions=example["key_decisions"],
            known_issues=example["known_issues"],
            lessons_learned=example["lessons_learned"],
            next_goals=example["next_goals"],
            is_active=True,
            version=1
        )
        db.add(db_doc)
        created.append({"project_name": example["project_name"]})

    await db.commit()

    logger.info("Seeded %s example context docs for user %s", len(created), current_user.email)
    return {"created": len(created), "docs": created}
