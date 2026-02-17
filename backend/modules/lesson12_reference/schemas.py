"""Lesson 12: Reference Card - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Constants
# =============================================================================

CARD_SECTIONS = {
    "trust_zones": {
        "name": "Trust Zones",
        "description": "Quick reference for output types and verification needs",
        "source": "Lesson 5: Trust Matrix"
    },
    "templates": {
        "name": "Go-To Templates",
        "description": "Your most effective context templates",
        "source": "Lesson 3: Template Builder"
    },
    "verification": {
        "name": "Verification Shortcuts",
        "description": "Quick checks for different output types",
        "source": "Lesson 6: Verification Tools"
    },
    "delegation": {
        "name": "Delegation Patterns",
        "description": "Effective task handoff strategies",
        "source": "Lessons 7-8: Decomposer & Delegation"
    },
    "iteration": {
        "name": "Iteration Style",
        "description": "Your preferred 70-85-95 approach",
        "source": "Lesson 9: Iteration Passes"
    },
    "feedback": {
        "name": "Feedback Principles",
        "description": "Rules for effective AI feedback",
        "source": "Lesson 2: Feedback Analyzer"
    },
    "workflows": {
        "name": "Workflow Highlights",
        "description": "Your most time-saving workflows",
        "source": "Lesson 10: Status Reporter"
    },
    "context": {
        "name": "Context Best Practices",
        "description": "Key patterns for session continuity",
        "source": "Lesson 4: Context Docs"
    },
    "frontier": {
        "name": "Frontier Map",
        "description": "AI reliability zones at a glance",
        "source": "Lesson 11: Frontier Mapper"
    },
    "personal": {
        "name": "Personal Rules",
        "description": "Your custom AI collaboration rules",
        "source": "Your insights"
    }
}

EXPORT_FORMATS = ["markdown", "html", "json"]

EXAMPLE_REFERENCE_CARD = {
    "name": "My AI Reference Card",
    "top_templates": [
        {
            "name": "Code Review Request",
            "category": "coding",
            "usage_count": 47,
            "snippet": "Review this {{language}} code for {{focus_area}}..."
        },
        {
            "name": "Meeting Summary",
            "category": "writing",
            "usage_count": 32,
            "snippet": "Summarize the key points from this meeting..."
        }
    ],
    "trust_zones": [
        {"type": "Python Scripts", "level": "high", "verify": "Run tests, check edge cases"},
        {"type": "SQL Queries", "level": "medium", "verify": "Test on sample data first"},
        {"type": "Legal Text", "level": "low", "verify": "Always have lawyer review"}
    ],
    "verification_shortcuts": [
        {"output_type": "Code", "quick_check": "Run linter + basic test"},
        {"output_type": "Emails", "quick_check": "Read aloud for tone"},
        {"output_type": "Data Analysis", "quick_check": "Spot-check 3 calculations"}
    ],
    "delegation_patterns": [
        {"pattern": "Scaffold First", "description": "Get structure, fill details myself"},
        {"pattern": "Iterate Together", "description": "70% draft, refine collaboratively"}
    ],
    "iteration_style": {
        "preferred_passes": 3,
        "typical_flow": "Structure -> Content -> Polish",
        "feedback_style": "Specific examples over general direction"
    },
    "feedback_principles": [
        "Be specific: 'Make paragraph 2 more concise' not 'Make it better'",
        "Give examples when possible",
        "Explain the 'why' behind requests"
    ],
    "workflow_highlights": [
        {"name": "Weekly Status Report", "time_saved": "35 min/week"},
        {"name": "Code Documentation", "time_saved": "20 min/use"}
    ],
    "context_best_practices": [
        "Start sessions with project state summary",
        "Document decisions with reasoning",
        "End sessions by updating context doc"
    ],
    "frontier_map": {
        "reliable": ["Python scripting", "Email drafting", "Documentation"],
        "mixed": ["Data analysis", "Code review suggestions"],
        "unreliable": ["Legal interpretation", "Financial advice"]
    },
    "personal_rules": [
        "Always verify calculations independently",
        "Never trust AI for dates or current events",
        "Use AI for first drafts, human review for finals"
    ],
    "quick_prompts": [
        {"trigger": "review", "prompt": "Review this code for bugs, security issues, and performance..."},
        {"trigger": "explain", "prompt": "Explain this concept as if to a junior developer..."}
    ]
}


# =============================================================================
# Card Schemas
# =============================================================================

class PersonalRule(BaseModel):
    """A personal AI collaboration rule."""
    rule: str = Field(max_length=5000)
    category: Optional[str] = Field(None, max_length=500)


class QuickPrompt(BaseModel):
    """A frequently used prompt trigger."""
    trigger: str = Field(max_length=500)
    prompt: str = Field(max_length=10000)
    category: Optional[str] = Field(None, max_length=500)


class CustomSection(BaseModel):
    """A user-defined section on the reference card."""
    title: str = Field(max_length=500)
    content: str = Field(max_length=10000)
    order: int = 0


class CardCreate(BaseModel):
    """Schema for creating a reference card."""
    name: str = Field("My AI Reference Card", min_length=1, max_length=255)
    personal_rules: list[str] = []
    quick_prompts: list[dict] = []
    custom_sections: list[dict] = []


class CardUpdate(BaseModel):
    """Schema for updating a reference card."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    top_templates: Optional[list[dict]] = None
    trust_zones: Optional[list[dict]] = None
    verification_shortcuts: Optional[list[dict]] = None
    delegation_patterns: Optional[list[dict]] = None
    iteration_style: Optional[dict] = None
    feedback_principles: Optional[list[str]] = None
    workflow_highlights: Optional[list[dict]] = None
    context_best_practices: Optional[list[str]] = None
    frontier_map: Optional[dict] = None
    personal_rules: Optional[list[str]] = None
    quick_prompts: Optional[list[dict]] = None
    custom_sections: Optional[list[dict]] = None
    is_primary: Optional[bool] = None


