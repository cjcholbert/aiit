"""Lesson 7: Rule-based task categorization analysis.

Evaluates whether tasks are in the correct category (AI-Optimal, Collaborative,
Human-Primary), identifies borderline cases, checks dependency logic, and
validates decision gates.

No external AI dependency -- all analysis is performed via keyword-matching
heuristics against category signal dictionaries.
"""
import logging

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


# ---------------------------------------------------------------------------
# Category signal dictionaries
# ---------------------------------------------------------------------------

CATEGORY_SIGNALS: dict[str, list[str]] = {
    "ai_optimal": [
        "generate", "boilerplate", "format", "summarize", "template", "draft",
        "convert", "translate", "extract", "parse", "list", "compile",
        "write first draft", "create outline", "standard", "routine",
        "automate", "bulk", "batch", "repetitive",
    ],
    "collaborative": [
        "design", "architect", "analyze", "strategy", "review", "iterate",
        "evaluate", "plan", "assess", "recommend", "compare", "research",
        "brainstorm", "refine", "optimize", "customize", "adapt",
        "troubleshoot",
    ],
    "human_primary": [
        "approve", "deploy", "negotiate", "authorize", "sensitive", "budget",
        "hire", "fire", "present to", "sign", "client meeting", "legal",
        "compliance", "confidential", "final decision", "stakeholder",
        "relationship", "political", "disciplinary",
    ],
}

CATEGORIES = list(CATEGORY_SIGNALS.keys())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _score_text_against_signals(text: str) -> dict[str, tuple[int, list[str]]]:
    """Return {category: (score, [matched_keywords])} for *text*."""
    text_lower = text.lower()
    result: dict[str, tuple[int, list[str]]] = {}
    for category, keywords in CATEGORY_SIGNALS.items():
        matched: list[str] = []
        for kw in keywords:
            if kw in text_lower:
                matched.append(kw)
        result[category] = (len(matched), matched)
    return result


def _classify_task(task: dict) -> dict:
    """Classify a single task and return a task_review dict."""
    title = task.get("title", "")
    description = task.get("description", "")
    reasoning = task.get("reasoning", "")
    combined_text = f"{title} {description} {reasoning}"

    assigned_raw = task.get("category", "unknown")
    # Normalize assigned category to match our keys
    assigned = assigned_raw.lower().replace("-", "_").replace(" ", "_")
    # Map common variants
    if assigned in ("ai_optimal", "ai-optimal", "aioptimal"):
        assigned = "ai_optimal"
    elif assigned in ("human_primary", "human-primary", "humanprimary", "human"):
        assigned = "human_primary"
    elif assigned in ("collaborative",):
        assigned = "collaborative"

    scores = _score_text_against_signals(combined_text)

    # Sort categories by score (desc), then alphabetically for stability
    ranked = sorted(scores.items(), key=lambda x: (-x[1][0], x[0]))
    top_cat, (top_score, top_matches) = ranked[0]
    second_cat, (second_score, _second_matches) = ranked[1]

    # If no keywords matched at all, default recommended to the assigned category
    if top_score == 0:
        recommended = assigned if assigned in CATEGORIES else "collaborative"
        is_correct = assigned == recommended
        confidence = 0.5
        reasoning_text = (
            "No category signals detected in the task description. "
            "Cannot verify whether the assigned category is correct. "
            "Add action verbs and specifics so the categorization can be validated."
        )
        is_borderline = True
        borderline_note = (
            "Task description lacks recognizable signals for any category. "
            "This makes it impossible to confirm the categorization is correct."
        )
    else:
        recommended = top_cat
        is_correct = (assigned == recommended)

        gap = top_score - second_score
        # Confidence based on how wide the gap is
        if gap == 0:
            confidence = 0.45
        elif gap == 1:
            confidence = 0.60
        elif gap == 2:
            confidence = 0.72
        elif gap == 3:
            confidence = 0.82
        else:
            confidence = min(0.95, 0.82 + 0.03 * (gap - 3))

        is_borderline = gap <= 2 and second_score > 0
        borderline_note = ""
        if is_borderline:
            borderline_note = (
                f"Close match between {top_cat.replace('_', '-')} "
                f"({top_score} signals) and {second_cat.replace('_', '-')} "
                f"({second_score} signals)."
            )

        reasoning_text = (
            f"Contains {top_cat.replace('_', '-')} signals: "
            f"{', '.join(top_matches)}."
        )
        if not is_correct:
            reasoning_text += (
                f" Assigned as {assigned.replace('_', '-')} but "
                f"keyword evidence favours {recommended.replace('_', '-')}."
            )

    return {
        "task_title": title,
        "assigned_category": assigned_raw,
        "recommended_category": recommended,
        "is_correct": is_correct,
        "confidence": round(confidence, 2),
        "reasoning": reasoning_text,
        "is_borderline": is_borderline,
        "borderline_note": borderline_note,
    }


