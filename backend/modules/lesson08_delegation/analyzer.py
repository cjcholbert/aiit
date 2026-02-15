"""Lesson 8: AI-powered delegation output analysis.

Reuses Lesson 1 transcript normalization pattern to parse AI conversation output
and evaluates it against user-defined success criteria.
"""
import json
import logging
import re

import anthropic

from .schemas import CriterionResult, DelegationReview
from backend.services.anthropic_client import (
    async_call_anthropic,
    ANTHROPIC_MODEL,
    CircuitBreakerError,
)

logger = logging.getLogger(__name__)


class AnalyzerError(Exception):
    """Error during analysis."""
    pass


def _raise_for_circuit_breaker(exc):
    """Convert CircuitBreakerError to AnalyzerError with user-friendly message."""
    raise AnalyzerError("AI service temporarily unavailable — too many recent failures. Try again shortly.") from exc


# =============================================================================
# Transcript Parsing (reuses Lesson 1 patterns)
# =============================================================================

EXTRACT_OUTPUT_PROMPT = '''Extract the AI's final output/response from this text.

This may be:
- A conversation transcript (extract the AI's responses, especially the final one)
- Raw AI output that was copied
- A mix of user messages and AI responses

Return ONLY the AI-generated content, cleaned of:
- User messages/prompts
- Timestamps, metadata, UI elements
- Formatting artifacts

If there are multiple AI responses, focus on the final/complete deliverable.
If unclear what's the AI output, return the largest substantive text block.

Return ONLY the extracted output, nothing else.

TEXT TO EXTRACT FROM:
'''


async def parse_delegation_output(raw_text: str, model: str = None) -> str:
    """
    Parse and extract AI output from a pasted conversation or raw output.

    Reuses Lesson 1's normalization pattern but focuses on extracting
    the AI's deliverable rather than the full conversation structure.
    """
    if not raw_text or not raw_text.strip():
        return ""

    # If the text is already clean (no obvious conversation markers), return as-is
    conversation_markers = ['User:', 'Assistant:', 'Claude:', 'ChatGPT:', 'You:', 'Human:']
    has_markers = any(marker.lower() in raw_text.lower() for marker in conversation_markers)

    if not has_markers and len(raw_text.strip()) > 50:
        # Likely already clean output
        return raw_text.strip()

    model = model or ANTHROPIC_MODEL

    try:
        message = await async_call_anthropic(
            lambda client: client.messages.create(
                model=model,
                max_tokens=4096,
                messages=[
                    {"role": "user", "content": f"{EXTRACT_OUTPUT_PROMPT}\n{raw_text}"}
                ]
            )
        )

        extracted = message.content[0].text.strip()
        logger.info("Extracted AI output: %d -> %d chars", len(raw_text), len(extracted))
        return extracted

    except CircuitBreakerError as exc:
        _raise_for_circuit_breaker(exc)
    except anthropic.AuthenticationError:
        raise AnalyzerError("Invalid Anthropic API key")
    except anthropic.RateLimitError:
        raise AnalyzerError("Anthropic rate limit exceeded")
    except AnalyzerError:
        raise
    except Exception as e:
        raise AnalyzerError(f"Output extraction failed: {str(e)}")


# =============================================================================
# Success Criteria Extraction
# =============================================================================

