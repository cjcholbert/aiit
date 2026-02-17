"""Lesson 12: Rule-based integration challenge evaluator.

Evaluates learner responses to realistic workplace scenarios that require
applying all six managerial concepts: Context Assembly, Quality Judgment,
Task Decomposition, Iterative Refinement, Workflow Integration, and
Frontier Recognition.

No external AI dependency -- all evaluation is performed via rubric-based
keyword scoring against per-concept dictionaries.
"""
import logging

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


SCENARIOS = [
    {
        "id": "quarterly_report",
        "title": "Prepare a Quarterly Business Report",
        "description": "Your VP asks you to prepare the Q4 business report for the executive team. It needs financial summaries, project status updates, risk highlights, and strategic recommendations. The deadline is 3 days away and you have access to raw data from multiple departments.",
        "hints": {
            "context_assembly": "What context would you give the AI about your audience, formatting standards, and data sources?",
            "quality_judgment": "Which parts of the report can you trust AI to draft vs. which need careful human verification?",
            "task_decomposition": "How would you break this into AI-appropriate subtasks?",
            "iterative_refinement": "What does your feedback loop look like from first draft to final version?",
            "workflow_integration": "How does AI fit into your existing report-building process?",
            "frontier_recognition": "Where might AI produce unreliable outputs for this task?"
        }
    },
    {
        "id": "onboard_teammate",
        "title": "Onboard a New Team Member",
        "description": "A new hire starts on Monday. You need to create onboarding materials, set up their first-week schedule, draft welcome communications, prepare training docs for your team's tools and processes, and design a 30-60-90 day plan. You have some existing docs but they're outdated.",
        "hints": {
            "context_assembly": "What context does AI need about your team culture, role specifics, and existing processes?",
            "quality_judgment": "Which onboarding materials can AI generate reliably vs. which need your personal touch?",
            "task_decomposition": "Which onboarding tasks are AI-optimal, collaborative, or human-primary?",
            "iterative_refinement": "How would you refine AI-drafted materials through structured passes?",
            "workflow_integration": "How would you build a repeatable onboarding workflow using AI?",
            "frontier_recognition": "Where might AI-generated onboarding content be inaccurate or inappropriate?"
        }
    },
    {
        "id": "competitive_analysis",
        "title": "Research and Present Competitive Analysis",
        "description": "Your product team needs a competitive analysis of 5 rival products within your market. The deliverable is a presentation with feature comparisons, pricing analysis, market positioning, and strategic recommendations. You have 1 week and access to public information, customer feedback data, and internal usage metrics.",
        "hints": {
            "context_assembly": "What context would help AI understand your market, product, and analysis goals?",
            "quality_judgment": "How would you calibrate trust for AI-generated competitive insights?",
            "task_decomposition": "How would you break the research and presentation into manageable AI tasks?",
            "iterative_refinement": "What's your revision strategy from raw research to polished presentation?",
            "workflow_integration": "How would you integrate AI into your research and analysis workflow?",
            "frontier_recognition": "What competitive analysis tasks are beyond AI's reliable capability?"
        }
    }
]


# ---------------------------------------------------------------------------
# Per-concept keyword dictionaries
# ---------------------------------------------------------------------------

CONCEPT_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "context_assembly": {
        "strong": [
            "audience", "background", "constraints", "format", "examples",
            "prior work", "environment", "stakeholder", "requirements",
            "data sources",
        ],
        "bonus": ["template", "reusable", "checklist"],
        "weak": ["just tell it", "give it everything"],
    },
    "quality_judgment": {
        "strong": [
            "verify", "trust", "accuracy", "calibrate", "check", "validate",
            "fact-check", "source", "hallucinate", "confidence",
        ],
        "bonus": ["trust matrix", "risk-based", "domain"],
        "weak": ["trust everything", "always check"],
    },
    "task_decomposition": {
        "strong": [
            "subtask", "break down", "sequence", "delegate", "ai-optimal",
            "collaborative", "human", "dependency", "decision gate",
        ],
        "bonus": ["category", "parallel"],
        "weak": ["do it all", "one prompt"],
    },
    "iterative_refinement": {
        "strong": [
            "iterate", "feedback", "revision", "draft", "refine", "pass",
            "70%", "85%", "95%", "improve", "specific feedback",
        ],
        "bonus": ["checkpoint", "diminishing returns"],
        "weak": ["one shot", "first try"],
    },
    "workflow_integration": {
        "strong": [
            "process", "workflow", "integrate", "handoff", "automate",
            "repeatable", "sustainable", "document", "feedback loop",
        ],
        "bonus": ["template", "standard operating"],
        "weak": ["one-off", "ad hoc"],
    },
    "frontier_recognition": {
        "strong": [
            "boundary", "limitation", "unreliable", "frontier", "capability",
            "hallucinate", "novel", "edge case", "risk",
        ],
        "bonus": ["experiment", "zone"],
        "weak": ["can do anything", "no limits"],
    },
}

