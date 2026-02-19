"""Lesson 9: Iterative Refinement - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Pass Framework Constants
# =============================================================================

PASS_INFO = {
    1: {
        "label": "70%",
        "name": "Structure & Approach",
        "focus": "Architecture, logic, major components",
        "key_question": "Right problem, right way?",
        "description": "Get the overall structure right before diving into details."
    },
    2: {
        "label": "85%",
        "name": "Robustness",
        "focus": "Edge cases, error handling, validation",
        "key_question": "What will break in practice?",
        "description": "Strengthen the implementation against real-world conditions."
    },
    3: {
        "label": "95%",
        "name": "Production-Ready",
        "focus": "Clarity, documentation, polish",
        "key_question": "Will this work for its audience?",
        "description": "Final polish for production use."
    }
}


TRANSITION_TEMPLATES = {
    "1_to_2": {
        "name": "70% to 85% Transition",
        "template": """The structure and approach look good. Now let's make it robust.

Review the current output and address:
1. Edge cases: What inputs or scenarios aren't handled?
2. Error handling: Where could this fail? How should failures be handled?
3. Validation: What assumptions are being made that should be verified?
4. Real-world conditions: What happens under load, with bad data, or unusual timing?

Specific areas to strengthen:
[List specific areas based on the 70% feedback]"""
    },
    "2_to_3": {
        "name": "85% to 95% Transition",
        "template": """The implementation is robust. Now let's make it production-ready.

Review the current output and address:
1. Clarity: Is the code/content easy to understand for its audience?
2. Documentation: Are the important decisions and behaviors documented?
3. Polish: Are there any rough edges, inconsistencies, or confusing parts?
4. Audience fit: Will the intended users be able to use this effectively?

Specific areas to polish:
[List specific areas based on the 85% feedback]"""
    }
}


# =============================================================================
# Pass Feedback Schema
# =============================================================================

class PassFeedback(BaseModel):
    """Feedback recorded for a single pass."""
    pass_number: int = Field(..., ge=1, le=3)
    pass_label: str = Field(max_length=50)  # "70%", "85%", "95%"
    focus: str = Field(max_length=500)  # "Structure & Approach", etc.
    key_question: str = Field(max_length=500)  # "Right problem, right way?"
    key_question_answer: str = Field(max_length=5000)  # User's answer to the key question
    feedback: str = Field(max_length=10000)  # The actual iteration feedback given to AI
    completed_at: datetime


class PassRecordRequest(BaseModel):
    """Request body for recording a pass."""
    key_question_answer: str = Field(..., min_length=1, max_length=5000)
    feedback: str = Field(..., min_length=1, max_length=10000)


# =============================================================================
# Iteration Task Schemas
# =============================================================================

class IterationTaskCreate(BaseModel):
    """Schema for creating an iteration task."""
    task_name: str = Field(..., min_length=1, max_length=255)
    target_outcome: str = Field("", max_length=5000)
    notes: str = Field("", max_length=5000)


class IterationTaskUpdate(BaseModel):
    """Schema for updating an iteration task."""
    task_name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_outcome: Optional[str] = Field(None, max_length=5000)
    notes: Optional[str] = Field(None, max_length=5000)


class IterationTaskSummary(BaseModel):
    """Lightweight summary for list view."""
    id: str
    task_name: str
    current_pass: int
    current_pass_label: str
    passes_completed: int
    is_complete: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IterationTaskResponse(BaseModel):
    """Full iteration task response."""
    id: str
    task_name: str
    target_outcome: Optional[str]
    current_pass: int
    current_pass_info: dict  # Full pass info for current pass
    passes: list[PassFeedback]
    is_complete: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Statistics Schema
# =============================================================================

class IterationStats(BaseModel):
    """Statistics for iteration tasks."""
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    total_passes_recorded: int
    avg_passes_per_completed_task: float
    completion_rate: float
    tasks_by_current_pass: dict  # {1: count, 2: count, 3: count}


# =============================================================================
# Example Tasks (imported from examples.py)
# =============================================================================

from .examples import EXAMPLE_TASKS, EXAMPLE_CATEGORIES  # noqa: E402

__all_exports__ = ["EXAMPLE_TASKS", "EXAMPLE_CATEGORIES"]
