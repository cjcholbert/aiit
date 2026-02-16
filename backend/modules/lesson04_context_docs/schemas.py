"""Lesson 4: Context Docs - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Context Document Sections
# =============================================================================

CONTEXT_SECTIONS = {
    "current_state": {
        "name": "Current State",
        "description": "Track what's complete, in progress, and blocked",
        "fields": ["complete", "in_progress", "blocked"]
    },
    "key_decisions": {
        "name": "Key Decisions",
        "description": "Important decisions made with reasoning",
        "fields": ["decision", "reasoning", "date"]
    },
    "known_issues": {
        "name": "Known Issues",
        "description": "Issues encountered and their workarounds",
        "fields": ["issue", "workaround", "status"]
    },
    "lessons_learned": {
        "name": "Lessons Learned",
        "description": "Insights gained for future sessions",
        "fields": ["lesson", "context", "date"]
    },
    "next_goals": {
        "name": "Next Session Goals",
        "description": "Specific tasks for upcoming sessions",
        "fields": ["goal", "priority"]
    }
}

ISSUE_STATUSES = ["open", "resolved", "wont_fix"]
GOAL_PRIORITIES = ["high", "medium", "low"]

# Template for generating context document prompts
CONTEXT_PROMPT_TEMPLATE = """# Project Context: {{project_name}}

