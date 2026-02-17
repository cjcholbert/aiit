"""Lesson 11: Rule-based frontier pattern analysis.

Analyzes encounter data to cluster outcomes by type and zone, identify capability
boundaries where results are mixed, compare encounter evidence against zone
reliability assessments, and suggest under-explored areas.

Uses statistical aggregation and threshold logic instead of AI inference.
No external AI dependency required.
"""
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


# ---------------------------------------------------------------------------
# Reliability mapping helpers
# ---------------------------------------------------------------------------

_RELIABILITY_LABELS = ("reliable", "mixed", "unreliable")


def _success_rate_to_reliability(rate: float) -> str:
    """Map a 0-1 success rate to a reliability label."""
    if rate >= 0.7:
        return "reliable"
    if rate >= 0.4:
        return "mixed"
    return "unreliable"


def _reliability_matches(label: str, success_rate: float) -> bool:
    """Check whether a reliability label is consistent with the success rate."""
    suggested = _success_rate_to_reliability(success_rate)
    return label == suggested


# ---------------------------------------------------------------------------
# Encounter grouping utilities
# ---------------------------------------------------------------------------

def _group_encounters_by_type(encounters: list[dict]) -> dict[str, list[dict]]:
    """Group encounters by encounter_type (success/failure/surprise)."""
    groups = defaultdict(list)
    for enc in encounters:
        etype = enc.get("encounter_type", "unknown").lower()
        groups[etype].append(enc)
    return dict(groups)


def _group_encounters_by_zone(encounters: list[dict]) -> dict[str, list[dict]]:
    """Group encounters by zone_name."""
    groups = defaultdict(list)
    for enc in encounters:
        zone = enc.get("zone_name") or "Unassigned"
        groups[zone].append(enc)
    return dict(groups)


def _zones_by_name(zones: list[dict]) -> dict[str, dict]:
    """Index zones by name for quick lookup."""
    result = {}
    for z in zones:
        name = z.get("name", "Unnamed")
        result[name] = z
    return result


def _zones_by_category(zones: list[dict]) -> dict[str, list[dict]]:
    """Group zones by category."""
    groups = defaultdict(list)
    for z in zones:
        cat = z.get("category", "other")
        groups[cat].append(z)
    return dict(groups)


def _truncate(text: str, max_len: int = 120) -> str:
    """Truncate a string with ellipsis if too long."""
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


# ---------------------------------------------------------------------------
# Analysis components
# ---------------------------------------------------------------------------

def _build_pattern_clusters(
    encounters: list[dict],
    encounters_by_type: dict[str, list[dict]],
    encounters_by_zone: dict[str, list[dict]],
) -> list[dict]:
    """Group encounters into meaningful pattern clusters."""
    clusters = []

    for etype, enc_list in encounters_by_type.items():
        if not enc_list:
            continue

        # Sub-group by zone within each encounter type
        zone_subgroups = defaultdict(list)
        for enc in enc_list:
            zone = enc.get("zone_name") or "Unassigned"
            zone_subgroups[zone].append(enc)

        for zone_name, zone_encs in zone_subgroups.items():
            if not zone_encs:
                continue

            # Collect unique task types from tags or descriptions
            task_types = set()
            evidence = []
            for enc in zone_encs:
                tags = enc.get("tags") or []
                for tag in tags[:3]:
                    task_types.add(tag)
                desc = _truncate(enc.get("task_description", ""), 100)
                if desc and len(evidence) < 3:
                    evidence.append(desc)

            if not task_types:
                task_types.add(zone_name)

            # Generate descriptive cluster name
            type_label = etype.capitalize()
            cluster_name = f"{type_label}es in {zone_name}" if etype != "surprise" else f"Surprises in {zone_name}"

            # Generate insight
            count = len(zone_encs)
            if etype == "success":
                insight = (
                    f"AI performs reliably for {zone_name} tasks. "
                    f"{count} successful encounter{'s' if count != 1 else ''} "
                    f"suggest this is a strong capability area."
                )
            elif etype == "failure":
                insight = (
                    f"AI struggles with {zone_name} tasks. "
                    f"{count} failure{'s' if count != 1 else ''} "
                    f"indicate this may be outside reliable AI capability."
                )
            else:  # surprise
                insight = (
                    f"Unexpected results in {zone_name}. "
                    f"{count} surprise{'s' if count != 1 else ''} "
                    f"suggest the boundary here is not well understood yet."
                )

            clusters.append({
                "cluster_name": cluster_name,
                "encounter_type": etype,
                "task_types": sorted(task_types)[:5],
                "evidence": evidence,
                "insight": insight,
            })

    # Sort clusters: most encounters first
    clusters.sort(key=lambda c: len(c["evidence"]), reverse=True)
    return clusters[:10]  # Cap at 10 clusters


