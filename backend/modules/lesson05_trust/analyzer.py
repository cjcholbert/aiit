"""Lesson 5: Calibration Analyzer - Rule-based insight generation.

Replaces the previous AI-powered analyzer with deterministic threshold logic.
Generates calibration insights by comparing prediction confidence ratings against
actual accuracy per output type, using configurable thresholds for over-trust,
over-verification, and well-calibrated detection.

No external AI dependency required.
"""
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.models import Prediction, OutputType, CalibrationInsight

logger = logging.getLogger(__name__)

# Thresholds for insight detection
OVER_TRUST_THRESHOLD = 0.2       # >= 20% of predictions are high-confidence misses
OVER_VERIFY_THRESHOLD = 0.2      # >= 20% of predictions are low-confidence hits
CALIBRATION_TOLERANCE = 0.15     # accuracy within 15% of avg_confidence/10


async def analyze_calibration(user_id: str, db: AsyncSession) -> list[CalibrationInsight]:
    """Generate rule-based insights from prediction history.

    Analyzes per-output-type statistics to identify over-trust, over-verification,
    and well-calibrated patterns. Generates 1-2 aggregate recommendation insights.

    Args:
        user_id: The user whose predictions to analyze.
        db: Async database session.

    Returns:
        List of CalibrationInsight ORM objects persisted to the database.
    """
    # Fetch predictions with output type info
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user_id, Prediction.was_correct.isnot(None))
        .order_by(Prediction.verified_at.desc())
        .limit(100)
    )
    predictions = result.scalars().all()

    if len(predictions) < 10:
        logger.warning("Not enough predictions for analysis: %s", len(predictions))
        return []

    # Fetch output types
    output_type_result = await db.execute(
        select(OutputType).where(OutputType.user_id == user_id)
    )
    output_types = {ot.id: ot for ot in output_type_result.scalars().all()}

    # Calculate output type stats
    output_type_stats = {}
    for ot_id, output_type in output_types.items():
        ot_preds = [p for p in predictions if p.output_type_id == ot_id]
        if not ot_preds:
            continue

        correct = sum(1 for p in ot_preds if p.was_correct)
        total = len(ot_preds)
        avg_conf = sum(p.confidence_rating for p in ot_preds) / total

        output_type_stats[ot_id] = {
            "name": output_type.name,
            "trust_level": output_type.trust_level,
            "total": total,
            "correct": correct,
            "accuracy": correct / total,
            "avg_confidence": avg_conf,
            "over_trust_count": sum(1 for p in ot_preds if p.confidence_rating >= 7 and not p.was_correct),
            "over_verify_count": sum(1 for p in ot_preds if p.confidence_rating <= 4 and p.was_correct),
        }

    # Generate insights from per-output-type stats
    insights_data = []
    over_trust_types = []
    over_verify_types = []
    well_calibrated_types = []

    for ot_id, stats in output_type_stats.items():
        total = stats["total"]
        if total < 2:
            continue

        name = stats["name"]
        accuracy = stats["accuracy"]
        avg_conf = stats["avg_confidence"]
        over_trust_ratio = stats["over_trust_count"] / total
        over_verify_ratio = stats["over_verify_count"] / total

        # Check over-trust pattern
        if over_trust_ratio >= OVER_TRUST_THRESHOLD:
            over_trust_types.append(name)
            insights_data.append({
                "type": "over_trust",
                "output_type_id": ot_id,
                "description": (
                    f"You tend to over-trust AI output for '{name}'. "
                    f"{stats['over_trust_count']} of {total} predictions "
                    f"({over_trust_ratio * 100:.0f}%) had high confidence (7-10) "
                    f"but turned out to be incorrect. Consider lowering your "
                    f"default trust for this output type and adding a verification step."
                ),
                "evidence": {
                    "over_trust_count": stats["over_trust_count"],
                    "total_predictions": total,
                    "over_trust_rate": f"{over_trust_ratio * 100:.0f}%",
                    "accuracy": f"{accuracy * 100:.0f}%",
                    "avg_confidence": f"{avg_conf:.1f}",
                },
            })

        # Check over-verify pattern
        if over_verify_ratio >= OVER_VERIFY_THRESHOLD:
            over_verify_types.append(name)
            insights_data.append({
                "type": "over_verify",
                "output_type_id": ot_id,
                "description": (
                    f"You tend to under-trust AI output for '{name}'. "
                    f"{stats['over_verify_count']} of {total} predictions "
                    f"({over_verify_ratio * 100:.0f}%) had low confidence (1-4) "
                    f"but the output was actually correct. You may be spending "
                    f"unnecessary time verifying reliable outputs in this category."
                ),
                "evidence": {
                    "over_verify_count": stats["over_verify_count"],
                    "total_predictions": total,
                    "over_verify_rate": f"{over_verify_ratio * 100:.0f}%",
                    "accuracy": f"{accuracy * 100:.0f}%",
                    "avg_confidence": f"{avg_conf:.1f}",
                },
            })

        # Check well-calibrated pattern
        # Compare accuracy (0-1) against normalized confidence (avg_confidence / 10)
        normalized_conf = avg_conf / 10.0
        if abs(accuracy - normalized_conf) <= CALIBRATION_TOLERANCE:
            well_calibrated_types.append(name)
            insights_data.append({
                "type": "well_calibrated",
                "output_type_id": ot_id,
                "description": (
                    f"Your confidence is well-calibrated for '{name}'. "
                    f"Your average confidence ({avg_conf:.1f}/10) closely matches "
                    f"the actual accuracy ({accuracy * 100:.0f}%). "
                    f"Keep trusting your judgment for this output type."
                ),
                "evidence": {
                    "accuracy": f"{accuracy * 100:.0f}%",
                    "avg_confidence": f"{avg_conf:.1f}",
                    "calibration_gap": f"{abs(accuracy - normalized_conf) * 100:.1f}%",
                    "total_predictions": total,
                },
            })

    # Generate aggregate recommendation insights
    if over_trust_types:
        type_list = ", ".join(over_trust_types)
        insights_data.append({
            "type": "recommendation",
            "output_type_id": None,
            "description": (
                f"Focus on improving verification habits for: {type_list}. "
                f"Before accepting AI output in these categories, pause and "
                f"check at least one concrete detail against a known source. "
                f"Consider creating a quick checklist specific to each type."
            ),
            "evidence": {
                "affected_types": over_trust_types,
                "pattern": "over_trust",
            },
        })

    if over_verify_types:
        type_list = ", ".join(over_verify_types)
        insights_data.append({
            "type": "recommendation",
            "output_type_id": None,
            "description": (
                f"You can afford to trust AI more for: {type_list}. "
                f"Your verification effort in these areas exceeds what the "
                f"accuracy data warrants. Try a lighter-touch review for these "
                f"output types to save time without sacrificing quality."
            ),
            "evidence": {
                "affected_types": over_verify_types,
                "pattern": "over_verify",
            },
        })

    # If no specific issues found, provide a general recommendation
    if not over_trust_types and not over_verify_types:
        total_preds = len(predictions)
        total_correct = sum(1 for p in predictions if p.was_correct)
        overall_accuracy = total_correct / total_preds if total_preds else 0
        overall_avg_conf = sum(p.confidence_rating for p in predictions) / total_preds if total_preds else 0

        insights_data.append({
            "type": "recommendation",
            "output_type_id": None,
            "description": (
                f"Overall calibration looks reasonable across {total_preds} predictions "
                f"with {overall_accuracy * 100:.0f}% accuracy and average confidence "
                f"of {overall_avg_conf:.1f}/10. Continue tracking predictions to "
                f"build a more detailed picture per output type."
            ),
            "evidence": {
                "total_predictions": total_preds,
                "overall_accuracy": f"{overall_accuracy * 100:.0f}%",
                "overall_avg_confidence": f"{overall_avg_conf:.1f}",
            },
        })

    # Save insights to database
    created_insights = []
    for insight in insights_data:
        # Look up output type ID if output type name provided
        output_type_id = insight.get("output_type_id")
        if output_type_id and output_type_id not in output_types:
            # Try to find by name
            for ot_id, ot in output_types.items():
                if ot.name.lower() in str(insight.get("description", "")).lower():
                    output_type_id = ot_id
                    break
            else:
                output_type_id = None

        db_insight = CalibrationInsight(
            user_id=user_id,
            insight_type=insight.get("type", "recommendation"),
            output_type_id=output_type_id,
            description=insight.get("description", ""),
            evidence=insight.get("evidence", {})
        )
        db.add(db_insight)
        created_insights.append(db_insight)

    await db.commit()

    logger.info("Generated %d calibration insights for user %s", len(created_insights), user_id)
    return created_insights
