"""Week 5: Task Decomposer - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Task Categories
# =============================================================================

TASK_CATEGORIES = {
    "ai_optimal": {
        "label": "AI-Optimal",
        "color": "#4ade80",  # Green
        "description": "Well-defined input → well-defined output. Pattern-based work, no institutional knowledge required.",
        "examples": [
            "Generate boilerplate code from a template",
            "Format data from one structure to another",
            "Summarize a document or research findings",
            "Create standard documentation",
            "Write unit tests for existing functions"
        ],
        "signals": [
            "Clear input and output format",
            "Follows established patterns",
            "Easy to verify correctness",
            "No special access or authority needed"
        ]
    },
    "collaborative": {
        "label": "Collaborative",
        "color": "#fbbf24",  # Yellow
        "description": "Requires judgment calls. Benefits from your context combined with AI capability.",
        "examples": [
            "Develop a project strategy or approach",
            "Analyze complex data with business context",
            "Refine creative content iteratively",
            "Debug tricky issues with system knowledge",
            "Design architecture with constraints"
        ],
        "signals": [
            "Needs your expertise",
            "Multiple valid approaches possible",
            "Requires iteration and refinement",
            "Context-dependent decisions"
        ]
    },
    "human_primary": {
        "label": "Human-Primary",
        "color": "#f87171",  # Red
        "description": "Requires your authority, credentials, or institutional knowledge AI cannot have.",
        "examples": [
            "Make final approval decisions",
            "Send sensitive communications",
            "Take real-world actions (deploy, pay, sign)",
            "Handle confidential information",
            "Manage interpersonal situations"
        ],
        "signals": [
            "Requires your authority or signature",
            "Involves confidential/sensitive data",
            "Has real-world consequences",
            "Needs relationship or political awareness"
        ]
    }
}


# =============================================================================
# Tasks within a Decomposition
# =============================================================================

class TaskBase(BaseModel):
    """Base schema for tasks."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = Field(..., pattern="^(ai_optimal|collaborative|human_primary)$")
    reasoning: str = ""  # Why this category
    order: int = 0
    dependencies: list[str] = []  # List of task IDs this depends on
    is_decision_gate: bool = False  # Review point before continuing
    parallel_group: Optional[str] = None  # Tasks that can run in parallel
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(ai_optimal|collaborative|human_primary)$")
    reasoning: Optional[str] = None
    order: Optional[int] = None
    dependencies: Optional[list[str]] = None
    is_decision_gate: Optional[bool] = None
    parallel_group: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: str

    class Config:
        from_attributes = True


# =============================================================================
# Decompositions
# =============================================================================

class DecompositionCreate(BaseModel):
    """Schema for creating a decomposition."""
    project_name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    tasks: list[TaskCreate] = []


class DecompositionUpdate(BaseModel):
    """Schema for updating a decomposition."""
    project_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tasks: Optional[list[TaskCreate]] = None


class DecompositionSummary(BaseModel):
    """Summary schema for decomposition list view."""
    id: str
    project_name: str
    task_count: int
    ai_optimal_count: int
    collaborative_count: int
    human_primary_count: int
    completed_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DecompositionResponse(BaseModel):
    """Full decomposition response."""
    id: str
    project_name: str
    description: str
    tasks: list[TaskResponse]
    categories: dict  # Category counts
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Statistics
# =============================================================================

class DecompositionStats(BaseModel):
    """Statistics for decompositions."""
    total_decompositions: int
    total_tasks: int
    category_distribution: dict[str, int]  # ai_optimal, collaborative, human_primary counts
    category_percentages: dict[str, float]
    avg_tasks_per_decomposition: float
    most_common_category: str
    decision_gates_count: int
    completed_tasks: int
    completion_rate: float


# =============================================================================
# Example Decompositions
# =============================================================================

EXAMPLE_DECOMPOSITIONS = [
    {
        "project_name": "Build a REST API Endpoint",
        "description": "Create a new API endpoint for user profile management",
        "tasks": [
            {
                "title": "Research existing patterns",
                "description": "Look at how similar endpoints are structured in the codebase",
                "category": "ai_optimal",
                "reasoning": "Pattern-based research with clear output",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Design endpoint structure",
                "description": "Decide on routes, methods, and data shapes",
                "category": "collaborative",
                "reasoning": "Needs judgment about architecture trade-offs",
                "order": 1,
                "is_decision_gate": True
            },
            {
                "title": "Generate boilerplate code",
                "description": "Create the basic endpoint structure and models",
                "category": "ai_optimal",
                "reasoning": "Well-defined pattern, easy to verify",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Implement business logic",
                "description": "Add the specific validation and processing rules",
                "category": "collaborative",
                "reasoning": "Requires understanding of business requirements",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Write tests",
                "description": "Create unit and integration tests",
                "category": "ai_optimal",
                "reasoning": "Pattern-based, clear success criteria",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Code review and approval",
                "description": "Get team sign-off before merging",
                "category": "human_primary",
                "reasoning": "Requires authority and team judgment",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    {
        "project_name": "Prepare Quarterly Report",
        "description": "Create Q4 performance report for stakeholders",
        "tasks": [
            {
                "title": "Gather raw data",
                "description": "Export metrics from various systems",
                "category": "human_primary",
                "reasoning": "Requires access to confidential systems",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Clean and format data",
                "description": "Transform raw data into analyzable format",
                "category": "ai_optimal",
                "reasoning": "Clear transformation rules, pattern-based",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Analyze trends and insights",
                "description": "Identify key patterns and their business implications",
                "category": "collaborative",
                "reasoning": "Needs business context for meaningful insights",
                "order": 2,
                "is_decision_gate": True
            },
            {
                "title": "Draft report narrative",
                "description": "Write the story around the numbers",
                "category": "collaborative",
                "reasoning": "Needs refinement for tone and emphasis",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Create visualizations",
                "description": "Build charts and graphs for key metrics",
                "category": "ai_optimal",
                "reasoning": "Standard visualization patterns",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Executive review and sign-off",
                "description": "Get leadership approval before distribution",
                "category": "human_primary",
                "reasoning": "Requires authority and final judgment",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    }
]