def _build_capability_boundaries(
    encounters_by_zone: dict[str, list[dict]],
) -> list[dict]:
    """Identify zones with mixed encounter outcomes as capability boundaries."""
    boundaries = []

    for zone_name, encs in encounters_by_zone.items():
        if len(encs) < 2:
            continue

        types_present = {e.get("encounter_type", "unknown").lower() for e in encs}
        has_success = "success" in types_present
        has_failure = "failure" in types_present

        if not (has_success and has_failure):
            continue

        successes = sum(1 for e in encs if e.get("encounter_type", "").lower() == "success")
        failures = sum(1 for e in encs if e.get("encounter_type", "").lower() == "failure")
        total = len(encs)

        # Higher confidence with more data
        confidence = min(0.9, 0.4 + (total * 0.05))

        # Find a specific example of each
        success_ex = next(
            (_truncate(e.get("task_description", ""), 80) for e in encs if e.get("encounter_type", "").lower() == "success"),
            "N/A",
        )
        failure_ex = next(
            (_truncate(e.get("task_description", ""), 80) for e in encs if e.get("encounter_type", "").lower() == "failure"),
            "N/A",
        )

        boundaries.append({
            "boundary": (
                f"'{zone_name}' shows mixed results: {successes} success(es) and "
                f"{failures} failure(s) out of {total} encounters"
            ),
            "supporting_evidence": (
                f"Success example: {success_ex}. "
                f"Failure example: {failure_ex}."
            ),
            "confidence": round(confidence, 2),
        })

    boundaries.sort(key=lambda b: b["confidence"], reverse=True)
    return boundaries[:8]


def _build_zone_accuracy(
    zones: list[dict],
    encounters_by_zone: dict[str, list[dict]],
) -> list[dict]:
    """Compare zone reliability ratings against actual encounter success rates."""
    accuracy_entries = []

    for zone in zones:
        zone_name = zone.get("name", "Unnamed")
        current_reliability = zone.get("reliability", "mixed")

        encs = encounters_by_zone.get(zone_name, [])
        if not encs:
            # No encounter data for this zone
            accuracy_entries.append({
                "zone_name": zone_name,
                "current_reliability": current_reliability,
                "suggested_reliability": current_reliability,
                "needs_adjustment": False,
                "reasoning": (
                    f"No encounters recorded for '{zone_name}'. "
                    f"Current rating of '{current_reliability}' cannot be validated. "
                    f"Try logging some encounters in this zone."
                ),
            })
            continue

        successes = sum(1 for e in encs if e.get("encounter_type", "").lower() == "success")
        total = len(encs)
        success_rate = successes / total if total else 0

        suggested = _success_rate_to_reliability(success_rate)
        needs_adjustment = suggested != current_reliability

        if needs_adjustment:
            reasoning = (
                f"Encounter data ({successes}/{total} successes, "
                f"{success_rate * 100:.0f}% success rate) suggests '{suggested}' "
                f"reliability, but zone is currently rated '{current_reliability}'. "
                f"Consider updating the rating."
            )
        else:
            reasoning = (
                f"Encounter data ({successes}/{total} successes, "
                f"{success_rate * 100:.0f}% success rate) is consistent with "
                f"the current '{current_reliability}' rating."
            )

        accuracy_entries.append({
            "zone_name": zone_name,
            "current_reliability": current_reliability,
            "suggested_reliability": suggested,
            "needs_adjustment": needs_adjustment,
            "reasoning": reasoning,
        })

    return accuracy_entries


