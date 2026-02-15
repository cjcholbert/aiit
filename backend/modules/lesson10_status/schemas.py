"""Lesson 10: Status Reporter - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Workflow Constants
# =============================================================================

WORKFLOW_FREQUENCIES = {
    "daily": {"name": "Daily", "description": "Tasks you do every day"},
    "weekly": {"name": "Weekly", "description": "Tasks you do once a week"},
    "biweekly": {"name": "Bi-weekly", "description": "Tasks you do every two weeks"},
    "monthly": {"name": "Monthly", "description": "Tasks you do once a month"}
}

WORKFLOW_CRITERIA = {
    "frequency": {
        "label": "Happens at least weekly",
        "description": "Recurring tasks benefit most from AI integration"
    },
    "duration": {
        "label": "Takes 30+ minutes currently",
        "description": "Tasks that take time have more room for efficiency gains"
    },
    "inputs": {
        "label": "Has predictable inputs",
        "description": "Clear inputs make AI prompts more reliable"
    },
    "outputs": {
        "label": "Produces similar outputs each time",
        "description": "Consistent outputs mean templates can be reused"
    }
}

QUALITY_CHECK_TYPES = [
    {
        "id": "accuracy",
        "name": "Accuracy Check",
        "description": "Verify facts and data are correct"
    },
    {
        "id": "completeness",
        "name": "Completeness Check",
        "description": "All required sections included"
    },
    {
        "id": "tone",
        "name": "Tone Check",
        "description": "Appropriate voice and style"
    },
    {
        "id": "formatting",
        "name": "Format Check",
        "description": "Proper structure and layout"
    },
    {
        "id": "relevance",
        "name": "Relevance Check",
        "description": "Content is targeted and on-topic"
    }
]

EXAMPLE_WORKFLOWS = [
    {
        "name": "Weekly Status Report",
        "description": "Generate team status report for stakeholders",
        "frequency": "weekly",
        "estimated_time_minutes": 45,
        "inputs": [
            {"name": "accomplishments", "type": "text", "description": "Key accomplishments this week", "required": True},
            {"name": "blockers", "type": "text", "description": "Current blockers or risks", "required": True},
            {"name": "next_week", "type": "text", "description": "Priorities for next week", "required": True}
        ],
        "steps": [
            {"order": 1, "description": "Gather accomplishments from task tracker", "is_ai_step": False},
            {"order": 2, "description": "Identify blockers from team standup notes", "is_ai_step": False},
            {"order": 3, "description": "Draft priorities based on roadmap", "is_ai_step": False},
            {"order": 4, "description": "Generate report using AI template", "is_ai_step": True},
            {"order": 5, "description": "Review and adjust tone/details", "is_ai_step": False}
        ],
        "prompt_template": """Generate a professional weekly status report with the following information:

## Accomplishments
{{accomplishments}}

## Blockers/Risks
{{blockers}}

## Next Week Priorities
{{next_week}}

Format this as a concise executive summary suitable for stakeholders. Use bullet points for clarity. Keep the tone professional but accessible.""",
        "quality_checks": ["accuracy", "completeness", "tone"]
    },
    {
        "name": "Meeting Summary",
        "description": "Transform meeting notes into structured summary",
        "frequency": "daily",
        "estimated_time_minutes": 20,
        "inputs": [
            {"name": "meeting_notes", "type": "text", "description": "Raw meeting notes", "required": True},
            {"name": "attendees", "type": "text", "description": "List of attendees", "required": False},
            {"name": "meeting_type", "type": "text", "description": "Type of meeting (standup, planning, review)", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Copy raw notes from meeting", "is_ai_step": False},
            {"order": 2, "description": "Generate structured summary", "is_ai_step": True},
            {"order": 3, "description": "Verify action items are accurate", "is_ai_step": False},
            {"order": 4, "description": "Distribute to attendees", "is_ai_step": False}
        ],
        "prompt_template": """Transform these meeting notes into a structured summary:

## Raw Notes
{{meeting_notes}}

