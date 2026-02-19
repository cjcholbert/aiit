"""Lesson 5: Trust Matrix API routes."""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Integer

from backend.database import get_db
from backend.database.models import User, OutputType, Prediction, CalibrationInsight
from backend.auth.dependencies import get_current_user

from .schemas import (
    OutputTypeCreate, OutputTypeUpdate, OutputTypeResponse, OutputTypeSummary,
    PredictionCreate, PredictionVerify, PredictionResponse,
    CalibrationStats, CalibrationInsightResponse, OutputTypeStats, TrustLevelStats,
    DEFAULT_OUTPUT_TYPES
)
from backend.rate_limit import limiter
from .analyzer import analyze_calibration
from .examples import EXAMPLE_CATEGORIES, EXAMPLE_OUTPUT_TYPES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lesson5", tags=["Lesson 5: Trust Matrix"])


# =============================================================================
# Examples (public, no auth required)
# =============================================================================

@router.get("/examples")
async def get_examples():
    """Get example output types organized by professional category."""
    return {
        "categories": EXAMPLE_CATEGORIES,
        "examples": EXAMPLE_OUTPUT_TYPES
    }


# =============================================================================
# Output Type CRUD
# =============================================================================

@router.post("/output-types", response_model=OutputTypeResponse, status_code=201)
async def create_output_type(
    output_type: OutputTypeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new output type."""
    db_output_type = OutputType(
        user_id=current_user.id,
        name=output_type.name,
        category=output_type.category,
        trust_level=output_type.trust_level,
        reasoning=output_type.reasoning,
        verification_approach=output_type.verification_approach,
        examples=output_type.examples,
    )
    db.add(db_output_type)
    await db.commit()
    await db.refresh(db_output_type)

    logger.info("Created output type '%s' for user %s", output_type.name, current_user.email)

    return _output_type_to_response(db_output_type, 0, 0.0)


@router.get("/output-types", response_model=list[OutputTypeSummary])
async def list_output_types(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = Query(None, max_length=50),
    trust_level: Optional[str] = Query(None, pattern="^(high|medium|low)$")
):
    """List all output types for the current user."""
    query = select(OutputType).where(OutputType.user_id == current_user.id)

    if category:
        query = query.where(OutputType.category == category)
    if trust_level:
        query = query.where(OutputType.trust_level == trust_level)

    query = query.order_by(OutputType.name)

    result = await db.execute(query)
    output_types = result.scalars().all()

    # Batch query for prediction stats across all output types
    if output_types:
        ot_ids = [ot.id for ot in output_types]
        stats_query = (
            select(
                Prediction.output_type_id,
                func.count(Prediction.id).label("total"),
                func.count(Prediction.was_correct).label("verified"),
                func.sum(func.cast(Prediction.was_correct == True, Integer)).label("correct")
            )
            .where(Prediction.output_type_id.in_(ot_ids))
            .group_by(Prediction.output_type_id)
        )
        stats_result = await db.execute(stats_query)
        stats_map = {}
        for row in stats_result.all():
            verified = row[2] or 0
            correct = row[3] or 0
            accuracy = round(correct / verified * 100, 1) if verified else 0.0
            stats_map[row[0]] = (row[1] or 0, accuracy)
    else:
        stats_map = {}

    summaries = []
    for ot in output_types:
        pred_count, accuracy = stats_map.get(ot.id, (0, 0.0))
        summaries.append(OutputTypeSummary(
            id=ot.id,
            name=ot.name,
            category=ot.category,
            trust_level=ot.trust_level,
            reasoning=ot.reasoning or "",
            verification_approach=ot.verification_approach or "",
            examples=ot.examples or [],
            prediction_count=pred_count,
            accuracy_rate=accuracy
        ))

    return summaries


@router.post("/output-types/seed-defaults")
async def seed_default_output_types(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create starter output types for common AI outputs."""
    # Check if user already has output types
    result = await db.execute(
        select(func.count(OutputType.id)).where(OutputType.user_id == current_user.id)
    )
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"You already have {existing_count} output types. Delete them first to reseed."
        )

    created = []
    for output_type_data in DEFAULT_OUTPUT_TYPES:
        db_output_type = OutputType(
            user_id=current_user.id,
            **output_type_data
        )
        db.add(db_output_type)
        created.append(output_type_data["name"])

    await db.commit()

    logger.info("Seeded %s default output types for user %s", len(created), current_user.email)
    return {"created": len(created), "output_types": created}


