"""Lesson 1: Rule-based conversation context analysis.

Normalizes messy conversation transcripts and analyzes them for context
assembly patterns -- what context was provided upfront, what was added later,
what assumptions went wrong, and coaching for improvement.

No external AI dependency -- all analysis is performed via regex-based
normalization and context-element checklist heuristics.
"""
import logging
import re

from .schemas import (
    Analysis,
    ParsedTranscript,
    ContextProvided,
    ContextAddedLater,
    AssumptionsWrong,
    Pattern,
    Coaching,
    Confidence,
)

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


# ---------------------------------------------------------------------------
# Timestamp patterns to strip
# ---------------------------------------------------------------------------

_TIMESTAMP_PATTERNS = [
    # [12:34], [12:34:56]
    re.compile(r'\[\d{1,2}:\d{2}(?::\d{2})?\]'),
    # 12:34 AM/PM
    re.compile(r'\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b'),
    # 2024-01-15 12:34:56 or 2024-01-15T12:34:56
    re.compile(r'\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}\b'),
    # Standalone timestamps like 12:34 at line start
    re.compile(r'^\d{1,2}:\d{2}(?::\d{2})?\s', re.MULTILINE),
]

# ---------------------------------------------------------------------------
# Role label normalisation maps
# ---------------------------------------------------------------------------

_USER_LABELS = re.compile(
    r'^(?:Me|You|Person|Customer|Client|Human|User)\s*:\s*',
    re.IGNORECASE | re.MULTILINE,
)
_ASSISTANT_LABELS = re.compile(
    r'^(?:Claude|ChatGPT|GPT|AI|Bot|Copilot|Gemini|Assistant)\s*:\s*',
    re.IGNORECASE | re.MULTILINE,
)

