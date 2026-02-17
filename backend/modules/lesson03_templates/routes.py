"""Lesson 3: Template Builder API routes."""
import logging
from collections import Counter
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.database.models import User, Template, TemplateTest, Conversation
from backend.auth.dependencies import get_current_user

from .schemas import (
    TemplateCreate, TemplateUpdate, TemplateResponse, TemplateSummary,
    TemplateTestCreate, TemplateTestResponse, TemplateTestFeedback,
    TemplateSuggestion, TemplateStats, RenderRequest, RenderResponse
)
from backend.rate_limit import limiter
from .renderer import render_template, extract_variables_from_content
from .suggester import (
    generate_suggestions, generate_template_from_conversation, test_template_with_ai
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson3", tags=["Lesson 3: Template Builder"])


# =============================================================================
# Template CRUD
# =============================================================================

@router.post("/templates", response_model=TemplateResponse, status_code=201)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new context template."""
    db_template = Template(
        user_id=current_user.id,
        name=template.name,
        category=template.category,
        description=template.description,
        content=template.content,
        variables=[v.model_dump() for v in template.variables],
        tags=template.tags,
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)

    logger.info("Created template '%s' for user %s", template.name, current_user.email)

    return _template_to_response(db_template)


@router.get("/templates", response_model=list[TemplateSummary])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = Query(None, max_length=50),
    tag: Optional[str] = None,
    favorites_only: bool = False,
    search: Optional[str] = None
):
    """List all templates for the current user with optional filters."""
    query = select(Template).where(Template.user_id == current_user.id)

    if category:
        query = query.where(Template.category == category)

    if favorites_only:
        query = query.where(Template.is_favorite == True)

    query = query.order_by(Template.updated_at.desc())

    result = await db.execute(query)
    templates = result.scalars().all()

    # Post-filter for tags and search (JSON fields)
    summaries = []
    for t in templates:
        if tag and tag not in (t.tags or []):
            continue
        if search and search.lower() not in t.name.lower() and search.lower() not in (t.description or "").lower():
            continue

        summaries.append(TemplateSummary(
            id=t.id,
            name=t.name,
            category=t.category,
            description=t.description or "",
            usage_count=t.usage_count,
            last_used_at=t.last_used_at,
            is_favorite=t.is_favorite,
            tags=t.tags or []
        ))

    return summaries


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single template by ID."""
    template = await _get_user_template(template_id, current_user.id, db)
    return _template_to_response(template)


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    update: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a template."""
    template = await _get_user_template(template_id, current_user.id, db)

    if update.name is not None:
        template.name = update.name
    if update.category is not None:
        template.category = update.category
    if update.description is not None:
        template.description = update.description
    if update.content is not None:
        template.content = update.content
    if update.variables is not None:
        template.variables = [v.model_dump() for v in update.variables]
    if update.tags is not None:
        template.tags = update.tags
    if update.is_favorite is not None:
        template.is_favorite = update.is_favorite

    await db.commit()
    await db.refresh(template)

    logger.info("Updated template %s", template_id)
    return _template_to_response(template)


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a template."""
    template = await _get_user_template(template_id, current_user.id, db)
    await db.delete(template)
    await db.commit()

    logger.info("Deleted template %s", template_id)
    return {"deleted": True, "id": template_id}


@router.post("/templates/{template_id}/duplicate", response_model=TemplateResponse)
async def duplicate_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicate an existing template."""
    original = await _get_user_template(template_id, current_user.id, db)

    new_template = Template(
        user_id=current_user.id,
        name=f"{original.name} (Copy)",
        category=original.category,
        description=original.description,
        content=original.content,
        variables=original.variables,
        tags=original.tags,
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)

    logger.info("Duplicated template %s -> %s", template_id, new_template.id)
    return _template_to_response(new_template)


# =============================================================================
# Template Testing
# =============================================================================

@router.post("/templates/test", response_model=TemplateTestResponse)
@limiter.limit("3/minute")
async def test_template(
    request: Request,
    test: TemplateTestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Test a template by sending it to Claude."""
    template = await _get_user_template(test.template_id, current_user.id, db)

    # Render the template
    rendered, missing = render_template(
        template.content,
        template.variables or [],
        test.variable_values,
        test.test_prompt
    )

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required variables: {', '.join(missing)}"
        )

    # Return rendered prompt with copy instruction (no AI call)
    ai_response = await test_template_with_ai(rendered)

    # Save the test result
    db_test = TemplateTest(
        template_id=template.id,
        user_id=current_user.id,
        test_prompt=test.test_prompt,
        variable_values=test.variable_values,
        rendered_prompt=rendered,
        ai_response=ai_response
    )
    db.add(db_test)

    # Update template usage stats
    template.usage_count += 1
    template.last_used_at = datetime.utcnow()

    await db.commit()
    await db.refresh(db_test)

    logger.info("Tested template %s", template.id)

    return TemplateTestResponse(
        id=db_test.id,
        template_id=db_test.template_id,
        test_prompt=db_test.test_prompt,
        variable_values=db_test.variable_values or {},
        rendered_prompt=db_test.rendered_prompt,
        ai_response=db_test.ai_response,
        user_rating=db_test.user_rating,
        notes=db_test.notes,
        created_at=db_test.created_at
    )