def _assess_dependency_analysis(tasks: list[dict], reviews: list[dict]) -> dict:
    """Analyze task dependency sequencing."""
    issues: list[str] = []
    suggestions: list[str] = []

    # Build order map
    task_order: dict[str, int] = {}
    task_cats: dict[str, str] = {}
    for idx, task in enumerate(tasks):
        title = task.get("title", f"Task {idx + 1}")
        task_order[title] = task.get("order", idx)
        # Use recommended category from review
        if idx < len(reviews):
            task_cats[title] = reviews[idx]["recommended_category"]
        else:
            task_cats[title] = task.get("category", "unknown")

    # Check that human_primary tasks generally come after others
    for title, cat in task_cats.items():
        if cat == "human_primary":
            order = task_order.get(title, 999)
            for other_title, other_cat in task_cats.items():
                if other_cat in ("collaborative", "ai_optimal"):
                    other_order = task_order.get(other_title, 0)
                    if other_order > order:
                        issues.append(
                            f'"{title}" (human-primary) is sequenced before '
                            f'"{other_title}" ({other_cat.replace("_", "-")}), '
                            f"which may indicate a sequencing issue."
                        )

    # Check for unnecessary ai_optimal -> ai_optimal dependencies
    for task in tasks:
        deps = task.get("dependencies", [])
        title = task.get("title", "")
        cat = task_cats.get(title, "unknown")
        if cat == "ai_optimal" and deps:
            for dep_title in deps:
                dep_cat = task_cats.get(dep_title, "unknown")
                if dep_cat == "ai_optimal":
                    issues.append(
                        f'AI-optimal task "{title}" depends on AI-optimal task '
                        f'"{dep_title}" -- these may be parallelisable.'
                    )
                    suggestions.append(
                        f'Consider running "{title}" and "{dep_title}" in parallel '
                        f"if they don't share data."
                    )

    # Check decision gates have downstream tasks
    for task in tasks:
        if task.get("is_decision_gate"):
            title = task.get("title", "")
            has_downstream = any(
                title in t.get("dependencies", []) for t in tasks
            )
            if not has_downstream:
                issues.append(
                    f'Decision gate "{title}" has no downstream dependencies -- '
                    f"it may be unused or should be connected to subsequent tasks."
                )

    if not issues:
        # Check if there are actually dependencies defined
        has_any_deps = any(t.get("dependencies") for t in tasks)
        has_any_gates = any(t.get("is_decision_gate") for t in tasks)
        if not has_any_deps and not has_any_gates and len(tasks) > 2:
            suggestions.append(
                "No dependencies or decision gates defined between tasks. "
                "Real projects usually have sequencing constraints — consider "
                "which tasks depend on others and where review checkpoints belong."
            )
        else:
            suggestions.append("Task sequencing looks reasonable for this project.")

    # Determine overall quality
    if len(issues) == 0:
        quality = "good"
    elif len(issues) <= 2:
        quality = "fair"
    else:
        quality = "poor"

    return {
        "sequencing_quality": quality,
        "issues": issues,
        "suggestions": suggestions,
    }


