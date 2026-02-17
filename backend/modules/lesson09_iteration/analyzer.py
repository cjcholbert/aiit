"""Lesson 9: Rule-based iteration feedback quality analysis.

Evaluates whether iteration feedback is specific, actionable, and well-scoped
using regex and heuristic matching against five vague-feedback patterns:
no_specifics, no_action, no_reason, subjective, scope_creep.

No external AI dependency required.
"""
import logging
import re

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


# ---------------------------------------------------------------------------
# Pattern detection configuration
# ---------------------------------------------------------------------------

# Vague pronouns / references that signal lack of specifics
_VAGUE_REFS = re.compile(
    r'\b(this|it|that|these|those|stuff|things?|that thing|the thing)\b',
    re.IGNORECASE,
)

# Specific references that counterbalance vague pronouns
_SPECIFIC_REFS = re.compile(
    r'(?:'
    r'["\u201c\u201d\u2018\u2019].{3,}?["\u201c\u201d\u2018\u2019]'  # quoted text
    r'|line\s*\d+'                                                      # line numbers
    r'|paragraph\s*\d+'                                                 # paragraph refs
    r'|section\s*\d+'                                                   # section refs
    r'|header|title|subtitle|heading'                                   # element names
    r'|bullet\s*(?:point)?\s*\d*'                                       # bullet refs
    r'|row\s*\d+|column\s*\d+'                                          # table refs
    r'|the\s+(?:first|second|third|last|opening|closing)\s+\w+'         # ordinal refs
    r')',
    re.IGNORECASE,
)

# Imperative / action verbs that signal actionable feedback
_ACTION_VERBS = re.compile(
    r'\b(change|replace|add|remove|delete|move|rename|fix|update|rewrite|'
    r'insert|swap|cut|expand|shorten|simplify|clarify|restructure|reorganize|'
    r'merge|split|combine|drop|revise|rephrase|rework|adjust|modify|edit|'
    r'use|try|switch|convert|make\s+it\s+\w+)\b',
    re.IGNORECASE,
)

# Reasoning connectors that signal explained rationale
_REASON_CONNECTORS = re.compile(
    r'\b(because|since|so\s+that|in\s+order\s+to|the\s+reason|this\s+matters|'
    r'otherwise|this\s+will|this\s+helps|to\s+ensure|to\s+avoid|'
    r'to\s+improve|for\s+clarity|for\s+consistency|this\s+way|'
    r'as\s+a\s+result|the\s+goal\s+is|we\s+need|the\s+purpose)\b',
    re.IGNORECASE,
)

# Subjective phrases without standards
_SUBJECTIVE_PHRASES = re.compile(
    r"\b(don'?t\s+like|doesn'?t?\s+feel|feels?\s+weird|feels?\s+off|"
    r"not\s+great|not\s+good|meh|gross|ugly|yuck|ugh|bleh|"
    r"looks?\s+bad|looks?\s+wrong|sounds?\s+weird|sounds?\s+off|"
    r"doesn'?t?\s+look\s+right|i\s+hate|not\s+my\s+style|"
    r"doesn'?t?\s+vibe|no\s+good|sucks?|terrible|horrible|awful)\b",
    re.IGNORECASE,
)

# Standards / criteria references that counterbalance subjective language
_STANDARD_REFS = re.compile(
    r'\b(standard|requirement|spec|guideline|criteria|brand\s+guide|'
    r'style\s+guide|convention|best\s+practice|according\s+to|'
    r'per\s+the|as\s+defined|documentation|policy|rule)\b',
    re.IGNORECASE,
)

# Scope-expanding phrases
_SCOPE_PHRASES = re.compile(
    r'\b(also\b|while\s+you\'?re\s+at\s+it|another\s+thing|oh\s+and|'
    r'additionally|one\s+more\s+thing|btw|by\s+the\s+way|'
    r'on\s+a\s+separate\s+note|unrelated\s+but|side\s+note|'
    r'while\s+we\'?re\s+at\s+it|can\s+you\s+also|plus\s+also)\b',
    re.IGNORECASE,
)