## Current State
{{#if current_state.complete}}
### Completed:
{{#each current_state.complete}}
- {{this}}
{{/each}}
{{/if}}

{{#if current_state.in_progress}}
### In Progress:
{{#each current_state.in_progress}}
- {{this}}
{{/each}}
{{/if}}

{{#if current_state.blocked}}
### Blocked:
{{#each current_state.blocked}}
- {{this}}
{{/each}}
{{/if}}

## Key Decisions
{{#each key_decisions}}
- **{{decision}}**: {{reasoning}}
{{/each}}

## Known Issues & Constraints
{{#each known_issues}}
- **{{issue}}** ({{status}}): {{workaround}}
{{/each}}

## Lessons Learned
{{#each lessons_learned}}
- {{lesson}}
{{/each}}

## Goals for This Session
{{#each next_goals}}
- [{{priority}}] {{goal}}
{{/each}}

{{#if content}}
## Additional Notes
{{content}}
{{/if}}
"""

EXAMPLE_CONTEXT_DOCS = [
    {
        "project_name": "API Refactoring Project",
        "description": "Migrating REST API from v1 to v2 with breaking changes",
        "current_state": {
            "complete": [
                "Authentication endpoints migrated",
                "User endpoints migrated",
                "API documentation updated"
            ],
            "in_progress": [
                "Order endpoints migration",
                "Integration tests for new endpoints"
            ],
            "blocked": [
                "Payment integration - waiting on vendor SDK update"
            ]
        },
        "key_decisions": [
            {
                "decision": "Use versioned URLs (/v2/) instead of headers",
                "reasoning": "Easier for clients to test and debug, clearer in logs",
                "date": "2024-01-15"
            },
            {
                "decision": "Keep backward compatibility for 6 months",
                "reasoning": "Major clients need time to migrate",
                "date": "2024-01-10"
            }
        ],
        "known_issues": [
            {
                "issue": "Rate limiting not consistent between v1 and v2",
                "workaround": "Document differences, fix in sprint 4",
                "status": "open"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Start with comprehensive API schema validation",
                "context": "Found several edge cases late due to missing validation",
                "date": "2024-01-20"
            }
        ],
        "next_goals": [
            {"goal": "Complete order endpoints migration", "priority": "high"},
            {"goal": "Write migration guide for clients", "priority": "medium"}
        ]
    },
    {
        "project_name": "Dashboard Redesign",
        "description": "Modernizing the analytics dashboard with new charting library",
        "current_state": {
            "complete": [
                "Design mockups approved",
                "New charting library integrated"
            ],
            "in_progress": [
                "Converting existing charts to new format"
            ],
            "blocked": []
        },
        "key_decisions": [
            {
                "decision": "Use Chart.js instead of D3",
                "reasoning": "Simpler API, better documentation, sufficient for our needs",
                "date": "2024-01-08"
            }
        ],
        "known_issues": [],
        "lessons_learned": [
            {
                "lesson": "Test responsive behavior early",
                "context": "Had to redo several layouts for mobile",
                "date": "2024-01-18"
            }
        ],
        "next_goals": [
            {"goal": "Complete revenue chart conversion", "priority": "high"},
            {"goal": "Add export to PDF feature", "priority": "low"}
        ]
    }
]


# =============================================================================
# Nested Schemas
# =============================================================================

class CurrentState(BaseModel):
    """Current project state tracking."""
    complete: list[str] = []
    in_progress: list[str] = []
    blocked: list[str] = []


class KeyDecision(BaseModel):
    """A key decision with reasoning."""
    decision: str = Field(max_length=1000)
    reasoning: str = Field(max_length=5000)
    date: Optional[str] = Field(None, max_length=50)


class KnownIssue(BaseModel):
    """A known issue with workaround."""
    issue: str = Field(max_length=1000)
    workaround: str = Field("", max_length=5000)
    status: str = Field("open", max_length=20)  # open, resolved, wont_fix


class LessonLearned(BaseModel):
    """A lesson learned during the project."""
    lesson: str = Field(max_length=1000)
    context: str = Field("", max_length=5000)
    date: Optional[str] = Field(None, max_length=50)


class NextGoal(BaseModel):
    """A goal for upcoming sessions."""
    goal: str = Field(max_length=1000)
    priority: str = Field("medium", max_length=20)  # high, medium, low


# =============================================================================
# Context Document Schemas
# =============================================================================

class ContextDocCreate(BaseModel):
    """Schema for creating a context document."""
    project_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    current_state: Optional[CurrentState] = None
    key_decisions: list[KeyDecision] = []
    known_issues: list[KnownIssue] = []
    lessons_learned: list[LessonLearned] = []
    next_goals: list[NextGoal] = []
    content: Optional[str] = Field(None, max_length=10000)


class ContextDocUpdate(BaseModel):
    """Schema for updating a context document."""
    project_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    current_state: Optional[CurrentState] = None
    key_decisions: Optional[list[KeyDecision]] = None
    known_issues: Optional[list[KnownIssue]] = None
    lessons_learned: Optional[list[LessonLearned]] = None
    next_goals: Optional[list[NextGoal]] = None
    content: Optional[str] = Field(None, max_length=10000)
    is_active: Optional[bool] = None


class ContextDocSummary(BaseModel):
    """Lightweight summary for list view."""
    id: str
    project_name: str
    description: Optional[str]
    is_active: bool
    version: int
    session_count: int = 0
    last_session: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ContextDocResponse(BaseModel):
    """Full context document response."""
    id: str
    project_name: str
    description: Optional[str]
    current_state: dict
    key_decisions: list[dict]
    known_issues: list[dict]
    lessons_learned: list[dict]
    next_goals: list[dict]
    content: Optional[str]
    version: int
    is_active: bool
    session_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Session Schemas
# =============================================================================

class SessionCreate(BaseModel):
    """Schema for starting a new session."""
    context_doc_id: str
    goals: list[str] = []
    notes: Optional[str] = Field(None, max_length=10000)


class SessionUpdate(BaseModel):
    """Schema for updating/ending a session."""
    goals: Optional[list[str]] = None
    accomplishments: Optional[list[str]] = None
    decisions_made: Optional[list[KeyDecision]] = None
    issues_encountered: Optional[list[KnownIssue]] = None
    notes: Optional[str] = Field(None, max_length=10000)
    context_quality_rating: Optional[int] = Field(None, ge=1, le=10)
    continuity_rating: Optional[int] = Field(None, ge=1, le=10)
    ended_at: Optional[datetime] = None


class SessionSummary(BaseModel):
    """Lightweight session summary."""
    id: str
    context_doc_id: str
    project_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    accomplishment_count: int
    context_quality_rating: Optional[int]
    continuity_rating: Optional[int]

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Full session response."""
    id: str
    context_doc_id: str
    project_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    goals: list[str]
    accomplishments: list[str]
    decisions_made: list[dict]
    issues_encountered: list[dict]
    notes: Optional[str]
    context_quality_rating: Optional[int]
    continuity_rating: Optional[int]

    class Config:
        from_attributes = True


# =============================================================================
# Statistics Schema
# =============================================================================

class ContextDocsStats(BaseModel):
    """Statistics for context docs and sessions."""
    total_docs: int
    active_docs: int
    total_sessions: int
    sessions_this_week: int
    avg_context_quality: float
    avg_continuity_rating: float
    total_decisions: int
    total_lessons: int
    open_issues: int
    docs_by_activity: list[dict]  # [{project_name, session_count, last_session}]


# =============================================================================
# Prompt Generation
# =============================================================================

class GeneratePromptRequest(BaseModel):
    """Request to generate a context prompt."""
    context_doc_id: str
    include_decisions: bool = True
    include_issues: bool = True
    include_lessons: bool = True
    custom_additions: Optional[str] = Field(None, max_length=10000)
