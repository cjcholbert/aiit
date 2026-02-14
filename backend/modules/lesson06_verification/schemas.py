"""Week 4: Verification Tools - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Checklist Items
# =============================================================================

class ChecklistItemBase(BaseModel):
    """Base schema for checklist items."""
    text: str = Field(..., min_length=1, max_length=500)
    category: str = Field(default="general", max_length=50)  # critical, common_failure, edge_case, domain_specific
    is_critical: bool = False
    order: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    """Schema for creating a checklist item."""
    pass


class ChecklistItemResponse(ChecklistItemBase):
    """Schema for checklist item response."""
    id: str
    times_checked: int = 0
    times_caught_issue: int = 0

    class Config:
        from_attributes = True


# =============================================================================
# Skip Criteria
# =============================================================================

class SkipCriteria(BaseModel):
    """Criteria for when verification can be skipped."""
    trust_level_threshold: str = Field(default="high", pattern="^(high|medium|low)$")
    allow_low_stakes: bool = True
    allow_pattern_match: bool = True
    allow_prototyping: bool = True
    custom_conditions: list[str] = []


# =============================================================================
# Checklists
# =============================================================================

class ChecklistCreate(BaseModel):
    """Schema for creating a checklist."""
    name: str = Field(..., min_length=1, max_length=255)
    output_type: str = Field(..., min_length=1, max_length=100)
    output_type_id: Optional[str] = None  # Link to Week 3 output type
    description: str = ""
    items: list[ChecklistItemCreate] = []
    skip_criteria: Optional[SkipCriteria] = None


class ChecklistUpdate(BaseModel):
    """Schema for updating a checklist."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    output_type: Optional[str] = Field(None, min_length=1, max_length=100)
    output_type_id: Optional[str] = None
    description: Optional[str] = None
    items: Optional[list[ChecklistItemCreate]] = None
    skip_criteria: Optional[SkipCriteria] = None


class ChecklistSummary(BaseModel):
    """Summary schema for checklist list view."""
    id: str
    name: str
    output_type: str
    item_count: int
    critical_count: int
    session_count: int = 0
    avg_time_seconds: float = 0.0
    has_skip_criteria: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ChecklistResponse(BaseModel):
    """Full checklist response."""
    id: str
    name: str
    output_type: str
    output_type_id: Optional[str]
    description: str
    items: list[ChecklistItemResponse]
    skip_criteria: Optional[SkipCriteria]
    session_count: int = 0
    avg_time_seconds: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Verification Sessions
# =============================================================================

class VerificationSessionCreate(BaseModel):
    """Schema for starting a verification session."""
    checklist_id: str
    output_description: str = Field(..., min_length=1, max_length=1000)
    is_low_stakes: bool = False
    is_prototyping: bool = False


class VerificationItemResult(BaseModel):
    """Result for a single checklist item verification."""
    item_id: str
    was_checked: bool = True
    caught_issue: bool = False
    notes: str = ""


class VerificationSessionComplete(BaseModel):
    """Schema for completing a verification session."""
    item_results: list[VerificationItemResult]
    time_seconds: int
    overall_passed: bool
    issues_found: str = ""
    notes: str = ""


class VerificationSessionResponse(BaseModel):
    """Response for a verification session."""
    id: str
    checklist_id: str
    checklist_name: str
    output_description: str
    time_seconds: Optional[int]
    overall_passed: Optional[bool]
    issues_found: Optional[str]
    is_low_stakes: bool
    is_prototyping: bool
    completed: bool
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Statistics
# =============================================================================

class ChecklistStats(BaseModel):
    """Statistics for a checklist."""
    total_sessions: int
    completed_sessions: int
    avg_time_seconds: float
    pass_rate: float  # % of sessions that passed
    items_stats: list[dict]  # Per-item statistics


class VerificationStats(BaseModel):
    """Overall verification statistics."""
    total_checklists: int
    total_sessions: int
    avg_verification_time: float
    most_used_checklists: list[dict]
    most_effective_items: list[dict]  # Items that catch issues most often
    least_effective_items: list[dict]  # Items that never catch issues