# Pass focus keywords for alignment checking
_PASS_KEYWORDS = {
    "70": {
        "keywords": re.compile(
            r'\b(structure|flow|organization|outline|order|layout|'
            r'section|overall|big\s+picture|high.level|framework|'
            r'arrangement|sequence|progression|logic|architecture)\b',
            re.IGNORECASE,
        ),
        "label": "structure and flow",
    },
    "85": {
        "keywords": re.compile(
            r'\b(robust|edge\s+case|error|exception|corner\s+case|'
            r'missing|gap|incomplete|handle|cover|scenario|'
            r'what\s+if|fallback|validation|thorough|complete|'
            r'comprehensive|detail|specific|accuracy|correct)\b',
            re.IGNORECASE,
        ),
        "label": "robustness and edge cases",
    },
    "95": {
        "keywords": re.compile(
            r'\b(polish|wording|phrasing|tone|style|grammar|'
            r'spelling|typo|punctuation|formatting|spacing|'
            r'consistency|refinement|tweak|nuance|subtle|'
            r'word\s+choice|readability|smooth|clean|crisp)\b',
            re.IGNORECASE,
        ),
        "label": "polish and wording",
    },
}

# Coaching tips per dominant pattern
_COACHING_TIPS = {
    "no_specifics": (
        "Next time, quote the exact phrase or element you want changed "
        "so the AI knows precisely what to target."
    ),
    "no_action": (
        "Try starting your feedback with a verb: 'Replace X with Y', "
        "'Remove the second paragraph', or 'Add a transition sentence'."
    ),
    "no_reason": (
        "Add a quick 'because...' after your directive so the AI "
        "understands the intent and can make smarter choices."
    ),
    "subjective": (
        "Link your reaction to a concrete standard: instead of 'I don't "
        "like it', try 'This doesn't match our brand voice because...'."
    ),
    "scope_creep": (
        "Save new ideas for the next iteration pass. Staying focused on "
        "one concern at a time produces better results."
    ),
}

_DEFAULT_COACHING = (
    "Strong feedback is specific, actionable, and explains why. "
    "Keep building the habit of quoting exact text and stating your reasoning."
)


# ---------------------------------------------------------------------------
# Severity classification helpers
# ---------------------------------------------------------------------------

def _count_sentences(text: str) -> int:
    """Rough sentence count based on terminal punctuation."""
    parts = re.split(r'[.!?]+', text.strip())
    return max(1, sum(1 for p in parts if p.strip()))


def _severity_from_ratio(ratio: float) -> str:
    """Map a 0-1 ratio of problematic content to severity."""
    if ratio >= 0.6:
        return "severe"
    if ratio >= 0.3:
        return "moderate"
    return "mild"


def _severity_penalty(severity: str) -> int:
    """Score deduction per severity level."""
    return {"mild": 1, "moderate": 2, "severe": 3}.get(severity, 1)


# ---------------------------------------------------------------------------
# Individual pattern detectors
# ---------------------------------------------------------------------------

def _detect_no_specifics(text: str) -> dict | None:
    """Detect vague references without specific element names."""
    vague_matches = _VAGUE_REFS.findall(text)
    specific_matches = _SPECIFIC_REFS.findall(text)

    if not vague_matches:
        return None

    vague_count = len(vague_matches)
    specific_count = len(specific_matches)

    # Only flag if vague references dominate
    if specific_count >= vague_count:
        return None

    ratio = vague_count / max(1, vague_count + specific_count)
    if ratio < 0.5:
        return None

    # Find the most representative vague phrase for evidence
    evidence_phrase = vague_matches[0]
    # Try to get surrounding context
    match = re.search(
        r'(?:\S+\s+){0,3}\b' + re.escape(evidence_phrase) + r'\b(?:\s+\S+){0,3}',
        text,
        re.IGNORECASE,
    )
    evidence_text = match.group(0).strip() if match else evidence_phrase

    severity = _severity_from_ratio(ratio)
    return {
        "pattern": "no_specifics",
        "severity": severity,
        "evidence": f'"{evidence_text}" -- uses vague reference without pointing to a specific element',
        "fix": f'Replace "{evidence_phrase}" with the exact element name, a quoted phrase, or a line number',
    }


