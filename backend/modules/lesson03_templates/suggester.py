"""AI-powered template suggestions based on Week 1 patterns."""
import json
import logging
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import anthropic

from .schemas import TemplateSuggestion, Variable

# Load .env from AI-ManagerSkills parent folder
env_path = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")

SUGGESTION_PROMPT = '''Analyze this user's conversation history patterns and suggest context templates.

User's common context gaps (from Week 1 analysis):
{gaps_summary}

User's common pattern categories:
{patterns_summary}

Generate 2-3 template suggestions that would address their recurring context needs.

Return a JSON array:
[
  {{
    "name": "Template name (concise, 3-5 words)",
    "category": "A short category name (e.g., general, documentation, technical, creative, business)",
    "content": "The template text with {{{{variable}}}} placeholders for customizable parts",
    "variables": [
      {{"name": "var_name", "description": "What this variable is for", "default": "", "required": true}}
    ],
    "reasoning": "One sentence explaining why this template would help based on their patterns"
  }}
]

Guidelines:
- Focus on templates that would eliminate their most frequent context gaps
- Use {{{{variable_name}}}} syntax for placeholders (double braces)
- Keep template content under 500 characters
- Make templates specific and actionable, not generic
- Use a category that fits the template's purpose

Return ONLY valid JSON array, no markdown formatting.'''

GENERATE_FROM_CONVERSATION_PROMPT = '''Analyze this conversation where the user had to add context mid-conversation.

Conversation:
{transcript}

Analysis from Week 1:
- Context added later: {context_added_later}
- What would have helped: {what_would_have_helped}
- Pattern category: {pattern}

Generate a template that would have provided this context upfront.

Return a JSON object:
{{
  "name": "Template name (concise, 3-5 words)",
  "category": "A short category name (e.g., general, documentation, technical, creative, business)",
  "content": "The template text with {{{{variable}}}} placeholders",
  "variables": [
    {{"name": "var_name", "description": "What this variable is for", "default": "", "required": true}}
  ],
  "reasoning": "How this template addresses the context gap from this conversation"
}}

Return ONLY valid JSON, no markdown formatting.'''


def get_client():
    """Get Anthropic client."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set in environment")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def generate_suggestions(
    gaps_summary: str,
    patterns_summary: str,
    model: Optional[str] = None
) -> list[TemplateSuggestion]:
    """
    Generate template suggestions based on user's Week 1 patterns.

    Args:
        gaps_summary: Summary of common context gaps
        patterns_summary: Summary of pattern categories
        model: Optional model override

    Returns:
        List of TemplateSuggestion objects
    """
    model = model or ANTHROPIC_MODEL

    prompt = SUGGESTION_PROMPT.format(
        gaps_summary=gaps_summary,
        patterns_summary=patterns_summary
    )

    try:
        client = get_client()
        message = client.messages.create(
            model=model,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        content = message.content[0].text.strip()

        # Parse JSON
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)

        suggestions_data = json.loads(content)

        suggestions = []
        for s in suggestions_data:
            variables = [
                Variable(
                    name=v.get("name", ""),
                    description=v.get("description", ""),
                    default=v.get("default", ""),
                    required=v.get("required", False)
                )
                for v in s.get("variables", [])
            ]
            suggestions.append(TemplateSuggestion(
                name=s["name"],
                category=s["category"],
                content=s["content"],
                variables=variables,
                reasoning=s["reasoning"]
            ))

        logger.info(f"Generated {len(suggestions)} template suggestions")
        return suggestions

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse suggestions JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Failed to generate suggestions: {e}")
        return []


async def generate_template_from_conversation(
    transcript: str,
    analysis: dict,
    model: Optional[str] = None
) -> Optional[TemplateSuggestion]:
    """
    Generate a template from a conversation that had context gaps.

    Args:
        transcript: The raw conversation transcript
        analysis: The Week 1 analysis of the conversation
        model: Optional model override

    Returns:
        TemplateSuggestion or None if generation fails
    """
    model = model or ANTHROPIC_MODEL

    context_added = analysis.get("context_added_later", {})
    coaching = analysis.get("coaching", {})
    pattern = analysis.get("pattern", {})

    prompt = GENERATE_FROM_CONVERSATION_PROMPT.format(
        transcript=transcript[:2000],  # Limit length
        context_added_later=context_added.get("details", "None"),
        what_would_have_helped=coaching.get("context_that_would_have_helped", "Not specified"),
        pattern=pattern.get("category", "Unknown")
    )

    try:
        client = get_client()
        message = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        content = message.content[0].text.strip()

        # Parse JSON
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)

        data = json.loads(content)

        variables = [
            Variable(
                name=v.get("name", ""),
                description=v.get("description", ""),
                default=v.get("default", ""),
                required=v.get("required", False)
            )
            for v in data.get("variables", [])
        ]

        return TemplateSuggestion(
            name=data["name"],
            category=data["category"],
            content=data["content"],
            variables=variables,
            reasoning=data["reasoning"]
        )

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse template JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate template from conversation: {e}")
        return None


async def test_template_with_ai(
    rendered_prompt: str,
    model: Optional[str] = None
) -> str:
    """
    Test a rendered template by sending it to Claude.

    Args:
        rendered_prompt: The fully rendered template + user prompt
        model: Optional model override

    Returns:
        Claude's response text
    """
    model = model or ANTHROPIC_MODEL

    try:
        client = get_client()
        message = client.messages.create(
            model=model,
            max_tokens=2048,
            messages=[{"role": "user", "content": rendered_prompt}]
        )

        return message.content[0].text

    except Exception as e:
        logger.error(f"Template test failed: {e}")
        raise
