"""Rule-based template suggestions derived from Lesson 1 patterns.

This module uses keyword matching against a static template library to generate
template suggestions. No external AI service is required -- all logic is
deterministic and runs locally.
"""
import logging
import re
from typing import Optional

from .schemas import TemplateSuggestion, Variable

logger = logging.getLogger(__name__)


# =============================================================================
# Static Template Library
# =============================================================================

_TEMPLATE_LIBRARY: list[dict] = [
    {
        "name": "Technical Environment",
        "category": "technical",
        "keywords": ["environment", "tech", "stack", "framework", "language", "platform", "runtime", "version", "library", "tool"],
        "content": (
            "I am working in a {{tech_stack}} environment (version {{version}}).\n"
            "The project uses {{framework}} and is deployed on {{platform}}.\n"
            "Relevant constraints: {{constraints}}"
        ),
        "variables": [
            {"name": "tech_stack", "description": "Primary language or technology stack", "default": "", "required": True},
            {"name": "version", "description": "Version of the primary technology", "default": "", "required": False},
            {"name": "framework", "description": "Framework or library in use", "default": "", "required": True},
            {"name": "platform", "description": "Deployment platform (local, cloud provider, etc.)", "default": "", "required": False},
        ],
        "reasoning": "Addresses gaps where technical environment details were missing, helping the AI understand your stack upfront.",
    },
    {
        "name": "Audience Context",
        "category": "general",
        "keywords": ["audience", "reader", "stakeholder", "manager", "user", "customer", "recipient", "viewer", "client", "end-user"],
        "content": (
            "The target audience is {{audience}} who are {{familiarity}} with the subject.\n"
            "Their primary goal is {{audience_goal}}.\n"
            "Adjust tone and detail level accordingly."
        ),
        "variables": [
            {"name": "audience", "description": "Who will consume the output", "default": "", "required": True},
            {"name": "familiarity", "description": "How familiar the audience is (e.g., beginner, intermediate, expert)", "default": "somewhat familiar", "required": False},
            {"name": "audience_goal", "description": "What the audience is trying to accomplish", "default": "", "required": True},
        ],
        "reasoning": "Addresses gaps where audience information was missing, ensuring the AI tailors its output to the right readers.",
    },
    {
        "name": "Output Format",
        "category": "general",
        "keywords": ["format", "structure", "layout", "output", "template", "style", "organize", "section", "heading"],
        "content": (
            "Please provide the output in {{format}} format.\n"
            "Structure it with the following sections: {{sections}}.\n"
            "Target length: {{length}}."
        ),
        "variables": [
            {"name": "format", "description": "Desired output format (e.g., markdown, bullet list, table, JSON)", "default": "markdown", "required": True},
            {"name": "sections", "description": "Key sections or headings to include", "default": "", "required": True},
            {"name": "length", "description": "Approximate target length or word count", "default": "concise", "required": False},
        ],
        "reasoning": "Addresses gaps where output format expectations were unclear, preventing mismatched deliverables.",
    },
    {
        "name": "Constraints & Requirements",
        "category": "business",
        "keywords": ["constraint", "requirement", "deadline", "budget", "limit", "restriction", "rule", "must", "boundary", "compliance"],
        "content": (
            "Key constraints for this task:\n"
            "- Deadline: {{deadline}}\n"
            "- Budget/resource limits: {{budget}}\n"
            "- Must comply with: {{compliance}}\n"
            "- Additional restrictions: {{restrictions}}"
        ),
        "variables": [
            {"name": "deadline", "description": "When this must be completed", "default": "", "required": True},
            {"name": "budget", "description": "Budget or resource limitations", "default": "N/A", "required": False},
            {"name": "compliance", "description": "Standards, regulations, or policies to follow", "default": "", "required": False},
            {"name": "restrictions", "description": "Any other restrictions or hard rules", "default": "None", "required": False},
        ],
        "reasoning": "Addresses gaps where constraints were introduced too late, causing rework when the AI discovered limits mid-task.",
    },
    {
        "name": "Prior Work Reference",
        "category": "documentation",
        "keywords": ["previous", "prior", "existing", "already", "before", "history", "past", "earlier", "original", "reference"],
        "content": (
            "This builds on prior work: {{prior_work}}.\n"
            "What was already done: {{completed}}.\n"
            "What still needs to be done: {{remaining}}.\n"
            "Key decisions already made: {{decisions}}"
        ),
        "variables": [
            {"name": "prior_work", "description": "Brief description of existing work being extended", "default": "", "required": True},
            {"name": "completed", "description": "What has already been accomplished", "default": "", "required": True},
            {"name": "remaining", "description": "What still needs to be done", "default": "", "required": False},
            {"name": "decisions", "description": "Important decisions already made that should not be revisited", "default": "", "required": False},
        ],
        "reasoning": "Addresses gaps where the AI lacked awareness of existing work, leading to duplicate effort or contradictory suggestions.",
    },
    {
        "name": "Role & Background",
        "category": "general",
        "keywords": ["role", "background", "experience", "context", "who i am", "position", "team", "department", "expertise", "job"],
        "content": (
            "My role: {{role}} in {{department}}.\n"
            "My experience level with this topic: {{experience_level}}.\n"
            "What I need help with specifically: {{help_needed}}"
        ),
        "variables": [
            {"name": "role", "description": "Your job title or role", "default": "", "required": True},
            {"name": "department", "description": "Team or department context", "default": "", "required": False},
            {"name": "experience_level", "description": "Your familiarity with the task topic (beginner, intermediate, expert)", "default": "intermediate", "required": False},
            {"name": "help_needed", "description": "Specific aspect you need AI assistance with", "default": "", "required": True},
        ],
        "reasoning": "Addresses gaps where the AI could not calibrate its response to your expertise level, producing output that was too basic or too advanced.",
    },
    {
        "name": "Scope Definition",
        "category": "business",
        "keywords": ["scope", "boundary", "include", "exclude", "in-scope", "out-of-scope", "focus", "limit", "narrow", "broad"],
        "content": (
            "Scope for this task:\n"
            "IN SCOPE: {{in_scope}}\n"
            "OUT OF SCOPE: {{out_of_scope}}\n"
            "If something is ambiguous, {{ambiguity_rule}}."
        ),
        "variables": [
            {"name": "in_scope", "description": "What should be included in the output", "default": "", "required": True},
            {"name": "out_of_scope", "description": "What should be explicitly excluded", "default": "", "required": True},
            {"name": "ambiguity_rule", "description": "How to handle unclear scope items (e.g., ask first, exclude, include with note)", "default": "ask before including", "required": False},
        ],
        "reasoning": "Addresses gaps where scope was undefined, causing the AI to either do too much or miss important areas.",
    },
    {
        "name": "Success Criteria",
        "category": "business",
        "keywords": ["success", "criteria", "done", "complete", "measure", "quality", "acceptance", "definition of done", "metric", "pass"],
        "content": (
            "This task is successful when:\n"
            "1. {{criterion_1}}\n"
            "2. {{criterion_2}}\n"
            "3. {{criterion_3}}\n"
            "Quality bar: {{quality_bar}}"
        ),
        "variables": [
            {"name": "criterion_1", "description": "First success criterion", "default": "", "required": True},
            {"name": "criterion_2", "description": "Second success criterion", "default": "", "required": True},
            {"name": "criterion_3", "description": "Third success criterion (optional)", "default": "", "required": False},
            {"name": "quality_bar", "description": "Overall quality expectation (e.g., production-ready, draft, exploratory)", "default": "production-ready", "required": False},
        ],
        "reasoning": "Addresses gaps where the AI had no clear definition of done, making it hard to know when the output was adequate.",
    },
    {
        "name": "Error Handling Context",
        "category": "technical",
        "keywords": ["error", "issue", "problem", "bug", "fail", "exception", "crash", "broken", "fix", "debug"],
        "content": (
            "I am encountering the following issue: {{error_description}}\n"
            "Error message: {{error_message}}\n"
            "Steps to reproduce: {{steps}}\n"
            "What I have already tried: {{attempted_fixes}}"
        ),
        "variables": [
            {"name": "error_description", "description": "Plain-language description of the problem", "default": "", "required": True},
            {"name": "error_message", "description": "Exact error message or stack trace", "default": "", "required": True},
            {"name": "steps", "description": "Steps to reproduce the issue", "default": "", "required": False},
            {"name": "attempted_fixes", "description": "What you have already tried to fix it", "default": "Nothing yet", "required": False},
        ],
        "reasoning": "Addresses gaps where error context was incomplete, causing the AI to suggest fixes you already tried or miss the root cause.",
    },
    {
        "name": "Data & Source Context",
        "category": "documentation",
        "keywords": ["data", "source", "input", "file", "database", "dataset", "csv", "api", "table", "record", "schema"],
        "content": (
            "Data source: {{source}} (format: {{data_format}}).\n"
            "Key fields/columns: {{key_fields}}.\n"
            "Data volume: approximately {{volume}}.\n"
            "Known data quality issues: {{quality_notes}}"
        ),
        "variables": [
            {"name": "source", "description": "Where the data comes from (file, database, API, etc.)", "default": "", "required": True},
            {"name": "data_format", "description": "Format of the data (CSV, JSON, SQL table, etc.)", "default": "", "required": True},
            {"name": "key_fields", "description": "Important fields or columns the AI should know about", "default": "", "required": False},
            {"name": "volume", "description": "Approximate size of the dataset", "default": "", "required": False},
        ],
        "reasoning": "Addresses gaps where data context was missing, leading the AI to make wrong assumptions about structure or format.",
    },
]