def _detect_no_action(text: str) -> dict | None:
    """Detect absence of imperative / action verbs."""
    action_matches = _ACTION_VERBS.findall(text)
    if action_matches:
        return None

    # Check for "make it better" style phrasing
    vague_action = re.search(
        r'\b(make\s+it\s+better|improve\s+it|do\s+something|'
        r'needs?\s+work|needs?\s+improvement|not\s+there\s+yet)\b',
        text,
        re.IGNORECASE,
    )

    sentence_count = _count_sentences(text)
    if sentence_count <= 1:
        severity = "severe"
    elif sentence_count <= 3:
        severity = "moderate"
    else:
        severity = "mild"

    evidence_text = vague_action.group(0) if vague_action else text[:80].strip()
    return {
        "pattern": "no_action",
        "severity": severity,
        "evidence": f'"{evidence_text}" -- no clear directive telling the AI what to change',
        "fix": 'Start with an action verb: "Change [X] to [Y]", "Remove [element]", or "Add [detail] to [location]"',
    }


def _detect_no_reason(text: str) -> dict | None:
    """Detect directives without reasoning connectors."""
    reason_matches = _REASON_CONNECTORS.findall(text)
    if reason_matches:
        return None

    # Only flag if there ARE action verbs (a directive exists but lacks reasoning)
    action_matches = _ACTION_VERBS.findall(text)
    if not action_matches:
        return None

    sentence_count = _count_sentences(text)
    # Short feedback is more likely to lack reasoning
    if sentence_count <= 1:
        severity = "moderate"
    else:
        severity = "mild"

    # Find the first directive for evidence
    first_action = re.search(
        r'(?:\S+\s+){0,2}\b(?:' + '|'.join(re.escape(a) for a in action_matches[:3]) + r')\b(?:\s+\S+){0,4}',
        text,
        re.IGNORECASE,
    )
    evidence_text = first_action.group(0).strip() if first_action else text[:80].strip()

    return {
        "pattern": "no_reason",
        "severity": severity,
        "evidence": f'"{evidence_text}" -- gives a directive without explaining why',
        "fix": f'Add "because [reason]" after your directive so the AI understands the intent',
    }


def _detect_subjective(text: str) -> dict | None:
    """Detect subjective reactions without standards references."""
    subj_matches = list(_SUBJECTIVE_PHRASES.finditer(text))
    if not subj_matches:
        return None

    standard_matches = _STANDARD_REFS.findall(text)
    if standard_matches:
        return None

    match = subj_matches[0]
    evidence_text = match.group(0)
    # Expand context
    start = max(0, match.start() - 20)
    end = min(len(text), match.end() + 20)
    context = text[start:end].strip()

    ratio = len(subj_matches) / max(1, _count_sentences(text))
    severity = _severity_from_ratio(min(ratio, 1.0))

    return {
        "pattern": "subjective",
        "severity": severity,
        "evidence": f'"{context}" -- subjective reaction without linking to a standard or requirement',
        "fix": f'Replace "{evidence_text}" with a reference to a specific standard, requirement, or measurable criterion',
    }


def _detect_scope_creep(text: str) -> dict | None:
    """Detect scope-expanding phrases."""
    scope_matches = list(_SCOPE_PHRASES.finditer(text))
    if not scope_matches:
        return None

    match = scope_matches[0]
    evidence_text = match.group(0)
    start = max(0, match.start() - 10)
    end = min(len(text), match.end() + 40)
    context = text[start:end].strip()

    count = len(scope_matches)
    if count >= 3:
        severity = "severe"
    elif count >= 2:
        severity = "moderate"
    else:
        severity = "mild"

    return {
        "pattern": "scope_creep",
        "severity": severity,
        "evidence": f'"{context}" -- introduces a new topic mid-iteration',
        "fix": "Save this for the next pass. Keep this iteration focused on the current concern.",
    }


# ---------------------------------------------------------------------------
# Improved version generator
# ---------------------------------------------------------------------------

