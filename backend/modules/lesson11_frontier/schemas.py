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
    {"id": "coding", "name": "Coding & Development"},
    {"id": "writing", "name": "Writing & Content"},
    {"id": "analysis", "name": "Analysis & Research"},
    {"id": "data", "name": "Data & Calculations"},
    {"id": "creative", "name": "Creative & Design"},
    {"id": "planning", "name": "Planning & Strategy"},
    {"id": "communication", "name": "Communication & Email"},
    {"id": "documentation", "name": "Documentation"},
    {"id": "troubleshooting", "name": "Troubleshooting"},
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
        "name": "Python Scripting",
        "category": "coding",
        "reliability": "reliable",
        "confidence": 85,
        "strengths": [
            "Standard library usage",
            "Common patterns and idioms",
            "Error handling structure",
            "Code documentation"
        ],
        "weaknesses": [
            "Complex async patterns",
            "Performance optimization",
            "Platform-specific code"
        ],
        "verification_needs": "Test execution, edge cases, security review for user input"
    },
    {
        "name": "Legal Document Analysis",
        "category": "analysis",
        "reliability": "unreliable",
        "confidence": 70,
        "strengths": [
            "Summarizing key points",
            "Identifying document sections",
            "Comparing document structures"
        ],
        "weaknesses": [
            "Jurisdiction-specific interpretation",
            "Contractual implications",
            "Regulatory compliance details"
        ],
        "verification_needs": "Always verify with legal professional - AI cannot provide legal advice"
    },
    {
        "name": "Email Drafting",
        "category": "communication",
        "reliability": "reliable",
        "confidence": 90,
        "strengths": [
            "Professional tone",
            "Clear structure",
            "Appropriate formality levels",
            "Call-to-action clarity"
        ],
        "weaknesses": [
            "Company-specific terminology",
            "Relationship nuances",
            "Cultural context"
        ],
        "verification_needs": "Quick read-through for tone and accuracy of facts"
    },
    {
        "name": "Financial Calculations",
        "category": "data",
        "reliability": "mixed",
        "confidence": 60,
        "strengths": [
            "Simple arithmetic",
            "Standard formulas",
            "Explaining concepts"
        ],
        "weaknesses": [
            "Complex calculations",
            "Multi-step analysis",
            "Real-time data assumptions"
        ],
        "verification_needs": "Always verify calculations independently - use calculator/spreadsheet"
    }
]

EXAMPLE_ENCOUNTERS = [
    {
        "encounter_type": "success",
        "task_description": "Generate a Python script to parse CSV files and extract specific columns",
        "outcome": "Working script on first try, handled edge cases well",
        "expected_result": "Expected to need 1-2 iterations",
        "lessons": "AI excels at straightforward data processing tasks with clear requirements",
        "tags": ["python", "csv", "data-processing"]
    },
    {
        "encounter_type": "failure",
        "task_description": "Analyze this legal contract for potential liability issues",
        "outcome": "AI provided general observations but missed jurisdiction-specific clauses that were critical",
        "expected_result": "Hoped for detailed liability analysis",
        "lessons": "AI cannot replace domain expertise for legal analysis - use only for summarization",
        "tags": ["legal", "contracts", "analysis"]
    },
    {
        "encounter_type": "surprise",
        "task_description": "Write a regex to validate complex date formats",
        "outcome": "AI suggested a much simpler approach using dateutil.parser instead of regex",
        "expected_result": "Expected a complex regex pattern",
        "lessons": "AI sometimes suggests better approaches than what I asked for",
        "tags": ["regex", "dates", "alternative-approach"]
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
