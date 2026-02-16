"""SQLAlchemy models for AI Manager Skills platform."""
from datetime import datetime
from typing import Optional
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


# =============================================================================
# Core Models (Users, Progress)
# =============================================================================

class User(Base):
    """User account."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
    output_types = relationship("OutputType", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    calibration_insights = relationship("CalibrationInsight", back_populates="user", cascade="all, delete-orphan")
    checklists = relationship("Checklist", back_populates="user", cascade="all, delete-orphan")
    verification_sessions = relationship("VerificationSession", back_populates="user", cascade="all, delete-orphan")
    decompositions = relationship("Decomposition", back_populates="user", cascade="all, delete-orphan")
    delegations = relationship("Delegation", back_populates="user", cascade="all, delete-orphan")
    iterations = relationship("Iteration", back_populates="user", cascade="all, delete-orphan")
    iteration_tasks = relationship("IterationTask", back_populates="user", cascade="all, delete-orphan")
    feedback_entries = relationship("FeedbackEntry", back_populates="user", cascade="all, delete-orphan")
    workflow_templates = relationship("WorkflowTemplate", back_populates="user", cascade="all, delete-orphan")
    status_reports = relationship("StatusReport", back_populates="user", cascade="all, delete-orphan")
    context_docs = relationship("ContextDoc", back_populates="user", cascade="all, delete-orphan")
    context_sessions = relationship("ContextSession", back_populates="user", cascade="all, delete-orphan")
    frontier_zones = relationship("FrontierZone", back_populates="user", cascade="all, delete-orphan")
    frontier_encounters = relationship("FrontierEncounter", back_populates="user", cascade="all, delete-orphan")
    reference_cards = relationship("ReferenceCard", back_populates="user", cascade="all, delete-orphan")
    page_views = relationship("PageView", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")


class UserProgress(Base):
    """User progress through lesson sections."""
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson = Column(Integer, nullable=False)  # 1-12
    completed_exercises = Column(JSON, default=list)  # List of exercise IDs completed
    last_activity = Column(DateTime, server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="progress")


# =============================================================================
# Lesson 1: Context Tracker (Conversations)
# =============================================================================

class Conversation(Base):
    """Lesson 1: Analyzed conversation transcript."""
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    raw_transcript = Column(Text, nullable=False)

    # Analysis results (stored as JSON for flexibility)
    analysis = Column(JSON, nullable=False)

    # User edits/corrections to the analysis
    user_edits = Column(JSON, nullable=True)

    user = relationship("User", back_populates="conversations")


# =============================================================================
# Lesson 2: Template Builder
# =============================================================================

class Template(Base):
    """Lesson 2: Context template with variables and usage tracking."""
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # user-defined category
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)  # The actual template text with {{variable}} placeholders
    variables = Column(JSON, default=list)  # [{name, description, default, required}]
    tags = Column(JSON, default=list)  # user-defined tags for organization
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="templates")
    tests = relationship("TemplateTest", back_populates="template", cascade="all, delete-orphan")


class TemplateTest(Base):
    """Lesson 2: Template test result."""
    __tablename__ = "template_tests"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    template_id = Column(UUID(as_uuid=False), ForeignKey("templates.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_prompt = Column(Text, nullable=False)  # User's test question
    variable_values = Column(JSON, default=dict)  # {variable_name: value}
    rendered_prompt = Column(Text, nullable=False)  # Template + variables + test question
    ai_response = Column(Text, nullable=True)  # Claude's response
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    notes = Column(Text, nullable=True)  # User notes on what worked/didn't
    created_at = Column(DateTime, server_default=func.now())

    template = relationship("Template", back_populates="tests")
    user = relationship("User")


# =============================================================================
# Lesson 3: Trust Matrix
# =============================================================================

class OutputType(Base):
    """Lesson 3: A category of AI output with associated trust level."""
    __tablename__ = "output_types"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "PowerShell Scripts"
    category = Column(String(50), nullable=False)  # e.g., "Code", "Documentation", "Analysis"
    trust_level = Column(String(20), nullable=False)  # "high", "medium", "low"
    reasoning = Column(Text, nullable=True)  # Why this trust level
    verification_approach = Column(Text, nullable=True)  # How to verify outputs of this type
    examples = Column(JSON, default=list)  # Example outputs that fall in this type
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="output_types")
    predictions = relationship("Prediction", back_populates="output_type")


class Prediction(Base):
    """Lesson 3: A tracked prediction about AI output correctness."""
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    output_type_id = Column(UUID(as_uuid=False), ForeignKey("output_types.id", ondelete="SET NULL"), nullable=True, index=True)

    # The prediction
    output_description = Column(Text, nullable=False)  # What the AI output was about
    confidence_rating = Column(Integer, nullable=False)  # 1-10 before verification
    uncertainty_notes = Column(Text, nullable=True)  # What you were uncertain about

    # The outcome
    was_correct = Column(Boolean, nullable=True)  # null = not yet verified
    actual_issues = Column(Text, nullable=True)  # What was wrong (if anything)
    verification_method = Column(String(100), nullable=True)  # How you verified
    verification_time_seconds = Column(Integer, nullable=True)  # How long verification took

    # Calibration analysis
    calibration_note = Column(Text, nullable=True)  # Reflection on over/under trust

    created_at = Column(DateTime, server_default=func.now())
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="predictions")
    output_type = relationship("OutputType", back_populates="predictions")


class CalibrationInsight(Base):
    """Lesson 3: AI-generated insights about user's calibration patterns."""
    __tablename__ = "calibration_insights"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    insight_type = Column(String(50), nullable=False)  # "over_trust", "over_verify", "well_calibrated", "recommendation"
    output_type_id = Column(UUID(as_uuid=False), ForeignKey("output_types.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)  # Supporting data
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="calibration_insights")
    output_type = relationship("OutputType")


# =============================================================================
# Lesson 4: Verification Tools
# =============================================================================

class Checklist(Base):
    """Lesson 4: Verification checklist."""
    __tablename__ = "checklists"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    output_type = Column(String(100), nullable=False)  # type of output this checklist is for
    items = Column(JSON, nullable=False)  # List of checklist items
    skip_criteria = Column(JSON, nullable=True)  # Conditions when items can be skipped
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="checklists")
    verification_sessions = relationship("VerificationSession", back_populates="checklist", cascade="all, delete-orphan")


