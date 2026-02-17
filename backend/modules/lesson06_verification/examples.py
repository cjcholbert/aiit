"""Lesson 6: Verification Tools - Example checklists for professional categories."""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_CHECKLISTS = [
    {
        "category": "Project Management",
        "name": "Project Plan Review Checklist",
        "output_type": "AI-Generated Project Plans",
        "description": (
            "Verification checklist for reviewing AI-generated project plans "
            "to ensure completeness, feasibility, and alignment with "
            "organizational standards."
        ),
        "items": [
            {
                "text": "All task dependencies are identified and sequenced correctly",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "Resource assignments checked for conflicts and availability",
                "item_category": "general",
                "is_critical": False,
                "order": 1,
            },
            {
                "text": "Milestones have measurable completion criteria, not vague descriptions",
                "item_category": "common_failure",
                "is_critical": False,
                "order": 2,
            },
            {
                "text": "Timeline accounts for holidays, PTO, and known scheduling constraints",
                "item_category": "edge_case",
                "is_critical": False,
                "order": 3,
            },
            {
                "text": "Stakeholder review gates are included at key decision points",
                "item_category": "domain_specific",
                "is_critical": True,
                "order": 4,
            },
            {
                "text": "Risk mitigation steps defined for critical path tasks",
                "item_category": "critical",
                "is_critical": True,
                "order": 5,
            },
        ],
    },
    {
        "category": "Marketing",
        "name": "Marketing Copy Review Checklist",
        "output_type": "AI-Generated Marketing Content",
        "description": (
            "Verification checklist for reviewing AI-generated marketing copy "
            "to ensure brand consistency, accuracy, and regulatory compliance."
        ),
        "items": [
            {
                "text": "Brand voice and tone are consistent with style guidelines",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "All claims are verifiable and not misleading to the audience",
                "item_category": "critical",
                "is_critical": True,
                "order": 1,
            },
            {
                "text": "Call-to-action is clear, specific, and actionable",
                "item_category": "general",
                "is_critical": False,
                "order": 2,
            },
            {
                "text": "Language is appropriate for the target audience and channel",
                "item_category": "common_failure",
                "is_critical": False,
                "order": 3,
            },
            {
                "text": "No competitor trademarks or copyrighted phrases used",
                "item_category": "domain_specific",
                "is_critical": True,
                "order": 4,
            },
            {
                "text": "Content complies with applicable advertising standards and regulations",
                "item_category": "critical",
                "is_critical": True,
                "order": 5,
            },
        ],
    },
    {
        "category": "Human Resources",
        "name": "HR Document Review Checklist",
        "output_type": "AI-Generated HR Documents",
        "description": (
            "Verification checklist for reviewing AI-generated HR documents "
            "such as policies, job postings, and employee communications to "
            "ensure legal compliance and inclusivity."
        ),
        "items": [
            {
                "text": "Language is legally compliant with employment laws and regulations",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "No discriminatory or exclusionary phrasing detected",
                "item_category": "critical",
                "is_critical": True,
                "order": 1,
            },
            {
                "text": "Document is consistent with existing company policies and handbook",
                "item_category": "general",
                "is_critical": False,
                "order": 2,
            },
            {
                "text": "Salary ranges, benefits, and compensation details are accurate and current",
                "item_category": "common_failure",
                "is_critical": True,
                "order": 3,
            },
            {
                "text": "ADA and accessibility considerations are addressed where applicable",
                "item_category": "domain_specific",
                "is_critical": False,
                "order": 4,
            },
            {
                "text": "Document flagged for legal review if it involves binding terms or policy changes",
                "item_category": "edge_case",
                "is_critical": True,
                "order": 5,
            },
        ],
    },
    {
        "category": "Finance",
        "name": "Financial Report Accuracy Checklist",
        "output_type": "AI-Generated Financial Content",
        "description": (
            "Verification checklist for reviewing AI-generated financial "
            "reports, summaries, and analyses to ensure numerical accuracy "
            "and compliance with reporting standards."
        ),
        "items": [
            {
                "text": "All numbers match the original source data and spreadsheets",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "Calculations verified independently, not just accepted from AI output",
                "item_category": "critical",
                "is_critical": True,
                "order": 1,
            },
            {
                "text": "Correct reporting period is referenced throughout the document",
                "item_category": "common_failure",
                "is_critical": False,
                "order": 2,
            },
            {
                "text": "Variance explanations are factual and based on known business drivers, not AI speculation",
                "item_category": "critical",
                "is_critical": True,
                "order": 3,
            },
            {
                "text": "Report complies with applicable accounting and reporting standards",
                "item_category": "domain_specific",
                "is_critical": True,
                "order": 4,
            },
            {
                "text": "Rounding methodology is consistent across all tables and summaries",
                "item_category": "edge_case",
                "is_critical": False,
                "order": 5,
            },
        ],
    },
    {
        "category": "Education",
        "name": "Training Material Review Checklist",
        "output_type": "AI-Generated Educational Content",
        "description": (
            "Verification checklist for reviewing AI-generated training "
            "materials, course content, and assessments to ensure pedagogical "
            "soundness and accuracy."
        ),
        "items": [
            {
                "text": "Learning objectives are specific, measurable, and achievable",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "Content is appropriate for the target audience's experience level",
                "item_category": "general",
                "is_critical": False,
                "order": 1,
            },
            {
                "text": "Assessments directly align with and measure the stated learning objectives",
                "item_category": "critical",
                "is_critical": True,
                "order": 2,
            },
            {
                "text": "No factual errors in subject matter content or reference materials",
                "item_category": "critical",
                "is_critical": True,
                "order": 3,
            },
            {
                "text": "Materials meet accessibility standards for all participants",
                "item_category": "domain_specific",
                "is_critical": False,
                "order": 4,
            },
            {
                "text": "Estimated timing is realistic for the volume of content and activities",
                "item_category": "common_failure",
                "is_critical": False,
                "order": 5,
            },
        ],
    },
    {
        "category": "Operations",
        "name": "Process Document Verification Checklist",
        "output_type": "AI-Generated Procedures",
        "description": (
            "Verification checklist for reviewing AI-generated standard "
            "operating procedures and process documents to ensure accuracy, "
            "safety, and operational feasibility."
        ),
        "items": [
            {
                "text": "All steps are in the correct sequence with no missing intermediate steps",
                "item_category": "critical",
                "is_critical": True,
                "order": 0,
            },
            {
                "text": "Safety precautions and compliance requirements are explicitly included",
                "item_category": "critical",
                "is_critical": True,
                "order": 1,
            },
            {
                "text": "Role assignments and responsibilities are clearly defined for each step",
                "item_category": "general",
                "is_critical": False,
                "order": 2,
            },
            {
                "text": "Exception handling and escalation paths are documented for common failure scenarios",
                "item_category": "edge_case",
                "is_critical": False,
                "order": 3,
            },
            {
                "text": "Referenced tools, systems, and forms are current and accessible to staff",
                "item_category": "common_failure",
                "is_critical": False,
                "order": 4,
            },
            {
                "text": "Procedure has been reviewed and approved by the process owner",
                "item_category": "domain_specific",
                "is_critical": True,
                "order": 5,
            },
        ],
    },
]
