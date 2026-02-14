"""Week 8: Feedback Analyzer - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Feedback Quality Patterns
# =============================================================================

VAGUE_PATTERNS = {
    "no_specifics": {
        "name": "Lacks Specifics",
        "description": "Feedback doesn't identify specific locations, elements, or issues",
        "examples": ["This isn't quite right", "Something's off here", "Needs work"],
        "fix": "Point to exact locations: 'Line 42 has...', 'The third paragraph...', 'The login button...'"
    },
    "no_action": {
        "name": "No Clear Action",
        "description": "Doesn't tell the AI what to do differently",
        "examples": ["Make it better", "Improve this", "Fix the issues"],
        "fix": "Specify the change: 'Change X to Y', 'Add error handling for...', 'Remove the...'"
    },
    "no_reason": {
        "name": "Missing Reasoning",
        "description": "Doesn't explain why the change is needed",
        "examples": ["Change this", "Use something else", "That's wrong"],
        "fix": "Add context: '...because users expect...', '...since the API returns...', '...to match the style guide'"
    },
    "subjective": {
        "name": "Purely Subjective",
        "description": "Based only on feeling without criteria",
        "examples": ["I don't like it", "It feels wrong", "Not what I wanted"],
        "fix": "Define criteria: 'It should be under 100 words', 'Match the tone of [example]', 'Follow [standard]'"
    },
    "scope_creep": {
        "name": "Scope Creep",
        "description": "Introduces new requirements mid-iteration",
        "examples": ["Also add...", "While you're at it...", "Can you also..."],
        "fix": "Complete current pass first, then start new task: 'After this is done, we'll address...'"
    }
}

QUALITY_LEVELS = {
    "specific": {
        "score_range": (8, 10),
        "label": "Specific",
        "color": "#4ade80",
        "description": "Clear location, action, and reasoning"
    },
    "adequate": {
        "score_range": (5, 7),
        "label": "Adequate",
        "color": "#fbbf24",
        "description": "Has some specifics but could be clearer"
    },
    "vague": {
        "score_range": (0, 4),
        "label": "Vague",
        "color": "#f87171",
        "description": "Lacks specifics, action, or reasoning"
    }
}

FEEDBACK_CATEGORIES = [
    "code",
    "writing",
    "design",
    "analysis",
    "documentation",
    "other"
]


# =============================================================================
# Analysis Result Schema
# =============================================================================

class FeedbackIssue(BaseModel):
    """A specific issue found in feedback."""
    pattern: str  # Key from VAGUE_PATTERNS
    description: str
    location: Optional[str] = None  # Where in the feedback
    suggestion: str


class FeedbackAnalysis(BaseModel):
    """Complete analysis of a piece of feedback."""
    quality_score: int = Field(..., ge=0, le=10)
    quality_level: str  # "specific", "adequate", "vague"
    issues: list[FeedbackIssue]
    strengths: list[str]
    rewrite_suggestion: str
    summary: str


# =============================================================================
# Request/Response Schemas
# =============================================================================

class AnalyzeFeedbackRequest(BaseModel):
    """Request to analyze feedback quality."""
    feedback: str = Field(..., min_length=1)
    context: str = ""  # Optional context about what the feedback is for
    category: str = "other"


class FeedbackEntryCreate(BaseModel):
    """Schema for creating a feedback entry (after analysis)."""
    original_feedback: str = Field(..., min_length=1)
    context: str = ""
    analysis: FeedbackAnalysis
    category: str = "other"


class FeedbackEntryUpdate(BaseModel):
    """Schema for updating a feedback entry."""
    rewritten_feedback: Optional[str] = None
    is_example: Optional[bool] = None
    category: Optional[str] = None


class FeedbackEntrySummary(BaseModel):
    """Lightweight summary for list view."""
    id: str
    original_feedback: str
    quality_score: int
    quality_level: str
    has_rewrite: bool
    is_example: bool
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackEntryResponse(BaseModel):
    """Full feedback entry response."""
    id: str
    original_feedback: str
    context: Optional[str]
    analysis: FeedbackAnalysis
    rewritten_feedback: Optional[str]
    is_example: bool
    category: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Statistics Schema
# =============================================================================

class FeedbackStats(BaseModel):
    """Statistics for feedback entries."""
    total_entries: int
    avg_quality_score: float
    entries_by_level: dict  # {"specific": n, "adequate": n, "vague": n}
    common_issues: list[dict]  # [{pattern, count}]
    examples_saved: int
    rewrites_completed: int
    improvement_rate: float  # % of vague feedback that was rewritten


# =============================================================================
# Example Feedback for Learning
# =============================================================================

EXAMPLE_FEEDBACK = [
    {
        "original_feedback": "This code doesn't work right.",
        "context": "Reviewing a Python function",
        "category": "code",
        "expected_issues": ["no_specifics", "no_action"]
    },
    {
        "original_feedback": "Make the writing better and more engaging.",
        "context": "Reviewing blog post draft",
        "category": "writing",
        "expected_issues": ["no_specifics", "no_action", "subjective"]
    },
    {
        "original_feedback": "The error handling in the process_order function on line 156 catches all exceptions with a bare except clause. Change it to catch specific exceptions (ValueError, KeyError) and log the actual error message, because bare excepts hide bugs and make debugging harder.",
        "context": "Code review feedback",
        "category": "code",
        "expected_issues": []  # This is good feedback
    },
    {
        "original_feedback": "I don't like how this looks.",
        "context": "UI design review",
        "category": "design",
        "expected_issues": ["no_specifics", "subjective", "no_action"]
    },
    {
        "original_feedback": "The introduction should be shorter - under 50 words - and start with a question to hook the reader, similar to how the Economist opens their articles.",
        "context": "Article editing",
        "category": "writing",
        "expected_issues": []  # This is good feedback
    },
    {
        "original_feedback": "Fix the bugs and also add user authentication while you're at it.",
        "context": "Feature development",
        "category": "code",
        "expected_issues": ["no_specifics", "scope_creep"]
    }
]