class VerificationSession(Base):
    """Lesson 4: Verification session tracking."""
    __tablename__ = "verification_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    checklist_id = Column(UUID(as_uuid=False), ForeignKey("checklists.id", ondelete="CASCADE"), nullable=False, index=True)
    checklist_name = Column(String(255), nullable=False)
    output_description = Column(Text, nullable=False)
    is_low_stakes = Column(Boolean, default=False)
    is_prototyping = Column(Boolean, default=False)
    time_seconds = Column(Integer, nullable=True)
    overall_passed = Column(Boolean, nullable=True)
    issues_found = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="verification_sessions")
    checklist = relationship("Checklist", back_populates="verification_sessions")


# =============================================================================
# Lesson 5-6: Task Decomposer & Delegation Tracker
# =============================================================================

class Decomposition(Base):
    """Lesson 5: Task decomposition analysis."""
    __tablename__ = "decompositions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    tasks = Column(JSON, nullable=False)  # List of task objects
    categories = Column(JSON, nullable=False)  # ai_optimal, collaborative, human_only categorization
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="decompositions")


class Delegation(Base):
    """Lesson 6: Delegation template and task sequence."""
    __tablename__ = "delegations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    template = Column(Text, nullable=False)  # The delegation prompt template
    task_sequence = Column(JSON, nullable=False)  # Ordered list of tasks
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="delegations")


# =============================================================================
# Lesson 7-8: Iteration Tasks & Feedback Analyzer
# =============================================================================

class IterationTask(Base):
    """Lesson 7: Iteration task with multiple passes (70%, 85%, 95%)."""
    __tablename__ = "iteration_tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    target_outcome = Column(Text, nullable=True)  # What "done" looks like
    passes = Column(JSON, default=list)  # Array of pass feedback objects
    current_pass = Column(Integer, default=1)  # 1, 2, or 3
    is_complete = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="iteration_tasks")


# Legacy model for backward compatibility - will be migrated
class Iteration(Base):
    """Lesson 7-8: Iteration pass tracking (legacy)."""
    __tablename__ = "iterations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    pass_number = Column(Integer, nullable=False)  # 1, 2, 3 (70%, 85%, 95%)
    pass_label = Column(String(20), nullable=False)  # "70%", "85%", "95%"
    feedback = Column(Text, nullable=True)
    quality_assessment = Column(JSON, nullable=True)  # Lesson 8 quality metrics
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="iterations")


class FeedbackEntry(Base):
    """Lesson 8: Feedback quality analysis entry."""
    __tablename__ = "feedback_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_feedback = Column(Text, nullable=False)  # The original feedback text
    context = Column(Text, nullable=True)  # Optional context about what the feedback was for
    analysis = Column(JSON, nullable=False)  # Quality analysis result
    rewritten_feedback = Column(Text, nullable=True)  # User's improved version
    is_example = Column(Boolean, default=False)  # Whether this is a saved good example
    category = Column(String(50), nullable=True)  # e.g., "code", "writing", "design"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="feedback_entries")