class CardSummary(BaseModel):
    """Lightweight card summary for list view."""
    id: str
    name: str
    is_primary: bool
    section_count: int
    last_generated: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CardResponse(BaseModel):
    """Full reference card response."""
    id: str
    name: str
    top_templates: list[dict]
    trust_zones: list[dict]
    verification_shortcuts: list[dict]
    delegation_patterns: list[dict]
    iteration_style: dict
    feedback_principles: list[str]
    workflow_highlights: list[dict]
    context_best_practices: list[str]
    frontier_map: dict
    personal_rules: list[str]
    quick_prompts: list[dict]
    custom_sections: list[dict]
    is_primary: bool
    last_generated: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Generation Schemas
# =============================================================================

class GenerateRequest(BaseModel):
    """Request to generate/regenerate card content from user data."""
    include_templates: bool = True
    include_trust: bool = True
    include_verification: bool = True
    include_delegation: bool = True
    include_iteration: bool = True
    include_feedback: bool = True
    include_workflows: bool = True
    include_context: bool = True
    include_frontier: bool = True


class ExportRequest(BaseModel):
    """Request to export the reference card."""
    format: str = Field("markdown", max_length=50)  # markdown, html, json
    include_sections: list[str] = []  # Empty = all sections


# =============================================================================
# Statistics Schema
# =============================================================================

class CurriculumProgress(BaseModel):
    """Progress through the 12-lesson curriculum."""
    week: int
    name: str = Field(max_length=500)
    status: str = Field(max_length=50)  # "completed", "in_progress", "not_started"
    items_created: int
    last_activity: Optional[datetime]


class ReferenceStats(BaseModel):
    """Statistics for the reference card and curriculum completion."""
    has_primary_card: bool
    total_cards: int
    curriculum_progress: list[CurriculumProgress]
    completion_percentage: float
    total_items_created: int
    most_active_week: Optional[str]
    weeks_with_data: int
