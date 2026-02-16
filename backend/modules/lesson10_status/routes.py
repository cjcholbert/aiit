"""Lesson 10: Status Reporter API routes."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.database.models import User, WorkflowTemplate, StatusReport
from backend.auth.dependencies import get_current_user

from .schemas import (
    WorkflowTemplateCreate, WorkflowTemplateUpdate,
    WorkflowTemplateResponse, WorkflowTemplateSummary,
    StatusReportCreate, StatusReportUpdate,
    StatusReportResponse, StatusReportSummary,
    WorkflowStats,
    WORKFLOW_FREQUENCIES, WORKFLOW_CRITERIA, QUALITY_CHECK_TYPES, EXAMPLE_WORKFLOWS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson10", tags=["Lesson 10: Status Reporter"])


# =============================================================================
# Helper Functions
# =============================================================================

def template_to_summary(template: WorkflowTemplate, report_count: int = 0) -> WorkflowTemplateSummary:
    """Convert a WorkflowTemplate model to summary response."""
    return WorkflowTemplateSummary(
        id=template.id,
        name=template.name,
        description=template.description,
        frequency=template.frequency or "weekly",
        estimated_time_minutes=template.estimated_time_minutes,
        is_active=template.is_active,
        report_count=report_count,
        created_at=template.created_at
    )


def template_to_response(
    template: WorkflowTemplate,
    report_count: int = 0,
    avg_time_saved: Optional[float] = None
) -> WorkflowTemplateResponse:
    """Convert a WorkflowTemplate model to full response."""
    return WorkflowTemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        frequency=template.frequency or "weekly",
        estimated_time_minutes=template.estimated_time_minutes,
        inputs=template.inputs or [],
        steps=template.steps or [],
        prompt_template=template.prompt_template,
        quality_checks=template.quality_checks or [],
        is_active=template.is_active,
        report_count=report_count,
        avg_time_saved=avg_time_saved,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


def report_to_summary(
    report: StatusReport,
    template_name: Optional[str] = None,
    estimated_time: Optional[int] = None
) -> StatusReportSummary:
    """Convert a StatusReport model to summary response."""
    time_saved = None
    if estimated_time and report.actual_time_minutes:
        time_saved = estimated_time - report.actual_time_minutes

    return StatusReportSummary(
        id=report.id,
        template_id=report.template_id,
        template_name=template_name,
        title=report.title,
        actual_time_minutes=report.actual_time_minutes,
        quality_score=report.quality_score,
        time_saved_minutes=time_saved,
        created_at=report.created_at
    )


def report_to_response(
    report: StatusReport,
    template_name: Optional[str] = None,
    estimated_time: Optional[int] = None
) -> StatusReportResponse:
    """Convert a StatusReport model to full response."""
    time_saved = None
    if estimated_time and report.actual_time_minutes:
        time_saved = estimated_time - report.actual_time_minutes

    return StatusReportResponse(
        id=report.id,
        template_id=report.template_id,
        template_name=template_name,
        title=report.title,
        inputs_used=report.inputs_used or {},
        generated_content=report.generated_content,
        actual_time_minutes=report.actual_time_minutes,
        quality_score=report.quality_score,
        time_saved_minutes=time_saved,
        notes=report.notes,
        created_at=report.created_at
    )


async def _get_user_template(template_id: str, user_id: str, db: AsyncSession) -> WorkflowTemplate:
    """Get a template by ID, verifying ownership."""
    result = await db.execute(
        select(WorkflowTemplate).where(
            WorkflowTemplate.id == template_id,
            WorkflowTemplate.user_id == user_id
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    return template


async def _get_user_report(report_id: str, user_id: str, db: AsyncSession) -> StatusReport:
    """Get a report by ID, verifying ownership."""
    result = await db.execute(
        select(StatusReport).where(
            StatusReport.id == report_id,
            StatusReport.user_id == user_id
        )
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Status report not found")

    return report


# =============================================================================
# Reference Information
# =============================================================================

@router.get("/frequencies")
async def get_frequencies():
    """Get available workflow frequencies."""
    return WORKFLOW_FREQUENCIES


@router.get("/criteria")
async def get_criteria():
    """Get workflow selection criteria (what makes a good integration candidate)."""
    return WORKFLOW_CRITERIA


@router.get("/quality-checks")
async def get_quality_checks():
    """Get available quality check types."""
    return QUALITY_CHECK_TYPES


@router.get("/examples")
async def get_example_workflows():
    """Get example workflow templates for reference."""
    return EXAMPLE_WORKFLOWS


# =============================================================================
# Workflow Templates
# =============================================================================

@router.post("/templates", response_model=WorkflowTemplateResponse, status_code=201)
async def create_template(
    request: WorkflowTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow template."""
    # Validate frequency
    if request.frequency not in WORKFLOW_FREQUENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Must be one of: {list(WORKFLOW_FREQUENCIES.keys())}"
        )

    # Validate quality checks
    valid_checks = {qc["id"] for qc in QUALITY_CHECK_TYPES}
    for check in request.quality_checks:
        if check not in valid_checks:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quality check: {check}. Must be one of: {list(valid_checks)}"
            )

    # Create the template
    db_template = WorkflowTemplate(
        user_id=current_user.id,
        name=request.name,
        description=request.description,
        frequency=request.frequency,
        estimated_time_minutes=request.estimated_time_minutes,
        inputs=[inp.model_dump() for inp in request.inputs],
        steps=[step.model_dump() for step in request.steps],
        prompt_template=request.prompt_template,
        quality_checks=request.quality_checks,
        is_active=True
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)

    logger.info("Created workflow template '%s' for user %s", request.name, current_user.email)

    return template_to_response(db_template)