def _build_exploration_suggestions(
    zones: list[dict],
    encounters_by_zone: dict[str, list[dict]],
    zones_by_cat: dict[str, list[dict]],
) -> list[dict]:
    """Suggest under-explored zones (fewer than 3 encounters)."""
    suggestions = []

    for zone in zones:
        zone_name = zone.get("name", "Unnamed")
        encs = encounters_by_zone.get(zone_name, [])
        if len(encs) >= 3:
            continue

        category = zone.get("category", "other")

        # Predict reliability based on similar-category zones that DO have data
        sibling_zones = zones_by_cat.get(category, [])
        sibling_success_rates = []
        for sib in sibling_zones:
            sib_name = sib.get("name", "")
            if sib_name == zone_name:
                continue
            sib_encs = encounters_by_zone.get(sib_name, [])
            if sib_encs:
                sib_successes = sum(1 for e in sib_encs if e.get("encounter_type", "").lower() == "success")
                sibling_success_rates.append(sib_successes / len(sib_encs))

        if sibling_success_rates:
            avg_rate = sum(sibling_success_rates) / len(sibling_success_rates)
            predicted = _success_rate_to_reliability(avg_rate)
        else:
            predicted = zone.get("reliability", "mixed")

        enc_count = len(encs)
        strengths = zone.get("strengths", [])
        weaknesses = zone.get("weaknesses", [])

        test_idea_parts = [f"Try a typical {zone_name} task"]
        if weaknesses:
            test_idea_parts.append(f"specifically testing: {weaknesses[0]}")
        elif strengths:
            test_idea_parts.append(f"and verify the claimed strength: {strengths[0]}")

        suggestions.append({
            "area": zone_name,
            "why": (
                f"Only {enc_count} encounter{'s' if enc_count != 1 else ''} recorded. "
                f"More data is needed to validate the '{zone.get('reliability', 'unknown')}' "
                f"rating."
            ),
            "predicted_reliability": predicted,
            "test_idea": ". ".join(test_idea_parts) + ".",
        })

    # Prioritize zones with zero encounters
    suggestions.sort(key=lambda s: 0 if "0 encounters" in s["why"] else 1)
    return suggestions[:6]


def _build_blind_spots(
    zones: list[dict],
    encounters_by_zone: dict[str, list[dict]],
) -> list[str]:
    """Identify zones with high confidence but few encounters, or contradictory data."""
    blind_spots = []

    for zone in zones:
        zone_name = zone.get("name", "Unnamed")
        confidence = zone.get("confidence", 50)
        reliability = zone.get("reliability", "mixed")
        encs = encounters_by_zone.get(zone_name, [])
        enc_count = len(encs)

        # High confidence with few encounters
        if confidence > 70 and enc_count < 3:
            blind_spots.append(
                f"'{zone_name}' has {confidence}% confidence but only {enc_count} "
                f"encounter{'s' if enc_count != 1 else ''}. This confidence level "
                f"may not be well-supported by evidence."
            )

        # Many encounters that contradict the rating
        if enc_count >= 3:
            successes = sum(1 for e in encs if e.get("encounter_type", "").lower() == "success")
            success_rate = successes / enc_count
            suggested = _success_rate_to_reliability(success_rate)
            if suggested != reliability:
                blind_spots.append(
                    f"'{zone_name}' is rated '{reliability}' but encounter data "
                    f"({successes}/{enc_count} successes) suggests '{suggested}'. "
                    f"The current assessment may need updating."
                )

    return blind_spots[:6]


def _build_overall_insight(
    zones: list[dict],
    encounters: list[dict],
    encounters_by_zone: dict[str, list[dict]],
) -> dict:
    """Build the summary insight block."""
    total_enc = len(encounters)
    total_zones = len(zones)

    # Find strongest area (highest success rate zone with enough data)
    zone_rates = []
    for zone in zones:
        zone_name = zone.get("name", "Unnamed")
        encs = encounters_by_zone.get(zone_name, [])
        if len(encs) < 2:
            continue
        successes = sum(1 for e in encs if e.get("encounter_type", "").lower() == "success")
        rate = successes / len(encs)
        zone_rates.append((zone_name, rate, len(encs)))

    strongest = None
    weakest = None
    most_interesting = None

    if zone_rates:
        zone_rates.sort(key=lambda x: x[1], reverse=True)
        strongest = zone_rates[0][0]
        weakest = zone_rates[-1][0]

        # Most interesting: biggest gap between rating and reality
        biggest_gap = 0.0
        for zone in zones:
            zone_name = zone.get("name", "Unnamed")
            reliability = zone.get("reliability", "mixed")
            encs = encounters_by_zone.get(zone_name, [])
            if len(encs) < 2:
                continue
            successes = sum(1 for e in encs if e.get("encounter_type", "").lower() == "success")
            actual_rate = successes / len(encs)
            # Map reliability to expected rate
            expected = {"reliable": 0.8, "mixed": 0.5, "unreliable": 0.2}.get(reliability, 0.5)
            gap = abs(actual_rate - expected)
            if gap > biggest_gap:
                biggest_gap = gap
                most_interesting = (
                    f"'{zone_name}' shows a {gap * 100:.0f}% gap between its "
                    f"'{reliability}' rating and actual {actual_rate * 100:.0f}% success rate"
                )

    # Build summary
    if total_enc == 0:
        summary = (
            f"You have {total_zones} zone{'s' if total_zones != 1 else ''} defined "
            f"but no encounters logged yet. Start recording encounters to build "
            f"an evidence-based frontier map."
        )
    else:
        success_count = sum(1 for e in encounters if e.get("encounter_type", "").lower() == "success")
        summary = (
            f"Across {total_enc} encounters in {total_zones} zone{'s' if total_zones != 1 else ''}, "
            f"you have a {success_count / total_enc * 100:.0f}% overall success rate. "
        )
        if zone_rates:
            summary += (
                f"Performance varies significantly across zones, "
                f"with '{strongest}' being the most reliable area."
            )
        else:
            summary += "More encounters per zone are needed for detailed analysis."

    return {
        "summary": summary,
        "strongest_area": strongest or "Insufficient data",
        "weakest_area": weakest or "Insufficient data",
        "most_interesting_finding": most_interesting or "Not enough data to identify surprising patterns yet",
    }


