"""Week 6: Delegation Tracker - Pydantic schemas."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# =============================================================================
# Delegation Template Elements
# =============================================================================

TEMPLATE_ELEMENTS = {
    "context": {
        "label": "Context",
        "description": "Background information the AI needs to understand the task",
        "placeholder": "You are working on [project]. The current state is [state]. Key constraints include [constraints].",
        "tips": [
            "Reference your Week 2 context templates",
            "Include relevant technical environment details",
            "Mention any previous related work"
        ]
    },
    "objective": {
        "label": "Objective",
        "description": "Single clear outcome - what does 'done' look like?",
        "placeholder": "Create a [specific deliverable] that [achieves specific goal].",
        "tips": [
            "Be specific about the end state",
            "One objective per delegation",
            "Make it measurable if possible"
        ]
    },
    "scope": {
        "label": "Scope",
        "description": "What to include and what to explicitly exclude",
        "placeholder": "Include: [list]. Exclude: [list]. Do not: [boundaries].",
        "tips": [
            "Prevent scope creep by being explicit",
            "List things that might seem related but aren't needed",
            "Set clear boundaries"
        ]
    },
    "deliverable": {
        "label": "Deliverable",
        "description": "Specific output format expected",
        "placeholder": "Provide the output as [format] with [structure]. Include [specific elements].",
        "tips": [
            "Specify file format, structure, length",
            "Give examples of desired format",
            "Be precise about what to include"
        ]
    },
    "success_criteria": {
        "label": "Success Criteria",
        "description": "How you'll evaluate the output",
        "placeholder": "Success means: [criteria 1], [criteria 2], [criteria 3].",
        "tips": [
            "List specific checkpoints",
            "Reference your Week 4 verification checklists",
            "Make criteria binary (pass/fail) when possible"
        ]
    }
}


# =============================================================================
# Task Sequence Items
# =============================================================================

class SequenceTaskBase(BaseModel):
    """Base schema for tasks in a delegation sequence."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = Field(default="ai_optimal", pattern="^(ai_optimal|collaborative|human_primary)$")
    prompt: str = ""  # The actual delegation prompt for this task
    expected_output: str = ""
    order: int = 0
    status: str = Field(default="pending", pattern="^(pending|delegated|reviewing|completed|blocked)$")
    output_received: str = ""  # What AI actually returned
    review_notes: str = ""
    is_decision_gate: bool = False
    success_criteria: list[str] = []  # Task-level criteria (overrides template if set)
    ai_review: Optional[dict] = None  # Stores DelegationReview as JSON


class SequenceTaskCreate(SequenceTaskBase):
    """Schema for creating a sequence task."""
    pass


class SequenceTaskUpdate(BaseModel):
    """Schema for updating a sequence task."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(ai_optimal|collaborative|human_primary)$")
    prompt: Optional[str] = None
    expected_output: Optional[str] = None
    order: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(pending|delegated|reviewing|completed|blocked)$")
    output_received: Optional[str] = None
    review_notes: Optional[str] = None
    is_decision_gate: Optional[bool] = None
    success_criteria: Optional[list[str]] = None
    ai_review: Optional[dict] = None


class SequenceTaskResponse(SequenceTaskBase):
    """Schema for sequence task response."""
    id: str

    class Config:
        from_attributes = True


# =============================================================================
# Delegations
# =============================================================================

class DelegationCreate(BaseModel):
    """Schema for creating a delegation."""
    name: str = Field(..., min_length=1, max_length=255)
    template: str = ""  # The delegation prompt template
    task_sequence: list[SequenceTaskCreate] = []
    notes: str = ""


class DelegationUpdate(BaseModel):
    """Schema for updating a delegation."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    template: Optional[str] = None
    task_sequence: Optional[list[SequenceTaskCreate]] = None
    notes: Optional[str] = None


class DelegationSummary(BaseModel):
    """Summary schema for delegation list view."""
    id: str
    name: str
    task_count: int
    completed_count: int
    current_task: Optional[str]  # Title of current task
    has_template: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DelegationResponse(BaseModel):
    """Full delegation response."""
    id: str
    name: str
    template: str
    task_sequence: list[SequenceTaskResponse]
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Statistics
# =============================================================================

class DelegationStats(BaseModel):
    """Statistics for delegations."""
    total_delegations: int
    total_tasks: int
    tasks_completed: int
    tasks_pending: int
    completion_rate: float
    avg_tasks_per_delegation: float
    delegations_with_templates: int


# =============================================================================
# AI Review Schemas
# =============================================================================

class CriterionResult(BaseModel):
    """Result of evaluating a single success criterion."""
    criterion: str           # The success criterion text
    passed: bool             # Did output meet this criterion?
    reasoning: str           # AI's explanation
    confidence: float        # 0-1 confidence score


class DelegationReview(BaseModel):
    """Structured review of AI output against success criteria."""
    overall_pass: bool
    criteria_results: list[CriterionResult]
    summary: str             # Overall assessment
    suggestions: list[str]   # Improvement suggestions if needed
    ai_extracted_output: str # The parsed/normalized output


class AnalyzeRequest(BaseModel):
    """Request body for analyze endpoint."""
    raw_output: str = Field(..., min_length=1)


# =============================================================================
# Example Templates
# =============================================================================

EXAMPLE_TEMPLATES = [
    {
        "name": "Code Generation Template",
        "template": """## Context
I'm working on [PROJECT_NAME], a [TECH_STACK] application.
Current state: [CURRENT_STATE]
Relevant files: [FILE_LIST]

## Objective
Create [SPECIFIC_CODE] that [ACHIEVES_GOAL].

## Scope
Include: [INCLUSIONS]
Exclude: [EXCLUSIONS]
Do not: modify existing functionality, add dependencies without asking

## Deliverable
Provide the code as a complete, runnable [FILE_TYPE].
Include: necessary imports, error handling, comments for complex logic.
Format: Use [STYLE_GUIDE] conventions.

## Success Criteria
- [ ] Code runs without errors
- [ ] Handles edge cases: [LIST]
- [ ] Follows existing patterns in the codebase
- [ ] Includes basic error handling""",
        "task_sequence": [
            {
                "title": "Generate initial code",
                "description": "First pass at the implementation",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Review and refine",
                "description": "Check against success criteria, request improvements",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Integration testing",
                "description": "Test in actual environment",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": False
            }
        ]
    },
    {
        "name": "Documentation Template",
        "template": """## Context
Documenting [COMPONENT/FEATURE] for [AUDIENCE].
Related code: [FILE_REFERENCES]
Existing docs: [DOC_REFERENCES]

## Objective
Create [DOC_TYPE] that explains [WHAT_TO_EXPLAIN] so that [TARGET_AUDIENCE] can [DESIRED_OUTCOME].

## Scope
Include: [SECTIONS_TO_COVER]
Exclude: [OUT_OF_SCOPE]
Assume reader knows: [PREREQUISITES]

## Deliverable
Provide as [FORMAT] with:
- Clear headings and structure
- Code examples where helpful
- [SPECIFIC_SECTIONS]

## Success Criteria
- [ ] Accurate technical details
- [ ] Appropriate for target audience
- [ ] Follows existing documentation style
- [ ] Includes practical examples""",
        "task_sequence": [
            {
                "title": "Draft documentation",
                "description": "Create initial documentation draft",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Technical accuracy review",
                "description": "Verify all technical details are correct",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Publish documentation",
                "description": "Add to documentation system",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": False
            }
        ]
    }
]
