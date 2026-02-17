"""Lesson 2: Feedback Analyzer - Pydantic schemas."""
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
    pattern: str = Field(max_length=500)  # Key from VAGUE_PATTERNS
    description: str = Field(max_length=5000)
    location: Optional[str] = Field(None, max_length=500)  # Where in the feedback
    suggestion: str = Field(max_length=5000)


class FeedbackAnalysis(BaseModel):
    """Complete analysis of a piece of feedback."""
    quality_score: int = Field(..., ge=0, le=10)
    quality_level: str = Field(max_length=50)  # "specific", "adequate", "vague"
    issues: list[FeedbackIssue]
    strengths: list[str]
    rewrite_suggestion: str = Field(max_length=10000)
    summary: str = Field(max_length=5000)


# =============================================================================
# Request/Response Schemas
# =============================================================================

class AnalyzeFeedbackRequest(BaseModel):
    """Request to analyze feedback quality."""
    feedback: str = Field(..., min_length=1, max_length=10000)
    context: str = Field("", max_length=5000)
    category: str = Field("other", max_length=50)


class FeedbackEntryCreate(BaseModel):
    """Schema for creating a feedback entry (after analysis)."""
    original_feedback: str = Field(..., min_length=1, max_length=10000)
    context: str = Field("", max_length=5000)
    analysis: FeedbackAnalysis
    category: str = Field("other", max_length=50)


class FeedbackEntryUpdate(BaseModel):
    """Schema for updating a feedback entry."""
    rewritten_feedback: Optional[str] = Field(None, max_length=10000)
    is_example: Optional[bool] = None
    category: Optional[str] = Field(None, max_length=50)


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
    # --- IT / Code ---
    {
        "original_feedback": "This code doesn't work right.",
        "context": "Reviewing a Python function",
        "category": "code",
        "expected_issues": ["no_specifics", "no_action"]
    },
    {
        "original_feedback": "The error handling in the process_order function on line 156 catches all exceptions with a bare except clause. Change it to catch specific exceptions (ValueError, KeyError) and log the actual error message, because bare excepts hide bugs and make debugging harder.",
        "context": "Code review feedback",
        "category": "code",
        "expected_issues": []  # This is good feedback
    },
    {
        "original_feedback": "Fix the bugs and also add user authentication while you're at it.",
        "context": "Feature development",
        "category": "code",
        "expected_issues": ["no_specifics", "scope_creep"]
    },
    # --- Writing ---
    {
        "original_feedback": "Make the writing better and more engaging.",
        "context": "Reviewing blog post draft",
        "category": "writing",
        "expected_issues": ["no_specifics", "no_action", "subjective"]
    },
    {
        "original_feedback": "The introduction should be shorter - under 50 words - and start with a question to hook the reader, similar to how the Economist opens their articles.",
        "context": "Article editing",
        "category": "writing",
        "expected_issues": []  # This is good feedback
    },
    # --- Design ---
    {
        "original_feedback": "I don't like how this looks.",
        "context": "UI design review",
        "category": "design",
        "expected_issues": ["no_specifics", "subjective", "no_action"]
    },
    # --- Marketing / Sales ---
    {
        "original_feedback": "This campaign isn't really hitting the mark.",
        "context": "Reviewing Q2 email drip campaign",
        "category": "analysis",
        "expected_issues": ["no_specifics", "no_action", "subjective"]
    },
    {
        "original_feedback": "The subject line 'Big Savings Inside' has a 12% open rate, which is below our 18% benchmark. Rewrite it to include the specific discount percentage and a deadline, like our Black Friday subject line that hit 27% opens.",
        "context": "Email marketing optimization",
        "category": "writing",
        "expected_issues": []  # This is good feedback
    },
    {
        "original_feedback": "The sales proposal needs more punch. Also, can you redo the pricing section and add a competitive comparison while you're at it?",
        "context": "Sales proposal review",
        "category": "writing",
        "expected_issues": ["no_specifics", "subjective", "scope_creep"]
    },
    # --- HR / Operations ---
    {
        "original_feedback": "The onboarding document needs to be better.",
        "context": "New hire onboarding checklist review",
        "category": "documentation",
        "expected_issues": ["no_specifics", "no_action", "subjective"]
    },
    {
        "original_feedback": "The job posting for Senior Accountant lists 'excellent communication skills' as requirement #2 but doesn't specify what that means in practice. Replace it with 'Ability to explain monthly variance reports to non-finance department heads in plain language,' because that's the actual skill we need.",
        "context": "Job description review",
        "category": "writing",
        "expected_issues": []  # This is good feedback
    },
    # --- Finance / Accounting ---
    {
        "original_feedback": "These numbers don't look right to me.",
        "context": "Reviewing monthly expense report",
        "category": "analysis",
        "expected_issues": ["no_specifics", "no_action", "no_reason"]
    },
    {
        "original_feedback": "The Q3 budget forecast shows travel expenses at $42K, but we've already committed $38K through September conference registrations. Increase the travel line to $55K and add a footnote listing the three confirmed conferences, because the CFO will ask where the overage is coming from.",
        "context": "Quarterly budget review",
        "category": "analysis",
        "expected_issues": []  # This is good feedback
    },
    # --- Education / Training ---
    {
        "original_feedback": "This training module is confusing.",
        "context": "Reviewing new employee safety training",
        "category": "documentation",
        "expected_issues": ["no_specifics", "no_action"]
    },
    {
        "original_feedback": "The quiz at the end of Module 3 has 15 questions but only covers the first two sections. Add 5 questions covering the 'Emergency Procedures' section, specifically the evacuation routes and assembly points, because that's the content most employees failed on in last quarter's assessment.",
        "context": "Training course design review",
        "category": "documentation",
        "expected_issues": []  # This is good feedback
    },
    # --- Admin / Managerial ---
    {
        "original_feedback": "Can you just make the meeting notes cleaner?",
        "context": "Reviewing AI-drafted meeting summary",
        "category": "documentation",
        "expected_issues": ["no_specifics", "no_action"]
    },
    {
        "original_feedback": "The weekly status report lists 'Project Alpha: on track' but doesn't mention the vendor delay we discussed Monday. Add a risk flag under Project Alpha stating 'Hardware delivery delayed 2 weeks; go-live date at risk if not resolved by March 15' so leadership can escalate with procurement.",
        "context": "Team status report review",
        "category": "documentation",
        "expected_issues": []  # This is good feedback
    },
]