CONCEPT_LABELS: dict[str, str] = {
    "context_assembly": "Context Assembly",
    "quality_judgment": "Quality Judgment",
    "task_decomposition": "Task Decomposition",
    "iterative_refinement": "Iterative Refinement",
    "workflow_integration": "Workflow Integration",
    "frontier_recognition": "Frontier Recognition",
}

CONCEPT_ORDER = [
    "context_assembly", "quality_judgment", "task_decomposition",
    "iterative_refinement", "workflow_integration", "frontier_recognition",
]


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _score_concept(concept: str, response_text: str) -> dict:
    """Score a single concept response against its rubric.

    Returns a concept_scores entry dict.
    """
    kw = CONCEPT_KEYWORDS[concept]
    text_lower = response_text.lower()
    word_count = len(response_text.split())

    # Count keyword matches
    strong_matches: list[str] = [s for s in kw["strong"] if s in text_lower]
    bonus_matches: list[str] = [b for b in kw["bonus"] if b in text_lower]
    weak_matches: list[str] = [w for w in kw["weak"] if w in text_lower]

    # Calculate score
    score = 30
    score += min(len(strong_matches), 10) * 5  # max +50
    score += min(len(bonus_matches), 2) * 8    # max +16
    score -= len(weak_matches) * 10

    # Depth bonus
    if word_count > 200:
        score += 10
    elif word_count > 100:
        score += 5

    score = max(0, min(100, score))

    # Build strengths list
    strengths: list[str] = []
    if strong_matches:
        strengths.append(
            f"Mentions key concepts: {', '.join(strong_matches[:4])}."
        )
    if bonus_matches:
        strengths.append(
            f"Advanced vocabulary used: {', '.join(bonus_matches)}."
        )
    if word_count > 150:
        strengths.append("Detailed response with good depth.")
    if not strengths:
        strengths.append("Response provided for this concept.")

    # Build gaps list
    gaps: list[str] = []
    missing_strong = [s for s in kw["strong"] if s not in text_lower]
    if len(missing_strong) >= 5:
        gaps.append(
            f"Missing important concepts: {', '.join(missing_strong[:4])}."
        )
    if weak_matches:
        gaps.append(
            f"Contains weak signals: {', '.join(weak_matches)}. "
            f"These suggest an oversimplified approach."
        )
    if word_count < 50:
        gaps.append("Response is very brief -- more detail would demonstrate deeper understanding.")
    if not gaps:
        gaps.append("No significant gaps identified.")

    # Build suggestion
    if score < 40:
        suggestion = (
            f"Review the {CONCEPT_LABELS[concept]} framework and try to "
            f"address: {', '.join(missing_strong[:3])}."
        )
    elif score < 70:
        top_missing = missing_strong[:2] if missing_strong else ["depth"]
        suggestion = (
            f"Good start. Strengthen by addressing: {', '.join(top_missing)}."
        )
    else:
        suggestion = (
            f"Strong response. Consider connecting {CONCEPT_LABELS[concept]} "
            f"to other concepts for even richer analysis."
        )

    return {
        "concept": concept,
        "label": CONCEPT_LABELS[concept],
        "score": score,
        "strengths": strengths,
        "gaps": gaps,
        "suggestion": suggestion,
    }


def _find_connections(responses: dict[str, str]) -> list[str]:
    """Identify cross-concept vocabulary usage."""
    connections: list[str] = []
    checked_pairs: set[tuple[str, str]] = set()

    for concept_a in CONCEPT_ORDER:
        text_a = responses.get(concept_a, "").lower()
        if not text_a:
            continue
        for concept_b in CONCEPT_ORDER:
            if concept_a == concept_b:
                continue
            pair = tuple(sorted([concept_a, concept_b]))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            # Check if concept_a's response uses concept_b's keywords
            kw_b = CONCEPT_KEYWORDS[concept_b]["strong"]
            matches_ab = [kw for kw in kw_b if kw in text_a]

            text_b = responses.get(concept_b, "").lower()
            kw_a = CONCEPT_KEYWORDS[concept_a]["strong"]
            matches_ba = [kw for kw in kw_a if kw in text_b]

            if matches_ab:
                connections.append(
                    f"{CONCEPT_LABELS[concept_a]} response references "
                    f"{CONCEPT_LABELS[concept_b]} concepts "
                    f"({', '.join(matches_ab[:3])})."
                )
            if matches_ba:
                connections.append(
                    f"{CONCEPT_LABELS[concept_b]} response references "
                    f"{CONCEPT_LABELS[concept_a]} concepts "
                    f"({', '.join(matches_ba[:3])})."
                )

    if not connections:
        connections.append(
            "No cross-concept connections detected. Try referencing how "
            "concepts relate to each other for a more integrated approach."
        )

    return connections