def _assess_decision_gates(tasks: list[dict], reviews: list[dict]) -> dict:
    """Validate decision gate placement."""
    current_gates = [t for t in tasks if t.get("is_decision_gate")]
    current_count = len(current_gates)
    total_tasks = len(tasks)

    # Recommended: 1 gate per 3-4 tasks, minimum 1
    recommended_count = max(1, total_tasks // 3)

    missing_gates: list[str] = []
    unnecessary_gates: list[str] = []

    # Build set of gate titles
    gate_titles = {t.get("title", "") for t in current_gates}

    # Check: at least one gate before any human_primary task
    human_primary_tasks = []
    for idx, review in enumerate(reviews):
        if review["recommended_category"] == "human_primary":
            task = tasks[idx] if idx < len(tasks) else {}
            human_primary_tasks.append(task)
            # Check if any gate comes before this task in ordering
            task_order = task.get("order", idx)
            gate_before = any(
                g.get("order", 999) < task_order for g in current_gates
            )
            if not gate_before:
                title = task.get("title", f"Task {idx + 1}")
                missing_gates.append(
                    f'No decision gate before human-primary task "{title}" -- '
                    f"add a review checkpoint to validate AI work before this step."
                )

    # Flag gates that seem to be on pure ai_optimal tasks with no downstream impact
    for gate_task in current_gates:
        gate_title = gate_task.get("title", "")
        # Find corresponding review
        matching_review = next(
            (r for r in reviews if r["task_title"] == gate_title), None
        )
        if matching_review and matching_review["recommended_category"] == "ai_optimal":
            has_downstream = any(
                gate_title in t.get("dependencies", []) for t in tasks
            )
            if not has_downstream:
                unnecessary_gates.append(
                    f'Gate "{gate_title}" is on an AI-optimal task with no '
                    f"downstream dependencies -- consider removing or repositioning."
                )

    if current_count < recommended_count and not missing_gates:
        missing_gates.append(
            f"Only {current_count} gate(s) for {total_tasks} tasks. "
            f"Consider adding checkpoints every 3-4 tasks for review."
        )

    return {
        "current_count": current_count,
        "recommended_count": recommended_count,
        "missing_gates": missing_gates,
        "unnecessary_gates": unnecessary_gates,
    }


def _generate_coaching(reviews: list[dict], tasks: list[dict]) -> dict:
    """Generate coaching based on error patterns."""
    incorrect = [r for r in reviews if not r["is_correct"]]
    total = len(reviews)

    over_delegating = 0  # human tasks marked ai_optimal
    under_delegating = 0  # ai_optimal tasks marked human_primary

    for r in incorrect:
        assigned = r["assigned_category"].lower().replace("-", "_").replace(" ", "_")
        recommended = r["recommended_category"]
        if recommended == "human_primary" and assigned == "ai_optimal":
            over_delegating += 1
        elif recommended == "ai_optimal" and assigned in ("human_primary", "collaborative"):
            under_delegating += 1

    if over_delegating > under_delegating and over_delegating > 0:
        common_mistake = (
            "Over-delegating to AI: some tasks requiring human judgment or "
            "authority were categorized as AI-optimal."
        )
        biggest_insight = (
            "Tasks involving approvals, sensitive decisions, or stakeholder "
            "relationships need human ownership even when AI can assist."
        )
        next_step = (
            "Before categorizing, ask: 'Does this task require authority, "
            "accountability, or relationship awareness?' If yes, mark it human-primary."
        )
    elif under_delegating > over_delegating and under_delegating > 0:
        common_mistake = (
            "Under-delegating to AI: some routine or pattern-based tasks were "
            "kept as human-primary when AI could handle them effectively."
        )
        biggest_insight = (
            "Repetitive, format-driven, or template-based tasks are prime "
            "candidates for AI delegation -- freeing you for higher-value work."
        )
        next_step = (
            "Look for tasks with well-defined inputs and outputs. If the task "
            "is repeatable and doesn't require institutional judgment, try AI-optimal."
        )
    elif len(incorrect) > 0:
        common_mistake = (
            "Mixed categorization issues: some tasks landed in the wrong "
            "category in both directions."
        )
        biggest_insight = (
            "Focus on the core question for each task: 'Who needs to own the "
            "outcome?' AI owns routine outputs, humans own decisions with consequences."
        )
        next_step = (
            "For each task, write one sentence explaining WHY it belongs in its "
            "category. If you struggle to articulate it, reconsider the placement."
        )
    else:
        # Check if correctness is genuine or just the analyzer defaulting
        all_defaulted = all(
            r.get("confidence", 1.0) <= 0.5 for r in reviews
        )
        if all_defaulted:
            common_mistake = (
                "Task descriptions lack strong category signals. The analyzer "
                "couldn't independently verify categorizations because the "
                "descriptions don't contain enough detail."
            )
            biggest_insight = (
                "Add specific verbs and context to task descriptions. "
                "Words like 'generate', 'approve', 'design', or 'deploy' "
                "help clarify whether a task is AI-optimal, collaborative, "
                "or human-primary."
            )
            next_step = (
                "Rewrite each task description to include what action is being "
                "performed, who owns the outcome, and what tools or judgment "
                "are required."
            )
        else:
            common_mistake = "No significant categorization errors detected."
            biggest_insight = (
                "Strong categorization instincts. The decomposition reflects a "
                "clear understanding of what AI handles well vs. what needs human judgment."
            )
            next_step = (
                "Challenge yourself with more complex projects that blur the "
                "boundaries between categories to refine your edge-case intuition."
            )

    return {
        "biggest_insight": biggest_insight,
        "common_mistake": common_mistake,
        "next_step": next_step,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyze_decomposition(
    project_name: str,
    tasks: list[dict],
    model: str = None,
) -> dict:
    """Analyze a decomposition's task categorizations using rule-based heuristics.

    Args:
        project_name: Name of the project being decomposed.
        tasks: List of task dicts with title, description, category, reasoning,
               is_decision_gate, dependencies, order.
        model: Ignored (kept for API compatibility).

    Returns:
        Parsed analysis dict with overall_assessment, task_reviews,
        dependency_analysis, decision_gates, coaching, confidence.

    Raises:
        AnalyzerError: If input is invalid or analysis cannot be completed.
    """
    if not tasks:
        raise AnalyzerError("No tasks provided for analysis.")

    try:
        # ----- Task reviews -----
        reviews: list[dict] = [_classify_task(t) for t in tasks]

        correct_count = sum(1 for r in reviews if r["is_correct"])
        incorrect_count = len(reviews) - correct_count

        # ----- Overall score -----
        base_score = 7
        # Scale adjustments so small task lists don't trivially hit 10
        adjustment = correct_count - incorrect_count
        if len(reviews) <= 2:
            # Dampen for very small sets
            adjustment = round(adjustment * 0.5)
        score = max(1, min(10, base_score + adjustment))

        # ----- Category balance -----
        assigned_cats = {
            r["assigned_category"].lower().replace("-", "_").replace(" ", "_")
            for r in reviews
        }
        all_same = len(assigned_cats) <= 1 and len(reviews) > 1
        if all_same:
            only_cat = next(iter(assigned_cats), "unknown")
            balance_obs = (
                f"All tasks are categorized as {only_cat.replace('_', '-')}. "
                f"Real projects typically involve a mix of categories."
            )
        elif len(assigned_cats) == 2 and len(reviews) > 3:
            missing = set(CATEGORIES) - assigned_cats
            balance_obs = (
                f"Missing {', '.join(c.replace('_', '-') for c in missing)} tasks. "
                f"Consider whether any tasks fit the missing category."
            )
        else:
            balance_obs = "Good mix of task categories for this project."

        is_balanced = not all_same

        # ----- Strengths -----
        all_defaulted = all(r.get("confidence", 1.0) <= 0.5 for r in reviews)
        strengths: list[str] = []
        if correct_count == len(reviews) and not all_defaulted:
            strengths.append("All tasks correctly categorized.")
        elif correct_count > incorrect_count:
            strengths.append(
                f"{correct_count}/{len(reviews)} tasks correctly categorized."
            )
        borderline_count = sum(1 for r in reviews if r["is_borderline"])
        if borderline_count > 0 and correct_count > 0:
            strengths.append(
                "Some borderline tasks were handled well despite ambiguity."
            )
        if any(t.get("is_decision_gate") for t in tasks):
            strengths.append("Decision gates included in the decomposition.")
        if not strengths:
            strengths.append(
                "Tasks were identified, but descriptions need more detail "
                "for meaningful categorization analysis."
            )

        summary = (
            f"{'Strong' if score >= 8 else 'Decent' if score >= 5 else 'Needs work'} "
            f"decomposition of \"{project_name}\" with "
            f"{correct_count}/{len(reviews)} correct categorizations."
        )

        # ----- Dependency & gate analysis -----
        dep_analysis = _assess_dependency_analysis(tasks, reviews)
        gate_analysis = _assess_decision_gates(tasks, reviews)

        # ----- Coaching -----
        coaching = _generate_coaching(reviews, tasks)

        # ----- Confidence -----
        avg_confidence = (
            sum(r["confidence"] for r in reviews) / len(reviews)
            if reviews else 0.5
        )
        conf_score = max(1, min(10, round(avg_confidence * 10)))
        if len(tasks) <= 2:
            conf_reasoning = (
                "Limited task count reduces confidence in pattern detection."
            )
            conf_score = min(conf_score, 6)
        elif len(tasks) >= 6:
            conf_reasoning = (
                "Sufficient tasks for meaningful pattern analysis."
            )
        else:
            conf_reasoning = (
                "Moderate task count provides reasonable confidence."
            )

        return {
            "overall_assessment": {
                "score": score,
                "summary": summary,
                "strengths": strengths,
                "category_balance": {
                    "is_balanced": is_balanced,
                    "observation": balance_obs,
                },
            },
            "task_reviews": reviews,
            "dependency_analysis": dep_analysis,
            "decision_gates": gate_analysis,
            "coaching": coaching,
            "confidence": {
                "score": conf_score,
                "reasoning": conf_reasoning,
            },
        }

    except AnalyzerError:
        raise
    except Exception as exc:
        logger.error("Lesson 7 rule-based analysis failed: %s", exc, exc_info=True)
        raise AnalyzerError(f"Analysis failed: {exc}") from exc
