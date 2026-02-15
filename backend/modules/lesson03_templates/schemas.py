"""Lesson 3: Template Builder Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Variable(BaseModel):
    """Template variable definition."""
    name: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-zA-Z_][a-zA-Z0-9_]*$")
    description: str = ""
    default: str = ""
    required: bool = False


class TemplateCreate(BaseModel):
    """Request model for creating a template."""
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    description: str = ""
    content: str = Field(..., min_length=10, max_length=5000)
    variables: list[Variable] = []
    tags: list[str] = []


class TemplateUpdate(BaseModel):
    """Request model for updating a template."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    variables: Optional[list[Variable]] = None
    tags: Optional[list[str]] = None
    is_favorite: Optional[bool] = None


class TemplateResponse(BaseModel):
    """Response model for a template."""
    id: str
    name: str
    category: str
    description: str
    content: str
    variables: list[Variable]
    tags: list[str]
    usage_count: int
    last_used_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    is_favorite: bool

    class Config:
        from_attributes = True


class TemplateSummary(BaseModel):
    """Abbreviated template for list views."""
    id: str
    name: str
    category: str
    description: str
    usage_count: int
    last_used_at: Optional[datetime]
    is_favorite: bool
    tags: list[str]

    class Config:
        from_attributes = True


class TemplateTestCreate(BaseModel):
    """Request model for testing a template."""
    template_id: str
    test_prompt: str = Field(..., min_length=5, max_length=2000)
    variable_values: dict[str, str] = {}


class TemplateTestResponse(BaseModel):
    """Response model for a template test."""
    id: str
    template_id: str
    test_prompt: str
    variable_values: dict[str, str]
    rendered_prompt: str
    ai_response: Optional[str]
    user_rating: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateTestFeedback(BaseModel):
    """Request model for submitting test feedback."""
    rating: int = Field(..., ge=1, le=5)
    notes: str = ""


class TemplateSuggestion(BaseModel):
    """AI-generated template suggestion based on Lesson 1 patterns."""
    name: str
    category: str
    content: str
    variables: list[Variable]
    reasoning: str


class TemplateStats(BaseModel):
    """Aggregated template statistics."""
    total_templates: int
    count_by_category: dict[str, int]
    total_tests: int
    avg_rating: float
    most_used: list[TemplateSummary]
    recent_tests: list[TemplateTestResponse]


class RenderRequest(BaseModel):
    """Request model for rendering a template preview."""
    content: str
    variable_values: dict[str, str] = {}
    test_prompt: str = ""


class RenderResponse(BaseModel):
    """Response model for rendered template."""
    rendered: str
    missing_required: list[str]
