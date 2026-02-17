"""Lesson 9: Iteration Passes - Example tasks by professional category.

One task per category showing how the 70-85-95 framework applies
across different professional domains.
"""

EXAMPLE_CATEGORIES = ["Project Management", "Marketing", "Human Resources", "Finance", "Education", "Operations"]

EXAMPLE_TASKS = [
    {
        "category": "Project Management",
        "task_name": "Cross-Department Project Charter",
        "target_outcome": "A comprehensive charter for a multi-team initiative with clear goals, scope, stakeholders, timeline, and decision gates",
        "notes": "Pass 1 (70%): Get the structure right — goals, scope, stakeholders, timeline skeleton. Pass 2 (85%): Stress-test assumptions — dependencies, resource conflicts, risk scenarios. Pass 3 (95%): Polish for executive review — tighten language, add decision gates, ensure measurable milestones."
    },
    {
        "category": "Marketing",
        "task_name": "Product Launch Email Sequence",
        "target_outcome": "A 5-email nurture sequence for a new product that moves prospects from awareness to action",
        "notes": "Pass 1 (70%): Map the narrative arc, define value prop per email. Pass 2 (85%): Test subject lines, CTAs, spam filter compliance, mobile rendering. Pass 3 (95%): Align with brand voice, add personalization, create A/B variants."
    },
    {
        "category": "Human Resources",
        "task_name": "New Employee Onboarding Journey Map",
        "target_outcome": "A structured 30-60-90 day onboarding plan that new hires, managers, and HR can all follow",
        "notes": "Pass 1 (70%): Map milestones, stakeholder touchpoints, required trainings. Pass 2 (85%): Identify failure modes — manager unavailability, access delays, info overload in week 1. Pass 3 (95%): Create role-specific checklists, manager coaching tips, feedback mechanism."
    },
    {
        "category": "Finance",
        "task_name": "Quarterly Board Financial Summary",
        "target_outcome": "An executive-level financial narrative that accurately presents revenue, expenses, margins, cash position, and forward outlook",
        "notes": "Pass 1 (70%): Structure the narrative — revenue, expenses, margins, cash position, forward outlook. Pass 2 (85%): Verify all numbers against source data, validate trend characterizations, check that comparisons use correct periods. Pass 3 (95%): Calibrate tone for the board audience, add context behind unusual line items, ensure GAAP language consistency."
    },
    {
        "category": "Education",
        "task_name": "Hands-On Workshop Design for Data Literacy",
        "target_outcome": "A 4-hour interactive workshop where non-technical staff can interpret charts, spot misleading data, and ask the right questions about reports",
        "notes": "Pass 1 (70%): Structure learning progression, select realistic datasets from business scenarios. Pass 2 (85%): Test activities with non-technical volunteers, adjust difficulty and timing. Pass 3 (95%): Polish facilitator notes, create participant handouts, build feedback survey."
    },
    {
        "category": "Operations",
        "task_name": "Vendor Evaluation Decision Framework",
        "target_outcome": "A structured evaluation framework for selecting a new vendor with scoring rubric, mandatory requirements, and audit-ready documentation",
        "notes": "Pass 1 (70%): Define evaluation criteria, scoring rubric, mandatory requirements vs nice-to-have. Pass 2 (85%): Test framework against 2-3 real vendor proposals to find blind spots. Pass 3 (95%): Create stakeholder presentation version, add total cost of ownership calculations, document evaluation process for audit trail."
    },
]