# =============================================================================
# Default Checklists
# =============================================================================

DEFAULT_CHECKLISTS = [
    {
        "name": "Code Review Checklist",
        "output_type": "Code Syntax & Patterns",
        "description": "Standard verification for AI-generated code",
        "items": [
            {"text": "Syntax is valid (no obvious errors)", "category": "critical", "is_critical": True, "order": 0},
            {"text": "Variable/function names are clear and appropriate", "category": "general", "is_critical": False, "order": 1},
            {"text": "No hardcoded credentials or sensitive data", "category": "critical", "is_critical": True, "order": 2},
            {"text": "Error handling is present for edge cases", "category": "edge_case", "is_critical": False, "order": 3},
            {"text": "Logic handles empty/null inputs correctly", "category": "edge_case", "is_critical": False, "order": 4},
            {"text": "Code matches the requested functionality", "category": "critical", "is_critical": True, "order": 5},
        ],
        "skip_criteria": {
            "trust_level_threshold": "high",
            "allow_low_stakes": True,
            "allow_pattern_match": True,
            "allow_prototyping": True,
            "custom_conditions": []
        }
    },
    {
        "name": "API Integration Checklist",
        "output_type": "API Endpoints & Parameters",
        "description": "Verification for API-related code and configurations",
        "items": [
            {"text": "Endpoint URL is correct and current", "category": "critical", "is_critical": True, "order": 0},
            {"text": "HTTP method matches documentation", "category": "critical", "is_critical": True, "order": 1},
            {"text": "Required parameters are included", "category": "critical", "is_critical": True, "order": 2},
            {"text": "Authentication/headers are correct", "category": "critical", "is_critical": True, "order": 3},
            {"text": "Error response handling is implemented", "category": "common_failure", "is_critical": False, "order": 4},
            {"text": "Rate limiting considerations addressed", "category": "edge_case", "is_critical": False, "order": 5},
        ],
        "skip_criteria": {
            "trust_level_threshold": "high",
            "allow_low_stakes": False,
            "allow_pattern_match": True,
            "allow_prototyping": True,
            "custom_conditions": []
        }
    },
    {
        "name": "Security Recommendation Checklist",
        "output_type": "Security Recommendations",
        "description": "Verification for security-related AI suggestions",
        "items": [
            {"text": "Recommendation aligns with organization policy", "category": "critical", "is_critical": True, "order": 0},
            {"text": "No conflicts with existing security controls", "category": "critical", "is_critical": True, "order": 1},
            {"text": "Implementation won't break existing functionality", "category": "common_failure", "is_critical": False, "order": 2},
            {"text": "Recommendation is current (not outdated practice)", "category": "domain_specific", "is_critical": True, "order": 3},
            {"text": "Cross-referenced with trusted security source", "category": "critical", "is_critical": True, "order": 4},
        ],
        "skip_criteria": {
            "trust_level_threshold": "high",
            "allow_low_stakes": False,
            "allow_pattern_match": False,
            "allow_prototyping": False,
            "custom_conditions": ["Only skip for informational queries, never for implementation"]
        }
    },
    {
        "name": "Documentation Checklist",
        "output_type": "Documentation & Explanations",
        "description": "Quick verification for AI-generated documentation",
        "items": [
            {"text": "Technical terms are used correctly", "category": "critical", "is_critical": True, "order": 0},
            {"text": "Steps/instructions are in correct order", "category": "common_failure", "is_critical": False, "order": 1},
            {"text": "No contradictions or conflicting statements", "category": "common_failure", "is_critical": False, "order": 2},
            {"text": "Appropriate for target audience", "category": "general", "is_critical": False, "order": 3},
        ],
        "skip_criteria": {
            "trust_level_threshold": "medium",
            "allow_low_stakes": True,
            "allow_pattern_match": True,
            "allow_prototyping": True,
            "custom_conditions": []
        }
    }
]