# =============================================================================
# Keyword Scoring
# =============================================================================

def _score_template(template: dict, text: str) -> int:
    """Count how many of a template's keywords appear in the given text.

    Args:
        template: A template dict from the library with a ``keywords`` list.
        text: The combined text to search (case-insensitive).

    Returns:
        Number of distinct keyword matches.
    """
    text_lower = text.lower()
    return sum(1 for kw in template["keywords"] if kw in text_lower)


def _build_suggestion(template: dict, score: int) -> TemplateSuggestion:
    """Convert a library entry into a TemplateSuggestion schema object."""
    variables = [
        Variable(
            name=v["name"],
            description=v["description"],
            default=v.get("default", ""),
            required=v.get("required", False),
        )
        for v in template["variables"]
    ]
    return TemplateSuggestion(
        name=template["name"],
        category=template["category"],
        content=template["content"],
        variables=variables,
        reasoning=template["reasoning"],
    )


# =============================================================================
# Public API
# =============================================================================

async def generate_suggestions(
    gaps_summary: str,
    patterns_summary: str,
    model: Optional[str] = None,
) -> list[TemplateSuggestion]:
    """Generate template suggestions by matching gap/pattern keywords to
    a static template library.

    Args:
        gaps_summary: Summary of common context gaps from Lesson 1.
        patterns_summary: Summary of pattern categories from Lesson 1.
        model: Unused -- kept for API compatibility.

    Returns:
        List of 2-3 TemplateSuggestion objects ranked by keyword relevance.
    """
    combined_text = f"{gaps_summary or ''} {patterns_summary or ''}"

    if not combined_text.strip():
        logger.warning("Empty gaps and patterns summaries; returning no suggestions")
        return []

    scored: list[tuple[int, dict]] = []
    for tmpl in _TEMPLATE_LIBRARY:
        score = _score_template(tmpl, combined_text)
        if score > 0:
            scored.append((score, tmpl))

    # Sort descending by score
    scored.sort(key=lambda pair: pair[0], reverse=True)

    # Return top 2-3 (up to 3 if there are ties, otherwise 2)
    if not scored:
        # Fallback: return the two most broadly useful templates
        logger.info("No keyword matches; returning default suggestions")
        fallback_names = {"Role & Background", "Output Format"}
        return [
            _build_suggestion(t, 0)
            for t in _TEMPLATE_LIBRARY
            if t["name"] in fallback_names
        ]

    # Take top 3 with score > 0
    top = scored[:3]
    # If only 1 match, still return it alone; the frontend handles any count
    suggestions = [_build_suggestion(tmpl, score) for score, tmpl in top]

    logger.info(
        "Generated %d template suggestions (top scores: %s)",
        len(suggestions),
        [s for s, _ in top],
    )
    return suggestions


