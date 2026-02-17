"""Lesson 5: Trust Matrix - Example output types for professional categories."""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_OUTPUT_TYPES = [
    {
        "category": "Project Management",
        "name": "Meeting Agenda Generation",
        "output_category": "Document Drafting",
        "trust_level": "high",
        "reasoning": (
            "AI excels at structuring meeting agendas from rough notes and "
            "bullet points. The task is well-defined, low-risk, and follows "
            "predictable formatting patterns. Errors are easy to spot and "
            "unlikely to cause downstream problems."
        ),
        "verification_approach": (
            "Review the generated agenda to confirm all discussion topics "
            "from the source notes are included, time allocations are "
            "reasonable, and the order of items follows a logical flow. "
            "Quick scan is usually sufficient."
        ),
        "examples": [
            "Weekly team stand-up agenda generated from Slack thread summaries",
            "Quarterly planning meeting agenda built from department goal documents",
            "Client kickoff agenda structured from project brief and stakeholder list",
        ],
    },
    {
        "category": "Marketing",
        "name": "Social Media Post Drafts",
        "output_category": "Content Creation",
        "trust_level": "medium",
        "reasoning": (
            "AI can produce well-structured social media copy that captures "
            "general tone and messaging, but it often misses subtle brand "
            "voice nuances, cultural context, or audience-specific humor. "
            "Posts may sound generic without human refinement."
        ),
        "verification_approach": (
            "Compare each draft against brand voice guidelines and recent "
            "high-performing posts. Check that hashtags are current, claims "
            "are accurate, and the call-to-action aligns with campaign goals. "
            "Have a team member familiar with the audience review before posting."
        ),
        "examples": [
            "LinkedIn announcement posts for a new service offering",
            "Instagram caption series for a product launch campaign",
            "Facebook event promotion posts for an upcoming webinar",
        ],
    },
    {
        "category": "Human Resources",
        "name": "Job Description Writing",
        "output_category": "Compliance-Sensitive Documents",
        "trust_level": "medium",
        "reasoning": (
            "AI generates well-organized job descriptions with clear sections "
            "and professional language, but it may inadvertently include biased "
            "or exclusionary phrasing, miss legally required disclosures, or "
            "list qualifications that do not reflect actual job requirements. "
            "These documents have legal and diversity implications."
        ),
        "verification_approach": (
            "Run the description through a bias-detection review, verify all "
            "listed qualifications are genuinely required for the role, confirm "
            "equal opportunity and accommodation language is included, and have "
            "legal or compliance review before publishing externally."
        ),
        "examples": [
            "Senior account manager job posting for external job boards",
            "Internal promotion posting for a team lead position",
            "Part-time administrative assistant listing with specific scheduling needs",
        ],
    },
    {
        "category": "Finance",
        "name": "Financial Forecast Narratives",
        "output_category": "Analytical Commentary",
        "trust_level": "low",
        "reasoning": (
            "AI can structure a narrative around financial data, but it cannot "
            "verify the accuracy of underlying numbers, understand the business "
            "context behind trends, or account for non-obvious factors like "
            "pending contracts or seasonal adjustments. Presenting AI-generated "
            "financial commentary as authoritative is risky."
        ),
        "verification_approach": (
            "Cross-check every number cited in the narrative against source "
            "spreadsheets and accounting systems. Verify that trend explanations "
            "reflect actual business drivers, not AI speculation. Have the "
            "finance team review all variance explanations and forward-looking "
            "statements before distribution."
        ),
        "examples": [
            "Quarterly revenue forecast narrative for the board presentation",
            "Monthly budget variance explanation report for department heads",
            "Annual financial summary narrative for the company all-hands meeting",
        ],
    },
    {
        "category": "Education",
        "name": "Quiz Question Generation",
        "output_category": "Assessment Content",
        "trust_level": "medium",
        "reasoning": (
            "AI generates quiz questions efficiently and can cover a wide range "
            "of topics, but it sometimes produces ambiguous answer choices, "
            "marks incorrect answers as correct, or creates questions that test "
            "memorization rather than understanding. Subject matter expert "
            "review is essential before use."
        ),
        "verification_approach": (
            "Have a subject matter expert verify each question for factual "
            "accuracy, confirm the marked correct answer is truly correct, "
            "check that distractor options are plausible but clearly wrong, "
            "and ensure questions align with stated learning objectives."
        ),
        "examples": [
            "End-of-module quiz for a workplace safety training course",
            "Knowledge check questions for a new employee orientation program",
            "Practice assessment for a professional certification prep workshop",
        ],
    },
    {
        "category": "Operations",
        "name": "Standard Operating Procedure Drafts",
        "output_category": "Process Documentation",
        "trust_level": "medium",
        "reasoning": (
            "AI captures process flow and organizes steps clearly, but it may "
            "omit critical safety precautions, skip compliance-required steps, "
            "or miss institution-specific procedures that are not documented in "
            "the source material. Operational procedures carry real-world "
            "consequences if steps are missing or incorrect."
        ),
        "verification_approach": (
            "Walk through the procedure step-by-step with someone who performs "
            "the process regularly. Verify all safety and compliance steps are "
            "present, confirm tool and system references are accurate, and "
            "check that exception handling covers known edge cases. Get sign-off "
            "from the process owner before publishing."
        ),
        "examples": [
            "Warehouse receiving and inventory check-in procedure",
            "Customer complaint escalation and resolution workflow",
            "Monthly office supply ordering and vendor payment process",
        ],
    },
]