# =============================================================================
# Lesson 9-10: Status Reporter & Context Docs
# =============================================================================

class WorkflowTemplate(Base):
    """Lesson 9: Workflow template for recurring tasks."""
    __tablename__ = "workflow_templates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    frequency = Column(String(50))  # "daily", "weekly", "biweekly", "monthly"
    estimated_time_minutes = Column(Integer)  # Time before AI integration
    inputs = Column(JSON, default=list)  # Required inputs for workflow
    steps = Column(JSON, default=list)  # Workflow steps
    prompt_template = Column(Text)  # AI prompt template
    quality_checks = Column(JSON, default=list)  # Verification steps
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="workflow_templates")
    reports = relationship("StatusReport", back_populates="template", cascade="all, delete-orphan")


class StatusReport(Base):
    """Lesson 9: Status report generated from workflow."""
    __tablename__ = "status_reports"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(UUID(as_uuid=False), ForeignKey("workflow_templates.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    inputs_used = Column(JSON, default=dict)  # Actual inputs for this run
    generated_content = Column(Text)  # AI-generated or manual report content
    actual_time_minutes = Column(Integer)  # Time with AI integration
    quality_score = Column(Integer)  # Self-assessed quality (1-10)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="status_reports")
    template = relationship("WorkflowTemplate", back_populates="reports")


class ContextDoc(Base):
    """Lesson 10: Project context document for maintaining AI session continuity."""
    __tablename__ = "context_docs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Structured sections (stored as JSON for flexibility)
    current_state = Column(JSON, default=dict)  # {complete: [], in_progress: [], blocked: []}
    key_decisions = Column(JSON, default=list)  # [{decision, reasoning, date}]
    known_issues = Column(JSON, default=list)  # [{issue, workaround, status}]
    lessons_learned = Column(JSON, default=list)  # [{lesson, context, date}]
    next_goals = Column(JSON, default=list)  # [{goal, priority}]

    # Legacy content field for freeform notes
    content = Column(Text, nullable=True)

    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="context_docs")
    sessions = relationship("ContextSession", back_populates="context_doc", cascade="all, delete-orphan")


class ContextSession(Base):
    """Lesson 10: Individual work session on a project."""
    __tablename__ = "context_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    context_doc_id = Column(UUID(as_uuid=False), ForeignKey("context_docs.id", ondelete="CASCADE"), nullable=False, index=True)

    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)

    # Session content
    goals = Column(JSON, default=list)  # What you planned to accomplish
    accomplishments = Column(JSON, default=list)  # What you actually accomplished
    decisions_made = Column(JSON, default=list)  # Decisions made during session
    issues_encountered = Column(JSON, default=list)  # Issues found
    notes = Column(Text, nullable=True)  # Freeform session notes

    # Quality metrics
    context_quality_rating = Column(Integer, nullable=True)  # 1-10: How helpful was the context?
    continuity_rating = Column(Integer, nullable=True)  # 1-10: How seamless was session start?

    user = relationship("User", back_populates="context_sessions")
    context_doc = relationship("ContextDoc", back_populates="sessions")


# =============================================================================
# Lesson 11: Frontier Mapper
# =============================================================================

class FrontierZone(Base):
    """Lesson 11: Reliability zone mapping for a domain/topic."""
    __tablename__ = "frontier_zones"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)  # e.g., "Python scripting", "Legal advice"
    category = Column(String(100), nullable=False)  # e.g., "coding", "writing", "analysis"
    reliability = Column(String(20), nullable=False)  # "reliable", "mixed", "unreliable"
    confidence = Column(Integer, default=50)  # 0-100: How confident in this assessment
    strengths = Column(JSON, default=list)  # What AI does well here
    weaknesses = Column(JSON, default=list)  # What AI struggles with
    verification_needs = Column(Text, nullable=True)  # What to verify in this zone
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="frontier_zones")
    encounters = relationship("FrontierEncounter", back_populates="zone", cascade="all, delete-orphan")