def extract_success_criteria(template: str) -> list[str]:
    """
    Parse the "Success Criteria" section from a delegation template.

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
    # Match: - [ ] item, - item, * item, 1. item, • item
    list_patterns = [
        r'^\s*[-*•]\s*\[[ x]\]\s*(.+)$',  # - [ ] or - [x] checkbox
        r'^\s*[-*•]\s+(.+)$',              # - item or * item
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
# AI Review Against Criteria
# =============================================================================

REVIEW_PROMPT_TEMPLATE = '''You are evaluating an AI's output against specific success criteria.

TASK CONTEXT:
Title: {task_title}
Description: {task_description}

EXPECTED OUTPUT:
{expected_output}

SUCCESS CRITERIA TO EVALUATE:
{criteria_list}

ACTUAL OUTPUT RECEIVED:
{output}

---

Evaluate each success criterion listed above. For each:
1. Determine if the output meets the criterion (pass/fail)
2. Provide brief reasoning (1-2 sentences)
3. Rate your confidence (0.0 to 1.0)

Return ONLY valid JSON in this exact format:
{{
  "overall_pass": true or false,
  "criteria_results": [
    {{
      "criterion": "the exact criterion text",
      "passed": true or false,
      "reasoning": "Brief explanation of why it passed or failed",
      "confidence": 0.85
    }}
  ],
  "summary": "1-2 sentence overall assessment",
  "suggestions": ["Specific improvement if not passing", "Another suggestion if needed"]
}}

Rules:
- overall_pass is true only if ALL criteria pass
- Be specific in reasoning - reference actual content from the output
- suggestions should be empty array [] if all criteria pass
- If criteria list is empty, evaluate based on expected_output match instead'''


async def review_against_criteria(
    output: str,
    expected_output: str,
    success_criteria: list[str],
    task_title: str = "",
    task_description: str = "",
    model: str = None
) -> DelegationReview:
    """
    Use AI to evaluate output against success criteria.

    Returns a structured DelegationReview with per-criterion results.
    """
    model = model or ANTHROPIC_MODEL

    # Format criteria list for the prompt
    if success_criteria:
        criteria_list = "\n".join(f"{i+1}. {c}" for i, c in enumerate(success_criteria))
    else:
        criteria_list = "(No explicit criteria provided - evaluate against expected output)"

    prompt = REVIEW_PROMPT_TEMPLATE.format(
        task_title=task_title or "Untitled task",
        task_description=task_description or "No description provided",
        expected_output=expected_output or "No expected output specified",
        criteria_list=criteria_list,
        output=output
    )

    try:
        message = await async_call_anthropic(
            lambda client: client.messages.create(
                model=model,
                max_tokens=2048,
                system="You are a task review assistant. Evaluate outputs against criteria and return ONLY valid JSON. Be objective and specific.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
        )

        content = message.content[0].text.strip()
        logger.info("Review response (first 300 chars): %s", content[:300])

    except CircuitBreakerError as exc:
        _raise_for_circuit_breaker(exc)
    except anthropic.AuthenticationError:
        raise AnalyzerError("Invalid Anthropic API key")
    except anthropic.RateLimitError:
        raise AnalyzerError("Anthropic rate limit exceeded")
    except AnalyzerError:
        raise
    except Exception as e:
        raise AnalyzerError(f"Review failed: {str(e)}")

    # Parse JSON response
    try:
        # Clean markdown code blocks if present
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)

        # Find JSON object
        if not content.startswith("{"):
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                content = content[start:end]

        review_data = json.loads(content)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse review JSON: {content[:500]}")
        raise AnalyzerError(f"Failed to parse review response: {str(e)}")

    # Build DelegationReview object
    try:
        criteria_results = []
        for result in review_data.get("criteria_results", []):
            criteria_results.append(CriterionResult(
                criterion=result.get("criterion", ""),
                passed=result.get("passed", False),
                reasoning=result.get("reasoning", ""),
                confidence=float(result.get("confidence", 0.5))
            ))

        review = DelegationReview(
            overall_pass=review_data.get("overall_pass", False),
            criteria_results=criteria_results,
            summary=review_data.get("summary", ""),
            suggestions=review_data.get("suggestions", []),
            ai_extracted_output=output
        )

        return review

    except Exception as e:
        logger.error(f"Failed to create DelegationReview: {e}")
        raise AnalyzerError(f"Review response missing required fields: {str(e)}")


async def analyze_delegation_output(
    raw_output: str,
    template: str,
    expected_output: str,
    task_title: str = "",
    task_description: str = "",
    task_success_criteria: list[str] = None,
    model: str = None
) -> DelegationReview:
    """
    Full analysis pipeline:
    1. Parse/extract AI output from raw text
    2. Extract success criteria from template (or use task-level overrides)
    3. Review output against criteria

    Args:
        raw_output: Pasted conversation or AI output
        template: Delegation template text (for extracting criteria)
        expected_output: What the task expected to receive
        task_title: Title of the task being reviewed
        task_description: Description of the task
        task_success_criteria: Optional task-level criteria override
        model: Anthropic model to use

    Returns:
        DelegationReview with structured assessment
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
        model=model
    )

    return review