{{#if attendees}}Attendees: {{attendees}}{{/if}}
{{#if meeting_type}}Meeting Type: {{meeting_type}}{{/if}}

Create a summary with these sections:
1. Key Discussion Points (bullet points)
2. Decisions Made
3. Action Items (with owner if mentioned)
4. Next Steps/Follow-ups

Be concise. Focus on actionable outcomes.""",
        "quality_checks": ["accuracy", "completeness"]
    },
    {
        "name": "Client Communication",
        "description": "Draft professional client update emails",
        "frequency": "weekly",
        "estimated_time_minutes": 30,
        "inputs": [
            {"name": "project_status", "type": "text", "description": "Current project status", "required": True},
            {"name": "milestones", "type": "text", "description": "Completed or upcoming milestones", "required": True},
            {"name": "client_name", "type": "text", "description": "Client name for personalization", "required": True},
            {"name": "concerns", "type": "text", "description": "Any concerns or blockers to communicate", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Review project management tool for status", "is_ai_step": False},
            {"order": 2, "description": "List milestones and timeline updates", "is_ai_step": False},
            {"order": 3, "description": "Generate professional email draft", "is_ai_step": True},
            {"order": 4, "description": "Review tone and accuracy", "is_ai_step": False},
            {"order": 5, "description": "Send email", "is_ai_step": False}
        ],
        "prompt_template": """Draft a professional client update email:

Client: {{client_name}}
Project Status: {{project_status}}
Milestones: {{milestones}}
{{#if concerns}}Concerns to Address: {{concerns}}{{/if}}

Write a professional, friendly email that:
- Starts with a brief greeting
- Summarizes current status clearly
- Highlights progress on milestones
- Addresses any concerns proactively
- Ends with clear next steps

Keep the tone professional yet warm. Be concise but thorough.""",
        "quality_checks": ["accuracy", "tone", "completeness"]
    }
]


# =============================================================================
# Input/Step Schemas
# =============================================================================

class WorkflowInput(BaseModel):
    """A single input field for a workflow."""
    name: str
    type: str = "text"  # text, list, number
    description: str
    required: bool = True


class WorkflowStep(BaseModel):
    """A single step in a workflow."""
    order: int
    description: str
    is_ai_step: bool = False


# =============================================================================
# Create/Update Schemas
# =============================================================================

class WorkflowTemplateCreate(BaseModel):
    """Schema for creating a workflow template."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    frequency: str = "weekly"
    estimated_time_minutes: Optional[int] = Field(None, ge=1)
    inputs: list[WorkflowInput] = []
    steps: list[WorkflowStep] = []
    prompt_template: Optional[str] = None
    quality_checks: list[str] = []


class WorkflowTemplateUpdate(BaseModel):
    """Schema for updating a workflow template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    frequency: Optional[str] = None
    estimated_time_minutes: Optional[int] = Field(None, ge=1)
    inputs: Optional[list[WorkflowInput]] = None
    steps: Optional[list[WorkflowStep]] = None
    prompt_template: Optional[str] = None
    quality_checks: Optional[list[str]] = None
    is_active: Optional[bool] = None


class StatusReportCreate(BaseModel):
    """Schema for creating a status report."""
    template_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    inputs_used: dict = {}
    generated_content: Optional[str] = None
    actual_time_minutes: Optional[int] = Field(None, ge=1)
    quality_score: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class StatusReportUpdate(BaseModel):
    """Schema for updating a status report."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    generated_content: Optional[str] = None
    actual_time_minutes: Optional[int] = Field(None, ge=1)
    quality_score: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


# =============================================================================
# Response Schemas
# =============================================================================

class WorkflowTemplateSummary(BaseModel):
    """Lightweight summary for list view."""
    id: str
    name: str
    description: Optional[str]
    frequency: str
    estimated_time_minutes: Optional[int]
    is_active: bool
    report_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowTemplateResponse(BaseModel):
    """Full workflow template response."""
    id: str
    name: str
    description: Optional[str]
    frequency: str
    estimated_time_minutes: Optional[int]
    inputs: list[dict]
    steps: list[dict]
    prompt_template: Optional[str]
    quality_checks: list[str]
    is_active: bool
    report_count: int = 0
    avg_time_saved: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class StatusReportSummary(BaseModel):
    """Lightweight summary for list view."""
    id: str
    template_id: Optional[str]
    template_name: Optional[str]
    title: str
    actual_time_minutes: Optional[int]
    quality_score: Optional[int]
    time_saved_minutes: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class StatusReportResponse(BaseModel):
    """Full status report response."""
    id: str
    template_id: Optional[str]
    template_name: Optional[str]
    title: str
    inputs_used: dict
    generated_content: Optional[str]
    actual_time_minutes: Optional[int]
    quality_score: Optional[int]
    time_saved_minutes: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Statistics Schema
# =============================================================================

class WorkflowStats(BaseModel):
    """Statistics for workflow templates and reports."""
    total_templates: int
    active_templates: int
    total_reports: int
    total_time_saved_minutes: int
    avg_quality_score: float
    reports_this_week: int
    most_used_template: Optional[str]
    reports_by_template: list[dict]  # [{template_name, count}]
    time_saved_by_frequency: dict  # {daily: n, weekly: n, ...}
