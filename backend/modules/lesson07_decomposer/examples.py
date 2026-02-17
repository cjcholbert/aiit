"""Lesson 7: Task Decomposer - Example decompositions for professional categories."""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_DECOMPOSITIONS = [
    {
        "category": "Project Management",
        "project_name": "Organize Annual Company Retreat",
        "description": (
            "Plan and execute a multi-day company retreat including venue "
            "selection, agenda design, logistics coordination, and post-event "
            "follow-up for a team of 50-100 employees."
        ),
        "tasks": [
            {
                "title": "Research venue options",
                "description": (
                    "Compile a shortlist of 5-7 venue options based on budget, "
                    "location, capacity, and amenity requirements. Include pricing "
                    "comparisons, availability dates, and pros/cons for each."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can efficiently research and compare venues from publicly "
                    "available information, organize the data into a comparison "
                    "matrix, and summarize key differentiators."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Design agenda and team activities",
                "description": (
                    "Create a balanced retreat agenda that includes strategic "
                    "planning sessions, team-building activities, free time, "
                    "and social events. Align activities with company culture."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can propose agenda structures and activity ideas, but "
                    "human judgment is needed to ensure activities match team "
                    "dynamics, physical abilities, and company culture."
                ),
                "order": 1,
                "is_decision_gate": False,
            },
            {
                "title": "Get budget approval from leadership",
                "description": (
                    "Present the venue options and proposed budget to senior "
                    "leadership for approval. Address questions about ROI and "
                    "cost justification."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Budget approval requires relationship management, reading "
                    "the room during the presentation, and responding to "
                    "real-time objections -- all inherently human skills."
                ),
                "order": 2,
                "is_decision_gate": True,
            },
            {
                "title": "Create communications and registration",
                "description": (
                    "Draft announcement emails, registration forms, FAQ "
                    "documents, and a pre-retreat information packet for all "
                    "attendees."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI excels at generating templated communications, FAQs, "
                    "and information documents from structured inputs. These "
                    "are well-defined writing tasks with clear parameters."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Coordinate logistics with vendors",
                "description": (
                    "Manage bookings, catering arrangements, transportation, "
                    "audiovisual setup, and other vendor relationships. Handle "
                    "negotiations and last-minute changes."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Vendor coordination requires real-time negotiation, "
                    "relationship management, and on-the-spot problem solving "
                    "that AI cannot perform."
                ),
                "order": 4,
                "is_decision_gate": False,
            },
            {
                "title": "Post-event survey and summary",
                "description": (
                    "Design a feedback survey, distribute it to attendees, "
                    "compile results, and draft a summary report with "
                    "recommendations for next year."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can draft survey questions and compile results "
                    "efficiently, but interpreting qualitative feedback and "
                    "making actionable recommendations requires human insight."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Marketing",
        "project_name": "Launch Product Rebranding Campaign",
        "description": (
            "Execute a full rebranding campaign including brand audit, new "
            "messaging development, multi-channel content creation, and "
            "performance tracking for an established product line."
        ),
        "tasks": [
            {
                "title": "Audit current brand perception and competitor landscape",
                "description": (
                    "Analyze existing brand sentiment, review competitor "
                    "positioning, and compile a landscape assessment with "
                    "opportunities and threats."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can gather and organize competitive data, but "
                    "interpreting brand perception nuances and identifying "
                    "strategic positioning opportunities requires marketing "
                    "expertise and human judgment."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Define new brand messaging framework",
                "description": (
                    "Establish the updated brand voice, key messages, value "
                    "propositions, and positioning statements that will guide "
                    "all campaign materials."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Brand identity decisions require deep understanding of "
                    "company values, customer relationships, and market "
                    "positioning that only experienced marketers can provide."
                ),
                "order": 1,
                "is_decision_gate": True,
            },
            {
                "title": "Generate content across channels",
                "description": (
                    "Produce social media posts, email sequences, website copy, "
                    "press releases, and sales collateral using the approved "
                    "messaging framework."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "Once the messaging framework is approved, AI can "
                    "efficiently produce high volumes of content variations "
                    "across channels while maintaining consistency."
                ),
                "order": 2,
                "is_decision_gate": False,
            },
            {
                "title": "Design campaign timeline and channel strategy",
                "description": (
                    "Create a detailed launch calendar with channel-specific "
                    "tactics, audience targeting, budget allocation, and "
                    "coordination across teams."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can propose timeline structures and channel "
                    "recommendations, but finalizing the strategy requires "
                    "knowledge of team capacity, budget realities, and "
                    "cross-departmental coordination."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Secure stakeholder sign-off on brand guidelines",
                "description": (
                    "Present the finalized brand guidelines to executive "
                    "stakeholders, address feedback, and obtain formal "
                    "approval before public launch."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Executive presentations require reading the room, "
                    "handling objections diplomatically, and navigating "
                    "organizational politics -- purely human activities."
                ),
                "order": 4,
                "is_decision_gate": True,
            },
            {
                "title": "Track launch metrics and prepare performance report",
                "description": (
                    "Monitor campaign performance across all channels, compile "
                    "metrics into a dashboard-style report, and draft initial "
                    "performance insights."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI excels at aggregating data from multiple sources, "
                    "calculating performance metrics, and generating "
                    "structured reports from numerical data."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Human Resources",
        "project_name": "Redesign Employee Onboarding Program",
        "description": (
            "Overhaul the employee onboarding experience from pre-hire "
            "through the first 90 days, including materials development, "
            "manager training, and feedback mechanisms."
        ),
        "tasks": [
            {
                "title": "Survey recent hires on onboarding experience",
                "description": (
                    "Conduct interviews and surveys with employees hired in "
                    "the last 12 months to identify pain points, gaps, and "
                    "highlights in the current onboarding process."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Gathering honest feedback requires building rapport, "
                    "asking follow-up questions, and reading between the lines "
                    "of what employees share -- skills that require human "
                    "empathy and judgment."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Benchmark industry onboarding best practices",
                "description": (
                    "Research onboarding frameworks, retention statistics, and "
                    "best practices from similar-sized organizations in the "
                    "same industry."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can efficiently scan industry publications, "
                    "benchmarking studies, and best practice guides to compile "
                    "a comprehensive summary of current onboarding trends."
                ),
                "order": 1,
                "is_decision_gate": False,
            },
            {
                "title": "Design 30-60-90 day onboarding journey",
                "description": (
                    "Create a structured onboarding roadmap with clear "
                    "milestones, learning objectives, and check-in points for "
                    "each phase of the first 90 days."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can propose journey frameworks and milestone "
                    "structures, but tailoring them to company culture, role "
                    "complexity, and department-specific needs requires HR "
                    "expertise."
                ),
                "order": 2,
                "is_decision_gate": False,
            },
            {
                "title": "Create onboarding materials and checklists",
                "description": (
                    "Develop welcome packets, orientation guides, role-specific "
                    "checklists, resource directories, and first-week "
                    "schedules for new hires."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "Once the journey is designed, AI can efficiently produce "
                    "polished materials, checklists, and documentation from "
                    "the approved structure and content requirements."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Train managers on new onboarding process",
                "description": (
                    "Conduct training sessions for people managers covering "
                    "their role in onboarding, how to use new materials, and "
                    "how to conduct effective check-ins with new hires."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Manager training requires facilitation skills, handling "
                    "real-time questions, demonstrating interpersonal "
                    "techniques, and building buy-in -- all inherently human."
                ),
                "order": 4,
                "is_decision_gate": False,
            },
            {
                "title": "Set up feedback loops and iteration schedule",
                "description": (
                    "Establish ongoing mechanisms to collect new hire feedback, "
                    "track onboarding completion rates, and schedule quarterly "
                    "reviews to refine the program."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can help design survey instruments and tracking "
                    "systems, but deciding what to measure, how to act on "
                    "feedback, and when to make changes requires HR judgment."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Finance",
        "project_name": "Implement New Expense Approval Workflow",
        "description": (
            "Design and roll out an updated expense approval process with "
            "tiered authorization levels, clearer policies, and streamlined "
            "documentation for all departments."
        ),
        "tasks": [
            {
                "title": "Document current approval process and pain points",
                "description": (
                    "Map the existing expense approval workflow end-to-end, "
                    "interview stakeholders about bottlenecks, and identify "
                    "where delays and errors most commonly occur."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can help structure process mapping templates, but "
                    "uncovering the real pain points requires conversations "
                    "with people who use the process daily."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Research approval threshold benchmarks",
                "description": (
                    "Gather industry data on expense approval thresholds, "
                    "authorization tiers, and policy structures used by "
                    "comparable organizations."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can efficiently research and compile benchmark data "
                    "from industry reports, professional associations, and "
                    "published best practices."
                ),
                "order": 1,
                "is_decision_gate": False,
            },
            {
                "title": "Design new workflow with approval tiers",
                "description": (
                    "Create a tiered approval structure with defined dollar "
                    "thresholds, routing rules, escalation paths, and "
                    "auto-approval criteria for low-risk expenses."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can propose tier structures based on benchmarks, but "
                    "final decisions on thresholds and routing must account "
                    "for internal politics, risk tolerance, and organizational "
                    "hierarchy."
                ),
                "order": 2,
                "is_decision_gate": False,
            },
            {
                "title": "Draft updated expense policy document",
                "description": (
                    "Write a comprehensive expense policy covering eligible "
                    "expenses, documentation requirements, approval procedures, "
                    "reimbursement timelines, and violation consequences."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI excels at drafting detailed policy documents from "
                    "structured inputs, maintaining consistent formatting, and "
                    "ensuring all required sections are addressed."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Get CFO approval and legal review",
                "description": (
                    "Present the proposed workflow and policy to the CFO for "
                    "approval, then route through legal for compliance review "
                    "and sign-off."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Executive approval requires presenting a business case, "
                    "answering financial questions, and navigating the legal "
                    "review process -- all requiring human interaction."
                ),
                "order": 4,
                "is_decision_gate": True,
            },
            {
                "title": "Create training materials for staff rollout",
                "description": (
                    "Develop quick-reference guides, FAQ documents, and "
                    "step-by-step instructions for submitting and approving "
                    "expenses under the new workflow."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can generate clear, well-structured training materials "
                    "and reference guides from the approved policy, making "
                    "this a straightforward content production task."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Education",
        "project_name": "Design Professional Development Workshop Series",
        "description": (
            "Create and deliver a multi-session professional development "
            "workshop series focused on building key workplace competencies, "
            "including needs assessment, curriculum design, and facilitation."
        ),
        "tasks": [
            {
                "title": "Assess team skill gaps through needs analysis",
                "description": (
                    "Conduct surveys, interviews, and performance data reviews "
                    "to identify the most impactful skill gaps across the team "
                    "and prioritize workshop topics."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can help design assessment instruments and analyze "
                    "survey data, but interpreting results in context of team "
                    "dynamics and organizational priorities requires human "
                    "insight."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Research learning frameworks and methodologies",
                "description": (
                    "Review adult learning theories, workshop facilitation "
                    "methodologies, and evidence-based training approaches "
                    "that apply to the identified skill areas."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can efficiently summarize pedagogical research, "
                    "compare learning frameworks, and recommend approaches "
                    "based on the target audience and learning objectives."
                ),
                "order": 1,
                "is_decision_gate": False,
            },
            {
                "title": "Design curriculum outline and session structure",
                "description": (
                    "Create a workshop series blueprint with session topics, "
                    "learning objectives, time allocations, prerequisite "
                    "sequencing, and assessment strategies."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can draft curriculum outlines, but ensuring the pace, "
                    "depth, and sequence work for the actual participants "
                    "requires experience with the team and facilitation "
                    "expertise."
                ),
                "order": 2,
                "is_decision_gate": False,
            },
            {
                "title": "Create participant materials and exercises",
                "description": (
                    "Develop workbooks, slide decks, handouts, group "
                    "exercises, and reflection prompts for each workshop "
                    "session in the series."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "Once the curriculum is set, AI can produce polished "
                    "participant materials, exercises, and handouts quickly "
                    "and consistently from the approved outline."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Facilitate pilot workshop and gather feedback",
                "description": (
                    "Deliver the first workshop session to a pilot group, "
                    "observe participant engagement, collect real-time "
                    "feedback, and note areas for improvement."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Live facilitation requires reading the room, adapting "
                    "on the fly, managing group dynamics, and building the "
                    "trust needed for participants to engage authentically."
                ),
                "order": 4,
                "is_decision_gate": True,
            },
            {
                "title": "Iterate content based on participant outcomes",
                "description": (
                    "Analyze pilot feedback and assessment results, identify "
                    "what worked and what needs revision, and update materials "
                    "for the full series rollout."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can help analyze feedback patterns and suggest "
                    "revisions, but deciding which changes to prioritize and "
                    "how to adjust the facilitation approach requires "
                    "educator judgment."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
    {
        "category": "Operations",
        "project_name": "Migrate to New Vendor Management System",
        "description": (
            "Transition from the current vendor tracking process to a new "
            "vendor management platform, including data migration, process "
            "redesign, vendor communications, and team training."
        ),
        "tasks": [
            {
                "title": "Inventory current vendors and contract status",
                "description": (
                    "Compile a complete list of active vendors, contract "
                    "terms, renewal dates, spend history, and current "
                    "performance ratings from existing records."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can help structure the inventory template and "
                    "consolidate data from multiple sources, but verifying "
                    "accuracy against actual contracts requires someone with "
                    "access to and knowledge of the records."
                ),
                "order": 0,
                "is_decision_gate": False,
            },
            {
                "title": "Evaluate vendor management platform options",
                "description": (
                    "Research and compare vendor management software options "
                    "based on features, pricing, integration capabilities, "
                    "and user reviews."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can efficiently research platform options, compile "
                    "feature comparison matrices, and summarize user reviews "
                    "to support the evaluation process."
                ),
                "order": 1,
                "is_decision_gate": False,
            },
            {
                "title": "Map data migration requirements",
                "description": (
                    "Document which data fields need to migrate, identify "
                    "format differences between systems, define data cleanup "
                    "rules, and create a migration validation plan."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can draft migration plans and identify common data "
                    "mapping challenges, but understanding the business "
                    "significance of each data field and cleanup priorities "
                    "requires operational knowledge."
                ),
                "order": 2,
                "is_decision_gate": False,
            },
            {
                "title": "Draft vendor communication about transition",
                "description": (
                    "Write notification letters, FAQ documents, and "
                    "transition guides for vendors explaining the new system, "
                    "timeline, and any action required on their part."
                ),
                "task_category": "ai_optimal",
                "reasoning": (
                    "AI can draft professional vendor communications "
                    "efficiently, especially when given the key details and "
                    "timeline to include. These are structured writing tasks "
                    "with clear requirements."
                ),
                "order": 3,
                "is_decision_gate": False,
            },
            {
                "title": "Negotiate contracts and get legal sign-off",
                "description": (
                    "Negotiate terms with the selected platform vendor, "
                    "review contract language with legal counsel, and secure "
                    "formal approval for the purchase."
                ),
                "task_category": "human_primary",
                "reasoning": (
                    "Contract negotiation requires real-time back-and-forth, "
                    "understanding leverage points, and making judgment calls "
                    "about acceptable terms -- all inherently human activities."
                ),
                "order": 4,
                "is_decision_gate": True,
            },
            {
                "title": "Create new process documentation and train team",
                "description": (
                    "Develop standard operating procedures for the new system, "
                    "create quick-reference guides, and conduct training "
                    "sessions for all team members who will use the platform."
                ),
                "task_category": "collaborative",
                "reasoning": (
                    "AI can draft documentation and training materials "
                    "efficiently, but the training delivery and ensuring "
                    "team adoption requires human facilitation and "
                    "change management skills."
                ),
                "order": 5,
                "is_decision_gate": False,
            },
        ],
    },
]
