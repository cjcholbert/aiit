"""Lesson 3: Template Builder - Example templates organized by category.

Each template is a reusable prompt with {{variable}} placeholders that users
can fill in and adapt to their specific needs. Templates are designed for
the common worker building systematic AI collaboration habits.
"""

EXAMPLE_CATEGORIES = [
    "Tech",
    "Managerial",
    "Admin",
    "Education",
    "Marketing",
    "Human Resources",
]

EXAMPLE_TEMPLATES = [
    # =========================================================================
    # TECH (7 templates)
    # =========================================================================
    {
        "category": "Tech",
        "name": "Code Review Request",
        "description": "Request a thorough code review with specific focus areas",
        "content": (
            "Review the following {{language}} code from our {{project_name}} project.\n\n"
            "## Code to Review\n"
            "```{{language}}\n"
            "{{code_snippet}}\n"
            "```\n\n"
            "## Review Focus\n"
            "Please evaluate the code against these criteria:\n"
            "1. **Correctness** - Does the logic handle edge cases?\n"
            "2. **Readability** - Are variable names, comments, and structure clear?\n"
            "3. **Performance** - Any obvious inefficiencies or N+1 patterns?\n"
            "4. **Security** - Input validation, injection risks, auth checks?\n"
            "5. **Maintainability** - Would a new team member understand this in 6 months?\n\n"
            "## Additional Context\n"
            "{{additional_context}}\n\n"
            "For each issue found, provide:\n"
            "- The specific line or section\n"
            "- Why it is a problem\n"
            "- A concrete fix with code"
        ),
        "variables": [
            {"name": "language", "description": "Programming language of the code", "default": "Python", "required": True},
            {"name": "project_name", "description": "Name of the project or service", "default": "", "required": True},
            {"name": "code_snippet", "description": "The code to be reviewed", "default": "", "required": True},
            {"name": "additional_context", "description": "Architecture decisions, constraints, or known tech debt", "default": "No additional context.", "required": False},
        ],
        "tags": ["code", "review", "quality"],
    },
    {
        "category": "Tech",
        "name": "Bug Investigation Assistant",
        "description": "Structured template for investigating and resolving bugs",
        "content": (
            "I need help investigating a bug in our {{system_name}} application.\n\n"
            "## Bug Description\n"
            "{{bug_description}}\n\n"
            "## Environment\n"
            "- System/Service: {{system_name}}\n"
            "- Language/Framework: {{tech_stack}}\n\n"
            "## What I Have Tried\n"
            "{{steps_tried}}\n\n"
            "## Error Output\n"
            "```\n"
            "{{error_output}}\n"
            "```\n\n"
            "Please help me:\n"
            "1. Identify the most likely root cause based on the error output\n"
            "2. Suggest 2-3 diagnostic steps I can take to confirm the cause\n"
            "3. Provide a fix once the root cause is confirmed\n"
            "4. Recommend any preventive measures (tests, validation, monitoring)"
        ),
        "variables": [
            {"name": "system_name", "description": "Name of the application or service with the bug", "default": "", "required": True},
            {"name": "bug_description", "description": "What is happening vs. what should happen", "default": "", "required": True},
            {"name": "tech_stack", "description": "Language, framework, and relevant versions", "default": "Python / FastAPI", "required": True},
            {"name": "steps_tried", "description": "What you have already attempted to fix it", "default": "None yet.", "required": False},
            {"name": "error_output", "description": "Stack trace, error message, or log output", "default": "", "required": True},
        ],
        "tags": ["debugging", "troubleshooting", "bugs"],
    },
    {
        "category": "Tech",
        "name": "Architecture Decision Record",
        "description": "Document and evaluate an architecture decision with trade-offs",
        "content": (
            "Help me write an Architecture Decision Record (ADR) for the following decision.\n\n"
            "## Decision Title\n"
            "{{decision_title}}\n\n"
            "## Context\n"
            "We are building {{project_description}}. The decision impacts {{affected_components}}.\n\n"
            "## Options Under Consideration\n"
            "{{options}}\n\n"
            "Please structure the ADR with these sections:\n"
            "1. **Status** - Proposed / Accepted / Deprecated\n"
            "2. **Context** - Why this decision is needed now\n"
            "3. **Decision** - Recommend the best option with clear reasoning\n"
            "4. **Consequences** - Positive and negative trade-offs\n"
            "5. **Alternatives Rejected** - Why each was ruled out\n"
            "6. **Review Date** - When to revisit this decision\n\n"
            "Be specific about operational impact: deployment complexity, monitoring needs, "
            "team skill requirements, and migration path."
        ),
        "variables": [
            {"name": "decision_title", "description": "Short title for the architecture decision", "default": "", "required": True},
            {"name": "project_description", "description": "Brief description of the project and its goals", "default": "", "required": True},
            {"name": "affected_components", "description": "Systems, services, or teams affected by this decision", "default": "", "required": True},
            {"name": "options", "description": "List the 2-4 options being considered, one per line", "default": "", "required": True},
        ],
        "tags": ["architecture", "documentation", "decision"],
    },
    {
        "category": "Tech",
        "name": "API Documentation Generator",
        "description": "Generate clear API documentation from endpoint details",
        "content": (
            "Write developer-facing API documentation for the following endpoint.\n\n"
            "## Endpoint Details\n"
            "- **Method**: {{http_method}}\n"
            "- **Path**: {{endpoint_path}}\n"
            "- **Service**: {{service_name}}\n"
            "- **Authentication**: {{auth_method}}\n\n"
            "## Functionality\n"
            "{{endpoint_description}}\n\n"
            "Please generate documentation that includes:\n"
            "1. **Summary** - One-sentence description\n"
            "2. **Request** - Path params, query params, request body with types and examples\n"
            "3. **Response** - Success response with example JSON, status codes\n"
            "4. **Error Responses** - Common error codes (400, 401, 403, 404, 500) with example bodies\n"
            "5. **Usage Example** - A curl command and a Python requests example\n"
            "6. **Rate Limits** - If applicable\n\n"
            "Use clear, scannable formatting. Developers should be able to integrate this "
            "endpoint in under 5 minutes by reading the docs."
        ),
        "variables": [
            {"name": "http_method", "description": "HTTP method (GET, POST, PUT, DELETE, PATCH)", "default": "POST", "required": True},
            {"name": "endpoint_path", "description": "The API endpoint path", "default": "/api/v1/", "required": True},
            {"name": "service_name", "description": "Name of the API or microservice", "default": "", "required": True},
            {"name": "auth_method", "description": "How the endpoint is authenticated", "default": "Bearer token in Authorization header", "required": False},
            {"name": "endpoint_description", "description": "What this endpoint does, including business logic", "default": "", "required": True},
        ],
        "tags": ["api", "documentation", "developer"],
    },
    {
        "category": "Tech",
        "name": "Deployment Runbook",
        "description": "Step-by-step deployment checklist for a service release",
        "content": (
            "Create a deployment runbook for releasing {{service_name}} version {{version}}.\n\n"
            "## Release Details\n"
            "- **Service**: {{service_name}}\n"
            "- **Version**: {{version}}\n"
            "- **Changes Summary**: {{changes_summary}}\n\n"
            "Generate a runbook that covers:\n\n"
            "### Pre-Deployment\n"
            "- Environment verification checks\n"
            "- Database migration status\n"
            "- Feature flag configuration\n"
            "- Stakeholder notification checklist\n\n"
            "### Deployment Steps\n"
            "- Numbered steps with exact commands where possible\n"
            "- Health check verification between steps\n"
            "- Expected timelines for each step\n\n"
            "### Post-Deployment\n"
            "- Smoke test checklist\n"
            "- Monitoring dashboards to watch\n"
            "- Success criteria (how do we know it worked?)\n\n"
            "### Rollback Plan\n"
            "- Trigger conditions (when to rollback)\n"
            "- Rollback steps\n"
            "- Data recovery procedures if needed\n\n"
            "Make each step concrete and actionable. Another engineer should be able to "
            "follow this runbook without prior context."
        ),
        "variables": [
            {"name": "service_name", "description": "Name of the service being deployed", "default": "", "required": True},
            {"name": "version", "description": "Version number or release tag", "default": "", "required": True},
            {"name": "changes_summary", "description": "Brief summary of what changed in this release", "default": "", "required": True},
        ],
        "tags": ["deployment", "operations", "runbook"],
    },
    {
        "category": "Tech",
        "name": "Technical Prompt Engineering Template",
        "description": "Meta-template for creating effective technical prompts for AI tools",
        "content": (
            "I want to create an effective prompt for an AI coding assistant. "
            "Help me build a well-structured prompt for the following task.\n\n"
            "## Task I Want AI to Do\n"
            "{{task_description}}\n\n"
            "## My Tech Stack\n"
            "{{tech_stack}}\n\n"
            "## Constraints\n"
            "{{constraints}}\n\n"
            "Please generate a polished prompt that includes:\n"
            "1. **Role assignment** - What expertise the AI should assume\n"
            "2. **Context section** - Background information the AI needs\n"
            "3. **Task specification** - Exactly what to produce, with acceptance criteria\n"
            "4. **Output format** - How the response should be structured\n"
            "5. **Examples** - One good and one bad example if applicable\n"
            "6. **Guardrails** - What the AI should avoid doing\n\n"
            "The generated prompt should be copy-pasteable and self-contained. "
            "It should work even if the AI has no prior conversation context."
        ),
        "variables": [
            {"name": "task_description", "description": "What you want the AI to accomplish", "default": "", "required": True},
            {"name": "tech_stack", "description": "Languages, frameworks, and tools involved", "default": "", "required": True},
            {"name": "constraints", "description": "Limitations, standards, or requirements to follow", "default": "Follow standard best practices.", "required": False},
        ],
        "tags": ["meta", "prompt-engineering", "ai"],
    },
    {
        "category": "Tech",
        "name": "Incident Post-Mortem",
        "description": "Blameless post-mortem template for production incidents",
        "content": (
            "Help me write a blameless post-mortem for the following production incident.\n\n"
            "## Incident Summary\n"
            "- **Service affected**: {{service_name}}\n"
            "- **Duration**: {{incident_duration}}\n"
            "- **Severity**: {{severity}}\n"
            "- **What happened**: {{incident_description}}\n\n"
            "Structure the post-mortem as follows:\n"
            "1. **Timeline** - Key events from detection to resolution, with timestamps\n"
            "2. **Root Cause** - Technical root cause (not 'human error')\n"
            "3. **Impact** - Users affected, revenue impact, SLA implications\n"
            "4. **Detection** - How was it detected? How could we detect it faster?\n"
            "5. **Resolution** - What fixed it? Was it a workaround or permanent fix?\n"
            "6. **Action Items** - Concrete follow-ups with owners and deadlines:\n"
            "   - Prevent recurrence\n"
            "   - Improve detection\n"
            "   - Improve response\n"
            "7. **Lessons Learned** - What went well, what did not\n\n"
            "Keep the tone blameless and focused on system improvements."
        ),
        "variables": [
            {"name": "service_name", "description": "Service or system that had the incident", "default": "", "required": True},
            {"name": "incident_duration", "description": "How long the incident lasted", "default": "", "required": True},
            {"name": "severity", "description": "Severity level (SEV1, SEV2, SEV3)", "default": "SEV2", "required": True},
            {"name": "incident_description", "description": "What happened from user and system perspective", "default": "", "required": True},
        ],
        "tags": ["incident", "post-mortem", "operations"],
    },

    # =========================================================================
    # MANAGERIAL (6 templates)
    # =========================================================================
    {
        "category": "Managerial",
        "name": "Meeting Agenda Builder",
        "description": "Create structured meeting agendas with time allocations and owners",
        "content": (
            "Create a structured meeting agenda for the following meeting.\n\n"
            "## Meeting Details\n"
            "- **Meeting Title**: {{meeting_title}}\n"
            "- **Duration**: {{meeting_duration}}\n"
            "- **Attendees**: {{attendees}}\n"
            "- **Meeting Goal**: {{meeting_goal}}\n\n"
            "Generate an agenda that includes:\n"
            "1. **Opening** (2 min) - State the meeting goal and expected outcomes\n"
            "2. **Topic Blocks** - Break the agenda into 3-5 focused discussion topics:\n"
            "   - Topic name and owner\n"
            "   - Time allocation\n"
            "   - Whether it is informational, discussion, or decision\n"
            "   - Pre-read materials if needed\n"
            "3. **Action Items Review** (5 min) - Capture decisions and next steps\n"
            "4. **Parking Lot** - Items to defer to a future meeting\n\n"
            "Time allocations should add up to {{meeting_duration}}. "
            "Flag any topics that seem too large for the available time and suggest "
            "splitting them across multiple meetings."
        ),
        "variables": [
            {"name": "meeting_title", "description": "Name of the meeting", "default": "", "required": True},
            {"name": "meeting_duration", "description": "Total meeting length", "default": "60 minutes", "required": True},
            {"name": "attendees", "description": "Who will be in the meeting and their roles", "default": "", "required": True},
            {"name": "meeting_goal", "description": "The primary objective of this meeting", "default": "", "required": True},
        ],
        "tags": ["meeting", "agenda", "planning"],
    },
    {
        "category": "Managerial",
        "name": "Project Status Update",
        "description": "Concise project status update for stakeholders",
        "content": (
            "Write a project status update for {{project_name}} covering the period "
            "{{reporting_period}}.\n\n"
            "## Raw Status Notes\n"
            "{{status_notes}}\n\n"
            "Format the update with these sections:\n"
            "1. **Overall Status**: Green / Yellow / Red with one-sentence summary\n"
            "2. **Key Accomplishments** (this period):\n"
            "   - 3-5 bullet points of completed work\n"
            "3. **In Progress**:\n"
            "   - Current work items with percent complete\n"
            "4. **Blockers and Risks**:\n"
            "   - Any items blocking progress\n"
            "   - Risks with likelihood and mitigation plans\n"
            "5. **Next Period Plan**:\n"
            "   - Top 3 priorities for next period\n"
            "6. **Asks**:\n"
            "   - Decisions needed from stakeholders\n"
            "   - Resources or support required\n\n"
            "Keep it under 300 words. Stakeholders should understand the project state "
            "in under 2 minutes of reading."
        ),
        "variables": [
            {"name": "project_name", "description": "Name of the project", "default": "", "required": True},
            {"name": "reporting_period", "description": "Time period covered by this update", "default": "this week", "required": True},
            {"name": "status_notes", "description": "Raw notes about what happened, blockers, and plans", "default": "", "required": True},
        ],
        "tags": ["status", "reporting", "stakeholders"],
    },
    {
        "category": "Managerial",
        "name": "Decision Memo",
        "description": "Structured memo for documenting and communicating decisions",
        "content": (
            "Draft a decision memo for the following decision.\n\n"
            "## Decision Needed\n"
            "{{decision_question}}\n\n"
            "## Background\n"
            "{{background_context}}\n\n"
            "## Decision Maker\n"
            "{{decision_maker}}\n\n"
            "Structure the memo as follows:\n"
            "1. **Executive Summary** (2-3 sentences) - The decision, the recommendation, and why\n"
            "2. **Context** - Why this decision is needed now\n"
            "3. **Options Analysis**:\n"
            "   - Option A, B, C (minimum 2)\n"
            "   - For each: description, pros, cons, estimated cost/effort, risk level\n"
            "4. **Recommendation** - Which option and why, addressing the strongest counterargument\n"
            "5. **Implementation Plan** - Key next steps if approved\n"
            "6. **Reversibility** - How easy is it to change course later?\n\n"
            "The memo should be objective enough that the decision maker could choose a "
            "different option based on the same analysis."
        ),
        "variables": [
            {"name": "decision_question", "description": "The specific question that needs a decision", "default": "", "required": True},
            {"name": "background_context", "description": "Why this decision matters and relevant history", "default": "", "required": True},
            {"name": "decision_maker", "description": "Who has authority to make this decision", "default": "", "required": True},
        ],
        "tags": ["decision", "memo", "leadership"],
    },
    {
        "category": "Managerial",
        "name": "Strategic Initiative Brief",
        "description": "One-page brief for proposing a new strategic initiative",
        "content": (
            "Create a one-page strategic initiative brief for the following proposal.\n\n"
            "## Initiative\n"
            "{{initiative_name}}\n\n"
            "## Problem Statement\n"
            "{{problem_statement}}\n\n"
            "## Proposed Approach\n"
            "{{proposed_approach}}\n\n"
            "## Resources Available\n"
            "{{resources}}\n\n"
            "Structure the brief with:\n"
            "1. **Headline** - One compelling sentence\n"
            "2. **Problem** - What problem does this solve? Who feels the pain?\n"
            "3. **Proposed Solution** - What we will do, in plain language\n"
            "4. **Success Metrics** - 2-3 measurable outcomes that define success\n"
            "5. **Timeline** - Key milestones with target dates\n"
            "6. **Resource Requirements** - People, budget, tools needed\n"
            "7. **Risks** - Top 3 risks and mitigation strategies\n"
            "8. **Ask** - Specifically what approval or support is being requested\n\n"
            "Keep the entire brief under 500 words. It should be persuasive but honest "
            "about trade-offs."
        ),
        "variables": [
            {"name": "initiative_name", "description": "Name of the strategic initiative", "default": "", "required": True},
            {"name": "problem_statement", "description": "The business problem this initiative addresses", "default": "", "required": True},
            {"name": "proposed_approach", "description": "High-level description of the proposed solution", "default": "", "required": True},
            {"name": "resources", "description": "Budget, team size, and tools currently available", "default": "", "required": False},
        ],
        "tags": ["strategy", "proposal", "leadership"],
    },
    {
        "category": "Managerial",
        "name": "Delegation Brief",
        "description": "Clear delegation instructions for assigning work to team members",
        "content": (
            "Help me write a clear delegation brief for the following task.\n\n"
            "## Task to Delegate\n"
            "{{task_description}}\n\n"
            "## Delegating To\n"
            "{{team_member}}\n\n"
            "## Deadline\n"
            "{{deadline}}\n\n"
            "Create a delegation brief that includes:\n"
            "1. **Objective** - What done looks like (specific, measurable)\n"
            "2. **Context** - Why this matters and how it fits the bigger picture\n"
            "3. **Scope** - What is included and explicitly what is NOT included\n"
            "4. **Authority Level** - Can they make decisions, or check in first?\n"
            "5. **Resources** - People, tools, budget, and reference materials available\n"
            "6. **Checkpoints** - When to check in (not micromanage, just sync)\n"
            "7. **Support** - What help they can expect from me and when I am available\n"
            "8. **Success Criteria** - How we will evaluate if this was done well\n\n"
            "The tone should be empowering, not controlling. Give enough detail to "
            "set them up for success without dictating how to do the work."
        ),
        "variables": [
            {"name": "task_description", "description": "What needs to be done", "default": "", "required": True},
            {"name": "team_member", "description": "Name and role of the person receiving the delegation", "default": "", "required": True},
            {"name": "deadline", "description": "When this needs to be completed", "default": "", "required": True},
        ],
        "tags": ["delegation", "management", "team"],
    },
    {
        "category": "Managerial",
        "name": "Manager Prompt Builder",
        "description": "Meta-template for creating effective managerial prompts for any situation",
        "content": (
            "I need to create a reusable prompt for a recurring managerial task. "
            "Help me build an effective prompt template.\n\n"
            "## The Task\n"
            "{{task_type}}\n\n"
            "## Who Will Use This Prompt\n"
            "{{audience}}\n\n"
            "## Desired Output\n"
            "{{desired_output}}\n\n"
            "Generate a prompt template that:\n"
            "1. Starts with a clear role and context statement\n"
            "2. Uses {{curly_brace}} placeholders for parts that change each time\n"
            "3. Includes specific output formatting instructions\n"
            "4. Has built-in quality checks (e.g., 'ensure X is addressed')\n"
            "5. Lists all variables with descriptions and example values\n\n"
            "Also provide:\n"
            "- **When to use this prompt** - Situations where it adds value\n"
            "- **When NOT to use it** - Situations requiring human judgment instead\n"
            "- **Tips for better results** - How to fill in the variables effectively\n\n"
            "The template should be usable by someone with basic AI experience."
        ),
        "variables": [
            {"name": "task_type", "description": "The managerial task this prompt will automate", "default": "", "required": True},
            {"name": "audience", "description": "Who will use this prompt and their AI skill level", "default": "Managers with basic AI experience", "required": False},
            {"name": "desired_output", "description": "What the final output should look like", "default": "", "required": True},
        ],
        "tags": ["meta", "prompt-engineering", "management"],
    },

    # =========================================================================
    # ADMIN (6 templates)
    # =========================================================================
    {
        "category": "Admin",
        "name": "Procurement Request Justification",
        "description": "Build a business case for a software or hardware purchase",
        "content": (
            "Write a procurement justification for the following purchase request.\n\n"
            "## Item Requested\n"
            "{{item_name}}\n\n"
            "## Estimated Cost\n"
            "{{estimated_cost}}\n\n"
            "## Business Need\n"
            "{{business_need}}\n\n"
            "## Current Solution\n"
            "{{current_solution}}\n\n"
            "Structure the justification with:\n"
            "1. **Executive Summary** - What, why, and how much in 2 sentences\n"
            "2. **Business Need** - The problem this purchase solves\n"
            "3. **Current State** - How we handle this today and why it is insufficient\n"
            "4. **Proposed Solution** - What we want to buy and from whom\n"
            "5. **Cost-Benefit Analysis**:\n"
            "   - Total cost (one-time + recurring)\n"
            "   - Time savings per week/month\n"
            "   - Risk reduction\n"
            "   - Revenue impact if applicable\n"
            "6. **Alternatives Considered** - At least 2 alternatives and why they are less suitable\n"
            "7. **Implementation Timeline** - How quickly we can get value\n"
            "8. **Recommendation** - Clear ask with approval needed\n\n"
            "Keep it factual and quantify benefits wherever possible."
        ),
        "variables": [
            {"name": "item_name", "description": "What you want to purchase (software, hardware, service)", "default": "", "required": True},
            {"name": "estimated_cost", "description": "Price estimate including recurring costs", "default": "", "required": True},
            {"name": "business_need", "description": "Why the organization needs this", "default": "", "required": True},
            {"name": "current_solution", "description": "How you handle this today without the purchase", "default": "We do this manually.", "required": False},
        ],
        "tags": ["procurement", "budget", "business-case"],
    },
    {
        "category": "Admin",
        "name": "Policy Draft Generator",
        "description": "Draft an internal policy document from key requirements",
        "content": (
            "Draft an internal policy document for the following policy area.\n\n"
            "## Policy Topic\n"
            "{{policy_topic}}\n\n"
            "## Key Requirements\n"
            "{{key_requirements}}\n\n"
            "## Applies To\n"
            "{{scope}}\n\n"
            "Structure the policy document with:\n"
            "1. **Policy Title** and effective date\n"
            "2. **Purpose** - Why this policy exists (1-2 sentences)\n"
            "3. **Scope** - Who this applies to and in what situations\n"
            "4. **Definitions** - Key terms that need clarification\n"
            "5. **Policy Statements** - Numbered, clear rules:\n"
            "   - Use 'must' for mandatory requirements\n"
            "   - Use 'should' for recommended practices\n"
            "   - Use 'may' for optional/permitted actions\n"
            "6. **Procedures** - Step-by-step process for compliance\n"
            "7. **Exceptions** - How to request exceptions to this policy\n"
            "8. **Enforcement** - Consequences of non-compliance\n"
            "9. **Review Cycle** - When this policy will be reviewed\n\n"
            "Use plain language. Avoid legal jargon unless required. The policy should "
            "be understandable by any employee without additional explanation."
        ),
        "variables": [
            {"name": "policy_topic", "description": "What area the policy covers", "default": "", "required": True},
            {"name": "key_requirements", "description": "The essential rules or standards to include", "default": "", "required": True},
            {"name": "scope", "description": "Who must follow this policy (all employees, department, etc.)", "default": "All employees", "required": True},
        ],
        "tags": ["policy", "compliance", "documentation"],
    },
    {
        "category": "Admin",
        "name": "Compliance Checklist Builder",
        "description": "Create a compliance audit checklist for a specific regulation or standard",
        "content": (
            "Create a compliance checklist for the following regulation or standard.\n\n"
            "## Regulation/Standard\n"
            "{{regulation_name}}\n\n"
            "## Our Organization Type\n"
            "{{org_type}}\n\n"
            "## Areas to Cover\n"
            "{{focus_areas}}\n\n"
            "Generate a checklist with:\n"
            "1. **Checklist Header** - Regulation name, version/date, audit period\n"
            "2. **Control Categories** - Group requirements by logical area\n"
            "3. **For Each Control**:\n"
            "   - Requirement ID (if applicable)\n"
            "   - Requirement description in plain language\n"
            "   - Evidence needed to prove compliance\n"
            "   - Status options: Compliant / Partially Compliant / Non-Compliant / N/A\n"
            "   - Notes field for auditor comments\n"
            "4. **Summary Section** - Space for overall compliance score and findings\n"
            "5. **Remediation Tracker** - Table for non-compliant items with:\n"
            "   - Finding, severity, owner, target date, status\n\n"
            "The checklist should be practical for a non-specialist to complete "
            "with guidance from the regulation documentation."
        ),
        "variables": [
            {"name": "regulation_name", "description": "Name of the regulation or standard (e.g., SOC 2, HIPAA, GDPR)", "default": "", "required": True},
            {"name": "org_type", "description": "Type of organization (size, industry, structure)", "default": "Small to medium business", "required": True},
            {"name": "focus_areas", "description": "Specific areas to focus on within the regulation", "default": "All applicable areas", "required": False},
        ],
        "tags": ["compliance", "audit", "checklist"],
    },
    {
        "category": "Admin",
        "name": "Vendor Evaluation Matrix",
        "description": "Compare vendors or service providers systematically",
        "content": (
            "Help me build a vendor evaluation matrix for the following procurement decision.\n\n"
            "## What We Are Buying\n"
            "{{product_category}}\n\n"
            "## Vendors to Compare\n"
            "{{vendor_list}}\n\n"
            "## Our Key Requirements\n"
            "{{requirements}}\n\n"
            "Create an evaluation framework with:\n"
            "1. **Evaluation Criteria** (weighted):\n"
            "   - Functionality / Feature fit\n"
            "   - Pricing / Total cost of ownership\n"
            "   - Integration with existing systems\n"
            "   - Vendor stability and support quality\n"
            "   - Security and compliance\n"
            "   - Scalability\n"
            "   - Any criteria specific to our requirements\n"
            "2. **Scoring Scale** - 1-5 with clear definitions for each score\n"
            "3. **Weight Assignments** - Percentage weight for each criterion (total 100%)\n"
            "4. **Evaluation Matrix** - Table format comparing each vendor\n"
            "5. **Recommendation** - Weighted score totals and a recommended vendor\n\n"
            "Include 2-3 questions to ask each vendor during demos."
        ),
        "variables": [
            {"name": "product_category", "description": "Type of product or service being evaluated", "default": "", "required": True},
            {"name": "vendor_list", "description": "Names of vendors being compared", "default": "", "required": True},
            {"name": "requirements", "description": "Must-have and nice-to-have features", "default": "", "required": True},
        ],
        "tags": ["vendor", "evaluation", "procurement"],
    },
    {
        "category": "Admin",
        "name": "Admin Process Prompt Creator",
        "description": "Meta-template for building prompts that automate administrative workflows",
        "content": (
            "I need to create a reusable AI prompt for an administrative task that "
            "I perform regularly. Help me build it.\n\n"
            "## Administrative Task\n"
            "{{admin_task}}\n\n"
            "## Current Process\n"
            "{{current_process}}\n\n"
            "## Desired Improvement\n"
            "{{desired_improvement}}\n\n"
            "Generate a prompt template that:\n"
            "1. Clearly defines the administrative task and expected output format\n"
            "2. Uses {{curly_brace}} variables for information that changes each time\n"
            "3. Includes validation steps (e.g., 'verify all dates are in MM/DD/YYYY format')\n"
            "4. Has a checklist of required inputs before running the prompt\n"
            "5. Specifies the output format (table, list, document, etc.)\n\n"
            "Also include:\n"
            "- **Frequency** - How often this prompt will be used\n"
            "- **Time saved** - Estimated minutes saved per use\n"
            "- **Quality checks** - How to verify the output is correct\n"
            "- **Edge cases** - Situations where the prompt might need manual adjustment"
        ),
        "variables": [
            {"name": "admin_task", "description": "The administrative task to automate with AI", "default": "", "required": True},
            {"name": "current_process", "description": "How you currently complete this task manually", "default": "", "required": True},
            {"name": "desired_improvement", "description": "What would make this faster or more reliable", "default": "Reduce time and increase consistency.", "required": False},
        ],
        "tags": ["meta", "prompt-engineering", "automation"],
    },
    {
        "category": "Admin",
        "name": "Meeting Minutes Formatter",
        "description": "Transform raw meeting notes into structured minutes with action items",
        "content": (
            "Format the following raw meeting notes into professional meeting minutes.\n\n"
            "## Meeting Info\n"
            "- **Meeting**: {{meeting_name}}\n"
            "- **Date**: {{meeting_date}}\n"
            "- **Attendees**: {{attendees}}\n\n"
            "## Raw Notes\n"
            "{{raw_notes}}\n\n"
            "Format into structured minutes:\n"
            "1. **Header** - Meeting name, date, attendees, and absent members\n"
            "2. **Agenda Items Discussed** - Summarize each topic in 2-3 sentences\n"
            "3. **Key Decisions Made** - Numbered list with who made each decision\n"
            "4. **Action Items Table**:\n"
            "   | Action | Owner | Due Date | Priority |\n"
            "   Extract every commitment from the notes\n"
            "5. **Open Items** - Unresolved topics carried to next meeting\n"
            "6. **Next Meeting** - Date and preliminary agenda if mentioned\n\n"
            "If something in the raw notes is ambiguous, flag it with [CLARIFY] "
            "so I can follow up."
        ),
        "variables": [
            {"name": "meeting_name", "description": "Title of the meeting", "default": "", "required": True},
            {"name": "meeting_date", "description": "Date the meeting took place", "default": "", "required": True},
            {"name": "attendees", "description": "Who attended the meeting", "default": "", "required": True},
            {"name": "raw_notes", "description": "Unstructured notes taken during the meeting", "default": "", "required": True},
        ],
        "tags": ["meeting", "minutes", "documentation"],
    },

    # =========================================================================
    # EDUCATION (6 templates)
    # =========================================================================
    {
        "category": "Education",
        "name": "Lesson Plan Builder",
        "description": "Create a structured lesson plan with objectives, activities, and assessment",
        "content": (
            "Create a detailed lesson plan for the following topic.\n\n"
            "## Lesson Details\n"
            "- **Subject**: {{subject}}\n"
            "- **Topic**: {{topic}}\n"
            "- **Grade/Level**: {{grade_level}}\n"
            "- **Duration**: {{duration}}\n\n"
            "Structure the lesson plan with:\n"
            "1. **Learning Objectives** (3-5):\n"
            "   - Use Bloom's taxonomy verbs (analyze, evaluate, create)\n"
            "   - Make each objective measurable\n"
            "2. **Materials Needed** - List all resources, handouts, technology\n"
            "3. **Warm-Up** (5-10 min) - Hook activity to engage students\n"
            "4. **Direct Instruction** (15-20 min) - Key concepts to teach\n"
            "5. **Guided Practice** (15-20 min) - Structured activity with support\n"
            "6. **Independent Practice** (10-15 min) - Students work on their own\n"
            "7. **Assessment** - How you will check understanding:\n"
            "   - Formative (during lesson)\n"
            "   - Summative (end of lesson)\n"
            "8. **Differentiation** - Modifications for advanced and struggling students\n"
            "9. **Closure** (5 min) - Summary and preview of next lesson\n\n"
            "Include at least one collaborative activity and one technology integration point."
        ),
        "variables": [
            {"name": "subject", "description": "Academic subject area", "default": "", "required": True},
            {"name": "topic", "description": "Specific topic for this lesson", "default": "", "required": True},
            {"name": "grade_level", "description": "Grade or skill level of students", "default": "", "required": True},
            {"name": "duration", "description": "Total lesson time available", "default": "50 minutes", "required": True},
        ],
        "tags": ["lesson-plan", "teaching", "curriculum"],
    },
    {
        "category": "Education",
        "name": "Rubric Generator",
        "description": "Create an assessment rubric with clear criteria and performance levels",
        "content": (
            "Create an assessment rubric for the following assignment.\n\n"
            "## Assignment Details\n"
            "- **Assignment**: {{assignment_name}}\n"
            "- **Subject**: {{subject}}\n"
            "- **Total Points**: {{total_points}}\n\n"
            "## Key Skills Being Assessed\n"
            "{{skills_assessed}}\n\n"
            "Generate a rubric with:\n"
            "1. **4 Performance Levels**: Exemplary / Proficient / Developing / Beginning\n"
            "2. **4-6 Criteria Categories** based on the skills being assessed\n"
            "3. **For Each Criterion**:\n"
            "   - Clear description of what each performance level looks like\n"
            "   - Specific, observable behaviors (not vague descriptors)\n"
            "   - Point values for each level\n"
            "4. **Point Distribution** - Points per criterion that add up to {{total_points}}\n"
            "5. **Student-Friendly Version** - A simplified version students can self-assess with\n\n"
            "Avoid subjective language like 'good' or 'excellent.' Instead describe "
            "exactly what the student's work demonstrates at each level."
        ),
        "variables": [
            {"name": "assignment_name", "description": "Name of the assignment being graded", "default": "", "required": True},
            {"name": "subject", "description": "Subject area", "default": "", "required": True},
            {"name": "total_points", "description": "Maximum points for the assignment", "default": "100", "required": True},
            {"name": "skills_assessed", "description": "What skills or competencies this assignment evaluates", "default": "", "required": True},
        ],
        "tags": ["rubric", "assessment", "grading"],
    },
    {
        "category": "Education",
        "name": "Student Feedback Writer",
        "description": "Generate constructive, personalized feedback for student work",
        "content": (
            "Write constructive feedback for a student on the following work.\n\n"
            "## Student Context\n"
            "- **Student Name**: {{student_name}}\n"
            "- **Assignment**: {{assignment_name}}\n"
            "- **Current Performance Level**: {{performance_level}}\n\n"
            "## What the Student Did Well\n"
            "{{strengths}}\n\n"
            "## Areas for Improvement\n"
            "{{areas_for_improvement}}\n\n"
            "Write feedback that:\n"
            "1. **Opens with genuine recognition** of specific strengths (not generic praise)\n"
            "2. **Identifies 2-3 growth areas** with concrete examples from their work\n"
            "3. **Provides actionable next steps** - exactly what to do differently\n"
            "4. **Uses growth mindset language** - 'not yet' instead of 'wrong'\n"
            "5. **Includes a motivating close** that connects effort to progress\n\n"
            "Tone should be warm but honest. The student should feel both supported and "
            "challenged. Keep it under 200 words so they will actually read it."
        ),
        "variables": [
            {"name": "student_name", "description": "Student's first name", "default": "", "required": True},
            {"name": "assignment_name", "description": "What assignment this feedback is for", "default": "", "required": True},
            {"name": "performance_level", "description": "General level (struggling, meeting expectations, excelling)", "default": "meeting expectations", "required": True},
            {"name": "strengths", "description": "Specific things the student did well", "default": "", "required": True},
            {"name": "areas_for_improvement", "description": "Specific areas where the student can grow", "default": "", "required": True},
        ],
        "tags": ["feedback", "student", "assessment"],
    },
    {
        "category": "Education",
        "name": "Curriculum Map Outline",
        "description": "Map a semester or unit to standards, assessments, and pacing",
        "content": (
            "Create a curriculum map for the following course unit.\n\n"
            "## Course Information\n"
            "- **Course**: {{course_name}}\n"
            "- **Unit**: {{unit_name}}\n"
            "- **Duration**: {{unit_duration}}\n"
            "- **Standards**: {{standards}}\n\n"
            "Build a curriculum map with:\n"
            "1. **Unit Overview** - Big idea and essential questions (2-3)\n"
            "2. **Standards Alignment** - Map each standard to specific lessons\n"
            "3. **Weekly Pacing Guide**:\n"
            "   | Week | Topics | Activities | Assessment | Standards |\n"
            "   Fill in for each week of the unit\n"
            "4. **Key Vocabulary** - Terms students must master\n"
            "5. **Formative Assessments** - How you check understanding along the way\n"
            "6. **Summative Assessment** - End-of-unit evaluation description\n"
            "7. **Cross-Curricular Connections** - Links to other subjects\n"
            "8. **Resources** - Textbook chapters, digital tools, supplemental materials\n\n"
            "Ensure the pacing allows for review and reteaching days."
        ),
        "variables": [
            {"name": "course_name", "description": "Name of the course", "default": "", "required": True},
            {"name": "unit_name", "description": "Name of the unit or module", "default": "", "required": True},
            {"name": "unit_duration", "description": "How long this unit runs", "default": "4 weeks", "required": True},
            {"name": "standards", "description": "Applicable standards (e.g., Common Core, state standards)", "default": "", "required": True},
        ],
        "tags": ["curriculum", "planning", "standards"],
    },
    {
        "category": "Education",
        "name": "Educational Prompt Designer",
        "description": "Meta-template for creating AI prompts that support teaching and learning",
        "content": (
            "I want to create a reusable AI prompt to help with a recurring educational task. "
            "Help me design an effective prompt template.\n\n"
            "## Educational Task\n"
            "{{educational_task}}\n\n"
            "## Target Audience\n"
            "{{target_audience}}\n\n"
            "## Desired Output\n"
            "{{desired_output}}\n\n"
            "Create a prompt template that:\n"
            "1. Opens with the educational context and learning goals\n"
            "2. Uses {{curly_brace}} variables for information that changes each time\n"
            "3. Specifies the pedagogical approach (direct instruction, inquiry-based, etc.)\n"
            "4. Includes differentiation instructions for varied learner levels\n"
            "5. Defines the output format and length constraints\n"
            "6. Has a quality check: 'Does this align with the stated learning objectives?'\n\n"
            "Also provide:\n"
            "- **Best used for** - Types of educational tasks this prompt handles well\n"
            "- **Not suitable for** - Tasks that need a human educator's judgment\n"
            "- **Adaptation tips** - How to modify for different grade levels or subjects"
        ),
        "variables": [
            {"name": "educational_task", "description": "The teaching or learning task this prompt will support", "default": "", "required": True},
            {"name": "target_audience", "description": "Students, teachers, or parents and their level", "default": "Classroom teachers", "required": False},
            {"name": "desired_output", "description": "What the generated content should look like", "default": "", "required": True},
        ],
        "tags": ["meta", "prompt-engineering", "teaching"],
    },
    {
        "category": "Education",
        "name": "Discussion Question Generator",
        "description": "Generate higher-order thinking questions for classroom discussions",
        "content": (
            "Generate discussion questions for the following topic and reading.\n\n"
            "## Topic\n"
            "{{topic}}\n\n"
            "## Source Material\n"
            "{{source_material}}\n\n"
            "## Student Level\n"
            "{{student_level}}\n\n"
            "Create 10 discussion questions organized by cognitive level:\n\n"
            "### Comprehension (2 questions)\n"
            "- Questions that check basic understanding of the material\n\n"
            "### Analysis (3 questions)\n"
            "- Questions that ask students to break down ideas, compare concepts, "
            "or identify patterns\n\n"
            "### Evaluation (3 questions)\n"
            "- Questions that ask students to make judgments, defend positions, "
            "or assess arguments\n\n"
            "### Synthesis (2 questions)\n"
            "- Questions that ask students to create new ideas, propose solutions, "
            "or connect to other domains\n\n"
            "For each question, include:\n"
            "- The question itself\n"
            "- A follow-up probe if the discussion stalls\n"
            "- A connection to real-world application\n\n"
            "Questions should be open-ended with no single correct answer."
        ),
        "variables": [
            {"name": "topic", "description": "Discussion topic or theme", "default": "", "required": True},
            {"name": "source_material", "description": "Reading, video, or material students have engaged with", "default": "", "required": True},
            {"name": "student_level", "description": "Grade level or skill level of students", "default": "", "required": True},
        ],
        "tags": ["discussion", "questions", "critical-thinking"],
    },

    # =========================================================================
    # MARKETING (6 templates)
    # =========================================================================
    {
        "category": "Marketing",
        "name": "Campaign Brief",
        "description": "Structured brief for planning a marketing campaign",
        "content": (
            "Create a marketing campaign brief for the following initiative.\n\n"
            "## Campaign Overview\n"
            "- **Campaign Name**: {{campaign_name}}\n"
            "- **Product/Service**: {{product_service}}\n"
            "- **Target Audience**: {{target_audience}}\n"
            "- **Budget**: {{budget}}\n\n"
            "Structure the brief with:\n"
            "1. **Objective** - One clear, measurable goal (e.g., 'Generate 500 qualified leads')\n"
            "2. **Target Audience**:\n"
            "   - Demographics and psychographics\n"
            "   - Pain points this campaign addresses\n"
            "   - Where they spend time online and offline\n"
            "3. **Key Message** - The single most important takeaway\n"
            "4. **Supporting Messages** - 3 proof points or benefits\n"
            "5. **Channels**:\n"
            "   - Primary channels with rationale\n"
            "   - Content types for each channel\n"
            "   - Posting frequency\n"
            "6. **Timeline** - Campaign phases with dates\n"
            "7. **Budget Allocation** - How to distribute {{budget}} across channels\n"
            "8. **Success Metrics** - KPIs with targets\n"
            "9. **Call to Action** - What we want the audience to do\n\n"
            "Keep the brief actionable. A team member should be able to start executing "
            "from this document."
        ),
        "variables": [
            {"name": "campaign_name", "description": "Working name for the campaign", "default": "", "required": True},
            {"name": "product_service", "description": "What product or service is being promoted", "default": "", "required": True},
            {"name": "target_audience", "description": "Who we are trying to reach", "default": "", "required": True},
            {"name": "budget", "description": "Total campaign budget", "default": "", "required": True},
        ],
        "tags": ["campaign", "planning", "strategy"],
    },
    {
        "category": "Marketing",
        "name": "Social Media Post Series",
        "description": "Generate a week of social media posts for a specific platform",
        "content": (
            "Create a series of social media posts for the following campaign.\n\n"
            "## Campaign Details\n"
            "- **Platform**: {{platform}}\n"
            "- **Topic/Theme**: {{topic}}\n"
            "- **Brand Voice**: {{brand_voice}}\n"
            "- **Number of Posts**: {{num_posts}}\n\n"
            "For each post, provide:\n"
            "1. **Post text** - Optimized for {{platform}} character limits and format\n"
            "2. **Visual suggestion** - What image or graphic to pair with the post\n"
            "3. **Hashtags** - 3-5 relevant hashtags\n"
            "4. **Best posting time** - Recommended day/time based on platform best practices\n"
            "5. **Call to action** - What the reader should do next\n\n"
            "Post series requirements:\n"
            "- Mix of content types: educational, promotional, engagement, social proof\n"
            "- Each post should work standalone but build a cohesive narrative together\n"
            "- Include 1 post that encourages audience interaction (poll, question, challenge)\n"
            "- Maintain {{brand_voice}} consistently across all posts\n"
            "- Avoid salesy language in more than half the posts"
        ),
        "variables": [
            {"name": "platform", "description": "Social media platform (LinkedIn, Instagram, X, Facebook)", "default": "LinkedIn", "required": True},
            {"name": "topic", "description": "Central theme or message for the post series", "default": "", "required": True},
            {"name": "brand_voice", "description": "Tone and personality (professional, casual, authoritative, friendly)", "default": "Professional but approachable", "required": True},
            {"name": "num_posts", "description": "How many posts to create", "default": "5", "required": True},
        ],
        "tags": ["social-media", "content", "posts"],
    },
    {
        "category": "Marketing",
        "name": "Email Sequence Builder",
        "description": "Create a multi-email nurture sequence for leads or customers",
        "content": (
            "Design an email sequence for the following objective.\n\n"
            "## Sequence Details\n"
            "- **Objective**: {{sequence_objective}}\n"
            "- **Audience Segment**: {{audience_segment}}\n"
            "- **Number of Emails**: {{num_emails}}\n"
            "- **Sending Cadence**: {{cadence}}\n\n"
            "For each email in the sequence, provide:\n"
            "1. **Subject Line** - Two options (A/B testable)\n"
            "2. **Preview Text** - The snippet shown in inbox\n"
            "3. **Email Body** - Structured with:\n"
            "   - Opening hook (1-2 sentences)\n"
            "   - Value content (2-3 paragraphs)\n"
            "   - Single clear CTA\n"
            "4. **Send Timing** - Day and time relative to sequence start\n"
            "5. **Goal of This Email** - What it accomplishes in the journey\n\n"
            "Sequence design principles:\n"
            "- Each email should deliver standalone value even if others are not read\n"
            "- Progressive engagement: awareness -> consideration -> action\n"
            "- Include a 'breakup email' as the last email in the sequence\n"
            "- Subject lines under 50 characters\n"
            "- Body text scannable in under 60 seconds"
        ),
        "variables": [
            {"name": "sequence_objective", "description": "Goal of the email sequence (nurture, onboard, re-engage)", "default": "", "required": True},
            {"name": "audience_segment", "description": "Who receives these emails and what stage they are in", "default": "", "required": True},
            {"name": "num_emails", "description": "Number of emails in the sequence", "default": "5", "required": True},
            {"name": "cadence", "description": "How frequently emails are sent", "default": "Every 3 days", "required": False},
        ],
        "tags": ["email", "nurture", "sequence"],
    },
    {
        "category": "Marketing",
        "name": "Analytics Report Narrative",
        "description": "Turn marketing metrics into an actionable narrative report",
        "content": (
            "Write a narrative analysis of the following marketing performance data.\n\n"
            "## Report Period\n"
            "{{report_period}}\n\n"
            "## Channel/Campaign\n"
            "{{channel_name}}\n\n"
            "## Raw Metrics\n"
            "{{metrics_data}}\n\n"
            "Transform the raw data into an actionable report with:\n"
            "1. **Executive Summary** (3 sentences) - Overall performance and trend direction\n"
            "2. **Key Wins** - Top 3 metrics that improved and why\n"
            "3. **Areas of Concern** - Metrics that declined or underperformed targets\n"
            "4. **Trend Analysis** - What the data tells us about audience behavior\n"
            "5. **Competitive Context** - How our numbers compare to industry benchmarks (if known)\n"
            "6. **Recommendations** - 3-5 specific, prioritized actions based on the data:\n"
            "   - What to do\n"
            "   - Expected impact\n"
            "   - Effort required\n"
            "7. **Next Period Goals** - Targets to set based on current trajectory\n\n"
            "Focus on insights, not just data repetition. Every number should connect to "
            "a 'so what' and a 'now what.'"
        ),
        "variables": [
            {"name": "report_period", "description": "Time period covered by the report", "default": "Last 30 days", "required": True},
            {"name": "channel_name", "description": "Marketing channel or campaign being analyzed", "default": "", "required": True},
            {"name": "metrics_data", "description": "Raw performance metrics (impressions, clicks, conversions, etc.)", "default": "", "required": True},
        ],
        "tags": ["analytics", "reporting", "performance"],
    },
    {
        "category": "Marketing",
        "name": "Marketing Prompt Factory",
        "description": "Meta-template for building reusable marketing content prompts",
        "content": (
            "I need to create a reusable prompt template for a recurring marketing task. "
            "Help me design an effective, repeatable prompt.\n\n"
            "## Marketing Task\n"
            "{{marketing_task}}\n\n"
            "## Content Type\n"
            "{{content_type}}\n\n"
            "## Brand Guidelines\n"
            "{{brand_guidelines}}\n\n"
            "Generate a prompt template that:\n"
            "1. Sets the AI's role (e.g., 'You are a senior content strategist')\n"
            "2. Embeds brand voice guidelines so every output is on-brand\n"
            "3. Uses {{curly_brace}} variables for content that changes each time\n"
            "4. Specifies output format, word count, and platform constraints\n"
            "5. Includes a quality rubric: 'Before finalizing, check that...'\n"
            "6. Has anti-patterns: 'Do NOT use these words/phrases: ...'\n\n"
            "Also provide:\n"
            "- **Template usage guide** - When and how to use this prompt\n"
            "- **Variable filling tips** - How to provide effective inputs\n"
            "- **Iteration guide** - Common follow-up prompts to refine the output\n"
            "- **Quality bar** - What 'good enough to publish' looks like"
        ),
        "variables": [
            {"name": "marketing_task", "description": "The marketing content task to templatize", "default": "", "required": True},
            {"name": "content_type", "description": "Type of content (blog, ad copy, email, landing page)", "default": "", "required": True},
            {"name": "brand_guidelines", "description": "Voice, tone, and style requirements", "default": "Professional, clear, benefit-focused.", "required": False},
        ],
        "tags": ["meta", "prompt-engineering", "content"],
    },
    {
        "category": "Marketing",
        "name": "Competitor Messaging Analysis",
        "description": "Analyze competitor messaging to find differentiation opportunities",
        "content": (
            "Analyze the messaging of our competitors to identify differentiation opportunities.\n\n"
            "## Our Product/Service\n"
            "{{our_product}}\n\n"
            "## Competitors to Analyze\n"
            "{{competitors}}\n\n"
            "## Our Current Positioning\n"
            "{{current_positioning}}\n\n"
            "Provide an analysis that covers:\n"
            "1. **Messaging Themes** - Common themes across competitors:\n"
            "   - What claims do they all make?\n"
            "   - What language and tone do they use?\n"
            "   - What pain points do they emphasize?\n"
            "2. **Differentiation Gaps** - What none of them are saying that we could own\n"
            "3. **Overused Messaging** - Claims that have become generic and meaningless\n"
            "4. **Audience Targeting** - Who each competitor seems to target vs. who we target\n"
            "5. **Messaging Opportunities** - 3-5 specific positioning angles we could pursue:\n"
            "   - The angle\n"
            "   - Why it would resonate\n"
            "   - How to test it\n"
            "6. **Recommended Positioning Statement** - A draft positioning statement that "
            "differentiates us from the competitive landscape\n\n"
            "Base analysis on the information provided. Flag any claims that "
            "would need market research to validate."
        ),
        "variables": [
            {"name": "our_product", "description": "Description of our product or service", "default": "", "required": True},
            {"name": "competitors", "description": "List of competitor names and brief descriptions", "default": "", "required": True},
            {"name": "current_positioning", "description": "How we currently position ourselves in the market", "default": "", "required": True},
        ],
        "tags": ["competitive", "positioning", "strategy"],
    },

    # =========================================================================
    # HUMAN RESOURCES (6 templates)
    # =========================================================================
    {
        "category": "Human Resources",
        "name": "Job Description Writer",
        "description": "Create a compelling, inclusive job description from role requirements",
        "content": (
            "Write a job description for the following role.\n\n"
            "## Role Details\n"
            "- **Job Title**: {{job_title}}\n"
            "- **Department**: {{department}}\n"
            "- **Reports To**: {{reports_to}}\n"
            "- **Employment Type**: {{employment_type}}\n\n"
            "## Key Responsibilities\n"
            "{{key_responsibilities}}\n\n"
            "Structure the job description with:\n"
            "1. **About the Role** (2-3 sentences) - What makes this role impactful\n"
            "2. **What You Will Do** - 6-8 responsibilities, starting with the most important:\n"
            "   - Use action verbs (lead, design, build, analyze)\n"
            "   - Include impact: 'Design X to achieve Y'\n"
            "3. **What You Bring** - Requirements split into:\n"
            "   - Must-have qualifications (keep to 5-6)\n"
            "   - Nice-to-have qualifications (3-4)\n"
            "4. **What We Offer** - Benefits, growth opportunities, culture highlights\n"
            "5. **About Us** - Brief company/team description\n\n"
            "Writing guidelines:\n"
            "- Use gender-neutral language throughout\n"
            "- Avoid jargon and unnecessary acronyms\n"
            "- Focus on outcomes over years of experience\n"
            "- Include a statement welcoming diverse candidates\n"
            "- Keep total length under 600 words"
        ),
        "variables": [
            {"name": "job_title", "description": "Title for the position", "default": "", "required": True},
            {"name": "department", "description": "Department or team this role belongs to", "default": "", "required": True},
            {"name": "reports_to", "description": "Who this role reports to", "default": "", "required": True},
            {"name": "employment_type", "description": "Full-time, part-time, contract, etc.", "default": "Full-time", "required": True},
            {"name": "key_responsibilities", "description": "Main duties and expectations for this role", "default": "", "required": True},
        ],
        "tags": ["hiring", "job-description", "recruitment"],
    },
    {
        "category": "Human Resources",
        "name": "Performance Review Framework",
        "description": "Structured framework for writing fair, actionable performance reviews",
        "content": (
            "Help me write a performance review for the following team member.\n\n"
            "## Employee Details\n"
            "- **Name**: {{employee_name}}\n"
            "- **Role**: {{employee_role}}\n"
            "- **Review Period**: {{review_period}}\n\n"
            "## Performance Notes\n"
            "{{performance_notes}}\n\n"
            "Structure the review with:\n"
            "1. **Overall Assessment** - Summary rating and 2-sentence overview\n"
            "2. **Key Accomplishments** (3-5):\n"
            "   - Specific achievements with measurable impact\n"
            "   - Connection to team or company goals\n"
            "3. **Strengths** (2-3):\n"
            "   - Observable behaviors, not personality traits\n"
            "   - Examples that demonstrate each strength\n"
            "4. **Growth Areas** (2-3):\n"
            "   - Specific, actionable development opportunities\n"
            "   - Framed as growth, not criticism\n"
            "   - Include concrete steps to improve\n"
            "5. **Goals for Next Period** (3-4):\n"
            "   - SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)\n"
            "   - Mix of performance and development goals\n"
            "6. **Support Needed** - What the manager will provide to help them succeed\n\n"
            "Use specific examples, not generalities. 'Delivered Project X two weeks early, "
            "saving $10K' is better than 'good time management.'"
        ),
        "variables": [
            {"name": "employee_name", "description": "Name of the employee being reviewed", "default": "", "required": True},
            {"name": "employee_role", "description": "Their current role and level", "default": "", "required": True},
            {"name": "review_period", "description": "Time period this review covers", "default": "", "required": True},
            {"name": "performance_notes", "description": "Raw notes on their performance, achievements, and areas to improve", "default": "", "required": True},
        ],
        "tags": ["performance", "review", "development"],
    },
    {
        "category": "Human Resources",
        "name": "Interview Question Set",
        "description": "Generate behavioral interview questions tailored to a specific role",
        "content": (
            "Create a set of behavioral interview questions for the following role.\n\n"
            "## Role\n"
            "{{job_title}}\n\n"
            "## Key Competencies to Assess\n"
            "{{competencies}}\n\n"
            "## Interview Duration\n"
            "{{interview_duration}}\n\n"
            "Generate questions organized by competency:\n\n"
            "For each competency ({{competencies}}), provide:\n"
            "1. **Primary Question** - A behavioral question using the STAR format prompt:\n"
            "   'Tell me about a time when...'\n"
            "2. **Follow-Up Probes** (2-3) - Questions to dig deeper:\n"
            "   - 'What was your specific role?'\n"
            "   - 'What would you do differently?'\n"
            "3. **What Good Looks Like** - Key signals of a strong answer\n"
            "4. **Red Flags** - Warning signs in responses\n\n"
            "Also include:\n"
            "- 2 situational questions ('What would you do if...')\n"
            "- 1 culture-fit question aligned to company values\n"
            "- Suggested time allocation per section to fit {{interview_duration}}\n\n"
            "Questions should be legal and compliant. Avoid questions about age, "
            "family status, religion, or protected characteristics."
        ),
        "variables": [
            {"name": "job_title", "description": "Role being interviewed for", "default": "", "required": True},
            {"name": "competencies", "description": "Key skills and traits to evaluate (e.g., leadership, problem-solving, communication)", "default": "", "required": True},
            {"name": "interview_duration", "description": "How long the interview will last", "default": "45 minutes", "required": True},
        ],
        "tags": ["interview", "hiring", "behavioral"],
    },
    {
        "category": "Human Resources",
        "name": "HR Policy Document",
        "description": "Draft an employee-facing HR policy with clear guidelines and procedures",
        "content": (
            "Draft an employee-facing HR policy document for the following topic.\n\n"
            "## Policy Area\n"
            "{{policy_area}}\n\n"
            "## Key Rules to Establish\n"
            "{{key_rules}}\n\n"
            "## Company Size and Type\n"
            "{{company_context}}\n\n"
            "Structure the policy with:\n"
            "1. **Policy Name** and effective date\n"
            "2. **Purpose** - Why this policy exists and who it protects\n"
            "3. **Scope** - Who is covered (all employees, specific departments, contractors)\n"
            "4. **Definitions** - Clear definitions of key terms\n"
            "5. **Policy Guidelines** - Clear, numbered rules:\n"
            "   - What is expected\n"
            "   - What is not permitted\n"
            "   - Any exceptions or special circumstances\n"
            "6. **Procedures**:\n"
            "   - How to request exceptions or accommodations\n"
            "   - How to report violations\n"
            "   - Escalation path\n"
            "7. **Responsibilities** - What employees, managers, and HR each do\n"
            "8. **Consequences** - Progressive discipline approach\n"
            "9. **Related Policies** - Cross-references to other relevant policies\n"
            "10. **Acknowledgment** - Statement for employee signature\n\n"
            "Use plain language a new employee can understand. Include an FAQ section "
            "addressing the 3-5 most common questions."
        ),
        "variables": [
            {"name": "policy_area", "description": "Topic of the HR policy (remote work, PTO, workplace conduct, etc.)", "default": "", "required": True},
            {"name": "key_rules", "description": "Core rules and guidelines to include", "default": "", "required": True},
            {"name": "company_context", "description": "Company size, industry, and relevant context", "default": "Small to medium business, 50-200 employees", "required": False},
        ],
        "tags": ["policy", "hr", "compliance"],
    },
    {
        "category": "Human Resources",
        "name": "HR Prompt Template Builder",
        "description": "Meta-template for creating reusable HR prompts for any people operations task",
        "content": (
            "I need to create a reusable AI prompt for a recurring HR task. "
            "Help me build a prompt template I can use repeatedly.\n\n"
            "## HR Task\n"
            "{{hr_task}}\n\n"
            "## Who Will Use This Prompt\n"
            "{{users}}\n\n"
            "## Sensitivity Level\n"
            "{{sensitivity_level}}\n\n"
            "Generate a prompt template that:\n"
            "1. Sets appropriate context and role for the AI\n"
            "2. Uses {{curly_brace}} variables for employee-specific or situation-specific details\n"
            "3. Includes compliance guardrails:\n"
            "   - 'Do not include information about protected characteristics'\n"
            "   - 'Use legally compliant language'\n"
            "   - 'Flag any content that may need legal review'\n"
            "4. Specifies the output format and tone\n"
            "5. Has a review checklist before sending/publishing\n\n"
            "Also include:\n"
            "- **Privacy considerations** - What data should never be included in prompts\n"
            "- **Legal review triggers** - When output should be reviewed by legal/compliance\n"
            "- **Template variations** - How to adapt for different scenarios\n"
            "- **Quality checks** - How to verify the output is fair and unbiased"
        ),
        "variables": [
            {"name": "hr_task", "description": "The HR task to create a reusable prompt for", "default": "", "required": True},
            {"name": "users", "description": "Who will use this prompt (HR team, managers, recruiters)", "default": "HR team members", "required": False},
            {"name": "sensitivity_level", "description": "How sensitive the content is (low, medium, high)", "default": "Medium", "required": True},
        ],
        "tags": ["meta", "prompt-engineering", "hr"],
    },
    {
        "category": "Human Resources",
        "name": "Onboarding Plan Generator",
        "description": "Create a structured 30-60-90 day onboarding plan for a new hire",
        "content": (
            "Create a 30-60-90 day onboarding plan for the following new hire.\n\n"
            "## New Hire Details\n"
            "- **Role**: {{role_title}}\n"
            "- **Department**: {{department}}\n"
            "- **Start Date**: {{start_date}}\n"
            "- **Manager**: {{manager_name}}\n\n"
            "Build an onboarding plan with:\n\n"
            "### Days 1-30: Learn\n"
            "- Week 1: Orientation, systems access, team introductions\n"
            "- Week 2-4: Role-specific training, shadowing, initial assignments\n"
            "- **Milestone**: Can independently navigate core tools and processes\n"
            "- **Check-in topics**: Comfort level, questions, initial impressions\n\n"
            "### Days 31-60: Contribute\n"
            "- Take on defined projects with guidance\n"
            "- Build cross-functional relationships\n"
            "- Start attending key meetings as a participant\n"
            "- **Milestone**: Delivers first independent work product\n"
            "- **Check-in topics**: Workload, support needs, cultural fit\n\n"
            "### Days 61-90: Own\n"
            "- Own a workstream or project end-to-end\n"
            "- Contribute to team planning and decisions\n"
            "- Identify one area for improvement and propose a solution\n"
            "- **Milestone**: Operating independently in the role\n"
            "- **Check-in topics**: Performance feedback, goal setting, career interests\n\n"
            "Include specific tasks, meetings to attend, people to meet, and "
            "documents to read for each phase. The plan should be detailed enough "
            "that the manager and new hire both know what success looks like."
        ),
        "variables": [
            {"name": "role_title", "description": "Title of the new hire's position", "default": "", "required": True},
            {"name": "department", "description": "Department or team they are joining", "default": "", "required": True},
            {"name": "start_date", "description": "When they start", "default": "", "required": True},
            {"name": "manager_name", "description": "Their direct manager", "default": "", "required": True},
        ],
        "tags": ["onboarding", "new-hire", "planning"],
    },
]