async def generate_template_from_conversation(
    transcript: str,
    analysis: dict,
    model: Optional[str] = None,
) -> Optional[TemplateSuggestion]:
    """Build a template from a Lesson 1 conversation analysis using
    rule-based extraction.

    Algorithm:
        1. Extract gap descriptions from the analysis dict.
        2. Identify relevant keywords to determine the template category.
        3. Build a template with variable placeholders for each gap.
        4. Derive a template name from the pattern category.

    Args:
        transcript: The raw conversation transcript (used for keyword context).
        analysis: Lesson 1 analysis dict with keys ``context_added_later``,
                  ``coaching``, and ``pattern``.
        model: Unused -- kept for API compatibility.

    Returns:
        A TemplateSuggestion, or None if extraction yields insufficient data.
    """
    try:
        context_added = analysis.get("context_added_later", {})
        coaching = analysis.get("coaching", {})
        pattern = analysis.get("pattern", {})

        details = context_added.get("details", "") if isinstance(context_added, dict) else str(context_added)
        what_would_have_helped = coaching.get("context_that_would_have_helped", "") if isinstance(coaching, dict) else str(coaching)
        pattern_category = pattern.get("category", "general") if isinstance(pattern, dict) else str(pattern)

        # Combine all textual clues
        all_text = f"{details} {what_would_have_helped} {transcript[:1000]}"

        if not all_text.strip():
            logger.warning("Insufficient analysis data for template generation")
            return None

        # Determine which gap types are present by matching against library keywords
        gap_types: list[dict] = []
        for tmpl in _TEMPLATE_LIBRARY:
            score = _score_template(tmpl, all_text)
            if score > 0:
                gap_types.append({"template": tmpl, "score": score})

        gap_types.sort(key=lambda g: g["score"], reverse=True)

        # Build template content from the identified gaps
        variables: list[Variable] = []
        content_lines: list[str] = []

        if what_would_have_helped:
            # Parse individual gap items -- they may be comma or line separated
            gap_items = re.split(r"[,\n;]+", what_would_have_helped)
            gap_items = [g.strip() for g in gap_items if g.strip()]

            for i, gap in enumerate(gap_items[:4]):  # Limit to 4 variables
                var_name = _slugify(gap)
                if not var_name:
                    var_name = f"context_{i + 1}"
                variables.append(Variable(
                    name=var_name,
                    description=gap,
                    default="",
                    required=True,
                ))
                content_lines.append(f"{gap}: {{{{{var_name}}}}}")

        if details and not content_lines:
            # Fallback: use the details text to infer variables
            detail_items = re.split(r"[,\n;]+", details)
            detail_items = [d.strip() for d in detail_items if d.strip()]

            for i, detail in enumerate(detail_items[:4]):
                var_name = _slugify(detail)
                if not var_name:
                    var_name = f"detail_{i + 1}"
                variables.append(Variable(
                    name=var_name,
                    description=detail,
                    default="",
                    required=True,
                ))
                content_lines.append(f"{detail}: {{{{{var_name}}}}}")

        # If still empty, build from the best matching library template
        if not content_lines and gap_types:
            best = gap_types[0]["template"]
            return _build_suggestion(best, gap_types[0]["score"])

        if not content_lines:
            logger.warning("Could not extract any gaps from analysis")
            return None

        # Determine category from pattern_category
        category_map = {
            "technical": "technical",
            "creative": "creative",
            "business": "business",
            "documentation": "documentation",
            "analytical": "business",
            "communication": "general",
        }
        category = category_map.get(pattern_category.lower(), "general")

        # Generate a readable template name
        name = _generate_template_name(pattern_category, what_would_have_helped)

        content = "Provide the following context before starting:\n\n" + "\n".join(content_lines)

        reasoning = (
            f"Generated from a conversation where context was added late. "
            f"Pattern type: {pattern_category}. "
            f"This template front-loads the missing context to avoid mid-conversation corrections."
        )

        return TemplateSuggestion(
            name=name,
            category=category,
            content=content,
            variables=variables,
            reasoning=reasoning,
        )

    except KeyError as e:
        logger.error("Missing expected key in analysis dict: %s", e)
        return None
    except Exception as e:
        logger.error("Failed to generate template from conversation: %s", e)
        return None