# UI artifacts to remove
_UI_ARTIFACTS = re.compile(
    r'\b(?:Copy|Share|Regenerate|Edit|Retry|Like|Dislike|Thumbs up|Thumbs down)\b',
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Context element checkers (applied to text)
# ---------------------------------------------------------------------------

CONTEXT_ELEMENTS: dict[str, list[re.Pattern]] = {
    "role_statement": [
        re.compile(r'\bi\s+am\s+a\b', re.IGNORECASE),
        re.compile(r'\bas\s+a\b', re.IGNORECASE),
        re.compile(r"\bi'm\s+the\b", re.IGNORECASE),
        re.compile(r'\bmy\s+role\b', re.IGNORECASE),
        re.compile(r'\bi\s+work\s+as\b', re.IGNORECASE),
    ],
    "background": [
        re.compile(r'\bbackground\s*:', re.IGNORECASE),
        re.compile(r'\bcontext\s*:', re.IGNORECASE),
        re.compile(r'\bworking\s+on\b', re.IGNORECASE),
        re.compile(r'\bproject\s+is\b', re.IGNORECASE),
        re.compile(r'\bcurrently\b', re.IGNORECASE),
    ],
    "constraints": [
        re.compile(r'\bmust\b', re.IGNORECASE),
        re.compile(r'\bcannot\b', re.IGNORECASE),
        re.compile(r'\blimit\b', re.IGNORECASE),
        re.compile(r'\bwithin\b', re.IGNORECASE),
        re.compile(r'\bdeadline\b', re.IGNORECASE),
        re.compile(r'\bbudget\b', re.IGNORECASE),
    ],
    "format": [
        re.compile(r'\bformat\s*:', re.IGNORECASE),
        re.compile(r'\bstructured\s+as\b', re.IGNORECASE),
        re.compile(r'\bin\s+the\s+form\s+of\b', re.IGNORECASE),
        re.compile(r'\bas\s+a\s+list\b', re.IGNORECASE),
        re.compile(r'\bas\s+a\s+table\b', re.IGNORECASE),
        re.compile(r'\bmarkdown\b', re.IGNORECASE),
        re.compile(r'\bjson\b', re.IGNORECASE),
        re.compile(r'\bcsv\b', re.IGNORECASE),
    ],
    "examples": [
        re.compile(r'\bfor\s+example\b', re.IGNORECASE),
        re.compile(r'\blike\s+this\b', re.IGNORECASE),
        re.compile(r'\be\.g\.\b', re.IGNORECASE),
        re.compile(r'\bsuch\s+as\b', re.IGNORECASE),
        re.compile(r'\bhere\s+is\s+an?\s+example\b', re.IGNORECASE),
    ],
    "audience": [
        re.compile(r'\bfor\s+my\b', re.IGNORECASE),
        re.compile(r'\breader\b', re.IGNORECASE),
        re.compile(r'\baudience\b', re.IGNORECASE),
        re.compile(r'\bstakeholder\b', re.IGNORECASE),
        re.compile(r'\bboss\b', re.IGNORECASE),
        re.compile(r'\bteam\b', re.IGNORECASE),
        re.compile(r'\bmanager\b', re.IGNORECASE),
    ],
    "success_criteria": [
        re.compile(r'\bsuccess\s+means\b', re.IGNORECASE),
        re.compile(r'\bgood\s+output\b', re.IGNORECASE),
        re.compile(r'\bi\s+need\s+it\s+to\b', re.IGNORECASE),
        re.compile(r'\bshould\s+be\b', re.IGNORECASE),
        re.compile(r'\bgoal\s+is\b', re.IGNORECASE),
    ],
    "prior_attempts": [
        re.compile(r'\bi\s+tried\b', re.IGNORECASE),
        re.compile(r'\bpreviously\b', re.IGNORECASE),
        re.compile(r'\balready\b', re.IGNORECASE),
        re.compile(r'\bbefore\s+this\b', re.IGNORECASE),
        re.compile(r'\blast\s+time\b', re.IGNORECASE),
    ],
}

ELEMENT_LABELS: dict[str, str] = {
    "role_statement": "Role/position statement",
    "background": "Background/project context",
    "constraints": "Constraints or limitations",
    "format": "Desired output format",
    "examples": "Examples or illustrations",
    "audience": "Target audience",
    "success_criteria": "Success criteria",
    "prior_attempts": "Prior attempts or existing work",
}

ELEMENT_HABITS: dict[str, str] = {
    "role_statement": "Start prompts with your role and perspective to ground the AI's response.",
    "background": "Provide project context upfront -- what you're working on and why.",
    "constraints": "State constraints early: deadlines, technical limits, budget, scope boundaries.",
    "format": "Specify the output format you need (list, table, prose, code, etc.).",
    "examples": "Include a brief example of what good output looks like.",
    "audience": "Always specify who will use or read the output.",
    "success_criteria": "Define what 'done' looks like before asking for output.",
    "prior_attempts": "Mention what you've already tried so the AI doesn't repeat failed approaches.",
}

# Signals that context was added in later turns
_LATER_CONTEXT_SIGNALS = [
    re.compile(r'\bactually\b', re.IGNORECASE),
    re.compile(r'\bi\s+forgot\s+to\s+mention\b', re.IGNORECASE),
    re.compile(r'\bi\s+should\s+have\s+said\b', re.IGNORECASE),
    re.compile(r'\blet\s+me\s+clarify\b', re.IGNORECASE),
    re.compile(r'\bto\s+be\s+clear\b', re.IGNORECASE),
    re.compile(r'\bsorry,?\s+i\s+meant\b', re.IGNORECASE),
    re.compile(r'\bone\s+more\s+thing\b', re.IGNORECASE),
    re.compile(r'\balso\s*,?\s*(?:i|we|the)\b', re.IGNORECASE),
    re.compile(r'\bwait\b', re.IGNORECASE),
    re.compile(r'\boh\s*,', re.IGNORECASE),
    re.compile(r'\bcorrection\b', re.IGNORECASE),
]

# Signals that the assistant made assumptions (in assistant turns)
_ASSUMPTION_SIGNALS = [
    re.compile(r"\bi'(?:ll|m)\s+assum", re.IGNORECASE),
    re.compile(r'\bassuming\b', re.IGNORECASE),
    re.compile(r'\bdo\s+you\s+mean\b', re.IGNORECASE),
    re.compile(r'\bcould\s+you\s+clarify\b', re.IGNORECASE),
    re.compile(r'\bby\s+default\b', re.IGNORECASE),
    re.compile(r'\bunless\s+you\b', re.IGNORECASE),
    re.compile(r'\bdo\s+you\s+want\b', re.IGNORECASE),
    re.compile(r'\bdid\s+you\s+mean\b', re.IGNORECASE),
]


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _check_elements(text: str) -> dict[str, bool]:
    """Check which context elements are present in *text*."""
    result: dict[str, bool] = {}
    for element, patterns in CONTEXT_ELEMENTS.items():
        result[element] = any(p.search(text) for p in patterns)
    return result


def _extract_topic(first_user_message: str) -> str:
    """Generate a topic from the first user message (5-7 meaningful words)."""
    # Strip common prompt prefixes
    cleaned = re.sub(r'^(?:hey|hi|hello|can you|could you|please|i need you to)\s+', '', first_user_message.strip(), flags=re.IGNORECASE)
    words = cleaned.split()
    # Take first 7 meaningful words (skip very short words except key ones)
    meaningful = []
    for w in words:
        if len(w) <= 1 and w.lower() not in ("i", "a"):
            continue
        meaningful.append(w)
        if len(meaningful) >= 7:
            break
    topic = " ".join(meaningful)
    # Clean trailing punctuation
    topic = topic.rstrip(".,;:!?")
    if not topic:
        topic = "Conversation analysis"
    return topic


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def normalize_transcript(raw_text: str, model: str = None) -> str:
    """Normalize a messy conversation into a standard User:/Assistant: format.

    Uses regex-based cleaning -- no AI dependency.

    Args:
        raw_text: Raw pasted conversation text.
        model: Ignored (kept for API compatibility).

    Returns:
        Cleaned transcript string with standardized role labels.

    Raises:
        AnalyzerError: If normalization fails.
    """
    if not raw_text or not raw_text.strip():
        raise AnalyzerError("Empty transcript provided.")

    try:
        text = raw_text

        # 1. Strip timestamps
        for pattern in _TIMESTAMP_PATTERNS:
            text = pattern.sub('', text)

        # 2. Normalize role labels
        text = _USER_LABELS.sub('User: ', text)
        text = _ASSISTANT_LABELS.sub('Assistant: ', text)

        # 3. Remove UI artifacts
        text = _UI_ARTIFACTS.sub('', text)

        # 4. Clean up formatting: collapse multiple blank lines, strip trailing spaces
        text = re.sub(r'[ \t]+$', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()

        logger.info("Normalized transcript: %d -> %d chars", len(raw_text), len(text))
        return text

    except AnalyzerError:
        raise
    except Exception as exc:
        logger.error("Transcript normalization failed: %s", exc, exc_info=True)
        raise AnalyzerError(f"Normalization failed: {exc}") from exc


async def analyze_transcript(
    transcript: ParsedTranscript,
    model: str = None,
) -> Analysis:
    """Analyze a parsed transcript for context assembly patterns.

    Uses a context-element checklist approach -- no AI dependency.

    Args:
        transcript: ParsedTranscript with turns.
        model: Ignored (kept for API compatibility).

    Returns:
        Analysis Pydantic object matching the expected schema.

    Raises:
        AnalyzerError: If analysis fails.
    """
    if not transcript.turns:
        raise AnalyzerError("Transcript has no turns to analyze.")

    try:
        # Separate user and assistant turns
        user_turns = [t for t in transcript.turns if t.role == "user"]
        assistant_turns = [t for t in transcript.turns if t.role == "assistant"]

        if not user_turns:
            raise AnalyzerError("Transcript contains no user messages.")

        first_user_msg = user_turns[0].content
        later_user_msgs = [t.content for t in user_turns[1:]]
        all_assistant_text = " ".join(t.content for t in assistant_turns)

        # ----- Topic -----
        topic = _extract_topic(first_user_msg)

        # ----- Context elements in FIRST message -----
        first_elements = _check_elements(first_user_msg)
        present_elements = [e for e, found in first_elements.items() if found]
        missing_elements = [e for e, found in first_elements.items() if not found]

        # Build context_provided
        if present_elements:
            details = "First message includes: " + ", ".join(
                ELEMENT_LABELS[e] for e in present_elements
            ) + "."
            what_worked = "Good use of: " + ", ".join(
                ELEMENT_LABELS[e] for e in present_elements[:3]
            ) + "."
        else:
            details = "First message provides minimal structured context."
            what_worked = "Minimal context provided."

        context_provided = ContextProvided(
            details=details,
            what_worked=what_worked,
        )

        # ----- Context added later -----
        later_elements_found: list[str] = []
        trigger_phrases: list[str] = []

        for msg in later_user_msgs:
            later_check = _check_elements(msg)
            for element, found in later_check.items():
                if found and element in missing_elements:
                    later_elements_found.append(ELEMENT_LABELS[element])

            # Check for correction/clarification signals
            for signal in _LATER_CONTEXT_SIGNALS:
                match = signal.search(msg)
                if match:
                    # Extract a short snippet around the match
                    start = max(0, match.start() - 10)
                    end = min(len(msg), match.end() + 40)
                    snippet = msg[start:end].strip()
                    trigger_phrases.append(f'"{snippet}"')

        if later_elements_found:
            later_details = "Added later: " + ", ".join(set(later_elements_found)) + "."
            could_upfront = True
        elif trigger_phrases:
            later_details = "Clarifications were provided in follow-up messages."
            could_upfront = True
        elif missing_elements:
            # Context was missing and never added — that's a gap, not "none needed"
            missing_labels = [ELEMENT_LABELS[e] for e in missing_elements[:4]]
            later_details = (
                "Missing context was never provided: "
                + ", ".join(missing_labels)
                + ". These gaps persisted through the entire conversation."
            )
            could_upfront = True
        else:
            later_details = "Context was thorough from the start — nothing needed to be added."
            could_upfront = False

        if trigger_phrases:
            triggers_text = ", ".join(trigger_phrases[:3])
        elif missing_elements and not later_elements_found:
            triggers_text = "No corrections were made because the missing context was never addressed."
        else:
            triggers_text = "No correction signals detected — context was adequate from the start."

        context_added_later = ContextAddedLater(
            details=later_details,
            triggers=triggers_text,
            could_have_been_upfront=could_upfront,
        )

        # ----- Assumptions wrong -----
        assumption_phrases: list[str] = []
        for t in assistant_turns:
            for signal in _ASSUMPTION_SIGNALS:
                match = signal.search(t.content)
                if match:
                    start = max(0, match.start() - 5)
                    end = min(len(t.content), match.end() + 50)
                    assumption_phrases.append(t.content[start:end].strip())

        # Infer implicit assumptions: if the user omitted key context elements
        # but the assistant produced a substantive response, the assistant had
        # to silently fill in gaps — those are implicit assumptions even when
        # the assistant doesn't flag them with phrases like "I'm assuming".
        implicit_gaps: list[str] = []
        assistant_responded = len(all_assistant_text.strip()) > 50
        if assistant_responded and not assumption_phrases:
            for element in missing_elements:
                implicit_gaps.append(ELEMENT_LABELS[element])

        if assumption_phrases:
            wrong_details = "Assistant made explicit assumptions: " + "; ".join(
                f'"{p}"' for p in assumption_phrases[:3]
            ) + "."
            why_assumed = (
                "Common defaults for this type of request, combined with "
                "missing context in the initial prompt."
            )
            user_contributed = (
                "The user's initial message lacked "
                + ", ".join(ELEMENT_LABELS[e] for e in missing_elements[:3])
                + ", which left room for assumptions."
            ) if missing_elements else "User provided sufficient context; assumptions were minor."
        elif implicit_gaps:
            wrong_details = (
                "The assistant had to silently fill in gaps for: "
                + ", ".join(implicit_gaps[:4])
                + ". These are implicit assumptions — the AI proceeded without "
                "asking, which means it guessed."
            )
            why_assumed = (
                "The initial prompt didn't specify these elements, so the AI "
                "used generic defaults rather than asking for clarification."
            )
            user_contributed = (
                "The user's message omitted "
                + ", ".join(implicit_gaps[:3])
                + ", leaving the AI to guess. Providing these upfront would "
                "have eliminated the need for assumptions."
            )
        else:
            wrong_details = "None — context was sufficient and no assumptions were needed."
            why_assumed = "No assumptions required."
            user_contributed = "N/A"

        assumptions_wrong = AssumptionsWrong(
            details=wrong_details,
            why_assumed=why_assumed,
            user_contributed=user_contributed,
        )

        # ----- Pattern classification -----
        present_count = len(present_elements)
        first_msg_len = len(first_user_msg.strip())
        has_later_detail = bool(later_elements_found) or bool(trigger_phrases)

        if present_count >= 5:
            category = "Well-scoped request"
            insight = "Strong initial context set the conversation up for success."
        elif present_count <= 1 and first_msg_len < 100:
            if has_later_detail:
                category = "Two-stage request (concept then implementation)"
                insight = "Started with a broad idea, then added specifics in follow-up messages."
            else:
                category = "Vague/incomplete request"
                insight = "The request lacked enough detail for the AI to respond accurately on the first try."
        elif "audience" not in present_elements and "audience" in [e for e in missing_elements]:
            category = "Audience/management context gap"
            insight = "Missing information about who will consume or act on the output."
        elif ("constraints" not in present_elements or "format" not in present_elements):
            category = "Technical environment gap"
            insight = "Missing technical constraints or format specifications led to generic output."
        elif has_later_detail:
            category = "Scope clarification needed"
            insight = "Initial scope was unclear, requiring follow-up clarifications."
        else:
            category = "Scope clarification needed"
            insight = "Some context was present but key elements were missing from the first message."

        pattern = Pattern(category=category, insight=insight)

        # ----- Coaching -----
        if missing_elements:
            context_help = "Include upfront: " + ", ".join(
                ELEMENT_LABELS[e] for e in missing_elements[:4]
            ) + "."
        else:
            context_help = "Context was comprehensive. Consider adding examples for even better results."

        # Prompt rewrite: take first message and add placeholders for missing
        rewrite_parts = [first_user_msg.strip()]
        if missing_elements:
            rewrite_parts.append("\n\n[Add the following context:]")
            for element in missing_elements[:4]:
                rewrite_parts.append(f"- {ELEMENT_LABELS[element]}: [fill in]")
        prompt_rewrite = "\n".join(rewrite_parts)

        # Habit: based on dominant gap
        if missing_elements:
            primary_gap = missing_elements[0]
            habit = ELEMENT_HABITS.get(
                primary_gap,
                "Before sending a prompt, review what context you're assuming the AI already knows.",
            )
        else:
            habit = "Before sending a prompt, review what context you're assuming the AI already knows."

        coaching = Coaching(
            context_that_would_have_helped=context_help,
            prompt_rewrite=prompt_rewrite,
            habit_to_build=habit,
        )

        # ----- Confidence -----
        total_turns = len(transcript.turns)
        if first_msg_len < 30:
            conf_score = 4
            conf_reasoning = (
                "Your opening message was very short, which limits what the analysis can detect. "
                "For a stronger read, paste a conversation where your first message is at least "
                "2-3 sentences with real task context."
            )
        elif total_turns >= 5:
            conf_score = 8
            conf_reasoning = (
                "Multiple back-and-forth turns give strong signal for pattern detection. "
                "To reach 9-10, include conversations where you provided detailed upfront "
                "context so the tool can identify what you do well, not just what's missing."
            )
        elif total_turns >= 3:
            conf_score = 7
            conf_reasoning = (
                "Three or more turns provide a reasonable basis for analysis. "
                "Longer conversations (5+ turns) give richer signal — especially ones "
                "where you had to clarify or re-explain, since those reveal context gaps."
            )
        else:
            conf_score = 5
            conf_reasoning = (
                "Only 1-2 turns limits what the analysis can surface. "
                "Try pasting a conversation with more back-and-forth — the corrections "
                "and follow-ups are where your context patterns become visible."
            )

        # Clamp to valid range
        conf_score = max(1, min(10, conf_score))

        confidence = Confidence(score=conf_score, reasoning=conf_reasoning)

        # ----- Assemble Analysis -----
        analysis = Analysis(
            topic=topic,
            context_provided=context_provided,
            context_added_later=context_added_later,
            assumptions_wrong=assumptions_wrong,
            pattern=pattern,
            coaching=coaching,
            confidence=confidence,
        )

        logger.info(
            "L1 rule-based analysis complete: topic=%s, pattern=%s, confidence=%d",
            topic, category, conf_score,
        )

        return analysis

    except AnalyzerError:
        raise
    except Exception as exc:
        logger.error("Lesson 1 rule-based analysis failed: %s", exc, exc_info=True)
        raise AnalyzerError(f"Analysis failed: {exc}") from exc


async def check_api_connection() -> tuple[bool, str, list[str]]:
    """Check analysis engine status.

    Returns:
        Tuple of (is_available, status_message, available_models).
    """
    return (True, "Rule-based analysis active", ["rule-based"])
