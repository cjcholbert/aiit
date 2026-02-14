"""Template rendering with variable substitution."""
import re
from typing import Any


def render_template(
    content: str,
    variables: list[dict[str, Any]],
    variable_values: dict[str, str],
    user_prompt: str = ""
) -> tuple[str, list[str]]:
    """
    Render a template by substituting variables.

    Args:
        content: Template content with {{variable_name}} placeholders
        variables: List of variable definitions [{name, description, default, required}]
        variable_values: User-provided values for variables
        user_prompt: Optional user prompt to append

    Returns:
        Tuple of (rendered_content, list_of_missing_required_variables)
    """
    rendered = content
    missing_required = []

    # Create a lookup for variable definitions
    var_defs = {v["name"]: v for v in variables}

    # Find all placeholders in content
    placeholders = re.findall(r"\{\{(\w+)\}\}", content)

    for placeholder in set(placeholders):
        var_def = var_defs.get(placeholder, {})
        value = variable_values.get(placeholder, "")

        # If no value provided, use default
        if not value:
            value = var_def.get("default", "")

        # Check if required and still missing
        if var_def.get("required", False) and not value:
            missing_required.append(placeholder)
            continue

        # Replace placeholder
        rendered = rendered.replace(f"{{{{{placeholder}}}}}", value)

    # Append user prompt if provided
    if user_prompt:
        rendered = f"{rendered}\n\n---\n\nUser Request: {user_prompt}"

    return rendered, missing_required


def extract_variables_from_content(content: str) -> list[str]:
    """
    Extract variable names from template content.

    Args:
        content: Template content with {{variable_name}} placeholders

    Returns:
        List of unique variable names found
    """
    return list(set(re.findall(r"\{\{(\w+)\}\}", content)))


def validate_variable_name(name: str) -> bool:
    """Check if a variable name is valid (alphanumeric + underscore, starts with letter/underscore)."""
    return bool(re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name))
