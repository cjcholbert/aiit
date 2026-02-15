"""Lesson 7: Task Decomposer - Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# Task Categories
# =============================================================================

TASK_CATEGORIES = {
    "ai_optimal": {
        "label": "AI-Optimal",
        "color": "#4ade80",  # Green
        "description": "Well-defined input → well-defined output. Pattern-based work, no institutional knowledge required.",
        "examples": [
            "Generate boilerplate code from a template",
            "Format data from one structure to another",
            "Summarize a document or research findings",
            "Create standard documentation",
            "Write unit tests for existing functions"
        ],
        "signals": [
            "Clear input and output format",
            "Follows established patterns",
            "Easy to verify correctness",
            "No special access or authority needed"
        ]
    },
    "collaborative": {
        "label": "Collaborative",
        "color": "#fbbf24",  # Yellow
        "description": "Requires judgment calls. Benefits from your context combined with AI capability.",
        "examples": [
            "Develop a project strategy or approach",
            "Analyze complex data with business context",
            "Refine creative content iteratively",
            "Debug tricky issues with system knowledge",
            "Design architecture with constraints"
        ],
        "signals": [
            "Needs your expertise",
            "Multiple valid approaches possible",
            "Requires iteration and refinement",
            "Context-dependent decisions"
        ]
    },
    "human_primary": {
        "label": "Human-Primary",
        "color": "#f87171",  # Red
        "description": "Requires your authority, credentials, or institutional knowledge AI cannot have.",
        "examples": [
            "Make final approval decisions",
            "Send sensitive communications",
            "Take real-world actions (deploy, pay, sign)",
            "Handle confidential information",
            "Manage interpersonal situations"
        ],
        "signals": [
            "Requires your authority or signature",
            "Involves confidential/sensitive data",
            "Has real-world consequences",
            "Needs relationship or political awareness"
        ]
    }
}


# =============================================================================
# Tasks within a Decomposition
# =============================================================================

class TaskBase(BaseModel):
    """Base schema for tasks."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = Field(..., pattern="^(ai_optimal|collaborative|human_primary)$")
    reasoning: str = ""  # Why this category
    order: int = 0
    dependencies: list[str] = []  # List of task IDs this depends on
    is_decision_gate: bool = False  # Review point before continuing
    parallel_group: Optional[str] = None  # Tasks that can run in parallel
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(ai_optimal|collaborative|human_primary)$")
    reasoning: Optional[str] = None
    order: Optional[int] = None
    dependencies: Optional[list[str]] = None
    is_decision_gate: Optional[bool] = None
    parallel_group: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: str

    class Config:
        from_attributes = True


# =============================================================================
# Decompositions
# =============================================================================

class DecompositionCreate(BaseModel):
    """Schema for creating a decomposition."""
    project_name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    tasks: list[TaskCreate] = []


class DecompositionUpdate(BaseModel):
    """Schema for updating a decomposition."""
    project_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tasks: Optional[list[TaskCreate]] = None


class DecompositionSummary(BaseModel):
    """Summary schema for decomposition list view."""
    id: str
    project_name: str
    task_count: int
    ai_optimal_count: int
    collaborative_count: int
    human_primary_count: int
    completed_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DecompositionResponse(BaseModel):
    """Full decomposition response."""
    id: str
    project_name: str
    description: str
    tasks: list[TaskResponse]
    categories: dict  # Category counts
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Statistics
# =============================================================================

class DecompositionStats(BaseModel):
    """Statistics for decompositions."""
    total_decompositions: int
    total_tasks: int
    category_distribution: dict[str, int]  # ai_optimal, collaborative, human_primary counts
    category_percentages: dict[str, float]
    avg_tasks_per_decomposition: float
    most_common_category: str
    decision_gates_count: int
    completed_tasks: int
    completion_rate: float


# =============================================================================
# Example Decompositions
# =============================================================================

