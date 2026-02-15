"""Lesson 8: Delegation Tracker - Pydantic schemas."""
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
            "Reference your Lesson 3 context templates",
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
            "Reference your Lesson 6 verification checklists",
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
    # --- IT ---
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
    },
    # --- Marketing / Sales ---
    {
        "name": "Marketing Campaign Content Template",
        "template": """## Context
Campaign: [CAMPAIGN_NAME] for [PRODUCT/SERVICE].
Target audience: [AUDIENCE_SEGMENT] — [DEMOGRAPHICS/ROLE].
Brand voice: [TONE_DESCRIPTION] (e.g., professional but approachable).
Previous campaign reference: [LINK_OR_DESCRIPTION] (what worked/didn't).

## Objective
Create [CONTENT_TYPE] (email sequence / social posts / landing page copy) that drives [SPECIFIC_ACTION] (sign-ups / demo requests / purchases).

## Scope
Include: [CHANNELS_AND_PIECES] (e.g., 3 emails, 5 social posts, 1 landing page)
Exclude: [OUT_OF_SCOPE] (e.g., paid ad copy, press releases)
Do not: make claims we can't substantiate, use competitor names directly

## Deliverable
For each piece, provide:
- Headline / subject line
- Body copy (word count target: [NUMBER])
- Call to action
- Suggested send/post timing

## Success Criteria
- [ ] Consistent brand voice across all pieces
- [ ] Each piece has a clear, single call to action
- [ ] No unsubstantiated claims or superlatives
- [ ] Copy is within word count targets""",
        "task_sequence": [
            {
                "title": "Draft campaign copy",
                "description": "Generate all content pieces following the template guidelines",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Review brand voice and claims",
                "description": "Check that tone matches brand, all claims are accurate, CTAs are compelling",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Approve and schedule",
                "description": "Final sign-off from marketing lead, load into campaign platform",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": False
            }
        ]
    },
    # --- HR / Operations ---
    {
        "name": "HR Policy & Procedure Template",
        "template": """## Context
Creating/updating: [POLICY_NAME] (e.g., Remote Work Policy, PTO Policy).
Applies to: [EMPLOYEE_GROUPS] (all employees / managers / specific departments).
Current state: [NEW_POLICY or UPDATING_EXISTING — if updating, what's changing and why].
Regulatory considerations: [JURISDICTION] employment law, [SPECIFIC_REGULATIONS].

## Objective
Create a clear, enforceable [POLICY_TYPE] that [ACHIEVES_GOAL] (e.g., standardizes remote work expectations, clarifies PTO accrual rules).

## Scope
Include: policy statement, eligibility, procedures, exceptions process, enforcement
Exclude: [OUT_OF_SCOPE] (e.g., compensation details, benefits enrollment)
Do not: include language that contradicts existing [HANDBOOK_SECTION]

## Deliverable
Provide as a formatted policy document with:
- Policy statement (1-2 sentences)
- Scope and eligibility
- Detailed procedures
- Manager responsibilities
- Exception/appeal process
- Effective date and review schedule

## Success Criteria
- [ ] Language is clear and unambiguous
- [ ] Consistent with existing employee handbook tone
- [ ] Addresses common edge cases: [LIST]
- [ ] Includes manager action items
- [ ] Flagged for legal review before publication""",
        "task_sequence": [
            {
                "title": "Draft policy document",
                "description": "Create initial policy following the template structure",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Review for completeness and tone",
                "description": "Check edge cases, ensure language is clear, verify consistency with handbook",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Legal review and leadership approval",
                "description": "Route through legal/compliance, get HR director sign-off, communicate to employees",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": True
            }
        ]
    },
    # --- Finance ---
    {
        "name": "Financial Report & Analysis Template",
        "template": """## Context
Report type: [MONTHLY_VARIANCE / QUARTERLY_REVIEW / BUDGET_PROPOSAL / FORECAST].
Reporting period: [DATE_RANGE].
Audience: [CFO / Board / Department Heads / External Auditors].
Source data: [SYSTEMS_OR_FILES] (e.g., QuickBooks export, budget spreadsheet).
Key context: [NOTABLE_EVENTS] (e.g., new hire wave, vendor price increase, seasonal spike).

## Objective
Create a [REPORT_TYPE] that clearly communicates [KEY_MESSAGE] to [AUDIENCE] so they can [MAKE_DECISION].

## Scope
Include: [SECTIONS] (e.g., revenue summary, expense breakdown, variance analysis, forward guidance)
Exclude: [OUT_OF_SCOPE] (e.g., individual salary data, client-level revenue)
Do not: round numbers inconsistently, mix actuals with projections without labeling

## Deliverable
Provide as a structured report with:
- Executive summary (3-5 sentences)
- Data tables with period-over-period comparisons
- Variance explanations for items exceeding [THRESHOLD]% change
- Risk flags and action items

## Success Criteria
- [ ] All numbers match source data exactly
- [ ] Every variance over [THRESHOLD]% has an explanation
- [ ] Executive summary captures the 3 most important takeaways
- [ ] Appropriate level of detail for the target audience
- [ ] Clearly separates facts from assumptions""",
        "task_sequence": [
            {
                "title": "Structure report and populate data",
                "description": "Build the report framework and insert data from source files",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Draft variance analysis and narrative",
                "description": "Write explanations for significant variances, add business context",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Verify numbers and present",
                "description": "Cross-check all figures against source systems, deliver to audience",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": True
            }
        ]
    },
    # --- Education / Training ---
    {
        "name": "Training Module Development Template",
        "template": """## Context
Course: [COURSE_NAME] — Module [NUMBER] of [TOTAL].
Topic: [MODULE_TOPIC].
Target learners: [AUDIENCE] (e.g., new hires, frontline managers, sales team).
Prerequisite knowledge: [WHAT_THEY_ALREADY_KNOW].
Previous module covered: [BRIEF_SUMMARY].

## Objective
Create a training module that teaches [SPECIFIC_SKILL/KNOWLEDGE] so that learners can [OBSERVABLE_BEHAVIOR] by the end.

## Scope
Include: lesson content, 2-3 real-world scenarios, practice exercise, assessment quiz
Exclude: [OUT_OF_SCOPE] (topics covered in other modules)
Do not: use jargon without defining it, assume knowledge not listed in prerequisites

## Deliverable
Provide as a structured module with:
- Learning objectives (3-5 measurable outcomes)
- Lesson content (target: [WORD_COUNT] words)
- Real-world scenarios with discussion questions
- Hands-on exercise with instructions
- Quiz (8-10 questions) aligned to learning objectives

## Success Criteria
- [ ] Each learning objective maps to at least one quiz question
- [ ] Scenarios reflect actual situations the learners will face
- [ ] Content builds on previous module without repeating it
- [ ] Language is appropriate for the audience's experience level
- [ ] Exercise can be completed in [TIME_LIMIT] minutes""",
        "task_sequence": [
            {
                "title": "Draft module content and scenarios",
                "description": "Write the lesson content, create realistic scenarios and discussion questions",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Review content accuracy and relevance",
                "description": "Verify scenarios match real workplace situations, check difficulty is appropriate",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Pilot with test group and revise",
                "description": "Run module with a small group, observe engagement, collect feedback, finalize",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": True
            }
        ]
    },
    # --- Admin / Managerial ---
    {
        "name": "Meeting Summary & Action Items Template",
        "template": """## Context
Meeting: [MEETING_NAME] (e.g., Weekly Leadership Sync, Project Kickoff, Client Review).
Date: [DATE]. Duration: [LENGTH].
Attendees: [NAMES_AND_ROLES].
Meeting transcript or notes: [PASTE_OR_REFERENCE].

## Objective
Create a clear meeting summary that captures [KEY_DECISIONS] and assigns [ACTION_ITEMS] so that attendees and stakeholders know exactly what was decided and who owns next steps.

## Scope
Include: decisions made, action items with owners and deadlines, key discussion points, parking lot items
Exclude: side conversations, off-topic tangents, verbatim quotes unless specifically important
Do not: assign action items to people who weren't in the meeting without noting it

## Deliverable
Provide as a structured summary with:
- Meeting header (date, attendees, purpose)
- Key decisions (numbered, with brief rationale)
- Action items table (owner, task, deadline)
- Discussion highlights (3-5 bullet points)
- Parking lot / follow-up topics

## Success Criteria
- [ ] Every action item has an owner and a deadline
- [ ] Decisions are stated as outcomes, not as discussion summaries
- [ ] Summary is under [WORD_COUNT] words
- [ ] Nothing attributed to the wrong person
- [ ] Parking lot captures items that need future discussion""",
        "task_sequence": [
            {
                "title": "Generate meeting summary",
                "description": "Parse transcript/notes into structured summary format",
                "category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False
            },
            {
                "title": "Verify accuracy and completeness",
                "description": "Check decisions and action items match what actually happened, correct any misattributions",
                "category": "collaborative",
                "status": "pending",
                "is_decision_gate": True
            },
            {
                "title": "Distribute to attendees and stakeholders",
                "description": "Send final summary, confirm action item owners acknowledge their tasks",
                "category": "human_primary",
                "status": "pending",
                "is_decision_gate": False
            }
        ]
    }
]