def _generate_improved_version(text: str, patterns: list[dict]) -> str:
    """Apply fix templates to produce an improved version of the feedback."""
    improved = text

    pattern_set = {p["pattern"] for p in patterns}

    # Replace vague pronouns with placeholders
    if "no_specifics" in pattern_set:
        def _replace_vague(m):
            word = m.group(0)
            if word.lower() in ("this", "that", "it"):
                return f"[specific element, e.g. the {word}]"
            return f"[name the specific {word}]"

        # Only replace the first 2-3 vague refs to keep it readable
        count = 0
        max_replacements = 3

        def _limited_replace(m):
            nonlocal count
            # Skip if inside quotes
            start = m.start()
            before = improved[:start]
            if before.count('"') % 2 == 1 or before.count("'") % 2 == 1:
                return m.group(0)
            count += 1
            if count <= max_replacements:
                return _replace_vague(m)
            return m.group(0)

        improved = _VAGUE_REFS.sub(_limited_replace, improved)

    # Add reasoning placeholder after directives
    if "no_reason" in pattern_set:
        # Find sentences that have action verbs but no reasoning
        sentences = re.split(r'(?<=[.!?])\s+', improved)
        new_sentences = []
        added_reason = False
        for sentence in sentences:
            if not added_reason and _ACTION_VERBS.search(sentence) and not _REASON_CONNECTORS.search(sentence):
                sentence = sentence.rstrip('.!?') + " [because...]."
                added_reason = True
            new_sentences.append(sentence)
        improved = " ".join(new_sentences)

    # Remove scope-creep sections (mark them)
    if "scope_creep" in pattern_set:
        # Add a note about scope creep rather than deleting content
        if not improved.rstrip().endswith("]"):
            improved = improved.rstrip() + " [Save new topics for the next pass.]"

    return improved


# ---------------------------------------------------------------------------
# Strength detection
# ---------------------------------------------------------------------------

def _detect_strengths(text: str, patterns: list[dict]) -> list[str]:
    """Identify positive qualities in the feedback."""
    strengths = []
    pattern_set = {p["pattern"] for p in patterns}

    if "no_specifics" not in pattern_set and _SPECIFIC_REFS.findall(text):
        strengths.append("Points to specific elements rather than speaking in generalities")

    if "no_action" not in pattern_set and _ACTION_VERBS.findall(text):
        strengths.append("Uses clear action verbs that tell the AI exactly what to do")

    if "no_reason" not in pattern_set and _REASON_CONNECTORS.findall(text):
        strengths.append("Explains the reasoning behind requested changes")

    if "subjective" not in pattern_set:
        if _STANDARD_REFS.findall(text):
            strengths.append("References concrete standards or requirements")

    if "scope_creep" not in pattern_set:
        strengths.append("Stays focused on the current iteration scope")

    # If feedback is reasonably long and detailed
    word_count = len(text.split())
    if word_count >= 30:
        strengths.append("Provides sufficient detail for the AI to act on")

    if not strengths:
        strengths.append("Attempts to communicate a clear intent")

    return strengths[:4]  # Cap at 4 strengths


# ---------------------------------------------------------------------------
# Pass alignment check
# ---------------------------------------------------------------------------