EXAMPLE_DECOMPOSITIONS = [
    # --- IT ---
    {
        "project_name": "Build a REST API Endpoint",
        "description": "Create a new API endpoint for user profile management",
        "tasks": [
            {
                "title": "Research existing patterns",
                "description": "Look at how similar endpoints are structured in the codebase",
                "category": "ai_optimal",
                "reasoning": "Pattern-based research with clear output",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Design endpoint structure",
                "description": "Decide on routes, methods, and data shapes",
                "category": "collaborative",
                "reasoning": "Needs judgment about architecture trade-offs",
                "order": 1,
                "is_decision_gate": True
            },
            {
                "title": "Generate boilerplate code",
                "description": "Create the basic endpoint structure and models",
                "category": "ai_optimal",
                "reasoning": "Well-defined pattern, easy to verify",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Implement business logic",
                "description": "Add the specific validation and processing rules",
                "category": "collaborative",
                "reasoning": "Requires understanding of business requirements",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Write tests",
                "description": "Create unit and integration tests",
                "category": "ai_optimal",
                "reasoning": "Pattern-based, clear success criteria",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Code review and approval",
                "description": "Get team sign-off before merging",
                "category": "human_primary",
                "reasoning": "Requires authority and team judgment",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- Finance ---
    {
        "project_name": "Prepare Quarterly Report",
        "description": "Create Q4 performance report for stakeholders",
        "tasks": [
            {
                "title": "Gather raw data",
                "description": "Export metrics from various systems",
                "category": "human_primary",
                "reasoning": "Requires access to confidential systems",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Clean and format data",
                "description": "Transform raw data into analyzable format",
                "category": "ai_optimal",
                "reasoning": "Clear transformation rules, pattern-based",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Analyze trends and insights",
                "description": "Identify key patterns and their business implications",
                "category": "collaborative",
                "reasoning": "Needs business context for meaningful insights",
                "order": 2,
                "is_decision_gate": True
            },
            {
                "title": "Draft report narrative",
                "description": "Write the story around the numbers",
                "category": "collaborative",
                "reasoning": "Needs refinement for tone and emphasis",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Create visualizations",
                "description": "Build charts and graphs for key metrics",
                "category": "ai_optimal",
                "reasoning": "Standard visualization patterns",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Executive review and sign-off",
                "description": "Get leadership approval before distribution",
                "category": "human_primary",
                "reasoning": "Requires authority and final judgment",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- Marketing ---
    {
        "project_name": "Launch Product Marketing Campaign",
        "description": "Plan and execute a multi-channel marketing campaign for a new service offering",
        "tasks": [
            {
                "title": "Research competitor positioning",
                "description": "Analyze how competitors market similar services, identify messaging gaps and opportunities",
                "category": "collaborative",
                "reasoning": "AI can gather data but needs your knowledge of market positioning and strategic priorities",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Define target audience segments",
                "description": "Identify and prioritize customer segments based on fit, revenue potential, and existing relationships",
                "category": "human_primary",
                "reasoning": "Requires knowledge of actual customer base, sales pipeline, and strategic direction",
                "order": 1,
                "is_decision_gate": True
            },
            {
                "title": "Draft campaign messaging and copy",
                "description": "Write email sequences, social posts, and landing page copy for each audience segment",
                "category": "ai_optimal",
                "reasoning": "Well-defined format with clear brand voice guidelines to follow",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Review messaging for brand alignment",
                "description": "Ensure all copy matches brand voice, avoids compliance issues, and resonates with target audience",
                "category": "collaborative",
                "reasoning": "Requires judgment about tone, brand fit, and what will resonate with real customers",
                "order": 3,
                "is_decision_gate": True
            },
            {
                "title": "Build campaign calendar and schedule",
                "description": "Create a timeline of sends, posts, and touchpoints across all channels",
                "category": "ai_optimal",
                "reasoning": "Structured scheduling task with clear inputs and standard format",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Approve budget and launch",
                "description": "Final sign-off on spend allocation and campaign activation",
                "category": "human_primary",
                "reasoning": "Requires budget authority and accountability for campaign performance",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- HR ---
    {
        "project_name": "New Employee Onboarding Program",
        "description": "Design and implement a structured 90-day onboarding program for new hires",
        "tasks": [
            {
                "title": "Audit current onboarding gaps",
                "description": "Survey recent hires and managers to identify what's missing from the current process",
                "category": "human_primary",
                "reasoning": "Requires direct conversations with employees and access to sensitive feedback",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Research onboarding best practices",
                "description": "Compile best practices for 30/60/90-day onboarding programs in similar-sized companies",
                "category": "ai_optimal",
                "reasoning": "Well-documented topic with established frameworks to synthesize",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Design the 90-day milestone framework",
                "description": "Define what success looks like at 30, 60, and 90 days for each department",
                "category": "collaborative",
                "reasoning": "Needs your knowledge of department-specific expectations combined with structural best practices",
                "order": 2,
                "is_decision_gate": True
            },
            {
                "title": "Create onboarding checklists and templates",
                "description": "Build day-by-day checklists, welcome email templates, and manager guides",
                "category": "ai_optimal",
                "reasoning": "Template creation with clear structure and defined content requirements",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Build training schedule and resource guide",
                "description": "Map required trainings, system access, and mentor assignments to the 90-day timeline",
                "category": "collaborative",
                "reasoning": "Requires knowledge of internal systems, team structures, and available mentors",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Get HR leadership approval and pilot",
                "description": "Present the program to HR director, pilot with next hire cohort, collect feedback",
                "category": "human_primary",
                "reasoning": "Requires organizational authority and real-world testing with actual new hires",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- Finance / Accounting ---
    {
        "project_name": "Annual Budget Planning Process",
        "description": "Coordinate the annual budget cycle from department submissions through board approval",
        "tasks": [
            {
                "title": "Create budget request template",
                "description": "Design a standardized template for department heads to submit budget requests with justifications",
                "category": "ai_optimal",
                "reasoning": "Standard document format with well-defined fields and structure",
                "order": 0,
                "is_decision_gate": False
            },
            {
                "title": "Distribute templates and collect submissions",
                "description": "Send templates to all department heads with instructions and deadlines, follow up on late submissions",
                "category": "human_primary",
                "reasoning": "Requires relationship management, authority to enforce deadlines, and handling of sensitive data",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Consolidate and normalize submissions",
                "description": "Merge all department budgets into a single model, standardize categories, flag inconsistencies",
                "category": "ai_optimal",
                "reasoning": "Data transformation task with clear rules for categorization and formatting",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Analyze variances against prior year",
                "description": "Compare each line item to last year's actuals, flag significant changes, draft variance explanations",
                "category": "collaborative",
                "reasoning": "AI can compute variances but business context is needed to explain why changes occurred",
                "order": 3,
                "is_decision_gate": True
            },
            {
                "title": "Draft executive budget summary",
                "description": "Write the narrative overview highlighting key changes, risks, and investment priorities",
                "category": "collaborative",
                "reasoning": "Requires understanding of strategic priorities and what the CFO wants to emphasize",
                "order": 4,
                "is_decision_gate": False
            },
            {
                "title": "Present to leadership and get approval",
                "description": "Walk leadership through the budget, negotiate adjustments, obtain final sign-off",
                "category": "human_primary",
                "reasoning": "Requires authority, negotiation skills, and the ability to make real-time trade-off decisions",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- Education / Training ---
    {
        "project_name": "Develop Employee Training Course",
        "description": "Create a 4-module training course on customer service skills for frontline staff",
        "tasks": [
            {
                "title": "Define learning objectives and competencies",
                "description": "Identify the specific skills and knowledge employees should demonstrate after completing the course",
                "category": "collaborative",
                "reasoning": "Requires knowledge of actual performance gaps and organizational priorities combined with instructional design principles",
                "order": 0,
                "is_decision_gate": True
            },
            {
                "title": "Research and outline course content",
                "description": "Gather best practices, case studies, and frameworks to structure into four progressive modules",
                "category": "ai_optimal",
                "reasoning": "Well-documented topic area; AI can synthesize multiple sources into structured outlines",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Write module content and scenarios",
                "description": "Draft lesson text, real-world scenarios, and discussion prompts for each module",
                "category": "ai_optimal",
                "reasoning": "Content creation with clear structure, tone guidelines, and defined learning objectives",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Create assessments and practice exercises",
                "description": "Design quizzes, role-play scenarios, and skill-check exercises aligned to each module's objectives",
                "category": "collaborative",
                "reasoning": "AI can generate question formats but needs judgment on difficulty level and relevance to real job situations",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Review content with subject-matter experts",
                "description": "Have experienced managers validate that scenarios and advice match actual company practices",
                "category": "human_primary",
                "reasoning": "Requires institutional knowledge about how things actually work versus how they should work",
                "order": 4,
                "is_decision_gate": True
            },
            {
                "title": "Pilot course and collect feedback",
                "description": "Run the course with a test group, observe engagement, gather evaluations, and revise",
                "category": "human_primary",
                "reasoning": "Requires facilitating live sessions, reading the room, and making judgment calls about what's working",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    },
    # --- Admin / Managerial ---
    {
        "project_name": "Vendor Evaluation and Selection",
        "description": "Evaluate and select a new vendor for office supply management across three locations",
        "tasks": [
            {
                "title": "Draft vendor requirements document",
                "description": "List must-have capabilities, nice-to-haves, budget constraints, and evaluation criteria",
                "category": "collaborative",
                "reasoning": "AI can structure the document but needs your knowledge of actual business requirements and deal-breakers",
                "order": 0,
                "is_decision_gate": True
            },
            {
                "title": "Research potential vendors",
                "description": "Identify 5-8 candidate vendors, compile their capabilities, pricing tiers, and customer reviews",
                "category": "ai_optimal",
                "reasoning": "Information gathering and comparison task with clear output format",
                "order": 1,
                "is_decision_gate": False
            },
            {
                "title": "Create evaluation scorecard",
                "description": "Build a weighted scoring matrix based on the requirements document",
                "category": "ai_optimal",
                "reasoning": "Standard template with defined criteria and weights",
                "order": 2,
                "is_decision_gate": False
            },
            {
                "title": "Conduct vendor demos and interviews",
                "description": "Schedule and run demos with top 3 candidates, ask probing questions about SLAs and support",
                "category": "human_primary",
                "reasoning": "Requires relationship skills, reading between the lines of sales pitches, and asking follow-up questions",
                "order": 3,
                "is_decision_gate": False
            },
            {
                "title": "Summarize findings and draft recommendation",
                "description": "Write a comparison summary with pros/cons and a recommended vendor with justification",
                "category": "collaborative",
                "reasoning": "AI can structure the comparison but your judgment on cultural fit and risk tolerance shapes the recommendation",
                "order": 4,
                "is_decision_gate": True
            },
            {
                "title": "Present to leadership and negotiate contract",
                "description": "Get approval from operations director, then negotiate terms and pricing with selected vendor",
                "category": "human_primary",
                "reasoning": "Requires authority to commit organizational resources and negotiate binding agreements",
                "order": 5,
                "is_decision_gate": True
            }
        ]
    }
]
