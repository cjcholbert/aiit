"""Lesson 11: Frontier Mapper - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Constants
# =============================================================================

RELIABILITY_LEVELS = {
    "reliable": {
        "name": "Reliable Zone",
        "description": "AI consistently performs well here",
        "color": "green"
    },
    "mixed": {
        "name": "Mixed Zone",
        "description": "AI performance varies - verify carefully",
        "color": "yellow"
    },
    "unreliable": {
        "name": "Unreliable Zone",
        "description": "AI often struggles - high verification needed",
        "color": "red"
    }
}

ZONE_CATEGORIES = [
    {"id": "writing", "name": "Writing & Content"},
    {"id": "analysis", "name": "Analysis & Research"},
    {"id": "data", "name": "Data & Calculations"},
    {"id": "creative", "name": "Creative & Design"},
    {"id": "planning", "name": "Planning & Strategy"},
    {"id": "communication", "name": "Communication & Email"},
    {"id": "documentation", "name": "Documentation & Reports"},
    {"id": "brainstorming", "name": "Brainstorming & Ideation"},
    {"id": "summarization", "name": "Summarization & Review"},
    {"id": "other", "name": "Other"}
]

ENCOUNTER_TYPES = {
    "success": {
        "name": "Success",
        "description": "AI performed as expected or better",
        "icon": "check-circle"
    },
    "failure": {
        "name": "Failure",
        "description": "AI failed to deliver usable output",
        "icon": "x-circle"
    },
    "surprise": {
        "name": "Surprise",
        "description": "Unexpected result (positive or negative)",
        "icon": "alert-circle"
    }
}

EXAMPLE_ZONES = [
    {
        "name": "Internal Email Drafting",
        "category": "communication",
        "reliability": "reliable",
        "confidence": 85,
        "strengths": [
            "Professional tone and structure",
            "Appropriate formality for different audiences",
            "Clear calls to action"
        ],
        "weaknesses": [
            "Company-specific terminology and acronyms",
            "Relationship nuances between individuals",
            "Cultural context within your organization"
        ],
        "verification_needs": "Quick read-through for tone and accuracy of facts before sending"
    },
    {
        "name": "Meeting Summary Notes",
        "category": "summarization",
        "reliability": "reliable",
        "confidence": 80,
        "strengths": [
            "Captures key discussion points clearly",
            "Organizes action items with owners",
            "Structures notes in a professional format"
        ],
        "weaknesses": [
            "May miss nuance or subtext in discussions",
            "Cannot distinguish tentative ideas from firm decisions",
            "Struggles with ambiguous or overlapping topics"
        ],
        "verification_needs": "Compare against your own recollection of key decisions and confirm action items with attendees"
    },
    {
        "name": "Policy and Compliance Guidance",
        "category": "analysis",
        "reliability": "unreliable",
        "confidence": 30,
        "strengths": [
            "Provides general frameworks for thinking about compliance",
            "Explains common regulatory concepts in plain language",
            "Good starting point for structuring checklists"
        ],
        "weaknesses": [
            "May cite outdated regulations or incorrect effective dates",
            "Misses jurisdiction-specific requirements",
            "Presents incorrect information with full confidence"
        ],
        "verification_needs": "ALWAYS verify with appropriate professional before acting on any guidance. Never use as sole basis for compliance decisions."
    },
    {
        "name": "Budget Variance Explanations",
        "category": "data",
        "reliability": "mixed",
        "confidence": 50,
        "strengths": [
            "Structures financial narratives clearly",
            "Identifies obvious trends from clean data",
            "Explains numbers in accessible language"
        ],
        "weaknesses": [
            "Confuses correlation with causation",
            "Cannot know the business context behind numbers",
            "Misses one-time events or unusual items unless told"
        ],
        "verification_needs": "Verify every causal claim against actual business knowledge. Add context for any unusual line items."
    }
]

EXAMPLE_ENCOUNTERS = [
    {
        "encounter_type": "success",
        "task_description": "Asked AI to draft a risk register for a facilities relocation project across timeline, budget, and personnel categories",
        "outcome": "Identified 12 risk categories — 10 were directly relevant and useful, 2 were easily refined with a follow-up prompt",
        "expected_result": "Expected significant manual rework, but it was a strong starting point",
        "lessons": "AI is effective for generating risk checklists when given a specific project type. Best used as a brainstorming accelerator, not a final product.",
        "tags": ["risk-management", "project-planning", "brainstorming"]
    },
    {
        "encounter_type": "failure",
        "task_description": "Asked AI to summarize new state paid leave requirements including eligible employees, accrual rates, and employer obligations",
        "outcome": "Provided a detailed summary with confident specifics, but effective dates were wrong, two exemptions were missing, and the accrual rate was from a draft version of the law",
        "expected_result": "Expected a reliable summary of publicly available law for an internal memo",
        "lessons": "AI is unreliable for current legal and regulatory information. It presents outdated details with full confidence. Always verify against official sources.",
        "tags": ["compliance", "workplace-policy", "verification-critical"]
    },
    {
        "encounter_type": "surprise",
        "task_description": "Asked AI to rewrite a formal internal announcement about a wellness program into a conversational tone for the company newsletter",
        "outcome": "Not only shifted the tone effectively but reorganized the content to lead with employee benefits rather than program logistics — better structure than expected",
        "expected_result": "Expected mediocre results needing heavy rewriting",
        "lessons": "AI handles tone shifts well when given clear examples of source and target voice. Providing audience details produces dramatically better results.",
        "tags": ["internal-communications", "tone-adaptation", "content-rewriting"]
    }
]


# =============================================================================
# Zone Schemas
# =============================================================================

class ZoneCreate(BaseModel):
    """Schema for creating a frontier zone."""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field("other", max_length=500)
    reliability: str = Field("mixed", max_length=50)
    confidence: int = Field(50, ge=0, le=100)
    strengths: list[str] = []
    weaknesses: list[str] = []
    verification_needs: Optional[str] = Field(None, max_length=5000)
    notes: Optional[str] = Field(None, max_length=5000)


class ZoneUpdate(BaseModel):
    """Schema for updating a frontier zone."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=500)
    reliability: Optional[str] = Field(None, max_length=50)
    confidence: Optional[int] = Field(None, ge=0, le=100)
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    verification_needs: Optional[str] = Field(None, max_length=5000)
    notes: Optional[str] = Field(None, max_length=5000)