@router.get("/output-types/{output_type_id}", response_model=OutputTypeResponse)
async def get_output_type(
    output_type_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single output type by ID."""
    output_type = await _get_user_output_type(output_type_id, current_user.id, db)
    pred_count, accuracy = await _get_output_type_stats(output_type_id, db)
    return _output_type_to_response(output_type, pred_count, accuracy)


@router.put("/output-types/{output_type_id}", response_model=OutputTypeResponse)
async def update_output_type(
    output_type_id: str,
    update: OutputTypeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an output type."""
    output_type = await _get_user_output_type(output_type_id, current_user.id, db)

    if update.name is not None:
        output_type.name = update.name
    if update.category is not None:
        output_type.category = update.category
    if update.trust_level is not None:
        output_type.trust_level = update.trust_level
    if update.reasoning is not None:
        output_type.reasoning = update.reasoning
    if update.verification_approach is not None:
        output_type.verification_approach = update.verification_approach
    if update.examples is not None:
        output_type.examples = update.examples

    await db.commit()
    await db.refresh(output_type)

    logger.info("Updated output type %s", output_type_id)

    pred_count, accuracy = await _get_output_type_stats(output_type_id, db)
    return _output_type_to_response(output_type, pred_count, accuracy)


@router.delete("/output-types/{output_type_id}")
async def delete_output_type(
    output_type_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an output type."""
    output_type = await _get_user_output_type(output_type_id, current_user.id, db)
    await db.delete(output_type)
    await db.commit()

    logger.info("Deleted output type %s", output_type_id)
    return {"deleted": True, "id": output_type_id}


# =============================================================================
# Prediction Tracking
# =============================================================================

@router.post("/predictions", response_model=PredictionResponse, status_code=201)
async def create_prediction(
    prediction: PredictionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a new prediction before verifying AI output."""
    # Verify output type exists if provided
    output_type_name = None
    if prediction.output_type_id:
        output_type = await _get_user_output_type(prediction.output_type_id, current_user.id, db)
        output_type_name = output_type.name

    db_prediction = Prediction(
        user_id=current_user.id,
        output_type_id=prediction.output_type_id,
        output_description=prediction.output_description,
        confidence_rating=prediction.confidence_rating,
        uncertainty_notes=prediction.uncertainty_notes,
    )
    db.add(db_prediction)
    await db.commit()
    await db.refresh(db_prediction)

    logger.info("Created prediction for user %s, confidence=%s", current_user.email, prediction.confidence_rating)

    return _prediction_to_response(db_prediction, output_type_name)


@router.get("/predictions", response_model=list[PredictionResponse])
async def list_predictions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pending_only: bool = False,
    output_type_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200)
):
    """List predictions for the current user."""
    query = select(Prediction).where(Prediction.user_id == current_user.id)

    if pending_only:
        query = query.where(Prediction.was_correct.is_(None))
    if output_type_id:
        query = query.where(Prediction.output_type_id == output_type_id)

    query = query.order_by(Prediction.created_at.desc()).limit(limit)

    result = await db.execute(query)
    predictions = result.scalars().all()

    # Get output type names
    responses = []
    for p in predictions:
        output_type_name = None
        if p.output_type_id:
            output_type_result = await db.execute(
                select(OutputType.name).where(OutputType.id == p.output_type_id)
            )
            output_type_name = output_type_result.scalar()
        responses.append(_prediction_to_response(p, output_type_name))

    return responses


