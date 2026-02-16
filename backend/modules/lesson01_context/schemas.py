"""Pydantic schemas for Lesson 1: Context Pattern Tracker."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class Turn(BaseModel):
    """A single turn in a conversation."""
    role: str = Field(max_length=50)  # "user" or "assistant"
    content: str = Field(max_length=10000)


class ParsedTranscript(BaseModel):
    """Parsed conversation transcript."""
    turns: List[Turn]


class ContextProvided(BaseModel):
    """Analysis of context provided in first message."""
    details: str
    what_worked: str


class ContextAddedLater(BaseModel):
    """Analysis of context added after first exchange."""
    details: str
    triggers: str
    could_have_been_upfront: bool


class AssumptionsWrong(BaseModel):
    """Analysis of incorrect assumptions."""
    details: str
    why_assumed: str
    user_contributed: str


class Pattern(BaseModel):
    """Pattern classification."""
    category: str
    insight: str


class Coaching(BaseModel):
    """Coaching recommendations."""
    context_that_would_have_helped: str
    prompt_rewrite: str
    habit_to_build: str


class Confidence(BaseModel):
    """Confidence assessment."""
    score: int = Field(ge=1, le=10)
    reasoning: str


class Analysis(BaseModel):
    """Complete analysis result from Claude."""
    topic: str
    context_provided: ContextProvided
    context_added_later: ContextAddedLater
    assumptions_wrong: AssumptionsWrong
    pattern: Pattern
    coaching: Coaching
    confidence: Confidence


class UserEdits(BaseModel):
    """User edits to the analysis."""
    topic: Optional[str] = Field(None, max_length=500)
    pattern_category: Optional[str] = Field(None, max_length=500)
    habit_to_build: Optional[str] = Field(None, max_length=1000)
    notes: Optional[str] = Field(None, max_length=5000)


class ConversationCreate(BaseModel):
    """Request to create/analyze a new conversation."""
    raw_transcript: str = Field(max_length=50000)


class ConversationUpdate(BaseModel):
    """Request to update a conversation."""
    user_edits: UserEdits


class ConversationResponse(BaseModel):
    """Response for a single conversation."""
    id: str
    created_at: datetime
    raw_transcript: str
    analysis: Analysis
    user_edits: Optional[UserEdits] = None

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    """Summary of a conversation for list view."""
    id: str
    created_at: datetime
    topic: str
    pattern_category: str
    confidence_score: int


class HabitCount(BaseModel):
    """A habit with its occurrence count."""
    habit: str
    count: int


class PatternStats(BaseModel):
    """Aggregated pattern statistics."""
    total_conversations: int
    count_by_category: dict
    avg_confidence_score: float
    common_habits: List[HabitCount]


class GapItem(BaseModel):
    """Context gap item."""
    gap: str
    count: int
    percentage: int


class StrengthItem(BaseModel):
    """Context strength item."""
    strength: str
    count: int
    percentage: int


class AuditEntry(BaseModel):
    """Audit summary entry."""
    id: str
    topic: str
    pattern: str
    gap: str
    strength: str
    created_at: Optional[datetime] = None


class InsightsResponse(BaseModel):
    """Aggregated insights response."""
    total_analyzed: int
    context_gaps: List[GapItem]
    context_strengths: List[StrengthItem]
    audit_summary: List[AuditEntry]
