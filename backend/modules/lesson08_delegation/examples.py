"""Lesson 8: Delegation Tracker - Example delegation templates for professional categories."""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_DELEGATIONS = [
    {
        "category": "Project Management",
        "name": "Stakeholder Update Report",
        "template": (
            "## Context\n"
            "We are midway through the Q2 office relocation project. Leadership "
            "expects a written status update every two weeks summarizing progress, "
            "risks, and upcoming milestones. The audience includes the VP of Operations, "
            "Facilities Director, and department heads who are not involved in daily "
            "project activities.\n\n"
            "## Objective\n"
            "Draft a concise, professional project status report that gives stakeholders "
            "a clear picture of where the project stands without requiring them to ask "
            "follow-up questions.\n\n"
            "## Scope\n"
            "IN: Progress against milestones, budget status summary, top 3 risks with "
            "mitigation plans, key decisions needed, next two weeks outlook.\n"
            "OUT: Detailed task-level breakdowns, vendor contract specifics, internal "
            "team assignments, or technical facility specifications.\n\n"
            "## Deliverable\n"
            "A 1-2 page status report in narrative format with clearly labeled sections. "
            "Use bullet points for risks and action items. Include a one-line project "
            "health indicator (on track / at risk / off track) at the top.\n\n"
            "## Success Criteria\n"
            "- All active milestones referenced with completion percentage\n"
            "- Budget summary accurate to the current reporting period\n"
            "- Risks are specific, not generic placeholders\n"
            "- Language appropriate for executive audience (no jargon)\n"
            "- Actionable next steps with owners and due dates"
        ),
        "task_sequence": [
            {
                "title": "Gather project data and draft report",
                "description": (
                    "Compile current milestone status, budget figures, and risk "
                    "log entries. Feed this data to AI with the template to "
                    "generate the initial draft."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Review draft for accuracy and tone",
                "description": (
                    "Verify all numbers match source data, confirm risk descriptions "
                    "reflect actual project conditions, and adjust language for "
                    "executive audience."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Distribute to stakeholders and handle questions",
                "description": (
                    "Send the finalized report to the distribution list and "
                    "respond to any follow-up questions or requests for "
                    "clarification from leadership."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Marketing",
        "name": "Competitor Analysis Brief",
        "template": (
            "## Context\n"
            "Our marketing team is preparing for the annual planning cycle and needs "
            "an updated view of the competitive landscape. Three new competitors have "
            "entered our market segment in the past six months, and two existing "
            "competitors have launched rebranding campaigns. The brief will inform "
            "budget allocation and messaging strategy decisions.\n\n"
            "## Objective\n"
            "Produce a competitor analysis brief that summarizes each major competitor's "
            "current positioning, recent marketing activities, and potential threats "
            "or opportunities for our brand.\n\n"
            "## Scope\n"
            "IN: Top 6 competitors, their public messaging, social media presence, "
            "recent campaign themes, pricing positioning, and customer sentiment "
            "from public reviews.\n"
            "OUT: Proprietary financial data, internal competitor strategies, or "
            "recommendations for our specific response (that comes later).\n\n"
            "## Deliverable\n"
            "A structured brief with one section per competitor, each containing: "
            "company overview, positioning statement, recent activities, strengths, "
            "weaknesses, and a threat-level rating (high/medium/low). Include a "
            "summary comparison table at the end.\n\n"
            "## Success Criteria\n"
            "- All 6 competitors covered with consistent depth\n"
            "- Information is current (within the last 3 months)\n"
            "- Threat ratings are justified with specific evidence\n"
            "- Comparison table allows side-by-side evaluation\n"
            "- No unsupported speculation presented as fact"
        ),
        "task_sequence": [
            {
                "title": "Research competitors and generate draft brief",
                "description": (
                    "Provide AI with competitor names, known information, and "
                    "the template structure. Have AI compile publicly available "
                    "data into the analysis format."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Validate findings and add market context",
                "description": (
                    "Cross-check AI-generated insights against your team's "
                    "direct market experience. Add context about competitor "
                    "moves that are not publicly documented and adjust threat "
                    "ratings based on insider knowledge."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Present brief to leadership and facilitate discussion",
                "description": (
                    "Walk stakeholders through the competitive landscape, "
                    "facilitate strategic discussion about implications, and "
                    "capture decisions about how to respond."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": True,
            },
        ],
    },
    {
        "category": "Human Resources",
        "name": "Compensation Benchmarking Summary",
        "template": (
            "## Context\n"
            "The HR team is conducting the annual compensation review. We need to "
            "compare our current salary bands against market rates to identify roles "
            "where we may be under- or over-paying relative to industry benchmarks. "
            "This analysis covers 12 key roles across three departments and will be "
            "presented to the compensation committee.\n\n"
            "## Objective\n"
            "Create a compensation benchmarking summary that compares our current "
            "salary ranges to market data and highlights roles where adjustments "
            "may be warranted.\n\n"
            "## Scope\n"
            "IN: The 12 specified roles, market salary data from published surveys, "
            "geographic cost-of-living adjustments, and our current salary bands.\n"
            "OUT: Individual employee salary details, performance review data, "
            "specific adjustment recommendations (those require committee input), "
            "or benefits/equity compensation comparisons.\n\n"
            "## Deliverable\n"
            "A summary document with a table showing each role, our current range, "
            "market 25th/50th/75th percentile, and a variance indicator. Include a "
            "narrative section highlighting the top 3-4 roles with the largest gaps "
            "and any notable market trends.\n\n"
            "## Success Criteria\n"
            "- All 12 roles included with complete data\n"
            "- Market data sourced from reputable, current surveys\n"
            "- Geographic adjustments applied consistently\n"
            "- Variance calculations are mathematically correct\n"
            "- Narrative avoids recommending specific raises (that is the committee's role)"
        ),
        "task_sequence": [
            {
                "title": "Compile market data and generate comparison table",
                "description": (
                    "Provide AI with our salary bands and published market "
                    "data. Have it calculate variances, apply geographic "
                    "adjustments, and produce the comparison table with "
                    "narrative highlights."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Verify calculations and add organizational context",
                "description": (
                    "Double-check all variance calculations against source "
                    "data. Add context about hard-to-fill roles, upcoming "
                    "organizational changes, or retention risks that the "
                    "numbers alone do not capture."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Present to compensation committee for decisions",
                "description": (
                    "Walk the committee through the findings, answer "
                    "questions about methodology, and facilitate the "
                    "discussion about which roles to prioritize for "
                    "adjustments."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": True,
            },
        ],
    },
    {
        "category": "Finance",
        "name": "Monthly Variance Analysis Report",
        "template": (
            "## Context\n"
            "Each month, the finance team produces a variance analysis comparing actual "
            "spending to the approved budget. This report goes to department heads and "
            "the CFO. We are in month 8 of the fiscal year, and three departments have "
            "exceeded their Q3 budgets due to unplanned hiring and a vendor price increase.\n\n"
            "## Objective\n"
            "Draft a monthly budget vs. actual variance analysis report that clearly "
            "explains where spending deviated from plan and why, without editorializing "
            "or speculating about causes.\n\n"
            "## Scope\n"
            "IN: Budget figures by department and line item, actual spend from the "
            "accounting system, known explanations for major variances (provided by "
            "department heads), and year-to-date cumulative figures.\n"
            "OUT: Forecasting or projections, recommendations for budget cuts, "
            "individual transaction details, or commentary on department performance.\n\n"
            "## Deliverable\n"
            "A structured report with: executive summary (3-4 sentences), variance "
            "table by department, detailed explanations for any variance exceeding "
            "5% or $10,000, and a year-to-date trend section. All numbers must "
            "tie back to the source data.\n\n"
            "## Success Criteria\n"
            "- Every number matches the approved budget and accounting system exports\n"
            "- Variance explanations use confirmed facts, not assumptions\n"
            "- Executive summary captures the 2-3 most significant variances\n"
            "- Consistent formatting and rounding throughout\n"
            "- Report is neutral in tone (no blame or praise language)"
        ),
        "task_sequence": [
            {
                "title": "Feed source data and generate draft report",
                "description": (
                    "Input the budget and actual figures along with department "
                    "explanations. Have AI calculate variances, flag items "
                    "exceeding thresholds, and draft the report structure."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Verify numbers and confirm variance explanations",
                "description": (
                    "Cross-check every figure against the accounting export "
                    "and approved budget. Confirm that variance explanations "
                    "are factual by reviewing with the responsible department "
                    "heads."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Present to CFO and address follow-up questions",
                "description": (
                    "Deliver the finalized report to the CFO, walk through "
                    "the significant variances, and handle any questions "
                    "about specific line items or trends."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Education",
        "name": "Curriculum Gap Analysis",
        "template": (
            "## Context\n"
            "Our learning and development team has been running the same core training "
            "curriculum for two years. Several new competencies have been added to our "
            "performance framework, and employee survey results indicate gaps in "
            "communication skills and project management fundamentals. We need to "
            "understand where the current curriculum falls short before designing new "
            "content.\n\n"
            "## Objective\n"
            "Produce a gap analysis that maps current training offerings against the "
            "updated competency framework and identifies specific areas where new or "
            "revised content is needed.\n\n"
            "## Scope\n"
            "IN: Current course catalog with learning objectives, updated competency "
            "framework, employee survey results on skill gaps, and completion rate "
            "data for existing courses.\n"
            "OUT: Specific course designs, vendor recommendations for external training, "
            "budget estimates, or individual employee development plans.\n\n"
            "## Deliverable\n"
            "A gap analysis matrix showing each competency, which current courses "
            "address it (fully, partially, or not at all), and a priority rating "
            "(high/medium/low) for closing each gap. Include a narrative summary of "
            "the top 5 gaps with supporting evidence from the survey data.\n\n"
            "## Success Criteria\n"
            "- Every competency in the framework is mapped\n"
            "- Current course mappings are accurate (verified against syllabi)\n"
            "- Priority ratings are justified with data, not assumptions\n"
            "- Survey evidence is properly cited and summarized\n"
            "- Gaps are clearly distinguished from courses needing updates vs. entirely new content"
        ),
        "task_sequence": [
            {
                "title": "Map competencies to courses and generate gap matrix",
                "description": (
                    "Provide AI with the competency framework and course "
                    "catalog. Have it create the mapping matrix, identify "
                    "uncovered competencies, and draft the narrative summary "
                    "with survey data references."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Validate mappings and refine priority ratings",
                "description": (
                    "Review the AI-generated mappings against actual course "
                    "syllabi and learning objectives. Adjust priority ratings "
                    "based on organizational strategy, upcoming initiatives, "
                    "and feedback from department managers."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Present findings and facilitate curriculum planning session",
                "description": (
                    "Share the gap analysis with the L&D leadership team, "
                    "facilitate a discussion about which gaps to prioritize, "
                    "and capture decisions about next steps for curriculum "
                    "development."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": True,
            },
        ],
    },
    {
        "category": "Operations",
        "name": "Standard Operating Procedure Update",
        "template": (
            "## Context\n"
            "Our customer returns processing procedure was last updated 18 months ago. "
            "Since then, we have added a new inventory management system, changed our "
            "shipping provider, and introduced a customer loyalty credit option. The "
            "current SOP no longer reflects the actual process, causing confusion among "
            "new team members and inconsistent handling of returns.\n\n"
            "## Objective\n"
            "Revise the existing returns processing SOP to reflect all current systems, "
            "policies, and procedures so that any team member can follow it accurately "
            "without additional guidance.\n\n"
            "## Scope\n"
            "IN: Current SOP document, documented process changes from the last 18 months, "
            "new system screenshots and workflows, updated policy on loyalty credits, "
            "and shipping provider procedures.\n"
            "OUT: Warranty policy changes (handled by legal separately), customer-facing "
            "return policy language, or system configuration documentation.\n\n"
            "## Deliverable\n"
            "An updated SOP document in the standard company format with numbered steps, "
            "decision points clearly marked, system references with screenshots where "
            "applicable, and an appendix of exception scenarios. Version-controlled with "
            "a change log from the previous version.\n\n"
            "## Success Criteria\n"
            "- Every step references the correct current system or tool\n"
            "- Decision points have clear criteria (not ambiguous judgment calls)\n"
            "- Loyalty credit option is fully integrated into the process flow\n"
            "- New shipping provider procedures replace all references to the old provider\n"
            "- A new team member could follow the SOP without asking for help"
        ),
        "task_sequence": [
            {
                "title": "Merge change documentation and generate revised SOP draft",
                "description": (
                    "Feed the current SOP and all documented changes to AI. "
                    "Have it produce a revised draft that integrates the new "
                    "systems, policies, and procedures into the existing "
                    "structure."
                ),
                "task_category": "ai_optimal",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Walk through revised SOP with process experts",
                "description": (
                    "Review the draft step-by-step with team members who "
                    "perform returns processing daily. Identify any steps "
                    "that are missing, out of order, or inaccurate based "
                    "on how the process actually works."
                ),
                "task_category": "collaborative",
                "status": "pending",
                "is_decision_gate": False,
            },
            {
                "title": "Get process owner sign-off and publish",
                "description": (
                    "Submit the finalized SOP to the operations manager for "
                    "formal review and approval. Once signed off, distribute "
                    "to the team and archive the previous version."
                ),
                "task_category": "human_primary",
                "status": "pending",
                "is_decision_gate": True,
            },
        ],
    },
]