@router.get("/predictions/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single prediction by ID."""
    prediction = await _get_user_prediction(prediction_id, current_user.id, db)

    output_type_name = None
    if prediction.output_type_id:
        output_type_result = await db.execute(
            select(OutputType.name).where(OutputType.id == prediction.output_type_id)
        )
        output_type_name = output_type_result.scalar()

    return _prediction_to_response(prediction, output_type_name)


@router.put("/predictions/{prediction_id}/verify", response_model=PredictionResponse)
async def verify_prediction(
    prediction_id: str,
    verification: PredictionVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record the outcome after verifying."""
    prediction = await _get_user_prediction(prediction_id, current_user.id, db)

    if prediction.was_correct is not None:
        raise HTTPException(status_code=400, detail="Prediction already verified")

    prediction.was_correct = verification.was_correct
    prediction.actual_issues = verification.actual_issues
    prediction.verification_method = verification.verification_method
    prediction.verification_time_seconds = verification.verification_time_seconds
    prediction.calibration_note = verification.calibration_note
    prediction.verified_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(prediction)

    logger.info("Verified prediction %s: correct=%s", prediction_id, verification.was_correct)

    output_type_name = None
    if prediction.output_type_id:
        output_type_result = await db.execute(
            select(OutputType.name).where(OutputType.id == prediction.output_type_id)
        )
        output_type_name = output_type_result.scalar()

    return _prediction_to_response(prediction, output_type_name)


@router.delete("/predictions/{prediction_id}")
async def delete_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a prediction."""
    prediction = await _get_user_prediction(prediction_id, current_user.id, db)
    await db.delete(prediction)
    await db.commit()

    logger.info("Deleted prediction %s", prediction_id)
    return {"deleted": True, "id": prediction_id}


# =============================================================================
# Calibration Analysis
# =============================================================================

@router.get("/calibration/stats", response_model=CalibrationStats)
async def get_calibration_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated calibration statistics."""
    # Get all predictions
    result = await db.execute(
        select(Prediction).where(Prediction.user_id == current_user.id)
    )
    predictions = result.scalars().all()

    total = len(predictions)
    verified = [p for p in predictions if p.was_correct is not None]
    pending = total - len(verified)

    correct = [p for p in verified if p.was_correct]
    wrong = [p for p in verified if not p.was_correct]

    overall_accuracy = len(correct) / len(verified) if verified else 0.0

    avg_conf_correct = sum(p.confidence_rating for p in correct) / len(correct) if correct else 0.0
    avg_conf_wrong = sum(p.confidence_rating for p in wrong) / len(wrong) if wrong else 0.0

    # Over-trust: high confidence (>=7) but wrong
    over_trust = len([p for p in wrong if p.confidence_rating >= 7])
    # Over-verify: low confidence (<=4) but right
    over_verify = len([p for p in correct if p.confidence_rating <= 4])
    # Well-calibrated: confidence matches outcome reasonably
    well_calibrated = len(verified) - over_trust - over_verify

    # Calculate calibration score (simplified Brier-like score)
    calibration_score = _calculate_calibration_score(verified)

    # Get stats by output type
    output_type_stats = await _get_all_output_type_stats(current_user.id, db)

    # Get stats by trust level
    trust_level_stats = await _get_trust_level_stats(current_user.id, db)

    return CalibrationStats(
        total_predictions=total,
        verified_predictions=len(verified),
        pending_predictions=pending,
        overall_accuracy=round(overall_accuracy * 100, 1),
        avg_confidence_when_correct=round(avg_conf_correct, 1),
        avg_confidence_when_wrong=round(avg_conf_wrong, 1),
        over_trust_count=over_trust,
        over_verify_count=over_verify,
        well_calibrated_count=well_calibrated,
        calibration_score=calibration_score,
        by_output_type=output_type_stats,
        by_trust_level=trust_level_stats
    )


@router.get("/calibration/insights", response_model=list[CalibrationInsightResponse])
async def get_calibration_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-generated insights about calibration patterns."""
    result = await db.execute(
        select(CalibrationInsight)
        .where(CalibrationInsight.user_id == current_user.id)
        .order_by(CalibrationInsight.created_at.desc())
        .limit(20)
    )
    insights = result.scalars().all()

    responses = []
    for i in insights:
        output_type_name = None
        if i.output_type_id:
            output_type_result = await db.execute(
                select(OutputType.name).where(OutputType.id == i.output_type_id)
            )
            output_type_name = output_type_result.scalar()

        responses.append(CalibrationInsightResponse(
            id=i.id,
            insight_type=i.insight_type,
            output_type_id=i.output_type_id,
            output_type_name=output_type_name,
            description=i.description,
            evidence=i.evidence or {},
            created_at=i.created_at
        ))

    return responses


@router.post("/calibration/analyze")
@limiter.limit("3/minute")
async def trigger_calibration_analysis(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger AI analysis of prediction history to generate new insights."""
    # Check minimum predictions
    result = await db.execute(
        select(func.count(Prediction.id)).where(
            Prediction.user_id == current_user.id,
            Prediction.was_correct.isnot(None)
        )
    )
    verified_count = result.scalar()

    if verified_count < 5:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 5 verified predictions for analysis. You have {verified_count}."
        )

    # Run analysis
    insights = await analyze_calibration(current_user.id, db)

    return {
        "analyzed": True,
        "insights_generated": len(insights),
        "message": f"Generated {len(insights)} new insights based on {verified_count} predictions."
    }


# =============================================================================
# Helpers
# =============================================================================

async def _get_user_output_type(output_type_id: str, user_id: str, db: AsyncSession) -> OutputType:
    """Get an output type by ID, verifying ownership."""
    result = await db.execute(
        select(OutputType).where(
            OutputType.id == output_type_id,
            OutputType.user_id == user_id
        )
    )
    output_type = result.scalar_one_or_none()

    if not output_type:
        raise HTTPException(status_code=404, detail="Output type not found")

    return output_type


async def _get_user_prediction(prediction_id: str, user_id: str, db: AsyncSession) -> Prediction:
    """Get a prediction by ID, verifying ownership."""
    result = await db.execute(
        select(Prediction).where(
            Prediction.id == prediction_id,
            Prediction.user_id == user_id
        )
    )
    prediction = result.scalar_one_or_none()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return prediction


async def _get_output_type_stats(output_type_id: str, db: AsyncSession) -> tuple[int, float]:
    """Get prediction count and accuracy for an output type."""
    result = await db.execute(
        select(Prediction).where(Prediction.output_type_id == output_type_id)
    )
    predictions = result.scalars().all()

    count = len(predictions)
    verified = [p for p in predictions if p.was_correct is not None]
    correct = [p for p in verified if p.was_correct]

    accuracy = len(correct) / len(verified) * 100 if verified else 0.0

    return count, round(accuracy, 1)


async def _get_all_output_type_stats(user_id: str, db: AsyncSession) -> list[OutputTypeStats]:
    """Get stats for all user output types."""
    result = await db.execute(
        select(OutputType).where(OutputType.user_id == user_id)
    )
    output_types = result.scalars().all()

    stats = []
    for ot in output_types:
        pred_result = await db.execute(
            select(Prediction).where(Prediction.output_type_id == ot.id)
        )
        predictions = pred_result.scalars().all()

        total = len(predictions)
        if total == 0:
            continue

        verified = [p for p in predictions if p.was_correct is not None]
        correct = [p for p in verified if p.was_correct]
        wrong = [p for p in verified if not p.was_correct]

        stats.append(OutputTypeStats(
            output_type_id=ot.id,
            output_type_name=ot.name,
            trust_level=ot.trust_level,
            total_predictions=total,
            verified_predictions=len(verified),
            correct_predictions=len(correct),
            accuracy_rate=round(len(correct) / len(verified) * 100, 1) if verified else 0.0,
            avg_confidence=round(sum(p.confidence_rating for p in predictions) / total, 1),
            avg_confidence_when_correct=round(sum(p.confidence_rating for p in correct) / len(correct), 1) if correct else 0.0,
            avg_confidence_when_wrong=round(sum(p.confidence_rating for p in wrong) / len(wrong), 1) if wrong else 0.0
        ))

    return stats


async def _get_trust_level_stats(user_id: str, db: AsyncSession) -> list[TrustLevelStats]:
    """Get stats grouped by trust level."""
    result = await db.execute(
        select(OutputType).where(OutputType.user_id == user_id)
    )
    output_types = result.scalars().all()

    # Group output types by trust level
    level_output_types = {"high": [], "medium": [], "low": []}
    for ot in output_types:
        level_output_types[ot.trust_level].append(ot.id)

    stats = []
    for level, output_type_ids in level_output_types.items():
        if not output_type_ids:
            stats.append(TrustLevelStats(
                trust_level=level,
                total_predictions=0,
                verified_predictions=0,
                accuracy_rate=0.0,
                avg_confidence=0.0
            ))
            continue

        pred_result = await db.execute(
            select(Prediction).where(Prediction.output_type_id.in_(output_type_ids))
        )
        predictions = pred_result.scalars().all()

        total = len(predictions)
        verified = [p for p in predictions if p.was_correct is not None]
        correct = [p for p in verified if p.was_correct]

        stats.append(TrustLevelStats(
            trust_level=level,
            total_predictions=total,
            verified_predictions=len(verified),
            accuracy_rate=round(len(correct) / len(verified) * 100, 1) if verified else 0.0,
            avg_confidence=round(sum(p.confidence_rating for p in predictions) / total, 1) if total else 0.0
        ))

    return stats


def _calculate_calibration_score(predictions: list[Prediction]) -> float:
    """
    Calculate calibration score (0-100).
    Perfect calibration: when you say X% confident, you're right X% of the time.
    """
    if not predictions:
        return 0.0

    # Group by confidence bucket (1-3, 4-6, 7-10)
    buckets = {
        "low": {"predictions": [], "expected_accuracy": 0.25},
        "medium": {"predictions": [], "expected_accuracy": 0.55},
        "high": {"predictions": [], "expected_accuracy": 0.85},
    }

    for p in predictions:
        if p.confidence_rating <= 3:
            buckets["low"]["predictions"].append(p)
        elif p.confidence_rating <= 6:
            buckets["medium"]["predictions"].append(p)
        else:
            buckets["high"]["predictions"].append(p)

    # Calculate error for each bucket
    total_error = 0
    total_weight = 0

    for bucket in buckets.values():
        preds = bucket["predictions"]
        if not preds:
            continue

        actual_accuracy = sum(1 for p in preds if p.was_correct) / len(preds)
        expected = bucket["expected_accuracy"]
        error = abs(actual_accuracy - expected)
        total_error += error * len(preds)
        total_weight += len(preds)

    if total_weight == 0:
        return 0.0

    # Convert to 0-100 score (lower error = higher score)
    avg_error = total_error / total_weight
    score = max(0, (1 - avg_error * 2)) * 100  # Scale error to score

    return round(score, 1)


def _output_type_to_response(output_type: OutputType, pred_count: int, accuracy: float) -> OutputTypeResponse:
    """Convert an OutputType model to OutputTypeResponse."""
    return OutputTypeResponse(
        id=output_type.id,
        name=output_type.name,
        category=output_type.category,
        trust_level=output_type.trust_level,
        reasoning=output_type.reasoning or "",
        verification_approach=output_type.verification_approach or "",
        examples=output_type.examples or [],
        prediction_count=pred_count,
        accuracy_rate=accuracy,
        created_at=output_type.created_at,
        updated_at=output_type.updated_at
    )


def _prediction_to_response(prediction: Prediction, output_type_name: Optional[str]) -> PredictionResponse:
    """Convert a Prediction model to PredictionResponse."""
    return PredictionResponse(
        id=prediction.id,
        output_type_id=prediction.output_type_id,
        output_type_name=output_type_name,
        output_description=prediction.output_description,
        confidence_rating=prediction.confidence_rating,
        uncertainty_notes=prediction.uncertainty_notes,
        was_correct=prediction.was_correct,
        actual_issues=prediction.actual_issues,
        verification_method=prediction.verification_method,
        verification_time_seconds=prediction.verification_time_seconds,
        calibration_note=prediction.calibration_note,
        created_at=prediction.created_at,
        verified_at=prediction.verified_at
    )
