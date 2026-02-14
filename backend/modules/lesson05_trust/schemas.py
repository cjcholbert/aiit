"""Week 3: Trust Matrix Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Output Type Schemas
# =============================================================================

class OutputTypeCreate(BaseModel):
    """Request model for creating an output type."""
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    trust_level: str = Field(..., pattern="^(high|medium|low)$")
    reasoning: str = ""
    verification_approach: str = ""
    examples: list[str] = []


class OutputTypeUpdate(BaseModel):
    """Request model for updating an output type."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    trust_level: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    reasoning: Optional[str] = None
    verification_approach: Optional[str] = None
    examples: Optional[list[str]] = None


class OutputTypeResponse(BaseModel):
    """Response model for an output type."""
    id: str
    name: str
    category: str
    trust_level: str
    reasoning: str
    verification_approach: str
    examples: list[str]
    prediction_count: int = 0
    accuracy_rate: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OutputTypeSummary(BaseModel):
    """Abbreviated output type for list views."""
    id: str
    name: str
    category: str
    trust_level: str
    prediction_count: int = 0
    accuracy_rate: float = 0.0


# =============================================================================
# Prediction Schemas
# =============================================================================

class PredictionCreate(BaseModel):
    """Request model for creating a prediction."""
    output_type_id: Optional[str] = None
    output_description: str = Field(..., min_length=5, max_length=1000)
    confidence_rating: int = Field(..., ge=1, le=10)
    uncertainty_notes: str = ""


class PredictionVerify(BaseModel):
    """Request model for verifying a prediction."""
    was_correct: bool
    actual_issues: str = ""
    verification_method: str = ""
    verification_time_seconds: Optional[int] = None
    calibration_note: str = ""


class PredictionResponse(BaseModel):
    """Response model for a prediction."""
    id: str
    output_type_id: Optional[str]
    output_type_name: Optional[str] = None
    output_description: str
    confidence_rating: int
    uncertainty_notes: Optional[str]
    was_correct: Optional[bool]
    actual_issues: Optional[str]
    verification_method: Optional[str]
    verification_time_seconds: Optional[int]
    calibration_note: Optional[str]
    created_at: datetime
    verified_at: Optional[datetime]

    class Config:
        from_attributes = True


# =============================================================================
# Calibration Schemas
# =============================================================================

class OutputTypeStats(BaseModel):
    """Statistics for a single output type."""
    output_type_id: str
    output_type_name: str
    trust_level: str
    total_predictions: int
    verified_predictions: int
    correct_predictions: int
    accuracy_rate: float
    avg_confidence: float
    avg_confidence_when_correct: float
    avg_confidence_when_wrong: float


class TrustLevelStats(BaseModel):
    """Statistics grouped by trust level."""
    trust_level: str
    total_predictions: int
    verified_predictions: int
    accuracy_rate: float
    avg_confidence: float


class CalibrationStats(BaseModel):
    """Aggregated calibration statistics."""
    total_predictions: int
    verified_predictions: int
    pending_predictions: int
    overall_accuracy: float
    avg_confidence_when_correct: float
    avg_confidence_when_wrong: float
    over_trust_count: int  # High confidence (>=7) but wrong
    over_verify_count: int  # Low confidence (<=4) but right
    well_calibrated_count: int
    calibration_score: float  # 0-100
    by_output_type: list[OutputTypeStats]
    by_trust_level: list[TrustLevelStats]


class CalibrationInsightResponse(BaseModel):
    """Response model for a calibration insight."""
    id: str
    insight_type: str  # "over_trust", "over_verify", "well_calibrated", "recommendation"
    output_type_id: Optional[str]
    output_type_name: Optional[str] = None
    description: str
    evidence: dict
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Default Output Types
# =============================================================================

DEFAULT_OUTPUT_TYPES = [
    {
        "name": "Code Syntax & Patterns",
        "category": "Code",
        "trust_level": "high",
        "reasoning": "Well-documented languages with clear syntax rules. AI trained on vast code repositories.",
        "verification_approach": "Quick syntax check, run linter, test basic execution",
        "examples": ["Python function structure", "JavaScript async/await", "SQL query syntax"]
    },
    {
        "name": "API Endpoints & Parameters",
        "category": "Code",
        "trust_level": "medium",
        "reasoning": "APIs change frequently. AI training data may be outdated.",
        "verification_approach": "Check official documentation, test in sandbox",
        "examples": ["REST endpoint paths", "GraphQL schemas", "SDK method signatures"]
    },
    {
        "name": "Security Recommendations",
        "category": "Security",
        "trust_level": "medium",
        "reasoning": "AI may miss organization-specific context and current threat landscape.",
        "verification_approach": "Cross-reference with security policies, consult recent advisories",
        "examples": ["Firewall rules", "Permission settings", "Encryption recommendations"]
    },
    {
        "name": "Compliance & Regulatory",
        "category": "Compliance",
        "trust_level": "low",
        "reasoning": "Not authoritative. Regulations change, interpretations vary by jurisdiction.",
        "verification_approach": "Always verify with official sources, legal/compliance team",
        "examples": ["GDPR requirements", "HIPAA rules", "SOC2 controls"]
    },
    {
        "name": "Novel Integrations",
        "category": "Architecture",
        "trust_level": "low",
        "reasoning": "No training data for your specific system combinations.",
        "verification_approach": "Prototype thoroughly, test edge cases, review with team",
        "examples": ["Custom API integrations", "Multi-system workflows", "New tool combinations"]
    },
    {
        "name": "Documentation & Explanations",
        "category": "Documentation",
        "trust_level": "high",
        "reasoning": "AI excels at clear explanations and documentation structure.",
        "verification_approach": "Quick read-through for accuracy, check technical details",
        "examples": ["README files", "Code comments", "Process documentation"]
    },
    {
        "name": "Data Transformation Logic",
        "category": "Code",
        "trust_level": "high",
        "reasoning": "Pattern-based work with clear input/output. Easy to test.",
        "verification_approach": "Test with sample data, verify edge cases",
        "examples": ["JSON parsing", "CSV transformations", "Data mapping"]
    },
    {
        "name": "Troubleshooting Suggestions",
        "category": "Analysis",
        "trust_level": "medium",
        "reasoning": "Good starting points but may miss environment-specific factors.",
        "verification_approach": "Test suggestions methodically, check logs for specifics",
        "examples": ["Error diagnosis", "Performance issues", "Configuration problems"]
    }
]
