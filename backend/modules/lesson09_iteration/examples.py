"""Lesson 9: Iteration Passes - Example tasks organized by category.

Each task is designed to naturally benefit from the 70-85-95 iterative
refinement progression:
  Pass 1 (70%) - Structure & Approach: "Right problem, right way?"
  Pass 2 (85%) - Robustness: "What will break in practice?"
  Pass 3 (95%) - Production-Ready: "Will this work for its audience?"
"""

EXAMPLE_CATEGORIES = [
    "Tech",
    "Managerial",
    "Admin",
    "Education",
    "Marketing",
    "Human Resources",
]

EXAMPLE_TASKS = [
    # =========================================================================
    # Tech
    # =========================================================================
    {
        "category": "Tech",
        "task_name": "API Error Handler Refactoring Across Microservices",
        "target_outcome": "Consolidated error handling with consistent response format and status codes across all service endpoints",
        "notes": "Pass 1 focuses on the error taxonomy and response schema design. Pass 2 addresses retry logic, circuit breakers, and cascading failure scenarios. Pass 3 ensures error messages are developer-friendly and the approach is documented for onboarding."
    },
    {
        "category": "Tech",
        "task_name": "Database Query Optimization for Reporting Dashboard",
        "target_outcome": "All dashboard queries execute in under 100ms for typical data volumes with proper indexing and query plans",
        "notes": "Pass 1 identifies the slowest queries and proposes indexing strategy. Pass 2 stress-tests with realistic data volumes and concurrent users. Pass 3 adds query monitoring, alerting thresholds, and runbook documentation."
    },
    {
        "category": "Tech",
        "task_name": "CI/CD Pipeline Migration from Jenkins to GitHub Actions",
        "target_outcome": "Fully automated build, test, and deploy pipeline with environment promotion gates and rollback capability",
        "notes": "Pass 1 maps the existing Jenkins stages to GitHub Actions workflow structure. Pass 2 handles secrets management, matrix builds, and failure notification edge cases. Pass 3 covers developer documentation, migration guide, and team training materials."
    },
    {
        "category": "Tech",
        "task_name": "REST API Rate Limiting and Throttling Implementation",
        "target_outcome": "Per-tenant rate limiting with configurable thresholds, graceful degradation, and clear client feedback headers",
        "notes": "Pass 1 designs the rate limiting algorithm and storage strategy. Pass 2 tests burst traffic, distributed counting consistency, and bypass scenarios for internal services. Pass 3 polishes client-facing error responses, documents rate limit headers, and adds monitoring dashboards."
    },
    {
        "category": "Tech",
        "task_name": "Logging and Observability Stack Standardization",
        "target_outcome": "Unified structured logging format across all services with correlation IDs, consistent log levels, and centralized search",
        "notes": "Pass 1 defines the log schema, severity conventions, and correlation ID propagation pattern. Pass 2 addresses high-volume log handling, PII scrubbing, and storage retention edge cases. Pass 3 creates developer guidelines, log query examples, and alerting rule templates."
    },
    {
        "category": "Tech",
        "task_name": "Feature Flag System Design for Gradual Rollouts",
        "target_outcome": "Self-service feature flag platform supporting percentage rollouts, user targeting, and kill switches with audit trail",
        "notes": "Pass 1 architects the flag evaluation engine and storage model. Pass 2 handles stale cache invalidation, flag dependency conflicts, and performance under high request volume. Pass 3 adds the management UI documentation, rollout playbook, and incident response procedures."
    },

    # =========================================================================
    # Managerial
    # =========================================================================
    {
        "category": "Managerial",
        "task_name": "Quarterly OKR Framework for Engineering Teams",
        "target_outcome": "A repeatable OKR process with clear timelines, scoring rubrics, and alignment checkpoints between teams and leadership",
        "notes": "Pass 1 defines the OKR cadence, hierarchy, and scoring methodology. Pass 2 addresses gaming risks, cross-team dependency conflicts, and mid-quarter adjustment procedures. Pass 3 ensures the framework is simple enough for ICs to use without training overhead."
    },
    {
        "category": "Managerial",
        "task_name": "Decision Framework for Build vs Buy Evaluations",
        "target_outcome": "Structured evaluation template that produces a defensible recommendation with total cost of ownership analysis",
        "notes": "Pass 1 establishes evaluation criteria categories and weighting approach. Pass 2 stress-tests the framework against past decisions that went wrong and adds hidden cost detection. Pass 3 refines the presentation format for executive stakeholders and adds decision log templates."
    },
    {
        "category": "Managerial",
        "task_name": "Cross-Team Dependency Tracking and Escalation Process",
        "target_outcome": "Visible dependency map with automated status updates and clear escalation paths when blockers arise",
        "notes": "Pass 1 designs the dependency registration and tracking workflow. Pass 2 handles scenarios where teams disagree on priority, dependencies shift mid-sprint, or status updates go stale. Pass 3 creates concise documentation and integrates with existing project management tooling."
    },
    {
        "category": "Managerial",
        "task_name": "Technical Debt Prioritization and Communication Strategy",
        "target_outcome": "A scoring model for tech debt items with business impact translation that non-technical stakeholders can act on",
        "notes": "Pass 1 creates the debt categorization and scoring dimensions. Pass 2 validates the model against real backlog items and tests for bias toward easily quantifiable debt. Pass 3 develops the executive summary format and quarterly review presentation template."
    },
    {
        "category": "Managerial",
        "task_name": "Incident Retrospective Process Redesign for Blameless Culture",
        "target_outcome": "Structured post-incident review process that surfaces systemic improvements without assigning individual blame",
        "notes": "Pass 1 outlines the retrospective format, facilitation guide, and action item tracking. Pass 2 addresses scenarios where root cause is ambiguous, multiple teams are involved, or leadership pressure distorts findings. Pass 3 polishes the template for ease of use and adds example retrospectives as reference."
    },
    {
        "category": "Managerial",
        "task_name": "Vendor Selection Scorecard for SaaS Tool Procurement",
        "target_outcome": "Weighted evaluation matrix covering security, integration, cost, and support that produces a clear procurement recommendation",
        "notes": "Pass 1 identifies evaluation categories and defines the scoring scale. Pass 2 tests the scorecard against past vendor choices and adds contract risk factors. Pass 3 formats the output for procurement and legal review with clear justification narratives."
    },

    # =========================================================================
    # Admin
    # =========================================================================
    {
        "category": "Admin",
        "task_name": "IT Asset Lifecycle Management Procedure Document",
        "target_outcome": "End-to-end procedure covering procurement, provisioning, tracking, and decommissioning of hardware and software assets",
        "notes": "Pass 1 maps the full lifecycle stages and responsible parties. Pass 2 addresses exceptions like emergency purchases, BYOD devices, and audit trail gaps. Pass 3 ensures the procedure is scannable, role-specific, and includes checklists for each stage."
    },
    {
        "category": "Admin",
        "task_name": "Annual Compliance Audit Preparation Checklist",
        "target_outcome": "A comprehensive pre-audit checklist that reduces audit preparation time by 50% and eliminates last-minute scrambling",
        "notes": "Pass 1 structures the checklist by compliance domain with evidence requirements. Pass 2 adds fallback procedures for missing documentation, timeline buffers for common delays, and cross-references to policy documents. Pass 3 formats for print and digital use with progress tracking."
    },
    {
        "category": "Admin",
        "task_name": "Office Space Reconfiguration Request and Approval Workflow",
        "target_outcome": "Standardized request process with clear approval authority, budget thresholds, and facilities coordination steps",
        "notes": "Pass 1 defines the request form fields, approval chain, and facilities handoff. Pass 2 handles budget overrun scenarios, conflicting team requests, and ADA compliance requirements. Pass 3 polishes the user-facing request form and creates a FAQ for common questions."
    },
    {
        "category": "Admin",
        "task_name": "Document Retention and Destruction Policy Update",
        "target_outcome": "Updated retention schedule aligned with current regulations, with clear destruction procedures and litigation hold exceptions",
        "notes": "Pass 1 maps document categories to retention periods based on regulatory requirements. Pass 2 addresses litigation hold conflicts, cross-jurisdictional differences, and electronic records edge cases. Pass 3 makes the policy readable for non-legal staff and adds quick-reference cards."
    },
    {
        "category": "Admin",
        "task_name": "Expense Reporting Process Streamlining and Automation",
        "target_outcome": "Reduced expense report processing time from 5 days to 1 day with automated approvals for pre-authorized categories",
        "notes": "Pass 1 maps current pain points and designs the automated approval rules. Pass 2 tests edge cases like split receipts, foreign currency, missing documentation, and policy violations. Pass 3 creates the user guide, manager approval guide, and exception handling procedures."
    },
    {
        "category": "Admin",
        "task_name": "Business Continuity Plan Annual Review and Update",
        "target_outcome": "Updated BCP with current contact trees, recovery procedures, and tested communication channels for all critical functions",
        "notes": "Pass 1 reviews and updates the critical function inventory and recovery priorities. Pass 2 identifies single points of failure, tests communication chain reliability, and validates recovery time estimates. Pass 3 ensures the plan is accessible during an actual emergency and updates the tabletop exercise script."
    },

    # =========================================================================
    # Education
    # =========================================================================
    {
        "category": "Education",
        "task_name": "Hands-On Workshop Design for Data Literacy Fundamentals",
        "target_outcome": "A 4-hour workshop with exercises that enable participants to interpret charts, spot misleading statistics, and ask data-driven questions",
        "notes": "Pass 1 structures the learning arc, key concepts, and exercise sequence. Pass 2 tests exercises for ambiguous instructions, varying skill levels, and time management risks. Pass 3 polishes facilitator notes, participant handouts, and post-workshop assessment."
    },
    {
        "category": "Education",
        "task_name": "Assessment Rubric for Technical Writing Portfolio Projects",
        "target_outcome": "Transparent rubric with clear criteria, performance levels, and examples that students can use for self-assessment before submission",
        "notes": "Pass 1 defines criteria categories and performance level descriptions. Pass 2 tests for grading consistency across evaluators, addresses borderline cases, and eliminates subjective language. Pass 3 adds annotated example submissions at each performance level and student-facing guidance."
    },
    {
        "category": "Education",
        "task_name": "Microlearning Module Series on Cybersecurity Awareness",
        "target_outcome": "Ten 5-minute modules with knowledge checks that measurably improve phishing identification rates across the organization",
        "notes": "Pass 1 sequences the topics and designs the core content for each module. Pass 2 validates scenario realism, tests knowledge check question quality, and addresses accessibility requirements. Pass 3 adds engagement hooks, real-world examples from recent incidents, and manager discussion guides."
    },
    {
        "category": "Education",
        "task_name": "Mentorship Program Curriculum for Junior Developers",
        "target_outcome": "Structured 6-month program with monthly milestones, discussion guides, and skill assessments that mentors can facilitate independently",
        "notes": "Pass 1 maps the skill progression arc and defines monthly themes and deliverables. Pass 2 addresses mentor skill variation, mentee disengagement scenarios, and progress tracking when milestones are missed. Pass 3 creates the mentor onboarding guide, conversation starters, and program evaluation survey."
    },
    {
        "category": "Education",
        "task_name": "Case Study Library for Project Management Training",
        "target_outcome": "Twelve realistic case studies covering common PM failure modes with facilitation guides and debrief frameworks",
        "notes": "Pass 1 identifies the failure mode categories and drafts scenario outlines with learning objectives. Pass 2 tests for unintentional bias in scenarios, validates time estimates for group discussion, and adds complexity variants. Pass 3 writes facilitator answer keys, discussion prompts, and connects each case to PM methodology concepts."
    },
    {
        "category": "Education",
        "task_name": "Self-Paced Onboarding Course for New Software Platform",
        "target_outcome": "Interactive onboarding course that gets new users to their first successful workflow within 30 minutes with no support tickets",
        "notes": "Pass 1 maps the critical path from login to first success and structures the module flow. Pass 2 identifies where users commonly get stuck, adds error recovery guidance, and tests with different user personas. Pass 3 adds contextual help tooltips, progress indicators, and a quick-start reference card."
    },

    # =========================================================================
    # Marketing
    # =========================================================================
    {
        "category": "Marketing",
        "task_name": "Product Launch Email Sequence for B2B SaaS Release",
        "target_outcome": "Five-email nurture sequence that achieves 25% open rate and 5% click-through to trial signup across segmented audiences",
        "notes": "Pass 1 maps the sequence arc, key messages per email, and audience segmentation logic. Pass 2 tests subject lines for spam filter triggers, validates CTA placement, and addresses unsubscribe compliance. Pass 3 polishes copy tone for brand consistency, adds A/B test variants, and creates the send schedule."
    },
    {
        "category": "Marketing",
        "task_name": "Content Calendar Strategy for Thought Leadership Blog",
        "target_outcome": "90-day editorial calendar with topic clusters, SEO keyword targets, and author assignments that drives 30% organic traffic growth",
        "notes": "Pass 1 identifies pillar topics, maps keyword clusters, and designs the publishing cadence. Pass 2 validates keyword difficulty vs. domain authority, addresses content cannibalization risks, and adds contingency topics. Pass 3 creates author brief templates, editorial guidelines, and distribution checklists."
    },
    {
        "category": "Marketing",
        "task_name": "Brand Voice Guidelines Document for Multi-Channel Use",
        "target_outcome": "Actionable brand voice guide with do/don't examples for each channel that any team member can apply without design review",
        "notes": "Pass 1 defines voice attributes, tone spectrum, and channel-specific adaptations. Pass 2 tests guidelines against real content samples that previously missed the mark and adds edge cases like crisis communication. Pass 3 adds quick-reference cards, before/after examples, and a self-check rubric for writers."
    },
    {
        "category": "Marketing",
        "task_name": "Customer Case Study Template and Interview Framework",
        "target_outcome": "Repeatable case study production process that takes a customer from interview to published story in under two weeks",
        "notes": "Pass 1 designs the interview question framework, story arc template, and approval workflow. Pass 2 addresses customer reluctance scenarios, legal review bottlenecks, and metric verification challenges. Pass 3 polishes the template for visual consistency, adds pull-quote extraction guidance, and creates a customer outreach email template."
    },
    {
        "category": "Marketing",
        "task_name": "Competitive Positioning Matrix for Sales Enablement",
        "target_outcome": "One-page battle cards per competitor with objection handling scripts that sales reps can reference during live calls",
        "notes": "Pass 1 identifies key competitors, comparison dimensions, and positioning angles. Pass 2 validates claims for accuracy, addresses scenarios where competitors have genuine advantages, and tests objection scripts for believability. Pass 3 formats for quick scanning during calls, adds conversation bridges, and creates an update cadence plan."
    },
    {
        "category": "Marketing",
        "task_name": "Social Media Analytics Dashboard Requirements Specification",
        "target_outcome": "Clear specification for a cross-platform analytics view that surfaces actionable insights rather than vanity metrics",
        "notes": "Pass 1 identifies the key decisions the dashboard should inform and maps required data sources. Pass 2 addresses data freshness limitations, metric definition inconsistencies across platforms, and alert threshold calibration. Pass 3 adds user stories for each stakeholder role, wireframe annotations, and a phased delivery roadmap."
    },

    # =========================================================================
    # Human Resources
    # =========================================================================
    {
        "category": "Human Resources",
        "task_name": "Job Description Template for Technical Role Families",
        "target_outcome": "Modular job description framework that reduces time-to-post by 60% while ensuring inclusive language and accurate leveling",
        "notes": "Pass 1 designs the template structure with required vs. preferred qualifications and leveling criteria. Pass 2 tests for gendered language, inflated requirements that discourage qualified candidates, and legal compliance across jurisdictions. Pass 3 adds hiring manager guidance, a requirement prioritization exercise, and interview alignment notes."
    },
    {
        "category": "Human Resources",
        "task_name": "New Employee Onboarding Journey Map and Checklist",
        "target_outcome": "90-day onboarding program with week-by-week milestones, buddy system guidelines, and manager check-in frameworks",
        "notes": "Pass 1 maps the onboarding timeline, key activities, and responsible parties for each phase. Pass 2 addresses remote employee variations, department-specific additions, and scenarios where buddies or managers are unavailable. Pass 3 creates the new hire welcome packet, manager preparation checklist, and 30-60-90 day review templates."
    },
    {
        "category": "Human Resources",
        "task_name": "Performance Review Calibration Process and Manager Guide",
        "target_outcome": "Fair and consistent calibration process with bias mitigation steps that managers can follow without extensive HR coaching",
        "notes": "Pass 1 defines the calibration meeting structure, rating distribution guidance, and evidence requirements. Pass 2 addresses recency bias, halo effect, and scenarios where managers disagree on ratings or lack sufficient evidence. Pass 3 creates the manager preparation worksheet, facilitation script, and post-calibration communication templates."
    },
    {
        "category": "Human Resources",
        "task_name": "Employee Engagement Survey Design and Action Planning",
        "target_outcome": "Concise survey instrument with validated questions that produces actionable team-level insights, not just organization-wide scores",
        "notes": "Pass 1 selects question domains, response scales, and demographic cuts that enable meaningful analysis. Pass 2 tests for survey fatigue, leading questions, and scenarios where anonymity could be compromised in small teams. Pass 3 adds the action planning template, manager discussion guide, and results communication framework."
    },
    {
        "category": "Human Resources",
        "task_name": "Remote Work Policy Update with Hybrid Flexibility Guidelines",
        "target_outcome": "Clear policy covering eligibility, expectations, equipment, and in-office requirements that reduces manager interpretation variance",
        "notes": "Pass 1 defines policy scope, eligibility criteria, and core expectations for each work arrangement. Pass 2 addresses edge cases like cross-state tax implications, time zone conflicts, and accommodations requests. Pass 3 adds a manager FAQ, employee self-assessment tool, and team agreement template."
    },
    {
        "category": "Human Resources",
        "task_name": "Internal Mobility and Career Pathing Framework",
        "target_outcome": "Transparent career path documentation with skill requirements per level that employees can use to plan their own development",
        "notes": "Pass 1 maps role families, defines levels, and establishes the competency model structure. Pass 2 tests for paths that dead-end, addresses lateral move compensation questions, and validates against actual promotion data. Pass 3 creates the self-assessment worksheet, development conversation guide, and internal job posting integration process."
    },
]
