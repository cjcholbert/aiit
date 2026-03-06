"""Progress tracking routes - lesson completion status."""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.auth.dependencies import get_current_user
from backend.database.models import (
    User, Conversation, FeedbackEntry, Template, TemplateTest,
    ContextDoc, ContextSession, OutputType, Prediction, CalibrationInsight,
    Checklist, Decomposition, Delegation, IterationTask,
    WorkflowTemplate, StatusReport, FrontierZone, FrontierEncounter,
    ReferenceCard,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["progress"])


async def _count(db: AsyncSession, model, user_id: str, extra_filter=None):
    """Count rows for a given model and user."""
    q = select(func.count()).select_from(model).where(model.user_id == user_id)
    if extra_filter is not None:
        q = q.where(extra_filter)
    result = await db.execute(q)
    return result.scalar() or 0


async def _check_lesson1(db: AsyncSession, user_id: str) -> dict:
    """L1: analyzed 1+ conversation and reviewed the coaching output."""
    conv_count = await _count(db, Conversation, user_id)
    has_analysis = conv_count >= 1
    # Bonus criteria: 3+ conversations for deeper pattern recognition
    has_three = conv_count >= 3
    criteria_met = (1 if conv_count >= 1 else 0) + (1 if has_analysis else 0) + (1 if has_three else 0)
    return {
        "lesson": 1,
        "criteria_met": criteria_met,
        "criteria_total": 3,
        "complete": conv_count >= 1,
    }


async def _check_lesson2(db: AsyncSession, user_id: str) -> dict:
    """L2: analyzed 3+ entries, rewrote 1+ vague, reviewed patterns, 3+ categories."""
    entry_count = await _count(db, FeedbackEntry, user_id)
    rewritten_count = await _count(
        db, FeedbackEntry, user_id,
        FeedbackEntry.rewritten_feedback.isnot(None)
    )
    # Check distinct categories
    cat_q = select(FeedbackEntry.category).where(
        FeedbackEntry.user_id == user_id,
        FeedbackEntry.category.isnot(None),
    ).distinct()
    cat_result = await db.execute(cat_q)
    distinct_categories = len(cat_result.scalars().all())
    has_spread = distinct_categories >= 3
    criteria_met = (1 if entry_count >= 3 else 0) + (1 if rewritten_count >= 1 else 0) + 1 + (1 if has_spread else 0)  # patterns always available
    return {
        "lesson": 2,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": entry_count >= 3 and rewritten_count >= 1 and has_spread,
    }


async def _check_lesson3(db: AsyncSession, user_id: str) -> dict:
    """L3: created 1+ template, tested 1+, used variables, rated 1+ test."""
    template_count = await _count(db, Template, user_id)
    test_count = await _count(db, TemplateTest, user_id)
    # Check if any template has variables
    var_q = select(func.count()).select_from(Template).where(
        Template.user_id == user_id,
        Template.variables.isnot(None),
    )
    var_result = await db.execute(var_q)
    has_variables = (var_result.scalar() or 0) >= 1
    # Check for rated tests
    rated_count = await _count(db, TemplateTest, user_id, TemplateTest.user_rating.isnot(None))
    has_rated = rated_count >= 1
    criteria_met = (1 if template_count >= 1 else 0) + (1 if test_count >= 1 else 0) + (1 if has_variables else 0) + (1 if has_rated else 0)
    return {
        "lesson": 3,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": template_count >= 1 and test_count >= 1 and has_variables and has_rated,
    }


async def _check_lesson4(db: AsyncSession, user_id: str) -> dict:
    """L4: created 1+ doc, 1+ session, generated prompt, documented decisions."""
    doc_count = await _count(db, ContextDoc, user_id)
    session_count = await _count(db, ContextSession, user_id)
    # Check for docs with key_decisions populated
    docs_q = select(ContextDoc).where(
        ContextDoc.user_id == user_id,
        ContextDoc.key_decisions.isnot(None),
    )
    docs_result = await db.execute(docs_q)
    docs_with_decisions = docs_result.scalars().all()
    has_decisions = any(
        isinstance(d.key_decisions, list) and len(d.key_decisions) > 0
        for d in docs_with_decisions
    )
    # prompt generation is hard to track without a separate counter, use session as proxy
    criteria_met = (1 if doc_count >= 1 else 0) + (1 if session_count >= 1 else 0) + (1 if session_count >= 1 else 0) + (1 if has_decisions else 0)
    return {
        "lesson": 4,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": doc_count >= 1 and session_count >= 1 and has_decisions,
    }


