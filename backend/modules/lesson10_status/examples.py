"""Lesson 10: Status Reporter - Example workflow templates by professional category.

One workflow per category showing how AI-assisted status reporting
applies across different professional domains.
"""

EXAMPLE_CATEGORIES = ["Project Management", "Marketing", "Human Resources", "Finance", "Education", "Operations"]

EXAMPLE_WORKFLOW_TEMPLATES = [
    {
        "category": "Project Management",
        "name": "Sprint Retrospective Summary",
        "description": "Summarize sprint outcomes into a structured retrospective with themes and action items",
        "frequency": "biweekly",
        "estimated_time_minutes": 30,
        "inputs": [
            {"name": "sprint_goals", "type": "text", "description": "Goals set at the start of the sprint", "required": True},
            {"name": "completed_items", "type": "text", "description": "Work items completed during the sprint", "required": True},
            {"name": "incomplete_items", "type": "text", "description": "Work items not completed and reasons why", "required": True},
            {"name": "team_feedback", "type": "text", "description": "Feedback collected from team members", "required": True}
        ],
        "steps": [
            {"order": 1, "description": "Gather sprint data from project management tool", "is_ai_step": False},
            {"order": 2, "description": "Generate summary with themes and action items", "is_ai_step": True},
            {"order": 3, "description": "Review for accuracy and fairness", "is_ai_step": False},
            {"order": 4, "description": "Distribute to team and stakeholders", "is_ai_step": False}
        ],
        "prompt_template": """Generate a sprint retrospective summary from the following data:

## Sprint Goals
{{sprint_goals}}

## Completed Items
{{completed_items}}

## Incomplete Items
{{incomplete_items}}

## Team Feedback
{{team_feedback}}

Organize the summary into these sections:
1. **What Went Well** — themes from completed work and positive feedback
2. **What Didn't Go Well** — patterns in incomplete work and challenges
3. **Action Items** — specific, assignable improvements for next sprint

Keep the tone constructive. Focus on process improvements, not individual blame. Each action item should be concrete and measurable.""",
        "quality_checks": ["accuracy", "completeness", "tone"]
    },
    {
        "category": "Marketing",
        "name": "Campaign Performance Report",
        "description": "Generate a narrative analysis of campaign metrics with actionable recommendations",
        "frequency": "weekly",
        "estimated_time_minutes": 25,
        "inputs": [
            {"name": "campaign_name", "type": "text", "description": "Name of the campaign being reported on", "required": True},
            {"name": "metrics_data", "type": "text", "description": "Key metrics: impressions, clicks, conversions, engagement rates", "required": True},
            {"name": "budget_spent", "type": "text", "description": "Budget spent vs. allocated for the period", "required": True},
            {"name": "notable_events", "type": "text", "description": "Any notable events affecting performance (holidays, competitor activity, etc.)", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Export metrics from marketing platform", "is_ai_step": False},
            {"order": 2, "description": "Generate narrative analysis with recommendations", "is_ai_step": True},
            {"order": 3, "description": "Verify numbers match source data", "is_ai_step": False},
            {"order": 4, "description": "Add executive summary and distribute", "is_ai_step": False}
        ],
        "prompt_template": """Generate a campaign performance report:

## Campaign: {{campaign_name}}

## Metrics
{{metrics_data}}

## Budget
{{budget_spent}}

{{#if notable_events}}
## Notable Events
{{notable_events}}
{{/if}}

Create a report with these sections:
1. **Executive Summary** — 2-3 sentence overview of performance
2. **Key Metrics Analysis** — what the numbers mean, not just what they are
3. **Budget Efficiency** — cost per result and ROI observations
4. **Recommendations** — 2-3 specific, actionable next steps

Use plain language. Avoid jargon. Focus on insights over data repetition.""",
        "quality_checks": ["accuracy", "completeness", "relevance"]
    },
    {
        "category": "Human Resources",
        "name": "Recruitment Pipeline Update",
        "description": "Summarize recruitment pipeline status with bottleneck analysis for hiring managers",
        "frequency": "weekly",
        "estimated_time_minutes": 20,
        "inputs": [
            {"name": "open_positions", "type": "text", "description": "List of open positions with department and days open", "required": True},
            {"name": "candidates_in_pipeline", "type": "text", "description": "Number of candidates at each stage (applied, screened, interviewed, offered)", "required": True},
            {"name": "interviews_completed", "type": "text", "description": "Interviews completed this week with outcomes", "required": True},
            {"name": "offers_extended", "type": "text", "description": "Offers extended or accepted this week", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Pull pipeline data from applicant tracking system", "is_ai_step": False},
            {"order": 2, "description": "Generate status summary with bottleneck analysis", "is_ai_step": True},
            {"order": 3, "description": "Verify candidate counts and position details", "is_ai_step": False},
            {"order": 4, "description": "Send to hiring managers", "is_ai_step": False}
        ],
        "prompt_template": """Generate a recruitment pipeline update:

## Open Positions
{{open_positions}}

## Candidates in Pipeline
{{candidates_in_pipeline}}

## Interviews Completed
{{interviews_completed}}

{{#if offers_extended}}
## Offers
{{offers_extended}}
{{/if}}

Create a summary with these sections:
1. **Pipeline Overview** — high-level status across all open roles
2. **Bottleneck Analysis** — where candidates are getting stuck and why
3. **Positions Needing Attention** — roles at risk of delayed fill
4. **This Week's Progress** — interviews completed and offers in motion

Keep it concise. Hiring managers want to scan this in under 2 minutes.""",
        "quality_checks": ["accuracy", "completeness", "formatting"]
    },
    {
        "category": "Finance",
        "name": "Weekly Cash Flow Summary",
        "description": "Generate a cash flow narrative with trend analysis and anomaly flagging",
        "frequency": "weekly",
        "estimated_time_minutes": 30,
        "inputs": [
            {"name": "opening_balance", "type": "text", "description": "Opening cash balance for the week", "required": True},
            {"name": "inflows", "type": "text", "description": "Cash inflows by category (receivables collected, other income)", "required": True},
            {"name": "outflows", "type": "text", "description": "Cash outflows by category (payroll, vendor payments, operating expenses)", "required": True},
            {"name": "pending_transactions", "type": "text", "description": "Expected but not yet settled transactions", "required": True},
            {"name": "notes", "type": "text", "description": "Any unusual items or context for the week", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Compile transaction data from accounting system", "is_ai_step": False},
            {"order": 2, "description": "Generate narrative with trend analysis", "is_ai_step": True},
            {"order": 3, "description": "Verify all figures against bank statements", "is_ai_step": False},
            {"order": 4, "description": "Flag any anomalies for review", "is_ai_step": False}
        ],
        "prompt_template": """Generate a weekly cash flow summary:

## Opening Balance
{{opening_balance}}

## Inflows
{{inflows}}

## Outflows
{{outflows}}

## Pending Transactions
{{pending_transactions}}

{{#if notes}}
## Notes
{{notes}}
{{/if}}

Create a summary with these sections:
1. **Week at a Glance** — opening balance, net change, closing balance
2. **Inflow Analysis** — where cash came from and any notable patterns
3. **Outflow Analysis** — major expenditure categories and variances from typical weeks
4. **Upcoming Considerations** — pending transactions and their expected impact
5. **Anomalies** — anything that looks unusual compared to recent weeks

Use precise financial language. All numbers should be clearly labeled. Flag anything that deviates significantly from recent trends.""",
        "quality_checks": ["accuracy", "completeness", "formatting"]
    },
    {
        "category": "Education",
        "name": "Student Progress Report",
        "description": "Generate personalized student progress narratives from assessment and attendance data",
        "frequency": "monthly",
        "estimated_time_minutes": 40,
        "inputs": [
            {"name": "student_name", "type": "text", "description": "Student's name", "required": True},
            {"name": "assessment_scores", "type": "text", "description": "Recent assessment scores with subject areas", "required": True},
            {"name": "attendance_data", "type": "text", "description": "Attendance record for the reporting period", "required": True},
            {"name": "participation_notes", "type": "text", "description": "Notes on class participation and engagement", "required": True},
            {"name": "goals", "type": "text", "description": "Previously set learning goals and their status", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Compile assessment and attendance data", "is_ai_step": False},
            {"order": 2, "description": "Generate personalized progress narrative", "is_ai_step": True},
            {"order": 3, "description": "Review for accuracy and sensitivity", "is_ai_step": False},
            {"order": 4, "description": "Add specific recommendations for next period", "is_ai_step": False}
        ],
        "prompt_template": """Generate a student progress report:

## Student: {{student_name}}

## Assessment Scores
{{assessment_scores}}

## Attendance
{{attendance_data}}

## Participation
{{participation_notes}}

{{#if goals}}
## Previous Goals
{{goals}}
{{/if}}

Create a progress report with these sections:
1. **Overall Progress** — brief narrative of the student's trajectory
2. **Strengths** — areas where the student is performing well
3. **Areas for Growth** — specific skills or subjects needing attention
4. **Goal Progress** — status of previously set goals (if applicable)
5. **Recommendations** — 2-3 specific, actionable next steps

Use an encouraging, growth-oriented tone. Be specific about what the student can do to improve. Avoid comparing to other students.""",
        "quality_checks": ["accuracy", "tone", "completeness", "relevance"]
    },
    {
        "category": "Operations",
        "name": "Daily Operations Handoff",
        "description": "Generate a structured shift handoff brief for incoming team members",
        "frequency": "daily",
        "estimated_time_minutes": 15,
        "inputs": [
            {"name": "shift_summary", "type": "text", "description": "Summary of events and activities during the shift", "required": True},
            {"name": "open_issues", "type": "text", "description": "Issues that are still unresolved and need attention", "required": True},
            {"name": "resolved_issues", "type": "text", "description": "Issues resolved during this shift", "required": True},
            {"name": "upcoming_deadlines", "type": "text", "description": "Deadlines or scheduled events in the next 24-48 hours", "required": False}
        ],
        "steps": [
            {"order": 1, "description": "Document shift events and issues", "is_ai_step": False},
            {"order": 2, "description": "Generate structured handoff brief", "is_ai_step": True},
            {"order": 3, "description": "Verify critical items are highlighted", "is_ai_step": False},
            {"order": 4, "description": "Post to team channel", "is_ai_step": False}
        ],
        "prompt_template": """Generate a shift handoff brief:

## Shift Summary
{{shift_summary}}

## Open Issues
{{open_issues}}

## Resolved Issues
{{resolved_issues}}

{{#if upcoming_deadlines}}
## Upcoming Deadlines
{{upcoming_deadlines}}
{{/if}}

Create a handoff brief with these sections:
1. **Critical Items** — anything requiring immediate attention from the incoming team (highlight urgency)
2. **Shift Recap** — brief summary of what happened, organized by priority
3. **Resolved This Shift** — what was closed out (so the next team doesn't duplicate effort)
4. **Watch List** — items to monitor over the next shift
5. **Upcoming** — deadlines or events in the next 24-48 hours

Keep it scannable. Use bullet points. The incoming team should understand the situation in under 3 minutes.""",
        "quality_checks": ["completeness", "formatting", "relevance"]
    },
]