@router.post("/templates/render", response_model=RenderResponse)
async def preview_render(
    request: RenderRequest,
    current_user: User = Depends(get_current_user)
):
    """Preview template rendering without saving or calling AI."""
    # Extract variables from content
    var_names = extract_variables_from_content(request.content)
    variables = [{"name": n, "required": False, "default": ""} for n in var_names]

    rendered, missing = render_template(
        request.content,
        variables,
        request.variable_values,
        request.test_prompt
    )

    return RenderResponse(rendered=rendered, missing_required=missing)


@router.put("/tests/{test_id}/feedback")
async def submit_test_feedback(
    test_id: str,
    feedback: TemplateTestFeedback,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback for a template test."""
    result = await db.execute(
        select(TemplateTest).where(
            TemplateTest.id == test_id,
            TemplateTest.user_id == current_user.id
        )
    )
    test = result.scalar_one_or_none()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    test.user_rating = feedback.rating
    test.notes = feedback.notes
    await db.commit()

    logger.info("Submitted feedback for test %s: rating=%s", test_id, feedback.rating)
    return {"success": True, "test_id": test_id}


@router.get("/templates/{template_id}/tests", response_model=list[TemplateTestResponse])
async def get_template_test_history(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 10
):
    """Get test history for a template."""
    # Verify template belongs to user
    await _get_user_template(template_id, current_user.id, db)

    result = await db.execute(
        select(TemplateTest)
        .where(TemplateTest.template_id == template_id)
        .order_by(TemplateTest.created_at.desc())
        .limit(limit)
    )
    tests = result.scalars().all()

    return [
        TemplateTestResponse(
            id=t.id,
            template_id=t.template_id,
            test_prompt=t.test_prompt,
            variable_values=t.variable_values or {},
            rendered_prompt=t.rendered_prompt,
            ai_response=t.ai_response,
            user_rating=t.user_rating,
            notes=t.notes,
            created_at=t.created_at
        )
        for t in tests
    ]


# =============================================================================
# AI-Assisted Features
# =============================================================================

@router.get("/suggestions", response_model=list[TemplateSuggestion])
@limiter.limit("3/minute")
async def get_template_suggestions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-generated template suggestions based on Lesson 1 patterns."""
    # Fetch user's Lesson 1 conversations
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .limit(20)
    )
    conversations = result.scalars().all()

    if len(conversations) < 3:
        raise HTTPException(
            status_code=400,
            detail="Need at least 3 analyzed conversations for suggestions. Add more in Lesson 1."
        )

    # Aggregate patterns and gaps
    gaps = []
    patterns = []
    for conv in conversations:
        analysis = conv.analysis or {}
        coaching = analysis.get("coaching", {})
        if coaching.get("context_that_would_have_helped"):
            gaps.append(coaching["context_that_would_have_helped"])

        pattern = analysis.get("pattern", {})
        if pattern.get("category"):
            patterns.append(pattern["category"])

    gaps_summary = "\n".join(f"- {g}" for g in gaps[:10])
    pattern_counts = Counter(patterns)
    patterns_summary = "\n".join(f"- {p}: {c} times" for p, c in pattern_counts.most_common(5))

    # Generate suggestions
    suggestions = await generate_suggestions(gaps_summary, patterns_summary)
    return suggestions