class ZoneSummary(BaseModel):
    """Lightweight zone summary for list view."""
    id: str
    name: str
    category: str
    reliability: str
    confidence: int
    strength_count: int
    weakness_count: int
    encounter_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ZoneResponse(BaseModel):
    """Full zone response."""
    id: str
    name: str
    category: str
    reliability: str
    confidence: int
    strengths: list[str]
    weaknesses: list[str]
    verification_needs: Optional[str]
    notes: Optional[str]
    encounter_count: int = 0
    recent_encounters: list[dict] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Encounter Schemas
# =============================================================================

class EncounterCreate(BaseModel):
    """Schema for creating an encounter."""
    zone_id: Optional[str] = None
    encounter_type: str = Field("success", max_length=50)
    task_description: str = Field(..., min_length=1, max_length=5000)
    outcome: str = Field(..., min_length=1, max_length=5000)
    expected_result: Optional[str] = Field(None, max_length=5000)
    lessons: Optional[str] = Field(None, max_length=5000)
    tags: list[str] = []


class EncounterUpdate(BaseModel):
    """Schema for updating an encounter."""
    zone_id: Optional[str] = None
    encounter_type: Optional[str] = Field(None, max_length=50)
    task_description: Optional[str] = Field(None, max_length=5000)
    outcome: Optional[str] = Field(None, max_length=5000)
    expected_result: Optional[str] = Field(None, max_length=5000)
    lessons: Optional[str] = Field(None, max_length=5000)
    tags: Optional[list[str]] = None


class EncounterSummary(BaseModel):
    """Lightweight encounter summary."""
    id: str
    zone_id: Optional[str]
    zone_name: Optional[str]
    encounter_type: str
    task_description: str
    tags: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


class EncounterResponse(BaseModel):
    """Full encounter response."""
    id: str
    zone_id: Optional[str]
    zone_name: Optional[str]
    encounter_type: str
    task_description: str
    outcome: str
    expected_result: Optional[str]
    lessons: Optional[str]
    tags: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Statistics Schema
# =============================================================================

class FrontierStats(BaseModel):
    """Statistics for frontier mapping."""
    total_zones: int
    zones_by_reliability: dict  # {"reliable": 5, "mixed": 3, "unreliable": 2}
    zones_by_category: dict  # {"coding": 3, "writing": 2, ...}
    total_encounters: int
    encounters_by_type: dict  # {"success": 10, "failure": 3, "surprise": 2}
    encounters_this_week: int
    avg_zone_confidence: float
    most_active_zones: list[dict]  # [{name, encounter_count}]
    recent_lessons: list[str]  # Last 5 lessons learned
    common_tags: list[dict]  # [{tag, count}]