async def _check_lesson5(db: AsyncSession, user_id: str) -> dict:
    """L5: trust matrix created, 10+ predictions verified, calibration adjustment, 3+ output types."""
    ot_count = await _count(db, OutputType, user_id)
    verified_count = await _count(
        db, Prediction, user_id,
        Prediction.was_correct.isnot(None)
    )
    # over-trust or over-verify
    over_trust = await _count(
        db, Prediction, user_id,
        (Prediction.was_correct == False) & (Prediction.confidence_rating >= 7)
    )
    over_verify = await _count(
        db, Prediction, user_id,
        (Prediction.was_correct == True) & (Prediction.confidence_rating <= 4)
    )
    has_calibration = (over_trust + over_verify) > 0
    has_3_types = ot_count >= 3
    criteria_met = (1 if ot_count >= 1 else 0) + (1 if verified_count >= 10 else 0) + (1 if has_calibration else 0) + (1 if has_3_types else 0)
    return {
        "lesson": 5,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": ot_count >= 1 and verified_count >= 10 and has_calibration and has_3_types,
    }


async def _check_lesson6(db: AsyncSession, user_id: str) -> dict:
    """L6: 1+ checklist, 1+ practice session, tracked issues, completed session."""
    checklist_count = await _count(db, Checklist, user_id)
    # Verification sessions are stored in-memory, not in DB.
    # Use checklist_count >= 1 as proxy for having done at least one session/practice.
    has_session = checklist_count >= 1
    # For "completed a full session", use checklist count >= 2 as a proxy
    # (users who completed sessions typically create/iterate on checklists)
    has_completed_session = checklist_count >= 2
    criteria_met = (
        (1 if checklist_count >= 1 else 0)
        + (1 if has_session else 0)
        + (1 if has_session else 0)
        + (1 if has_completed_session else 0)
    )
    return {
        "lesson": 6,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": checklist_count >= 1 and has_completed_session,
    }


async def _check_lesson7(db: AsyncSession, user_id: str) -> dict:
    """L7: 1+ decomposition, all 3 categories used, reasoning added, 5+ tasks total."""
    decomp_q = select(Decomposition).where(Decomposition.user_id == user_id)
    decomp_result = await db.execute(decomp_q)
    decomps = decomp_result.scalars().all()
    decomp_count = len(decomps)

    # Check categories and reasoning by inspecting JSON in Python
    all_tasks = []
    for d in decomps:
        tasks = d.tasks if isinstance(d.tasks, list) else []
        all_tasks.extend(tasks)

    categories_found = set()
    has_reasoning = False
    for t in all_tasks:
        if isinstance(t, dict):
            cat = t.get("category")
            if cat:
                categories_found.add(cat)
            if t.get("reasoning"):
                has_reasoning = True

    has_all_categories = (
        "ai_optimal" in categories_found
        and "collaborative" in categories_found
        and "human_primary" in categories_found
    )
    total_tasks = len(all_tasks)
    has_5_tasks = total_tasks >= 5

    criteria_met = (
        (1 if decomp_count >= 1 else 0)
        + (1 if has_all_categories else 0)
        + (1 if has_reasoning else 0)
        + (1 if has_5_tasks else 0)
    )
    return {
        "lesson": 7,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": decomp_count >= 1 and has_all_categories and has_reasoning and has_5_tasks,
    }


async def _check_lesson8(db: AsyncSession, user_id: str) -> dict:
    """L8: 1+ delegation, received output, reviewed, 3+ tasks total."""
    deleg_q = select(Delegation).where(Delegation.user_id == user_id)
    deleg_result = await db.execute(deleg_q)
    delegations = deleg_result.scalars().all()
    deleg_count = len(delegations)

    # Check task_sequence in Python for output_received and review_notes
    has_output = False
    has_review = False
    total_tasks = 0
    for d in delegations:
        tasks = d.task_sequence if isinstance(d.task_sequence, list) else []
        total_tasks += len(tasks)
        for t in tasks:
            if isinstance(t, dict):
                if t.get("output_received"):
                    has_output = True
                if t.get("review_notes"):
                    has_review = True

    has_3_tasks = total_tasks >= 3

    criteria_met = (
        (1 if deleg_count >= 1 else 0)
        + (1 if has_output else 0)
        + (1 if has_review else 0)
        + (1 if has_3_tasks else 0)
    )
    return {
        "lesson": 8,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": deleg_count >= 1 and has_output and has_review and has_3_tasks,
    }


async def _check_lesson9(db: AsyncSession, user_id: str) -> dict:
    """L9: 1+ task, all 3 passes, transition feedback, 2+ tasks."""
    task_count = await _count(db, IterationTask, user_id)
    complete_count = await _count(
        db, IterationTask, user_id,
        IterationTask.is_complete == True
    )
    has_2_tasks = task_count >= 2
    criteria_met = (1 if task_count >= 1 else 0) + (1 if complete_count >= 1 else 0) + (1 if task_count >= 1 else 0) + (1 if has_2_tasks else 0)
    return {
        "lesson": 9,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": task_count >= 1 and complete_count >= 1 and has_2_tasks,
    }


