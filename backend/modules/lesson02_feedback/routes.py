"""Lesson 2: Feedback Analyzer API routes."""
import logging
import re
from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.database.models import User, FeedbackEntry
from backend.auth.dependencies import get_current_user

from .schemas import (
    AnalyzeFeedbackRequest, FeedbackEntryCreate, FeedbackEntryUpdate,
    FeedbackEntryResponse, FeedbackEntrySummary, FeedbackStats,
    FeedbackAnalysis, FeedbackIssue,
    VAGUE_PATTERNS, QUALITY_LEVELS, FEEDBACK_CATEGORIES, EXAMPLE_FEEDBACK
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson2", tags=["Lesson 2: Feedback Analyzer"])


# =============================================================================
# Helper Functions
# =============================================================================

def analyze_feedback_quality(feedback: str, context: str = "") -> FeedbackAnalysis:
    """
    Analyze feedback quality using pattern matching.

    This is a rule-based analyzer. For production, you could enhance this
    with an LLM call for more nuanced analysis.
    """
    feedback_lower = feedback.lower()
    issues = []
    strengths = []

    # Check for vague patterns

    # 1. No specifics - check for location indicators
    has_specifics = bool(re.search(
        r'(line \d+|paragraph|section|function|class|button|field|page|'
        r'the \w+ (in|on|at)|specifically|exactly|"[^"]+"|\'[^\']+\')',
        feedback_lower
    ))
    if not has_specifics and len(feedback) < 100:
        issues.append(FeedbackIssue(
            pattern="no_specifics",
            description=VAGUE_PATTERNS["no_specifics"]["description"],
            suggestion=VAGUE_PATTERNS["no_specifics"]["fix"]
        ))
    elif has_specifics:
        strengths.append("Points to specific locations or elements")

    # 2. No clear action - check for action verbs
    action_patterns = r'\b(change|add|remove|replace|move|update|fix|use|make it|should be|needs to|must|delete|insert|modify)\b'
    has_action = bool(re.search(action_patterns, feedback_lower))
    if not has_action:
        issues.append(FeedbackIssue(
            pattern="no_action",
            description=VAGUE_PATTERNS["no_action"]["description"],
            suggestion=VAGUE_PATTERNS["no_action"]["fix"]
        ))
    else:
        strengths.append("Includes clear action to take")

    # 3. Missing reasoning - check for because/since/to/so that
    reason_patterns = r'\b(because|since|so that|in order to|this will|to ensure|to make|to improve|to match|to follow)\b'
    has_reason = bool(re.search(reason_patterns, feedback_lower))
    if not has_reason and len(feedback) > 20:
        issues.append(FeedbackIssue(
            pattern="no_reason",
            description=VAGUE_PATTERNS["no_reason"]["description"],
            suggestion=VAGUE_PATTERNS["no_reason"]["fix"]
        ))
    elif has_reason:
        strengths.append("Explains reasoning behind the change")

    # 4. Purely subjective - check for feeling words without criteria
    subjective_patterns = r"\b(i don'?t like|feels? wrong|not what i|doesn'?t feel|looks? bad|seems off)\b"
    has_subjective = bool(re.search(subjective_patterns, feedback_lower))
    criteria_patterns = r'\b(\d+ (words?|characters?|lines?|items?)|under|over|at least|at most|less than|more than|between)\b'
    has_criteria = bool(re.search(criteria_patterns, feedback_lower))

    if has_subjective and not has_criteria:
        issues.append(FeedbackIssue(
            pattern="subjective",
            description=VAGUE_PATTERNS["subjective"]["description"],
            suggestion=VAGUE_PATTERNS["subjective"]["fix"]
        ))
    elif has_criteria:
        strengths.append("Includes measurable criteria")

    # 5. Scope creep - check for adding unrelated requests
    scope_patterns = r"\b(also add|while you'?re at it|can you also|and also|plus add|additionally)\b"
    has_scope_creep = bool(re.search(scope_patterns, feedback_lower))
    if has_scope_creep:
        issues.append(FeedbackIssue(
            pattern="scope_creep",
            description=VAGUE_PATTERNS["scope_creep"]["description"],
            suggestion=VAGUE_PATTERNS["scope_creep"]["fix"]
        ))

    # Calculate quality score
    base_score = 10
    penalty_per_issue = 2.5
    score = max(0, base_score - (len(issues) * penalty_per_issue))

    # Bonus for length and detail
    if len(feedback) > 150 and len(issues) <= 1:
        score = min(10, score + 1)

    score = round(score)

    # Determine quality level
    if score >= 8:
        quality_level = "specific"
    elif score >= 5:
        quality_level = "adequate"
    else:
        quality_level = "vague"

    # Generate rewrite suggestion
    if issues:
        rewrite_parts = []
        if not has_specifics:
            rewrite_parts.append("Start by identifying the exact location (e.g., 'In the [section/function/paragraph]...')")
        if not has_action:
            rewrite_parts.append("State clearly what should change (e.g., 'Change X to Y' or 'Add Z')")
        if not has_reason:
            rewrite_parts.append("Explain why (e.g., '...because [reason]')")
        if has_subjective and not has_criteria:
            rewrite_parts.append("Replace feelings with criteria (e.g., 'should be under 100 words' instead of 'too long')")
        if has_scope_creep:
            rewrite_parts.append("Focus on one change at a time; save additional requests for later")

        rewrite_suggestion = "To improve this feedback:\n" + "\n".join(f"- {p}" for p in rewrite_parts)
    else:
        rewrite_suggestion = "This feedback is already specific and actionable. No changes needed."

    # Generate summary
    if quality_level == "specific":
        summary = "This feedback is clear and actionable. It identifies specific issues and provides direction."
    elif quality_level == "adequate":
        summary = f"This feedback has some good elements but could be improved. Found {len(issues)} issue(s) to address."
    else:
        summary = f"This feedback is too vague to act on effectively. Found {len(issues)} issue(s) that need addressing."

    return FeedbackAnalysis(
        quality_score=score,
        quality_level=quality_level,
        issues=issues,
        strengths=strengths,
        rewrite_suggestion=rewrite_suggestion,
        summary=summary
    )


def entry_to_response(entry: FeedbackEntry) -> FeedbackEntryResponse:
    """Convert a FeedbackEntry model to FeedbackEntryResponse."""
    analysis_data = entry.analysis or {}

    # Reconstruct FeedbackAnalysis from stored JSON
    issues = [
        FeedbackIssue(**issue) for issue in analysis_data.get("issues", [])
    ]

    analysis = FeedbackAnalysis(
        quality_score=analysis_data.get("quality_score", 0),
        quality_level=analysis_data.get("quality_level", "vague"),
        issues=issues,
        strengths=analysis_data.get("strengths", []),
        rewrite_suggestion=analysis_data.get("rewrite_suggestion", ""),
        summary=analysis_data.get("summary", "")
    )

    return FeedbackEntryResponse(
        id=entry.id,
        original_feedback=entry.original_feedback,
        context=entry.context,
        analysis=analysis,
        rewritten_feedback=entry.rewritten_feedback,
        is_example=entry.is_example,
        category=entry.category,
        created_at=entry.created_at,
        updated_at=entry.updated_at
    )


def entry_to_summary(entry: FeedbackEntry) -> FeedbackEntrySummary:
    """Convert a FeedbackEntry model to FeedbackEntrySummary."""
    analysis = entry.analysis or {}

    return FeedbackEntrySummary(
        id=entry.id,
        original_feedback=entry.original_feedback[:100] + "..." if len(entry.original_feedback) > 100 else entry.original_feedback,
        quality_score=analysis.get("quality_score", 0),
        quality_level=analysis.get("quality_level", "vague"),
        has_rewrite=bool(entry.rewritten_feedback),
        is_example=entry.is_example,
        category=entry.category,
        created_at=entry.created_at
    )


# =============================================================================
# Reference Information
# =============================================================================

@router.get("/patterns")
async def get_vague_patterns():
    """Get information about vague feedback patterns to avoid."""
    return VAGUE_PATTERNS


@router.get("/quality-levels")
async def get_quality_levels():
    """Get quality level definitions."""
    return QUALITY_LEVELS


@router.get("/categories")
async def get_categories():
    """Get available feedback categories."""
    return FEEDBACK_CATEGORIES


# =============================================================================
# Feedback Analysis
# =============================================================================

@router.post("/analyze", response_model=FeedbackAnalysis)
async def analyze_feedback(
    request: AnalyzeFeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze feedback quality without saving.

    Use this endpoint to get a quick analysis before deciding to save.
    """
    analysis = analyze_feedback_quality(request.feedback, request.context)
    return analysis


@router.post("/entries", response_model=FeedbackEntryResponse, status_code=201)
async def create_feedback_entry(
    request: AnalyzeFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze feedback and save the entry.

    This analyzes the feedback and stores it for tracking patterns over time.
    """
    # Analyze the feedback
    analysis = analyze_feedback_quality(request.feedback, request.context)

    # Create the entry
    db_entry = FeedbackEntry(
        user_id=current_user.id,
        original_feedback=request.feedback,
        context=request.context,
        analysis=analysis.model_dump(),
        category=request.category if request.category in FEEDBACK_CATEGORIES else "other"
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)

    logger.info(f"Created feedback entry with score {analysis.quality_score} for user {current_user.email}")

    return entry_to_response(db_entry)


@router.get("/entries", response_model=list[FeedbackEntrySummary])
async def list_entries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    examples_only: bool = Query(False),
    category: Optional[str] = Query(None)
):
    """List feedback entries for the current user."""
    query = select(FeedbackEntry).where(FeedbackEntry.user_id == current_user.id)

    if examples_only:
        query = query.where(FeedbackEntry.is_example == True)

    if category and category in FEEDBACK_CATEGORIES:
        query = query.where(FeedbackEntry.category == category)

    query = query.order_by(FeedbackEntry.created_at.desc()).limit(limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    return [entry_to_summary(e) for e in entries]


@router.get("/entries/{entry_id}", response_model=FeedbackEntryResponse)
async def get_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single feedback entry by ID."""
    entry = await _get_user_entry(entry_id, current_user.id, db)
    return entry_to_response(entry)


@router.put("/entries/{entry_id}", response_model=FeedbackEntryResponse)
async def update_entry(
    entry_id: str,
    update: FeedbackEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a feedback entry (save rewrite, mark as example)."""
    entry = await _get_user_entry(entry_id, current_user.id, db)

    if update.rewritten_feedback is not None:
        entry.rewritten_feedback = update.rewritten_feedback
    if update.is_example is not None:
        entry.is_example = update.is_example
    if update.category is not None and update.category in FEEDBACK_CATEGORIES:
        entry.category = update.category

    await db.commit()
    await db.refresh(entry)

    logger.info(f"Updated feedback entry {entry_id}")

    return entry_to_response(entry)


@router.delete("/entries/{entry_id}")
async def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a feedback entry."""
    entry = await _get_user_entry(entry_id, current_user.id, db)
    await db.delete(entry)
    await db.commit()

    logger.info(f"Deleted feedback entry {entry_id}")
    return {"deleted": True, "id": entry_id}


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=FeedbackStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get feedback analysis statistics."""
    result = await db.execute(
        select(FeedbackEntry).where(FeedbackEntry.user_id == current_user.id)
    )
    entries = result.scalars().all()

    total = len(entries)
    if total == 0:
        return FeedbackStats(
            total_entries=0,
            avg_quality_score=0.0,
            entries_by_level={"specific": 0, "adequate": 0, "vague": 0},
            common_issues=[],
            examples_saved=0,
            rewrites_completed=0,
            improvement_rate=0.0
        )

    # Calculate averages and counts
    scores = []
    levels = {"specific": 0, "adequate": 0, "vague": 0}
    issue_counts = Counter()
    examples = 0
    rewrites = 0
    vague_count = 0
    vague_rewritten = 0

    for entry in entries:
        analysis = entry.analysis or {}
        score = analysis.get("quality_score", 0)
        level = analysis.get("quality_level", "vague")
        issues = analysis.get("issues", [])

        scores.append(score)
        if level in levels:
            levels[level] += 1

        for issue in issues:
            if isinstance(issue, dict):
                issue_counts[issue.get("pattern", "unknown")] += 1

        if entry.is_example:
            examples += 1

        if entry.rewritten_feedback:
            rewrites += 1

        if level == "vague":
            vague_count += 1
            if entry.rewritten_feedback:
                vague_rewritten += 1

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    improvement_rate = round((vague_rewritten / vague_count * 100) if vague_count > 0 else 0, 1)

    # Get top 5 common issues
    common_issues = [
        {"pattern": pattern, "count": count, "name": VAGUE_PATTERNS.get(pattern, {}).get("name", pattern)}
        for pattern, count in issue_counts.most_common(5)
    ]

    return FeedbackStats(
        total_entries=total,
        avg_quality_score=avg_score,
        entries_by_level=levels,
        common_issues=common_issues,
        examples_saved=examples,
        rewrites_completed=rewrites,
        improvement_rate=improvement_rate
    )


# =============================================================================
# Examples
# =============================================================================

@router.post("/entries/seed-examples")
async def seed_examples(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Seed example feedback entries for practice."""
    result = await db.execute(
        select(func.count(FeedbackEntry.id)).where(FeedbackEntry.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} entries. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_FEEDBACK:
        analysis = analyze_feedback_quality(example["original_feedback"], example["context"])

        db_entry = FeedbackEntry(
            user_id=current_user.id,
            original_feedback=example["original_feedback"],
            context=example["context"],
            analysis=analysis.model_dump(),
            category=example["category"]
        )
        db.add(db_entry)
        created.append({
            "feedback": example["original_feedback"][:50] + "...",
            "score": analysis.quality_score
        })

    await db.commit()

    logger.info(f"Seeded {len(created)} example entries for user {current_user.email}")
    return {"created": len(created), "entries": created}


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_entry(entry_id: str, user_id: str, db: AsyncSession) -> FeedbackEntry:
    """Get a feedback entry by ID, verifying ownership."""
    result = await db.execute(
        select(FeedbackEntry).where(
            FeedbackEntry.id == entry_id,
            FeedbackEntry.user_id == user_id
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Feedback entry not found")

    return entry