def _build_confidence(total_encounters: int) -> dict:
    """Score analysis confidence based on data volume."""
    if total_encounters < 5:
        score = 3
        reasoning = (
            f"Only {total_encounters} encounter{'s' if total_encounters != 1 else ''} available. "
            f"Patterns may be unreliable. Log more encounters for higher confidence."
        )
    elif total_encounters < 10:
        score = 5
        reasoning = (
            f"{total_encounters} encounters provide a baseline picture, "
            f"but more data would strengthen these patterns."
        )
    elif total_encounters < 20:
        score = 7
        reasoning = (
            f"{total_encounters} encounters give reasonable confidence in the "
            f"identified patterns, though edge cases may not be captured."
        )
    else:
        score = 8
        reasoning = (
            f"{total_encounters} encounters provide strong evidence for "
            f"the identified patterns and boundaries."
        )

    return {"score": score, "reasoning": reasoning}


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------

async def analyze_frontier_patterns(
    zones: list[dict],
    encounters: list[dict],
    model: str = None,
) -> dict:
    """Analyze frontier encounter patterns using statistical aggregation.

    Groups encounters by type and zone to identify clusters, detects capability
    boundaries where outcomes are mixed, validates zone reliability ratings
    against actual data, and suggests under-explored areas.

    Args:
        zones: List of zone dicts with name, category, reliability, confidence,
               strengths, weaknesses.
        encounters: List of encounter dicts with encounter_type, task_description,
                    outcome, expected_result, lessons, tags, zone_name.
        model: Unused (kept for API compatibility).

    Returns:
        Dict with pattern_clusters, capability_boundaries, zone_accuracy,
        exploration_suggestions, blind_spots, overall_insight, confidence.

    Raises:
        AnalyzerError: If analysis fails due to unexpected data issues.
    """
    try:
        # Pre-compute groupings
        encounters_by_type = _group_encounters_by_type(encounters)
        encounters_by_zone = _group_encounters_by_zone(encounters)
        zones_by_cat = _zones_by_category(zones)

        # Build each section
        pattern_clusters = _build_pattern_clusters(
            encounters, encounters_by_type, encounters_by_zone
        )
        capability_boundaries = _build_capability_boundaries(encounters_by_zone)
        zone_accuracy = _build_zone_accuracy(zones, encounters_by_zone)
        exploration_suggestions = _build_exploration_suggestions(
            zones, encounters_by_zone, zones_by_cat
        )
        blind_spots = _build_blind_spots(zones, encounters_by_zone)
        overall_insight = _build_overall_insight(zones, encounters, encounters_by_zone)
        confidence = _build_confidence(len(encounters))

        return {
            "pattern_clusters": pattern_clusters,
            "capability_boundaries": capability_boundaries,
            "zone_accuracy": zone_accuracy,
            "exploration_suggestions": exploration_suggestions,
            "blind_spots": blind_spots,
            "overall_insight": overall_insight,
            "confidence": confidence,
        }

    except AnalyzerError:
        raise
    except Exception as e:
        logger.error("Frontier pattern analysis failed: %s", str(e), exc_info=True)
        raise AnalyzerError(f"Analysis failed: {str(e)}")
