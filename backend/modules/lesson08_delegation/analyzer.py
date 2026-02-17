"""Lesson 8: Rule-based delegation output analysis.

Parses AI conversation output using regex-based extraction and evaluates it
against user-defined success criteria using keyword matching. No external AI
service is required -- all logic is deterministic and runs locally.
"""
import logging
import re

from .schemas import CriterionResult, DelegationReview

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


# =============================================================================
# Conversation Marker Constants
# =============================================================================

# Markers that indicate a user/human turn
_USER_MARKERS = {"user", "you", "human", "me"}

# Markers that indicate an assistant/AI turn
_ASSISTANT_MARKERS = {"assistant", "claude", "chatgpt", "ai", "bot"}

# All recognised conversation role markers (union of both sets)
_ALL_MARKERS = _USER_MARKERS | _ASSISTANT_MARKERS

# Regex that splits on lines starting with a conversation marker followed by ':'
_MARKER_PATTERN = re.compile(
    r"^(" + "|".join(re.escape(m) for m in sorted(_ALL_MARKERS)) + r")\s*:",
    re.IGNORECASE | re.MULTILINE,
)


# =============================================================================
# Transcript Parsing
# =============================================================================

async def parse_delegation_output(raw_text: str, model: str = None) -> str:
    """Parse and extract AI output from a pasted conversation or raw output.

    Uses regex-based conversation marker detection:
    1. If no conversation markers found and text is long enough, return as-is.
    2. Otherwise split by markers, identify assistant turns, and return the
       last/longest assistant response.

    Args:
        raw_text: The raw pasted text (conversation transcript or clean output).
        model: Unused -- kept for API compatibility.

    Returns:
        The extracted AI output string.
    """
    if not raw_text or not raw_text.strip():
        return ""

    # Quick check: are there any conversation markers at all?
    conversation_markers = ["User:", "Assistant:", "Claude:", "ChatGPT:", "You:", "Human:"]
    has_markers = any(marker.lower() in raw_text.lower() for marker in conversation_markers)

    if not has_markers and len(raw_text.strip()) > 50:
        # Likely already clean output
        return raw_text.strip()

    # --- Rule-based extraction when markers are present ---

    # Split text into (marker, content) segments
    segments = _split_by_markers(raw_text)

    if not segments:
        # Could not parse any segments; return the whole text stripped
        return raw_text.strip()

    # Collect assistant responses
    assistant_segments: list[str] = []
    for role, content in segments:
        if role.lower() in _ASSISTANT_MARKERS:
            cleaned = content.strip()
            if cleaned:
                assistant_segments.append(cleaned)

    if not assistant_segments:
        # No identifiable assistant segments; return full text
        logger.info("No assistant segments found in transcript; returning full text")
        return raw_text.strip()

    # Prefer the last assistant response; fall back to the longest if the last
    # one is very short (< 30 chars, likely just an acknowledgement)
    last_response = assistant_segments[-1]
    longest_response = max(assistant_segments, key=len)

    if len(last_response) >= 30 or last_response == longest_response:
        extracted = last_response
    else:
        extracted = longest_response

    logger.info("Extracted AI output: %d -> %d chars", len(raw_text), len(extracted))
    return extracted


def _split_by_markers(text: str) -> list[tuple[str, str]]:
    """Split a transcript into (role, content) pairs using conversation markers.

    Returns:
        List of (role_string, content_text) tuples. role_string is the
        normalised marker label (e.g. "assistant", "user").
    """
    # Find all marker positions
    matches = list(_MARKER_PATTERN.finditer(text))

    if not matches:
        return []

    segments: list[tuple[str, str]] = []

    for idx, match in enumerate(matches):
        role = match.group(1).lower()
        start = match.end()
        # Content runs until the next marker or end of text
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        content = text[start:end]
        segments.append((role, content))

    return segments


# =============================================================================
# Success Criteria Extraction (already rule-based -- kept unchanged)
# =============================================================================

