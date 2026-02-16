"""Lesson 5: Calibration Analyzer - AI-powered insight generation."""
import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.models import Prediction, OutputType, CalibrationInsight
from backend.services.anthropic_client import async_call_anthropic, ANTHROPIC_MODEL, CircuitBreakerError

logger = logging.getLogger(__name__)

CALIBRATION_PROMPT = '''Analyze this user's prediction tracking data to identify calibration patterns.

A prediction is when a user rates their confidence (1-10) that AI output is correct BEFORE verifying it.
After verification, they record whether it was actually correct.

Prediction History (most recent first):
{predictions_json}

Output Type Performance Summary:
{output_type_stats_json}

Analyze and identify:
1. **Over-trust patterns**: Where user rated high confidence (7-10) but the output was wrong
2. **Over-verification patterns**: Where user rated low confidence (1-4) but the output was right
3. **Well-calibrated areas**: Where confidence levels matched actual accuracy
4. **Specific recommendations** for improving calibration

Return a JSON object with insights array:
{{
  "insights": [
    {{
      "type": "over_trust|over_verify|well_calibrated|recommendation",
      "output_type_id": "optional - include if insight is output-type-specific, otherwise null",
      "description": "Clear, actionable description of the pattern or recommendation",
      "evidence": {{"relevant_stat": "value", "example_count": 5}}
    }}
  ]
}}

Guidelines:
- Generate 3-6 insights total
- Be specific and actionable
- Include evidence (numbers, percentages)
- For recommendations, explain WHY and HOW to adjust
- If an output type has consistent issues, suggest adjusting its trust level

Return ONLY valid JSON, no other text.'''


async def analyze_calibration(user_id: str, db: AsyncSession) -> list[CalibrationInsight]:
    """Generate AI insights from prediction history."""
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

    # Format predictions for AI
    predictions_data = []
    for p in predictions[:50]:  # Limit to recent 50 for context
        output_type_name = output_types[p.output_type_id].name if p.output_type_id and p.output_type_id in output_types else "Unknown"
        predictions_data.append({
            "description": p.output_description[:200],  # Truncate long descriptions
            "output_type": output_type_name,
            "confidence": p.confidence_rating,
            "was_correct": p.was_correct,
            "issues": p.actual_issues[:100] if p.actual_issues else None
        })

    # Calculate output type stats
    output_type_stats = {}
    for ot_id, output_type in output_types.items():
        ot_preds = [p for p in predictions if p.output_type_id == ot_id]
        if not ot_preds:
            continue

        correct = sum(1 for p in ot_preds if p.was_correct)
        total = len(ot_preds)
        avg_conf = sum(p.confidence_rating for p in ot_preds) / total

        output_type_stats[output_type.name] = {
            "trust_level": output_type.trust_level,
            "total_predictions": total,
            "accuracy": f"{correct/total*100:.0f}%",
            "avg_confidence": f"{avg_conf:.1f}",
            "over_trust_count": sum(1 for p in ot_preds if p.confidence_rating >= 7 and not p.was_correct),
            "over_verify_count": sum(1 for p in ot_preds if p.confidence_rating <= 4 and p.was_correct)
        }

    # Call Claude API with circuit breaker + retry
    try:
        response = await async_call_anthropic(
            lambda client: client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=1500,
                messages=[{
                    "role": "user",
                    "content": CALIBRATION_PROMPT.format(
                        predictions_json=json.dumps(predictions_data, indent=2),
                        output_type_stats_json=json.dumps(output_type_stats, indent=2)
                    )
                }]
            )
        )

        response_text = response.content[0].text.strip()

        # Parse JSON response
        # Handle potential markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        data = json.loads(response_text)
        insights_data = data.get("insights", [])

    except CircuitBreakerError:
        logger.error("AI service unavailable (circuit breaker open) for calibration analysis")
        return []
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI response as JSON: %s", e)
        logger.error("Response was: %s", response_text[:500])
        return []
    except Exception as e:
        logger.error("Calibration analysis failed: %s", e)
        return []

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