async def _check_lesson10(db: AsyncSession, user_id: str) -> dict:
    """L10: 1+ workflow, 1+ report, time tracking, 2+ reports."""
    wf_count = await _count(db, WorkflowTemplate, user_id)
    report_count = await _count(db, StatusReport, user_id)
    time_count = await _count(
        db, StatusReport, user_id,
        StatusReport.actual_time_minutes > 0
    )
    has_2_reports = report_count >= 2
    criteria_met = (1 if wf_count >= 1 else 0) + (1 if report_count >= 1 else 0) + (1 if time_count >= 1 else 0) + (1 if has_2_reports else 0)
    return {
        "lesson": 10,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": wf_count >= 1 and report_count >= 1 and time_count >= 1 and has_2_reports,
    }


async def _check_lesson11(db: AsyncSession, user_id: str) -> dict:
    """L11: 1+ zone, 1+ encounter, reviewed stats, 2+ zone categories."""
    zone_count = await _count(db, FrontierZone, user_id)
    enc_count = await _count(db, FrontierEncounter, user_id)
    # Check distinct zone categories
    zone_cat_q = select(FrontierZone.category).where(
        FrontierZone.user_id == user_id,
        FrontierZone.category.isnot(None),
    ).distinct()
    zone_cat_result = await db.execute(zone_cat_q)
    distinct_zone_cats = len(zone_cat_result.scalars().all())
    has_2_categories = distinct_zone_cats >= 2
    criteria_met = (1 if zone_count >= 1 else 0) + (1 if enc_count >= 1 else 0) + (1 if zone_count >= 1 else 0) + (1 if has_2_categories else 0)
    return {
        "lesson": 11,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": zone_count >= 1 and enc_count >= 1 and has_2_categories,
    }


async def _check_lesson12(db: AsyncSession, user_id: str) -> dict:
    """L12: generated card, reviewed progress, exported/customized, 3+ sections filled."""
    cards_q = select(ReferenceCard).where(ReferenceCard.user_id == user_id)
    cards_result = await db.execute(cards_q)
    cards = cards_result.scalars().all()
    card_count = len(cards)

    has_personal_rules = False
    has_3_sections = False
    for c in cards:
        if isinstance(c.personal_rules, list) and len(c.personal_rules) > 0:
            has_personal_rules = True
        # Count filled sections
        filled = 0
        if isinstance(c.top_templates, list) and len(c.top_templates) > 0:
            filled += 1
        if isinstance(c.feedback_principles, list) and len(c.feedback_principles) > 0:
            filled += 1
        if isinstance(c.trust_zones, list) and len(c.trust_zones) > 0:
            filled += 1
        if isinstance(c.delegation_patterns, list) and len(c.delegation_patterns) > 0:
            filled += 1
        if isinstance(c.personal_rules, list) and len(c.personal_rules) > 0:
            filled += 1
        if isinstance(c.workflow_highlights, list) and len(c.workflow_highlights) > 0:
            filled += 1
        if isinstance(c.context_best_practices, list) and len(c.context_best_practices) > 0:
            filled += 1
        if isinstance(c.verification_shortcuts, list) and len(c.verification_shortcuts) > 0:
            filled += 1
        if filled >= 3:
            has_3_sections = True

    criteria_met = (
        (1 if card_count >= 1 else 0)
        + (1 if card_count >= 1 else 0)  # reviewed progress proxy
        + (1 if has_personal_rules else 0)
        + (1 if has_3_sections else 0)
    )
    return {
        "lesson": 12,
        "criteria_met": criteria_met,
        "criteria_total": 4,
        "complete": card_count >= 1 and has_personal_rules and has_3_sections,
    }


LESSON_CHECKERS = [
    _check_lesson1, _check_lesson2, _check_lesson3, _check_lesson4,
    _check_lesson5, _check_lesson6, _check_lesson7, _check_lesson8,
    _check_lesson9, _check_lesson10, _check_lesson11, _check_lesson12,
]


@router.get("/summary")
async def get_progress_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get completion status for all 12 lessons."""
    lessons = []
    for checker in LESSON_CHECKERS:
        result = await checker(db, current_user.id)
        lessons.append(result)

    completed = sum(1 for l in lessons if l["complete"])
    total = len(lessons)

    return {
        "lessons": lessons,
        "completed_count": completed,
        "total_count": total,
        "completion_percentage": round((completed / total) * 100) if total > 0 else 0,
    }
