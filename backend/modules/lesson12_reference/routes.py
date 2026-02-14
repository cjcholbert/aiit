"""Lesson 12: Reference Card - API routes."""
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.database.models import (
    User, ReferenceCard, Template, OutputType, Checklist,
    Decomposition, Delegation, IterationTask, FeedbackEntry,
    WorkflowTemplate, ContextDoc, FrontierZone, FrontierEncounter
)
from backend.auth import get_current_user

from .schemas import (
    CARD_SECTIONS, EXPORT_FORMATS, EXAMPLE_REFERENCE_CARD,
    CardCreate, CardUpdate, CardSummary, CardResponse,
    GenerateRequest, ExportRequest, CurriculumProgress, ReferenceStats
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lesson12", tags=["Lesson 12: Reference Card"])


# =============================================================================
# Reference Data Endpoints
# =============================================================================

@router.get("/sections")
async def get_sections():
    """Get available card sections."""
    return CARD_SECTIONS


@router.get("/export-formats")
async def get_export_formats():
    """Get available export formats."""
    return EXPORT_FORMATS


@router.get("/example")
async def get_example_card():
    """Get example reference card for inspiration."""
    return EXAMPLE_REFERENCE_CARD


# =============================================================================
# Card CRUD Endpoints
# =============================================================================

@router.post("/cards", response_model=CardResponse)
async def create_card(
    card: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new reference card."""
    # Check if user already has a primary card
    existing_query = select(ReferenceCard).where(
        ReferenceCard.user_id == current_user.id,
        ReferenceCard.is_primary == True
    )
    existing_result = await db.execute(existing_query)
    has_primary = existing_result.scalar_one_or_none() is not None

    db_card = ReferenceCard(
        user_id=current_user.id,
        name=card.name,
        personal_rules=card.personal_rules,
        quick_prompts=card.quick_prompts,
        custom_sections=card.custom_sections,
        is_primary=not has_primary  # First card becomes primary
    )
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)

    return _card_to_response(db_card)


@router.get("/cards", response_model=list[CardSummary])
async def list_cards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all reference cards for the current user."""
    query = select(ReferenceCard).where(
        ReferenceCard.user_id == current_user.id
    ).order_by(desc(ReferenceCard.is_primary), desc(ReferenceCard.updated_at))

    result = await db.execute(query)
    cards = result.scalars().all()

    return [
        CardSummary(
            id=c.id,
            name=c.name,
            is_primary=c.is_primary,
            section_count=_count_sections(c),
            last_generated=c.last_generated,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in cards
    ]


@router.get("/cards/primary", response_model=CardResponse)
async def get_primary_card(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the primary reference card, or create one if none exists."""
    query = select(ReferenceCard).where(
        ReferenceCard.user_id == current_user.id,
        ReferenceCard.is_primary == True
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        # Create a default primary card
        card = ReferenceCard(
            user_id=current_user.id,
            name="My AI Reference Card",
            is_primary=True
        )
        db.add(card)
        await db.commit()
        await db.refresh(card)

    return _card_to_response(card)


@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(
    card_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single reference card by ID."""
    query = select(ReferenceCard).where(
        ReferenceCard.id == card_id,
        ReferenceCard.user_id == current_user.id
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    return _card_to_response(card)


@router.put("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: str,
    card_update: CardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a reference card."""
    query = select(ReferenceCard).where(
        ReferenceCard.id == card_id,
        ReferenceCard.user_id == current_user.id
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Update fields
    update_data = card_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)

    await db.commit()
    await db.refresh(card)

    return _card_to_response(card)


@router.delete("/cards/{card_id}")
async def delete_card(
    card_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reference card."""
    query = select(ReferenceCard).where(
        ReferenceCard.id == card_id,
        ReferenceCard.user_id == current_user.id
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if card.is_primary:
        raise HTTPException(status_code=400, detail="Cannot delete primary card")

    await db.delete(card)
    await db.commit()

    return {"message": "Card deleted successfully"}


# =============================================================================
# Generation Endpoint
# =============================================================================

@router.post("/cards/{card_id}/generate", response_model=CardResponse)
async def generate_card_content(
    card_id: str,
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate/regenerate card content from user's data across all weeks."""
    query = select(ReferenceCard).where(
        ReferenceCard.id == card_id,
        ReferenceCard.user_id == current_user.id
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Gather data from all weeks
    if request.include_templates:
        card.top_templates = await _get_top_templates(db, current_user.id)

    if request.include_trust:
        card.trust_zones = await _get_trust_zones(db, current_user.id)

    if request.include_verification:
        card.verification_shortcuts = await _get_verification_shortcuts(db, current_user.id)

    if request.include_delegation:
        card.delegation_patterns = await _get_delegation_patterns(db, current_user.id)

    if request.include_iteration:
        card.iteration_style = await _get_iteration_style(db, current_user.id)

    if request.include_feedback:
        card.feedback_principles = await _get_feedback_principles(db, current_user.id)

    if request.include_workflows:
        card.workflow_highlights = await _get_workflow_highlights(db, current_user.id)

    if request.include_context:
        card.context_best_practices = await _get_context_practices(db, current_user.id)

    if request.include_frontier:
        card.frontier_map = await _get_frontier_map(db, current_user.id)

    card.last_generated = datetime.utcnow()
    await db.commit()
    await db.refresh(card)

    return _card_to_response(card)


# =============================================================================
# Export Endpoint
# =============================================================================

@router.post("/cards/{card_id}/export")
async def export_card(
    card_id: str,
    request: ExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export the reference card in the requested format."""
    query = select(ReferenceCard).where(
        ReferenceCard.id == card_id,
        ReferenceCard.user_id == current_user.id
    )
    result = await db.execute(query)
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if request.format == "json":
        return _card_to_response(card)
    elif request.format == "markdown":
        content = _generate_markdown(card, request.include_sections)
        return PlainTextResponse(content, media_type="text/markdown")
    elif request.format == "html":
        content = _generate_html(card, request.include_sections)
        return PlainTextResponse(content, media_type="text/html")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")


# =============================================================================
# Statistics Endpoint
# =============================================================================

@router.get("/stats", response_model=ReferenceStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get curriculum progress and reference card statistics."""
    user_id = current_user.id

    # Check for primary card
    cards_query = select(ReferenceCard).where(ReferenceCard.user_id == user_id)
    cards_result = await db.execute(cards_query)
    cards = cards_result.scalars().all()

    has_primary = any(c.is_primary for c in cards)

    # Gather progress from each week
    progress = []
    total_items = 0
    weeks_with_data = 0

    # Week 1: Conversations
    w1_count = await _count_items(db, "conversations", user_id)
    progress.append(_make_progress(1, "Context Tracker", w1_count))
    total_items += w1_count
    if w1_count > 0: weeks_with_data += 1

    # Week 2: Templates
    w2_count = await _count_items(db, "templates", user_id)
    progress.append(_make_progress(2, "Template Builder", w2_count))
    total_items += w2_count
    if w2_count > 0: weeks_with_data += 1

    # Week 3: Output Types + Predictions
    w3_count = await _count_items(db, "output_types", user_id)
    w3_count += await _count_items(db, "predictions", user_id)
    progress.append(_make_progress(3, "Trust Matrix", w3_count))
    total_items += w3_count
    if w3_count > 0: weeks_with_data += 1

    # Week 4: Checklists
    w4_count = await _count_items(db, "checklists", user_id)
    progress.append(_make_progress(4, "Verification Tools", w4_count))
    total_items += w4_count
    if w4_count > 0: weeks_with_data += 1

    # Week 5: Decompositions
    w5_count = await _count_items(db, "decompositions", user_id)
    progress.append(_make_progress(5, "Task Decomposer", w5_count))
    total_items += w5_count
    if w5_count > 0: weeks_with_data += 1

    # Week 6: Delegations
    w6_count = await _count_items(db, "delegations", user_id)
    progress.append(_make_progress(6, "Delegation Tracker", w6_count))
    total_items += w6_count
    if w6_count > 0: weeks_with_data += 1

    # Week 7: Iteration Tasks
    w7_count = await _count_items(db, "iteration_tasks", user_id)
    progress.append(_make_progress(7, "Iteration Passes", w7_count))
    total_items += w7_count
    if w7_count > 0: weeks_with_data += 1

    # Week 8: Feedback Entries
    w8_count = await _count_items(db, "feedback_entries", user_id)
    progress.append(_make_progress(8, "Feedback Analyzer", w8_count))
    total_items += w8_count
    if w8_count > 0: weeks_with_data += 1

    # Week 9: Workflow Templates + Reports
    w9_count = await _count_items(db, "workflow_templates", user_id)
    w9_count += await _count_items(db, "status_reports", user_id)
    progress.append(_make_progress(9, "Status Reporter", w9_count))
    total_items += w9_count
    if w9_count > 0: weeks_with_data += 1

    # Week 10: Context Docs + Sessions
    w10_count = await _count_items(db, "context_docs", user_id)
    w10_count += await _count_items(db, "context_sessions", user_id)
    progress.append(_make_progress(10, "Context Docs", w10_count))
    total_items += w10_count
    if w10_count > 0: weeks_with_data += 1

    # Week 11: Frontier Zones + Encounters
    w11_count = await _count_items(db, "frontier_zones", user_id)
    w11_count += await _count_items(db, "frontier_encounters", user_id)
    progress.append(_make_progress(11, "Frontier Mapper", w11_count))
    total_items += w11_count
    if w11_count > 0: weeks_with_data += 1

    # Week 12: Reference Cards
    w12_count = len(cards)
    progress.append(_make_progress(12, "Reference Card", w12_count))
    total_items += w12_count
    if w12_count > 0: weeks_with_data += 1

    # Find most active week
    most_active = max(progress, key=lambda p: p["items_created"])
    most_active_week = most_active["name"] if most_active["items_created"] > 0 else None

    completion_pct = round((weeks_with_data / 12) * 100, 1)

    return ReferenceStats(
        has_primary_card=has_primary,
        total_cards=len(cards),
        curriculum_progress=progress,
        completion_percentage=completion_pct,
        total_items_created=total_items,
        most_active_week=most_active_week,
        weeks_with_data=weeks_with_data
    )


# =============================================================================
# Helper Functions
# =============================================================================

def _card_to_response(card: ReferenceCard) -> CardResponse:
    """Convert database card to response model."""
    return CardResponse(
        id=card.id,
        name=card.name,
        top_templates=card.top_templates or [],
        trust_zones=card.trust_zones or [],
        verification_shortcuts=card.verification_shortcuts or [],
        delegation_patterns=card.delegation_patterns or [],
        iteration_style=card.iteration_style or {},
        feedback_principles=card.feedback_principles or [],
        workflow_highlights=card.workflow_highlights or [],
        context_best_practices=card.context_best_practices or [],
        frontier_map=card.frontier_map or {},
        personal_rules=card.personal_rules or [],
        quick_prompts=card.quick_prompts or [],
        custom_sections=card.custom_sections or [],
        is_primary=card.is_primary,
        last_generated=card.last_generated,
        created_at=card.created_at,
        updated_at=card.updated_at
    )


def _count_sections(card: ReferenceCard) -> int:
    """Count non-empty sections in a card."""
    count = 0
    if card.top_templates: count += 1
    if card.trust_zones: count += 1
    if card.verification_shortcuts: count += 1
    if card.delegation_patterns: count += 1
    if card.iteration_style: count += 1
    if card.feedback_principles: count += 1
    if card.workflow_highlights: count += 1
    if card.context_best_practices: count += 1
    if card.frontier_map: count += 1
    if card.personal_rules: count += 1
    if card.quick_prompts: count += 1
    if card.custom_sections: count += 1
    return count


async def _count_items(db: AsyncSession, table: str, user_id: str) -> int:
    """Count items in a table for a user."""
    table_map = {
        "conversations": "conversations",
        "templates": "templates",
        "output_types": "output_types",
        "predictions": "predictions",
        "checklists": "checklists",
        "decompositions": "decompositions",
        "delegations": "delegations",
        "iteration_tasks": "iteration_tasks",
        "feedback_entries": "feedback_entries",
        "workflow_templates": "workflow_templates",
        "status_reports": "status_reports",
        "context_docs": "context_docs",
        "context_sessions": "context_sessions",
        "frontier_zones": "frontier_zones",
        "frontier_encounters": "frontier_encounters"
    }

    if table not in table_map:
        return 0

    result = await db.execute(
        select(func.count()).select_from(
            select(1).where(
                func.text(f"{table}.user_id = '{user_id}'")
            ).select_from(func.text(table_map[table]))
        )
    )
    # Simpler approach - just query the model directly
    from backend.database.models import (
        Conversation, Template, OutputType, Prediction, Checklist,
        Decomposition, Delegation, IterationTask, FeedbackEntry,
        WorkflowTemplate, StatusReport, ContextDoc, ContextSession,
        FrontierZone, FrontierEncounter
    )

    model_map = {
        "conversations": Conversation,
        "templates": Template,
        "output_types": OutputType,
        "predictions": Prediction,
        "checklists": Checklist,
        "decompositions": Decomposition,
        "delegations": Delegation,
        "iteration_tasks": IterationTask,
        "feedback_entries": FeedbackEntry,
        "workflow_templates": WorkflowTemplate,
        "status_reports": StatusReport,
        "context_docs": ContextDoc,
        "context_sessions": ContextSession,
        "frontier_zones": FrontierZone,
        "frontier_encounters": FrontierEncounter
    }

    model = model_map.get(table)
    if not model:
        return 0

    result = await db.execute(
        select(func.count()).where(model.user_id == user_id)
    )
    return result.scalar() or 0


def _make_progress(week: int, name: str, count: int) -> dict:
    """Create progress entry."""
    if count == 0:
        status = "not_started"
    elif count < 3:
        status = "in_progress"
    else:
        status = "completed"

    return {
        "week": week,
        "name": name,
        "status": status,
        "items_created": count,
        "last_activity": None
    }


async def _get_top_templates(db: AsyncSession, user_id: str) -> list[dict]:
    """Get top used templates."""
    query = select(Template).where(
        Template.user_id == user_id
    ).order_by(desc(Template.usage_count)).limit(5)

    result = await db.execute(query)
    templates = result.scalars().all()

    return [
        {
            "name": t.name,
            "category": t.category,
            "usage_count": t.usage_count,
            "snippet": t.content[:100] + "..." if len(t.content) > 100 else t.content
        }
        for t in templates
    ]


async def _get_trust_zones(db: AsyncSession, user_id: str) -> list[dict]:
    """Get trust zones from output types."""
    query = select(OutputType).where(
        OutputType.user_id == user_id
    ).order_by(OutputType.trust_level)

    result = await db.execute(query)
    types = result.scalars().all()

    return [
        {
            "type": t.name,
            "level": t.trust_level,
            "verify": t.verification_approach or "Standard review"
        }
        for t in types
    ]


async def _get_verification_shortcuts(db: AsyncSession, user_id: str) -> list[dict]:
    """Get verification shortcuts from checklists."""
    query = select(Checklist).where(
        Checklist.user_id == user_id
    ).limit(5)

    result = await db.execute(query)
    checklists = result.scalars().all()

    shortcuts = []
    for c in checklists:
        items = c.items or []
        quick_check = items[0] if items else "Review output"
        shortcuts.append({
            "output_type": c.output_type,
            "quick_check": quick_check if isinstance(quick_check, str) else quick_check.get("text", "Review output")
        })

    return shortcuts


async def _get_delegation_patterns(db: AsyncSession, user_id: str) -> list[dict]:
    """Get delegation patterns."""
    query = select(Delegation).where(
        Delegation.user_id == user_id
    ).limit(5)

    result = await db.execute(query)
    delegations = result.scalars().all()

    return [
        {
            "pattern": d.name,
            "description": d.notes or "Delegation pattern"
        }
        for d in delegations
    ]


async def _get_iteration_style(db: AsyncSession, user_id: str) -> dict:
    """Analyze iteration style from iteration tasks."""
    query = select(IterationTask).where(
        IterationTask.user_id == user_id,
        IterationTask.is_complete == True
    )

    result = await db.execute(query)
    tasks = result.scalars().all()

    if not tasks:
        return {
            "preferred_passes": 3,
            "typical_flow": "Structure -> Content -> Polish",
            "feedback_style": "Iterative refinement"
        }

    # Analyze patterns
    total_passes = sum(t.current_pass for t in tasks)
    avg_passes = round(total_passes / len(tasks), 1) if tasks else 3

    return {
        "preferred_passes": avg_passes,
        "typical_flow": "Structure -> Content -> Polish",
        "feedback_style": "Iterative refinement",
        "tasks_completed": len(tasks)
    }


async def _get_feedback_principles(db: AsyncSession, user_id: str) -> list[str]:
    """Extract feedback principles from high-quality feedback entries."""
    query = select(FeedbackEntry).where(
        FeedbackEntry.user_id == user_id,
        FeedbackEntry.is_example == True
    ).limit(5)

    result = await db.execute(query)
    entries = result.scalars().all()

    # Default principles if no examples saved
    if not entries:
        return [
            "Be specific about what needs to change",
            "Give examples when possible",
            "Explain the 'why' behind requests"
        ]

    # Extract principles from saved examples
    principles = []
    for e in entries:
        if e.rewritten_feedback:
            principles.append(f"Example: {e.rewritten_feedback[:80]}...")

    return principles or ["Be specific about what needs to change"]


async def _get_workflow_highlights(db: AsyncSession, user_id: str) -> list[dict]:
    """Get most time-saving workflows."""
    query = select(WorkflowTemplate).where(
        WorkflowTemplate.user_id == user_id,
        WorkflowTemplate.is_active == True
    ).order_by(desc(WorkflowTemplate.estimated_time_minutes)).limit(5)

    result = await db.execute(query)
    workflows = result.scalars().all()

    return [
        {
            "name": w.name,
            "time_saved": f"{w.estimated_time_minutes or 0} min/{w.frequency or 'use'}"
        }
        for w in workflows
    ]


async def _get_context_practices(db: AsyncSession, user_id: str) -> list[str]:
    """Extract context best practices from high-rated sessions."""
    # Get lessons learned from context docs
    query = select(ContextDoc).where(
        ContextDoc.user_id == user_id
    ).limit(10)

    result = await db.execute(query)
    docs = result.scalars().all()

    practices = set()
    for doc in docs:
        lessons = doc.lessons_learned or []
        for lesson in lessons[:2]:  # Take top 2 from each doc
            if isinstance(lesson, dict):
                practices.add(lesson.get("lesson", ""))
            elif isinstance(lesson, str):
                practices.add(lesson)

    practices = [p for p in practices if p][:5]

    if not practices:
        return [
            "Start sessions with project state summary",
            "Document decisions with reasoning",
            "End sessions by updating context doc"
        ]

    return practices


async def _get_frontier_map(db: AsyncSession, user_id: str) -> dict:
    """Build frontier map from zones."""
    query = select(FrontierZone).where(
        FrontierZone.user_id == user_id
    )

    result = await db.execute(query)
    zones = result.scalars().all()

    frontier_map = {
        "reliable": [],
        "mixed": [],
        "unreliable": []
    }

    for zone in zones:
        if zone.reliability in frontier_map:
            frontier_map[zone.reliability].append(zone.name)

    return frontier_map


def _generate_markdown(card: ReferenceCard, sections: list[str]) -> str:
    """Generate markdown export of the card."""
    md = f"# {card.name}\n\n"
    md += f"*Generated: {datetime.utcnow().strftime('%Y-%m-%d')}*\n\n"

    if not sections or "trust_zones" in sections:
        if card.trust_zones:
            md += "## Trust Zones\n\n"
            for zone in card.trust_zones:
                md += f"- **{zone.get('type', 'Unknown')}** ({zone.get('level', 'unknown')}): {zone.get('verify', '')}\n"
            md += "\n"

    if not sections or "templates" in sections:
        if card.top_templates:
            md += "## Top Templates\n\n"
            for t in card.top_templates:
                md += f"### {t.get('name', 'Template')}\n"
                md += f"*Category: {t.get('category', 'general')} | Used: {t.get('usage_count', 0)} times*\n\n"
                md += f"```\n{t.get('snippet', '')}\n```\n\n"

    if not sections or "verification" in sections:
        if card.verification_shortcuts:
            md += "## Verification Shortcuts\n\n"
            for v in card.verification_shortcuts:
                md += f"- **{v.get('output_type', 'Output')}**: {v.get('quick_check', '')}\n"
            md += "\n"

    if not sections or "frontier" in sections:
        if card.frontier_map:
            md += "## Frontier Map\n\n"
            for level, items in card.frontier_map.items():
                if items:
                    md += f"### {level.title()}\n"
                    for item in items:
                        md += f"- {item}\n"
                    md += "\n"

    if not sections or "personal" in sections:
        if card.personal_rules:
            md += "## Personal Rules\n\n"
            for rule in card.personal_rules:
                md += f"- {rule}\n"
            md += "\n"

    if not sections or "quick_prompts" in sections:
        if card.quick_prompts:
            md += "## Quick Prompts\n\n"
            for p in card.quick_prompts:
                md += f"### /{p.get('trigger', 'prompt')}\n"
                md += f"```\n{p.get('prompt', '')}\n```\n\n"

    return md


def _generate_html(card: ReferenceCard, sections: list[str]) -> str:
    """Generate HTML export of the card."""
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{card.name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }}
        h1 {{ color: #1a1a1a; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }}
        h2 {{ color: #374151; margin-top: 30px; }}
        .zone {{ padding: 10px; margin: 5px 0; border-radius: 5px; }}
        .reliable {{ background: #d1fae5; }}
        .mixed {{ background: #fef3c7; }}
        .unreliable {{ background: #fee2e2; }}
        code {{ background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }}
        pre {{ background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; overflow-x: auto; }}
        ul {{ list-style-type: none; padding-left: 0; }}
        li {{ padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
        .meta {{ color: #6b7280; font-size: 0.9em; }}
    </style>
</head>
<body>
    <h1>{card.name}</h1>
    <p class="meta">Generated: {datetime.utcnow().strftime('%Y-%m-%d')}</p>
"""

    if not sections or "trust_zones" in sections:
        if card.trust_zones:
            html += "<h2>Trust Zones</h2><ul>"
            for zone in card.trust_zones:
                level = zone.get('level', 'mixed')
                html += f"<li class='zone {level}'><strong>{zone.get('type', '')}</strong> ({level}): {zone.get('verify', '')}</li>"
            html += "</ul>"

    if not sections or "personal" in sections:
        if card.personal_rules:
            html += "<h2>Personal Rules</h2><ul>"
            for rule in card.personal_rules:
                html += f"<li>{rule}</li>"
            html += "</ul>"

    if not sections or "frontier" in sections:
        if card.frontier_map:
            html += "<h2>Frontier Map</h2>"
            for level, items in card.frontier_map.items():
                if items:
                    html += f"<h3 class='{level}'>{level.title()}</h3><ul>"
                    for item in items:
                        html += f"<li>{item}</li>"
                    html += "</ul>"

    html += "</body></html>"
    return html