@router.get("/templates", response_model=list[WorkflowTemplateSummary])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(False)
):
    """List user's workflow templates."""
    query = select(WorkflowTemplate).where(WorkflowTemplate.user_id == current_user.id)

    if active_only:
        query = query.where(WorkflowTemplate.is_active == True)

    query = query.order_by(WorkflowTemplate.created_at.desc())

    result = await db.execute(query)
    templates = result.scalars().all()

    # Get report counts for each template
    summaries = []
    for template in templates:
        count_result = await db.execute(
            select(func.count(StatusReport.id)).where(StatusReport.template_id == template.id)
        )
        report_count = count_result.scalar() or 0
        summaries.append(template_to_summary(template, report_count))

    return summaries


@router.get("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single workflow template by ID."""
    template = await _get_user_template(template_id, current_user.id, db)

    # Get report count
    count_result = await db.execute(
        select(func.count(StatusReport.id)).where(StatusReport.template_id == template.id)
    )
    report_count = count_result.scalar() or 0

    # Calculate average time saved
    avg_time_saved = None
    if template.estimated_time_minutes and report_count > 0:
        avg_result = await db.execute(
            select(func.avg(StatusReport.actual_time_minutes)).where(
                StatusReport.template_id == template.id,
                StatusReport.actual_time_minutes.isnot(None)
            )
        )
        avg_actual = avg_result.scalar()
        if avg_actual:
            avg_time_saved = round(template.estimated_time_minutes - avg_actual, 1)

    return template_to_response(template, report_count, avg_time_saved)


@router.put("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def update_template(
    template_id: str,
    update: WorkflowTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a workflow template."""
    template = await _get_user_template(template_id, current_user.id, db)

    # Validate frequency if provided
    if update.frequency is not None and update.frequency not in WORKFLOW_FREQUENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Must be one of: {list(WORKFLOW_FREQUENCIES.keys())}"
        )

    # Validate quality checks if provided
    if update.quality_checks is not None:
        valid_checks = {qc["id"] for qc in QUALITY_CHECK_TYPES}
        for check in update.quality_checks:
            if check not in valid_checks:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid quality check: {check}. Must be one of: {list(valid_checks)}"
                )

    # Apply updates
    if update.name is not None:
        template.name = update.name
    if update.description is not None:
        template.description = update.description
    if update.frequency is not None:
        template.frequency = update.frequency
    if update.estimated_time_minutes is not None:
        template.estimated_time_minutes = update.estimated_time_minutes
    if update.inputs is not None:
        template.inputs = [inp.model_dump() for inp in update.inputs]
    if update.steps is not None:
        template.steps = [step.model_dump() for step in update.steps]
    if update.prompt_template is not None:
        template.prompt_template = update.prompt_template
    if update.quality_checks is not None:
        template.quality_checks = update.quality_checks
    if update.is_active is not None:
        template.is_active = update.is_active

    await db.commit()
    await db.refresh(template)

    logger.info("Updated workflow template %s", template_id)

    # Get report count for response
    count_result = await db.execute(
        select(func.count(StatusReport.id)).where(StatusReport.template_id == template.id)
    )
    report_count = count_result.scalar() or 0

    return template_to_response(template, report_count)


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a workflow template and its reports."""
    template = await _get_user_template(template_id, current_user.id, db)

    await db.delete(template)
    await db.commit()

    logger.info("Deleted workflow template %s", template_id)
    return {"deleted": True, "id": template_id}


# =============================================================================
# Status Reports
# =============================================================================

@router.post("/reports", response_model=StatusReportResponse, status_code=201)
async def create_report(
    request: StatusReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new status report."""
    template = None
    template_name = None
    estimated_time = None

    # If template_id is provided, verify it exists and get details
    if request.template_id:
        template = await _get_user_template(request.template_id, current_user.id, db)
        template_name = template.name
        estimated_time = template.estimated_time_minutes

    # Create the report
    db_report = StatusReport(
        user_id=current_user.id,
        template_id=request.template_id,
        title=request.title,
        inputs_used=request.inputs_used,
        generated_content=request.generated_content,
        actual_time_minutes=request.actual_time_minutes,
        quality_score=request.quality_score,
        notes=request.notes
    )
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)

    logger.info("Created status report '%s' for user %s", request.title, current_user.email)

    return report_to_response(db_report, template_name, estimated_time)


@router.get("/reports", response_model=list[StatusReportSummary])
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    template_id: Optional[str] = Query(None)
):
    """List user's status reports."""
    query = select(StatusReport).where(StatusReport.user_id == current_user.id)

    if template_id:
        query = query.where(StatusReport.template_id == template_id)

    query = query.order_by(StatusReport.created_at.desc()).limit(limit)

    result = await db.execute(query)
    reports = result.scalars().all()

    # Build summaries with template info
    summaries = []
    template_cache = {}

    for report in reports:
        template_name = None
        estimated_time = None

        if report.template_id:
            if report.template_id not in template_cache:
                template_result = await db.execute(
                    select(WorkflowTemplate).where(WorkflowTemplate.id == report.template_id)
                )
                template = template_result.scalar_one_or_none()
                if template:
                    template_cache[report.template_id] = {
                        "name": template.name,
                        "estimated_time": template.estimated_time_minutes
                    }
            if report.template_id in template_cache:
                template_name = template_cache[report.template_id]["name"]
                estimated_time = template_cache[report.template_id]["estimated_time"]

        summaries.append(report_to_summary(report, template_name, estimated_time))

    return summaries


@router.get("/reports/{report_id}", response_model=StatusReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single status report by ID."""
    report = await _get_user_report(report_id, current_user.id, db)

    template_name = None
    estimated_time = None

    if report.template_id:
        template_result = await db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.id == report.template_id)
        )
        template = template_result.scalar_one_or_none()
        if template:
            template_name = template.name
            estimated_time = template.estimated_time_minutes

    return report_to_response(report, template_name, estimated_time)


@router.put("/reports/{report_id}", response_model=StatusReportResponse)
async def update_report(
    report_id: str,
    update: StatusReportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a status report."""
    report = await _get_user_report(report_id, current_user.id, db)

    if update.title is not None:
        report.title = update.title
    if update.generated_content is not None:
        report.generated_content = update.generated_content
    if update.actual_time_minutes is not None:
        report.actual_time_minutes = update.actual_time_minutes
    if update.quality_score is not None:
        report.quality_score = update.quality_score
    if update.notes is not None:
        report.notes = update.notes

    await db.commit()
    await db.refresh(report)

    logger.info("Updated status report %s", report_id)

    template_name = None
    estimated_time = None

    if report.template_id:
        template_result = await db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.id == report.template_id)
        )
        template = template_result.scalar_one_or_none()
        if template:
            template_name = template.name
            estimated_time = template.estimated_time_minutes

    return report_to_response(report, template_name, estimated_time)


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a status report."""
    report = await _get_user_report(report_id, current_user.id, db)

    await db.delete(report)
    await db.commit()

    logger.info("Deleted status report %s", report_id)
    return {"deleted": True, "id": report_id}


# =============================================================================
# Statistics
# =============================================================================

@router.get("/stats", response_model=WorkflowStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflow and report statistics."""
    # Get all templates
    templates_result = await db.execute(
        select(WorkflowTemplate).where(WorkflowTemplate.user_id == current_user.id)
    )
    templates = templates_result.scalars().all()

    # Get all reports
    reports_result = await db.execute(
        select(StatusReport).where(StatusReport.user_id == current_user.id)
    )
    reports = list(reports_result.scalars().all())

    total_templates = len(templates)
    active_templates = sum(1 for t in templates if t.is_active)
    total_reports = len(reports)

    if total_reports == 0:
        return WorkflowStats(
            total_templates=total_templates,
            active_templates=active_templates,
            total_reports=0,
            total_time_saved_minutes=0,
            avg_quality_score=0.0,
            reports_this_week=0,
            most_used_template=None,
            reports_by_template=[],
            time_saved_by_frequency={}
        )

    # Build template lookup
    template_lookup = {t.id: t for t in templates}

    # Calculate time saved
    total_time_saved = 0
    quality_scores = []
    reports_by_template = {}
    time_saved_by_frequency = {"daily": 0, "weekly": 0, "biweekly": 0, "monthly": 0}

    week_ago = datetime.utcnow() - timedelta(days=7)
    reports_this_week = 0

    for report in reports:
        if report.quality_score:
            quality_scores.append(report.quality_score)

        if report.created_at >= week_ago:
            reports_this_week += 1

        template = template_lookup.get(report.template_id) if report.template_id else None

        if template:
            # Track by template
            if template.name not in reports_by_template:
                reports_by_template[template.name] = 0
            reports_by_template[template.name] += 1

            # Calculate time saved
            if template.estimated_time_minutes and report.actual_time_minutes:
                saved = template.estimated_time_minutes - report.actual_time_minutes
                if saved > 0:
                    total_time_saved += saved
                    freq = template.frequency or "weekly"
                    if freq in time_saved_by_frequency:
                        time_saved_by_frequency[freq] += saved

    # Find most used template
    most_used = None
    if reports_by_template:
        most_used = max(reports_by_template.keys(), key=lambda k: reports_by_template[k])

    # Format reports by template
    reports_by_template_list = [
        {"template_name": name, "count": count}
        for name, count in sorted(reports_by_template.items(), key=lambda x: -x[1])
    ]

    avg_quality = round(sum(quality_scores) / len(quality_scores), 1) if quality_scores else 0.0

    return WorkflowStats(
        total_templates=total_templates,
        active_templates=active_templates,
        total_reports=total_reports,
        total_time_saved_minutes=total_time_saved,
        avg_quality_score=avg_quality,
        reports_this_week=reports_this_week,
        most_used_template=most_used,
        reports_by_template=reports_by_template_list,
        time_saved_by_frequency=time_saved_by_frequency
    )


# =============================================================================
# Seed Examples
# =============================================================================

@router.post("/templates/seed-examples")
async def seed_examples(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Seed example workflow templates for practice."""
    # Check if user already has templates
    result = await db.execute(
        select(func.count(WorkflowTemplate.id)).where(WorkflowTemplate.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} templates. Delete them first to seed examples."
        )

    created = []
    for example in EXAMPLE_WORKFLOWS:
        db_template = WorkflowTemplate(
            user_id=current_user.id,
            name=example["name"],
            description=example["description"],
            frequency=example["frequency"],
            estimated_time_minutes=example["estimated_time_minutes"],
            inputs=example["inputs"],
            steps=example["steps"],
            prompt_template=example["prompt_template"],
            quality_checks=example["quality_checks"],
            is_active=True
        )
        db.add(db_template)
        created.append({"name": example["name"], "frequency": example["frequency"]})

    await db.commit()

    logger.info("Seeded %s example templates for user %s", len(created), current_user.email)
    return {"created": len(created), "templates": created}