@router.post("/templates/generate-from-conversation", response_model=TemplateSuggestion)
async def generate_from_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a template from a Lesson 1 conversation with context gaps."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    suggestion = await generate_template_from_conversation(
        conversation.raw_transcript,
        conversation.analysis or {}
    )

    if not suggestion:
        raise HTTPException(status_code=500, detail="Failed to generate template")

    return suggestion


# =============================================================================
# Stats
# =============================================================================

@router.get("/stats", response_model=TemplateStats)
async def get_template_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated template statistics."""
    # Get all templates
    result = await db.execute(
        select(Template).where(Template.user_id == current_user.id)
    )
    templates = result.scalars().all()

    # Get all tests
    result = await db.execute(
        select(TemplateTest).where(TemplateTest.user_id == current_user.id)
    )
    tests = result.scalars().all()

    # Calculate stats
    total_templates = len(templates)
    category_counts = Counter(t.category for t in templates)

    total_tests = len(tests)
    ratings = [t.user_rating for t in tests if t.user_rating is not None]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

    # Most used templates
    most_used = sorted(templates, key=lambda t: t.usage_count, reverse=True)[:5]
    most_used_summaries = [
        TemplateSummary(
            id=t.id,
            name=t.name,
            category=t.category,
            description=t.description or "",
            usage_count=t.usage_count,
            last_used_at=t.last_used_at,
            is_favorite=t.is_favorite,
            tags=t.tags or []
        )
        for t in most_used
    ]

    # Recent tests
    recent_tests = sorted(tests, key=lambda t: t.created_at, reverse=True)[:5]
    recent_test_responses = [
        TemplateTestResponse(
            id=t.id,
            template_id=t.template_id,
            test_prompt=t.test_prompt,
            variable_values=t.variable_values or {},
            rendered_prompt=t.rendered_prompt,
            ai_response=t.ai_response,
            user_rating=t.user_rating,
            notes=t.notes,
            created_at=t.created_at
        )
        for t in recent_tests
    ]

    return TemplateStats(
        total_templates=total_templates,
        count_by_category=dict(category_counts),
        total_tests=total_tests,
        avg_rating=round(avg_rating, 2),
        most_used=most_used_summaries,
        recent_tests=recent_test_responses
    )


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_template(template_id: str, user_id: str, db: AsyncSession) -> Template:
    """Get a template by ID, verifying ownership."""
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.user_id == user_id
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


def _template_to_response(template: Template) -> TemplateResponse:
    """Convert a Template model to TemplateResponse."""
    from .schemas import Variable

    variables = [
        Variable(
            name=v.get("name", ""),
            description=v.get("description", ""),
            default=v.get("default", ""),
            required=v.get("required", False)
        )
        for v in (template.variables or [])
    ]

    return TemplateResponse(
        id=template.id,
        name=template.name,
        category=template.category,
        description=template.description or "",
        content=template.content,
        variables=variables,
        tags=template.tags or [],
        usage_count=template.usage_count,
        last_used_at=template.last_used_at,
        created_at=template.created_at,
        updated_at=template.updated_at,
        is_favorite=template.is_favorite
    )