class FrontierEncounter(Base):
    """Lesson 11: Individual encounter at the frontier (success, failure, surprise)."""
    __tablename__ = "frontier_encounters"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id = Column(UUID(as_uuid=False), ForeignKey("frontier_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    encounter_type = Column(String(20), nullable=False)  # "success", "failure", "surprise"
    task_description = Column(Text, nullable=False)  # What you asked the AI to do
    outcome = Column(Text, nullable=False)  # What happened
    expected_result = Column(Text, nullable=True)  # What you expected
    lessons = Column(Text, nullable=True)  # What you learned
    tags = Column(JSON, default=list)  # Searchable tags
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="frontier_encounters")
    zone = relationship("FrontierZone", back_populates="encounters")


# =============================================================================
# Lesson 12: Reference Card
# =============================================================================

class ReferenceCard(Base):
    """Lesson 12: Personal AI collaboration reference card."""
    __tablename__ = "reference_cards"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, default="My AI Reference Card")

    # Aggregated insights from Lessons 1-11
    top_templates = Column(JSON, default=list)  # Best templates from Lesson 3
    trust_zones = Column(JSON, default=list)  # Trust matrix summary from Lesson 5
    verification_shortcuts = Column(JSON, default=list)  # From Lesson 6
    delegation_patterns = Column(JSON, default=list)  # From Lessons 7-8
    iteration_style = Column(JSON, default=dict)  # From Lesson 9
    feedback_principles = Column(JSON, default=list)  # From Lesson 2
    workflow_highlights = Column(JSON, default=list)  # From Lesson 10
    context_best_practices = Column(JSON, default=list)  # From Lesson 4
    frontier_map = Column(JSON, default=dict)  # From Lesson 11

    # Personal notes and customizations
    personal_rules = Column(JSON, default=list)  # User's personal AI rules
    quick_prompts = Column(JSON, default=list)  # Frequently used prompts
    custom_sections = Column(JSON, default=list)  # User-defined sections

    is_primary = Column(Boolean, default=True)  # Is this the main reference card
    last_generated = Column(DateTime, nullable=True)  # When last auto-generated
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="reference_cards")


# =============================================================================
# Analytics (Page Views & Feedback)
# =============================================================================

class PageView(Base):
    """Analytics: Track page views for usage statistics."""
    __tablename__ = "page_views"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    page = Column(String(255), nullable=False)  # Page path (e.g., "/lesson/1", "/analytics")
    lesson = Column(Integer, nullable=True, index=True)  # Lesson number if applicable (1-12)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="page_views")


class Feedback(Base):
    """Analytics: User feedback on lessons and pages."""
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson = Column(Integer, nullable=True, index=True)  # Lesson number if applicable (1-12)
    page = Column(String(255), nullable=False)  # Page path
    rating = Column(Integer, nullable=False)  # 1-5 star rating
    comment = Column(Text, nullable=True)  # Optional feedback text
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="feedback")


# =============================================================================
# Refresh Tokens (for JWT auth)
# =============================================================================

class RefreshToken(Base):
    """Refresh token storage for JWT auth."""
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    revoked = Column(Boolean, default=False)


# =============================================================================
# Admin - Cohorts (Organization Tracking)
# =============================================================================

class Cohort(Base):
    """Admin: User cohort for organization/group tracking."""
    __tablename__ = "cohorts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    organization = Column(String(100), nullable=True)  # Company/org name
    start_date = Column(DateTime, nullable=True)  # Cohort start date
    end_date = Column(DateTime, nullable=True)  # Cohort end date
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    members = relationship("CohortMember", back_populates="cohort", cascade="all, delete-orphan")


class CohortMember(Base):
    """Admin: User membership in a cohort."""
    __tablename__ = "cohort_members"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    cohort_id = Column(UUID(as_uuid=False), ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime, server_default=func.now())

    cohort = relationship("Cohort", back_populates="members")
    user = relationship("User")


# =============================================================================
# Admin - A/B Testing (Experiments)
# =============================================================================

class Experiment(Base):
    """Admin: A/B test experiment definition."""
    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    feature_key = Column(String(50), nullable=False, index=True)  # Unique key for the feature being tested
    variants = Column(JSON, nullable=False)  # List of variant names, e.g., ["control", "variant_a"]
    traffic_percentage = Column(Integer, default=100)  # Percentage of users in experiment
    is_active = Column(Boolean, default=True)
    winner = Column(String(50), nullable=True)  # Winning variant when concluded
    created_at = Column(DateTime, server_default=func.now())
    concluded_at = Column(DateTime, nullable=True)

    assignments = relationship("ExperimentAssignment", back_populates="experiment", cascade="all, delete-orphan")


class ExperimentAssignment(Base):
    """Admin: User's assignment to an experiment variant."""
    __tablename__ = "experiment_assignments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    experiment_id = Column(UUID(as_uuid=False), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant = Column(String(50), nullable=False)  # Which variant the user is in
    assigned_at = Column(DateTime, server_default=func.now())

    experiment = relationship("Experiment", back_populates="assignments")
    user = relationship("User")