def _check_pass_alignment(text: str, pass_label: str, pass_focus: str) -> dict:
    """Check if feedback aligns with the expected focus for this pass stage."""
    # Extract the percentage from pass_label (e.g. "70%" -> "70")
    pct_match = re.search(r'(\d+)', pass_label)
    pct_key = pct_match.group(1) if pct_match else None

    pass_config = _PASS_KEYWORDS.get(pct_key)
    if pass_config is None:
        # Unknown pass stage, assume aligned
        return {
            "aligned": True,
            "observation": (
                f"Feedback addresses '{pass_focus}' concerns. "
                f"Continue focusing on what matters most at this stage."
            ),
        }

    keyword_matches = pass_config["keywords"].findall(text)
    expected_label = pass_config["label"]

    if keyword_matches:
        return {
            "aligned": True,
            "observation": (
                f"Good alignment with the {pass_label} pass. "
                f"Your feedback addresses {expected_label} "
                f"({', '.join(set(keyword_matches[:3]))})."
            ),
        }

    # Check if feedback mentions concepts from OTHER passes
    other_pass_matches = {}
    for key, cfg in _PASS_KEYWORDS.items():
        if key == pct_key:
            continue
        matches = cfg["keywords"].findall(text)
        if matches:
            other_pass_matches[key] = (cfg["label"], matches)

    if other_pass_matches:
        other_key = next(iter(other_pass_matches))
        other_label, other_kw = other_pass_matches[other_key]
        return {
            "aligned": False,
            "observation": (
                f"Your feedback seems focused on {other_label} "
                f"({', '.join(set(other_kw[:3]))}), but the {pass_label} pass "
                f"should focus on {expected_label}. Save detailed {other_label} "
                f"feedback for a later pass."
            ),
        }

    return {
        "aligned": True,
        "observation": (
            f"Feedback appears relevant to the {pass_label} pass ({expected_label}). "
            f"For even stronger alignment, use vocabulary that directly "
            f"addresses {expected_label} concerns."
        ),
    }


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------

async def analyze_feedback_quality(
    task_name: str,
    target_outcome: str,
    pass_label: str,
    pass_focus: str,
    feedback_text: str,
    key_question_answer: str,
    model: str = None,
) -> dict:
    """Analyze iteration feedback quality using rule-based pattern detection.

    Evaluates feedback against five vague-feedback patterns (no_specifics,
    no_action, no_reason, subjective, scope_creep) using regex and heuristic
    matching. Produces a quality score, detected patterns with evidence,
    pass alignment assessment, strengths, an improved version, and a coaching tip.

    Args:
        task_name: Name of the iteration task.
        target_outcome: What "done" looks like for this task.
        pass_label: Current pass label (70%, 85%, 95%).
        pass_focus: Focus area for this pass.
        feedback_text: The iteration feedback the user wrote.
        key_question_answer: User's answer to the pass key question.
        model: Unused (kept for API compatibility).

    Returns:
        Dict with quality_score, patterns_detected, pass_alignment,
        strengths, improved_version, coaching_tip.

    Raises:
        AnalyzerError: If feedback_text is empty or analysis fails.
    """
    if not feedback_text or not feedback_text.strip():
        raise AnalyzerError("Feedback text is empty. Please provide feedback to analyze.")

    text = feedback_text.strip()

    try:
        # Run all pattern detectors
        detectors = [
            _detect_no_specifics,
            _detect_no_action,
            _detect_no_reason,
            _detect_subjective,
            _detect_scope_creep,
        ]

        patterns_detected = []
        for detector in detectors:
            result = detector(text)
            if result is not None:
                patterns_detected.append(result)

        # Calculate quality score: start at 10, subtract per pattern
        score = 10
        for pattern in patterns_detected:
            score -= _severity_penalty(pattern["severity"])
        score = max(1, min(10, score))

        # Check pass alignment
        pass_alignment = _check_pass_alignment(text, pass_label, pass_focus)

        # Detect strengths
        strengths = _detect_strengths(text, patterns_detected)

        # Generate improved version
        improved_version = _generate_improved_version(text, patterns_detected)

        # Select coaching tip based on most severe pattern
        coaching_tip = _DEFAULT_COACHING
        if patterns_detected:
            # Sort by severity (severe > moderate > mild) and pick the worst
            severity_order = {"severe": 0, "moderate": 1, "mild": 2}
            worst = sorted(
                patterns_detected,
                key=lambda p: severity_order.get(p["severity"], 3),
            )[0]
            coaching_tip = _COACHING_TIPS.get(worst["pattern"], _DEFAULT_COACHING)

        return {
            "quality_score": score,
            "patterns_detected": patterns_detected,
            "pass_alignment": pass_alignment,
            "strengths": strengths,
            "improved_version": improved_version,
            "coaching_tip": coaching_tip,
        }

    except AnalyzerError:
        raise
    except Exception as e:
        logger.error("Feedback analysis failed: %s", str(e), exc_info=True)
        raise AnalyzerError(f"Analysis failed: {str(e)}")