async def test_template_with_ai(
    rendered_prompt: str,
    model: Optional[str] = None,
) -> str:
    """Return guidance for testing the rendered template externally.

    This function no longer sends prompts to an AI service. Instead it returns
    a static message directing the user to test with their preferred tool.

    Args:
        rendered_prompt: The fully rendered template + user prompt.
        model: Unused -- kept for API compatibility.

    Returns:
        A guidance message string.
    """
    return (
        "Template rendered successfully. Copy the rendered prompt above and "
        "paste it into your AI tool to test.\n\n"
        "This platform no longer sends prompts to AI directly. Instead, use "
        "the rendered prompt with your preferred AI assistant (ChatGPT, Claude, "
        "Gemini, etc.) to test how well your template provides context."
    )


# =============================================================================
# Internal helpers
# =============================================================================

def _slugify(text: str) -> str:
    """Convert a short phrase into a valid Python-style variable name.

    Example: "technical stack details" -> "technical_stack_details"
    """
    # Keep only alphanumeric and spaces, then convert
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", text.strip())
    slug = re.sub(r"\s+", "_", cleaned).lower()
    # Truncate to reasonable variable name length
    slug = slug[:40]
    # Ensure it starts with a letter or underscore
    if slug and not slug[0].isalpha():
        slug = f"ctx_{slug}"
    return slug or ""


def _generate_template_name(pattern_category: str, gaps_text: str) -> str:
    """Produce a concise human-readable template name (3-5 words)."""
    category_label = pattern_category.strip().title() if pattern_category else "General"

    # Try to extract a short descriptor from the gaps text
    if gaps_text:
        words = gaps_text.split()[:3]
        descriptor = " ".join(w.title() for w in words if len(w) > 2)
        if descriptor:
            name = f"{category_label} {descriptor} Template"
            # Trim if too long
            if len(name) > 60:
                name = f"{category_label} Context Template"
            return name

    return f"{category_label} Context Template"