def extract_success_criteria(template: str) -> list[str]:
    """Parse the "Success Criteria" section from a delegation template.

    Looks for markdown-style lists under a Success Criteria header.
    Returns a list of individual criterion strings.
    """
    if not template:
        return []

    criteria = []

    # Find Success Criteria section
    # Match headers like: ## Success Criteria, ### Success Criteria, **Success Criteria**
    header_patterns = [
        r'##\s*Success\s*Criteria[:\s]*\n',
        r'###\s*Success\s*Criteria[:\s]*\n',
        r'\*\*Success\s*Criteria\*\*[:\s]*\n',
        r'Success\s*Criteria[:\s]*\n'
    ]

    section_start = -1
    for pattern in header_patterns:
        match = re.search(pattern, template, re.IGNORECASE)
        if match:
            section_start = match.end()
            break

    if section_start == -1:
        return []

    # Find next section (next ## header or end of text)
    next_section = re.search(r'\n##\s+\w', template[section_start:])
    section_end = section_start + next_section.start() if next_section else len(template)

    section_text = template[section_start:section_end]

    # Extract list items
    # Match: - [ ] item, - item, * item, 1. item, bullet item
    list_patterns = [
        r'^\s*[-*\u2022]\s*\[[ x]\]\s*(.+)$',  # - [ ] or - [x] checkbox
        r'^\s*[-*\u2022]\s+(.+)$',              # - item or * item
        r'^\s*\d+\.\s+(.+)$',              # 1. item
    ]

    for line in section_text.split('\n'):
        line = line.strip()
        if not line:
            continue

        for pattern in list_patterns:
            match = re.match(pattern, line)
            if match:
                criterion = match.group(1).strip()
                if criterion and len(criterion) > 3:  # Skip very short items
                    criteria.append(criterion)
                break

    return criteria


# =============================================================================
# Keyword-Based Review Against Criteria
# =============================================================================

def _extract_key_terms(text: str) -> list[str]:
    """Extract meaningful terms (length > 3) from a text string.

    Strips common stop words and returns lowercased terms.
    """
    stop_words = {
        "the", "and", "for", "are", "but", "not", "you", "all", "can",
        "had", "her", "was", "one", "our", "out", "has", "have", "been",
        "from", "this", "that", "with", "they", "will", "each", "make",
        "like", "just", "over", "such", "than", "them", "very", "when",
        "what", "your", "into", "also", "more", "some", "then", "does",
        "should", "would", "could", "about", "which", "their", "there",
        "these", "those", "being", "other", "where", "after", "before",
    }
    # Tokenise: split on non-alphanumeric chars, keep words > 3 chars
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    return [w for w in words if w not in stop_words]


def _compute_keyword_overlap(criterion_terms: list[str], output_lower: str) -> float:
    """Return the fraction of criterion terms found in the output text.

    Args:
        criterion_terms: Key terms extracted from a criterion.
        output_lower: The lowercased output text to search in.

    Returns:
        Float between 0.0 and 1.0 representing the overlap ratio.
    """
    if not criterion_terms:
        return 0.0
    found = sum(1 for term in criterion_terms if term in output_lower)
    return found / len(criterion_terms)


