"""Lesson 3: Template Builder - Example templates by professional category.

One reusable prompt template per category, showing professionals how to
build structured, variable-driven prompts for their domain.
"""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_TEMPLATES = [
    {
        "category": "Project Management",
        "name": "Stakeholder Update Email",
        "description": "Template for writing clear, structured project status updates to stakeholders",
        "content": (
            "Draft a project status update email for stakeholders.\n\n"
            "## Project Information\n"
            "- **Project**: {{project_name}}\n"
            "- **Reporting Period**: {{period}}\n\n"
            "## Accomplishments This Period\n"
            "{{accomplishments}}\n\n"
            "## Current Blockers or Risks\n"
            "{{blockers}}\n\n"
            "## Planned Next Steps\n"
            "{{next_steps}}\n\n"
            "## Request or Ask\n"
            "{{ask}}\n\n"
            "Structure the email with these guidelines:\n"
            "1. **Subject Line** - Include the project name, period, and a one-word "
            "status indicator (On Track / At Risk / Delayed)\n"
            "2. **Opening** (2 sentences max) - State overall status and the single "
            "most important thing the reader needs to know\n"
            "3. **Accomplishments** - Bullet list of what was completed, with "
            "measurable outcomes where possible (e.g., 'Completed vendor evaluation, "
            "narrowing from 8 candidates to 3 finalists')\n"
            "4. **Blockers** - For each blocker, state the issue, the impact if "
            "unresolved, and what action is needed from whom\n"
            "5. **Next Steps** - What will happen in the next reporting period, "
            "listed in priority order\n"
            "6. **Ask** - If you need a decision, approval, or resource, state it "
            "clearly with a deadline\n\n"
            "Tone should be professional but direct. Stakeholders should be able to "
            "understand the project status in under 60 seconds. Avoid jargon. Lead "
            "with outcomes, not activities."
        ),
        "variables": [
            {"name": "project_name", "description": "Name of the project being reported on", "default": "", "required": True},
            {"name": "period", "description": "Reporting period (e.g., 'Week of Feb 10' or 'January 2026')", "default": "", "required": True},
            {"name": "accomplishments", "description": "Key milestones or deliverables completed this period", "default": "", "required": True},
            {"name": "blockers", "description": "Issues preventing progress, or 'None' if clear", "default": "None", "required": False},
            {"name": "next_steps", "description": "Planned activities for the next period", "default": "", "required": True},
            {"name": "ask", "description": "Specific decisions, approvals, or resources needed from stakeholders", "default": "No action needed at this time.", "required": False},
        ],
        "tags": ["status", "communication", "stakeholder"],
    },
    {
        "category": "Marketing",
        "name": "Campaign Brief",
        "description": "Structured brief for planning and aligning a marketing campaign",
        "content": (
            "Create a marketing campaign brief for the following initiative.\n\n"
            "## Campaign Overview\n"
            "- **Campaign Name**: {{campaign_name}}\n"
            "- **Product or Service**: {{product_service}}\n"
            "- **Target Audience**: {{target_audience}}\n"
            "- **Budget**: {{budget}}\n\n"
            "Structure the brief with these sections:\n\n"
            "1. **Objective** - One clear, measurable goal. Use this format: "
            "'[Action verb] [metric] by [amount] within [timeframe].' "
            "Example: 'Generate 500 qualified leads within 6 weeks.'\n\n"
            "2. **Target Audience Profile**:\n"
            "   - Who they are (demographics, job titles, industries)\n"
            "   - What they care about (pain points this campaign addresses)\n"
            "   - Where they spend time (channels, publications, communities)\n"
            "   - What has worked to reach them before and what has not\n\n"
            "3. **Key Message** - The single most important takeaway a reader "
            "should remember. One sentence.\n\n"
            "4. **Supporting Messages** - Three proof points or benefits that "
            "support the key message. Each should be specific and provable.\n\n"
            "5. **Channels and Content Plan**:\n"
            "   - Primary channels with rationale for each\n"
            "   - Content types for each channel (ads, emails, posts, events)\n"
            "   - Recommended posting frequency\n\n"
            "6. **Timeline** - Campaign phases with dates:\n"
            "   - Planning and asset creation\n"
            "   - Launch\n"
            "   - Optimization window\n"
            "   - Wrap-up and reporting\n\n"
            "7. **Budget Allocation** - How to distribute {{budget}} across channels, "
            "with rationale for the split\n\n"
            "8. **Success Metrics** - KPIs with specific targets. Include both "
            "leading indicators (clicks, sign-ups) and lagging indicators "
            "(revenue, retention).\n\n"
            "9. **Call to Action** - What do we want the audience to do? Be specific.\n\n"
            "Keep the brief actionable. A team member should be able to start "
            "executing from this document without additional meetings."
        ),
        "variables": [
            {"name": "campaign_name", "description": "Working name for the campaign", "default": "", "required": True},
            {"name": "product_service", "description": "What product or service is being promoted", "default": "", "required": True},
            {"name": "target_audience", "description": "Who the campaign is trying to reach", "default": "", "required": True},
            {"name": "budget", "description": "Total campaign budget", "default": "", "required": True},
        ],
        "tags": ["campaign", "planning", "strategy"],
    },
    {
        "category": "Human Resources",
        "name": "Performance Review Framework",
        "description": "Structured framework for writing fair, evidence-based performance reviews",
        "content": (
            "Help me write a performance review for the following employee.\n\n"
            "## Employee Details\n"
            "- **Name**: {{employee_name}}\n"
            "- **Role**: {{employee_role}}\n"
            "- **Review Period**: {{review_period}}\n\n"
            "## Performance Notes\n"
            "{{performance_notes}}\n\n"
            "Structure the review with these sections:\n\n"
            "1. **Overall Assessment** - A summary rating and two-sentence overview "
            "that captures overall performance. This should be honest and balanced, "
            "not inflate or deflate.\n\n"
            "2. **Key Accomplishments** (3-5):\n"
            "   - Each accomplishment should include a specific action and a "
            "measurable outcome\n"
            "   - Connect each accomplishment to a team or company goal\n"
            "   - Use the format: '[What they did] which resulted in [measurable "
            "impact]'\n\n"
            "3. **Strengths** (2-3):\n"
            "   - Focus on observable behaviors, not personality traits\n"
            "   - Include at least one specific example for each strength\n"
            "   - Good: 'Consistently prepares clear agendas that keep meetings "
            "under 30 minutes'\n"
            "   - Avoid: 'Great attitude' or 'Team player'\n\n"
            "4. **Growth Areas** (2-3):\n"
            "   - Frame as development opportunities, not criticism\n"
            "   - For each area, include a concrete next step the employee can take\n"
            "   - Be specific: 'Practice presenting financial data to non-finance "
            "audiences' rather than 'Improve communication'\n\n"
            "5. **Goals for Next Period** (3-4):\n"
            "   - Use SMART format (Specific, Measurable, Achievable, Relevant, "
            "Time-bound)\n"
            "   - Include a mix of performance goals and professional development "
            "goals\n\n"
            "6. **Support from Manager** - What the manager commits to providing: "
            "training, mentorship, exposure to new projects, regular feedback "
            "cadence, etc.\n\n"
            "Use specific examples throughout. 'Delivered the vendor negotiation "
            "three weeks ahead of deadline, saving $15K in rush fees' is stronger "
            "than 'good time management.'"
        ),
        "variables": [
            {"name": "employee_name", "description": "Name of the employee being reviewed", "default": "", "required": True},
            {"name": "employee_role", "description": "Current role and level", "default": "", "required": True},
            {"name": "review_period", "description": "Time period this review covers", "default": "", "required": True},
            {"name": "performance_notes", "description": "Raw notes on performance, achievements, and areas to improve", "default": "", "required": True},
        ],
        "tags": ["performance", "review", "development"],
    },
    {
        "category": "Finance",
        "name": "Budget Variance Report",
        "description": "Template for explaining budget versus actual results with actionable context",
        "content": (
            "Draft a budget variance report for the following period.\n\n"
            "## Report Details\n"
            "- **Department**: {{department}}\n"
            "- **Period**: {{period}}\n"
            "- **Budgeted Amount**: {{budget_amount}}\n"
            "- **Actual Amount**: {{actual_amount}}\n\n"
            "## Variance Items\n"
            "{{variance_items}}\n\n"
            "## Corrective Actions\n"
            "{{corrective_actions}}\n\n"
            "Structure the report with these sections:\n\n"
            "1. **Executive Summary** (3-4 sentences):\n"
            "   - State the total variance (dollar amount and percentage)\n"
            "   - Identify whether it is favorable or unfavorable\n"
            "   - Name the top one or two drivers\n"
            "   - State whether corrective action is needed\n\n"
            "2. **Variance Detail Table**:\n"
            "   | Line Item | Budget | Actual | Variance ($) | Variance (%) | Note |\n"
            "   Include every line item with a variance greater than 5 percent or "
            "$5,000, whichever is smaller.\n\n"
            "3. **Variance Explanations** - For each significant variance:\n"
            "   - What happened (root cause, not just 'higher than expected')\n"
            "   - Whether it is a one-time event or a recurring trend\n"
            "   - Impact on full-year forecast if the trend continues\n\n"
            "4. **Corrective Actions** - For unfavorable variances:\n"
            "   - Specific action to be taken\n"
            "   - Who is responsible\n"
            "   - Expected timeline for resolution\n"
            "   - Projected financial impact of the correction\n\n"
            "5. **Forecast Update** - Does this variance change the full-year "
            "outlook? If yes, provide revised numbers.\n\n"
            "Tone should be factual and precise. Avoid hedging language like "
            "'slightly over' or 'somewhat below.' Use exact figures. The reader "
            "should be able to understand the financial position without asking "
            "follow-up questions."
        ),
        "variables": [
            {"name": "department", "description": "Department or cost center being reported", "default": "", "required": True},
            {"name": "period", "description": "Reporting period (e.g., 'Q3 2025' or 'November 2025')", "default": "", "required": True},
            {"name": "budget_amount", "description": "Total budgeted amount for the period", "default": "", "required": True},
            {"name": "actual_amount", "description": "Total actual spend or revenue for the period", "default": "", "required": True},
            {"name": "variance_items", "description": "Key line items where budget and actual diverged, with amounts", "default": "", "required": True},
            {"name": "corrective_actions", "description": "Actions taken or planned to address unfavorable variances", "default": "To be determined based on analysis.", "required": False},
        ],
        "tags": ["budget", "variance", "financial-reporting"],
    },
    {
        "category": "Education",
        "name": "Workshop Design Brief",
        "description": "Template for designing a professional development workshop with clear structure",
        "content": (
            "Design a professional development workshop based on these parameters.\n\n"
            "## Workshop Parameters\n"
            "- **Topic**: {{topic}}\n"
            "- **Target Audience**: {{audience}}\n"
            "- **Duration**: {{duration}}\n"
            "- **Learning Objectives**: {{learning_objectives}}\n"
            "- **Prerequisites**: {{prerequisites}}\n\n"
            "Structure the workshop design with these sections:\n\n"
            "1. **Workshop Overview** (2-3 sentences):\n"
            "   - What participants will learn and why it matters to them\n"
            "   - Tie the topic to a real workplace challenge the audience faces\n\n"
            "2. **Learning Objectives** - Expand each objective into:\n"
            "   - A measurable outcome (what participants will be able to do)\n"
            "   - An assessment method (how you will know they learned it)\n"
            "   - Use action verbs: apply, demonstrate, evaluate, create\n\n"
            "3. **Agenda with Time Blocks**:\n"
            "   - Opening and icebreaker (5-10 percent of total time)\n"
            "   - Core content delivery (no more than 30 percent as lecture)\n"
            "   - Hands-on activities (at least 40 percent of total time)\n"
            "   - Reflection and action planning (10-15 percent of total time)\n"
            "   - For each block: activity description, materials needed, "
            "facilitator instructions\n\n"
            "4. **Activities and Exercises** - For each activity:\n"
            "   - Purpose (which objective it addresses)\n"
            "   - Instructions (step by step)\n"
            "   - Group format (individual, pairs, small groups, whole group)\n"
            "   - Estimated time\n"
            "   - Debrief questions\n\n"
            "5. **Materials List**:\n"
            "   - Room setup requirements\n"
            "   - Handouts or worksheets (describe content)\n"
            "   - Technology needs\n"
            "   - Supplies (markers, sticky notes, etc.)\n\n"
            "6. **Facilitator Notes**:\n"
            "   - Common questions to prepare for\n"
            "   - Where participants typically struggle\n"
            "   - Backup activities if you run ahead or behind schedule\n\n"
            "Every activity should connect directly to at least one learning "
            "objective. Avoid filler content. Participants should leave with "
            "something they can use in their next workday."
        ),
        "variables": [
            {"name": "topic", "description": "Workshop topic or title", "default": "", "required": True},
            {"name": "audience", "description": "Who will attend (roles, experience level, group size)", "default": "", "required": True},
            {"name": "duration", "description": "Total time available for the workshop", "default": "2 hours", "required": True},
            {"name": "learning_objectives", "description": "What participants should be able to do after the workshop", "default": "", "required": True},
            {"name": "prerequisites", "description": "Any required knowledge or preparation before attending", "default": "None", "required": False},
        ],
        "tags": ["workshop", "training", "professional-development"],
    },
    {
        "category": "Operations",
        "name": "Process Change Request",
        "description": "Template for proposing and documenting a process change with business justification",
        "content": (
            "Draft a process change request for the following proposal.\n\n"
            "## Change Details\n"
            "- **Process Name**: {{process_name}}\n"
            "- **Current State**: {{current_state}}\n"
            "- **Proposed Change**: {{proposed_change}}\n"
            "- **Business Justification**: {{business_justification}}\n"
            "- **Affected Teams**: {{affected_teams}}\n"
            "- **Rollback Plan**: {{rollback_plan}}\n\n"
            "Structure the change request with these sections:\n\n"
            "1. **Change Summary** (3-4 sentences):\n"
            "   - What is being changed and why\n"
            "   - Expected benefit in measurable terms\n"
            "   - Who is affected\n\n"
            "2. **Current State Analysis**:\n"
            "   - Document the existing process step by step\n"
            "   - Identify specific pain points with data (error rates, time "
            "spent, customer complaints, cost)\n"
            "   - Note how long the current process has been in place\n\n"
            "3. **Proposed Change**:\n"
            "   - New process step by step\n"
            "   - Highlight exactly what is different from current state\n"
            "   - Required resources (people, tools, budget)\n"
            "   - Implementation timeline with milestones\n\n"
            "4. **Business Justification**:\n"
            "   - Quantified benefits (time saved, errors reduced, cost avoided)\n"
            "   - Qualitative benefits (employee satisfaction, customer experience)\n"
            "   - Cost of implementing the change\n"
            "   - Expected payback period or ROI\n\n"
            "5. **Risk Assessment**:\n"
            "   - What could go wrong during the transition\n"
            "   - Impact on daily operations during rollout\n"
            "   - Mitigation strategies for each risk\n\n"
            "6. **Affected Teams and Communication Plan**:\n"
            "   - List every team impacted, even indirectly\n"
            "   - Training requirements for each team\n"
            "   - Communication timeline (who learns what, when)\n\n"
            "7. **Rollback Plan**:\n"
            "   - Criteria that would trigger a rollback\n"
            "   - Steps to revert to the previous process\n"
            "   - Estimated time to rollback\n\n"
            "8. **Approval and Sign-Off** - List the decision makers who need "
            "to approve this change, with their role and the date needed.\n\n"
            "Write for an audience that may not be familiar with the day-to-day "
            "details of this process. Be specific enough that someone could "
            "execute the change from this document alone."
        ),
        "variables": [
            {"name": "process_name", "description": "Name of the process being changed", "default": "", "required": True},
            {"name": "current_state", "description": "Description of how the process works today and its problems", "default": "", "required": True},
            {"name": "proposed_change", "description": "What specifically will be different", "default": "", "required": True},
            {"name": "business_justification", "description": "Why this change is worth making (cost, time, quality)", "default": "", "required": True},
            {"name": "affected_teams", "description": "Teams or departments impacted by this change", "default": "", "required": True},
            {"name": "rollback_plan", "description": "How to revert if the change does not work", "default": "Revert to previous process and document lessons learned.", "required": False},
        ],
        "tags": ["process", "change-management", "operations"],
    },
]