def _generate_next_steps(
    concept_scores: list[dict],
    growth_area: str,
    strongest: str,
) -> list[str]:
    """Generate actionable next steps based on scores."""
    steps: list[str] = []

    growth_label = CONCEPT_LABELS.get(growth_area, growth_area)
    strongest_label = CONCEPT_LABELS.get(strongest, strongest)

    steps.append(
        f"Focus on {growth_label} -- review the core framework and "
        f"practice identifying its elements in real scenarios."
    )

    # Find concepts in the 40-60 range for targeted improvement
    mid_range = [
        cs for cs in concept_scores
        if 40 <= cs["score"] <= 60 and cs["concept"] != growth_area
    ]
    if mid_range:
        steps.append(
            f"Also strengthen {mid_range[0]['label']} which is close to "
            f"a tipping point for significant improvement."
        )

    steps.append(
        f"Leverage your strength in {strongest_label} to anchor "
        f"connections with weaker concepts."
    )

    return steps


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def evaluate_challenge(
    scenario_id: str,
    responses: dict[str, str],
    model: str = None,
) -> dict:
    """Evaluate integration challenge responses using rule-based rubrics.

    Args:
        scenario_id: Which scenario (quarterly_report, onboard_teammate,
                     competitive_analysis).
        responses: Dict with keys: context_assembly, quality_judgment,
                   task_decomposition, iterative_refinement,
                   workflow_integration, frontier_recognition.
        model: Ignored (kept for API compatibility).

    Returns:
        Parsed evaluation dict with overall_score, concept_scores,
        connections, strongest_concept, growth_area, next_steps, confidence.

    Raises:
        AnalyzerError: If input is invalid or evaluation cannot be completed.
    """
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise AnalyzerError(f"Unknown scenario: {scenario_id}")

    required_keys = [
        "context_assembly", "quality_judgment", "task_decomposition",
        "iterative_refinement", "workflow_integration", "frontier_recognition",
    ]
    for key in required_keys:
        if key not in responses or not responses[key].strip():
            raise AnalyzerError(f"Missing response for: {key}")

    try:
        # ----- Score each concept -----
        concept_scores: list[dict] = [
            _score_concept(concept, responses[concept])
            for concept in CONCEPT_ORDER
        ]

        # ----- Cross-concept connections -----
        connections_found = _find_connections(responses)

        # ----- Strongest / growth area -----
        best = max(concept_scores, key=lambda cs: cs["score"])
        worst = min(concept_scores, key=lambda cs: cs["score"])
        strongest_concept = best["label"]
        growth_area = worst["label"]

        # ----- Overall score (weighted average) -----
        total_score = sum(cs["score"] for cs in concept_scores)
        overall_score = max(0, min(100, round(total_score / len(concept_scores))))

        # ----- Overall feedback -----
        if overall_score >= 75:
            quality_word = "Strong"
        elif overall_score >= 50:
            quality_word = "Solid"
        else:
            quality_word = "Developing"

        overall_feedback = (
            f"{quality_word} integration of the six concepts for the "
            f'"{scenario["title"]}" scenario (overall {overall_score}/100). '
            f"Strongest area: {strongest_concept}. "
            f"Primary growth opportunity: {growth_area}."
        )

        # ----- Next steps -----
        next_steps = _generate_next_steps(
            concept_scores, worst["concept"], best["concept"]
        )

        # ----- Confidence -----
        avg_word_count = sum(
            len(responses[c].split()) for c in CONCEPT_ORDER
        ) / len(CONCEPT_ORDER)

        if avg_word_count < 50:
            conf_score = 5
            conf_reasoning = (
                "Responses are quite brief on average, limiting the depth "
                "of rule-based evaluation."
            )
        elif avg_word_count < 150:
            conf_score = 7
            conf_reasoning = (
                "Moderate response length provides reasonable signal for evaluation."
            )
        else:
            conf_score = 8
            conf_reasoning = (
                "Detailed responses give strong signal for keyword-based evaluation."
            )

        return {
            "overall_score": overall_score,
            "overall_feedback": overall_feedback,
            "concept_scores": concept_scores,
            "connections_found": connections_found,
            "strongest_concept": strongest_concept,
            "growth_area": growth_area,
            "next_steps": next_steps,
            "confidence": {
                "score": conf_score,
                "reasoning": conf_reasoning,
            },
        }

    except AnalyzerError:
        raise
    except Exception as exc:
        logger.error("Lesson 12 rule-based evaluation failed: %s", exc, exc_info=True)
        raise AnalyzerError(f"Evaluation failed: {exc}") from exc