async def review_against_criteria(
    output: str,
    expected_output: str,
    success_criteria: list[str],
    task_title: str = "",
    task_description: str = "",
    model: str = None,
) -> DelegationReview:
    """Evaluate output against success criteria using keyword matching.

    For each criterion:
        - Extract key terms from the criterion text.
        - Check what percentage of those terms appear in the output.
        - >= 40% overlap -> passed, confidence proportional to overlap.

    Args:
        output: The extracted AI output to evaluate.
        expected_output: Description of expected output (used as fallback criterion).
        success_criteria: List of criterion strings.
        task_title: Title of the task (informational).
        task_description: Description of the task (informational).
        model: Unused -- kept for API compatibility.

    Returns:
        DelegationReview with per-criterion results.
    """
    output_lower = output.lower()
    criteria_results: list[CriterionResult] = []

    # If no explicit criteria, synthesise one from expected_output
    effective_criteria = list(success_criteria) if success_criteria else []
    if not effective_criteria and expected_output:
        effective_criteria = [f"Output matches expected: {expected_output}"]

    if not effective_criteria:
        # Nothing to evaluate against -- pass with a note
        return DelegationReview(
            overall_pass=True,
            criteria_results=[],
            summary="No success criteria provided. Output accepted as-is.",
            suggestions=["Define explicit success criteria for more rigorous evaluation."],
            ai_extracted_output=output,
        )

    pass_threshold = 0.40

    for criterion_text in effective_criteria:
        terms = _extract_key_terms(criterion_text)

        if not terms:
            # If no meaningful terms could be extracted, do a simple substring check
            criterion_words = criterion_text.lower().split()
            short_terms = [w for w in criterion_words if len(w) > 2]
            if short_terms:
                overlap = sum(1 for t in short_terms if t in output_lower) / len(short_terms)
            else:
                overlap = 0.0
            terms_for_reporting = short_terms
        else:
            overlap = _compute_keyword_overlap(terms, output_lower)
            terms_for_reporting = terms

        passed = overlap >= pass_threshold
        # Confidence scales linearly with overlap, capped at 0.95
        confidence = round(min(overlap, 0.95), 2)

        if passed:
            found_count = sum(1 for t in terms_for_reporting if t in output_lower)
            reasoning = (
                f"Found {found_count} of {len(terms_for_reporting)} key terms "
                f"from criterion in output ({overlap:.0%} match)."
            )
        else:
            missing = [t for t in terms_for_reporting if t not in output_lower]
            # Show at most 5 missing terms to keep the message readable
            displayed_missing = missing[:5]
            extra = f" (and {len(missing) - 5} more)" if len(missing) > 5 else ""
            reasoning = (
                f"Missing key terms: {', '.join(displayed_missing)}{extra}. "
                f"Only {overlap:.0%} keyword overlap (threshold: {pass_threshold:.0%})."
            )

        criteria_results.append(CriterionResult(
            criterion=criterion_text,
            passed=passed,
            reasoning=reasoning,
            confidence=confidence,
        ))

    # Aggregate results
    passed_count = sum(1 for cr in criteria_results if cr.passed)
    total_count = len(criteria_results)
    overall_pass = passed_count == total_count

    if overall_pass:
        summary = f"All {total_count} criteria met."
    else:
        failed_count = total_count - passed_count
        summary = (
            f"{passed_count} of {total_count} criteria met. "
            f"{failed_count} criterion{'s' if failed_count != 1 else ''} "
            f"not satisfied."
        )

    # Build suggestions from failed criteria
    suggestions: list[str] = []
    for cr in criteria_results:
        if not cr.passed:
            suggestions.append(f"Ensure the output addresses: {cr.criterion}")

    return DelegationReview(
        overall_pass=overall_pass,
        criteria_results=criteria_results,
        summary=summary,
        suggestions=suggestions,
        ai_extracted_output=output,
    )


# =============================================================================
# Full Analysis Pipeline
# =============================================================================

async def analyze_delegation_output(
    raw_output: str,
    template: str,
    expected_output: str,
    task_title: str = "",
    task_description: str = "",
    task_success_criteria: list[str] = None,
    model: str = None,
) -> DelegationReview:
    """Full analysis pipeline:
    1. Parse/extract AI output from raw text
    2. Extract success criteria from template (or use task-level overrides)
    3. Review output against criteria

    Args:
        raw_output: Pasted conversation or AI output.
        template: Delegation template text (for extracting criteria).
        expected_output: What the task expected to receive.
        task_title: Title of the task being reviewed.
        task_description: Description of the task.
        task_success_criteria: Optional task-level criteria override.
        model: Unused -- kept for API compatibility.

    Returns:
        DelegationReview with structured assessment.
    """
    # Step 1: Parse/extract the AI output
    extracted_output = await parse_delegation_output(raw_output, model)

    if not extracted_output:
        raise AnalyzerError("Could not extract AI output from the provided text")

    # Step 2: Get success criteria (task-level overrides template-level)
    if task_success_criteria:
        criteria = task_success_criteria
    else:
        criteria = extract_success_criteria(template)

    # Step 3: Review against criteria
    review = await review_against_criteria(
        output=extracted_output,
        expected_output=expected_output,
        success_criteria=criteria,
        task_title=task_title,
        task_description=task_description,
        model=model,
    )

    return review
