"""Lesson 11: Frontier Mapper - Example zones and encounters by professional category.

One zone and one encounter per category showing how frontier mapping
applies across different professional domains.
"""

EXAMPLE_CATEGORIES = ["Project Management", "Marketing", "Human Resources", "Finance", "Education", "Operations"]

EXAMPLE_ZONES = [
    {
        "category": "Project Management",
        "name": "Risk Assessment Generation",
        "zone_category": "planning",
        "reliability": "mixed",
        "confidence": 55,
        "strengths": [
            "Identifies common risk categories across timeline, budget, and personnel",
            "Structures risk registers clearly with probability and impact ratings",
            "Generates mitigation strategies for standard project risks"
        ],
        "weaknesses": [
            "Misses organization-specific risks tied to internal politics or team history",
            "Over-generalizes probability estimates without actual project data",
            "Cannot account for interpersonal dynamics that affect project risk"
        ],
        "verification_needs": "Cross-reference with team leads who know the project history. Validate probability estimates against past project outcomes. Add organization-specific risks manually."
    },
    {
        "category": "Marketing",
        "name": "Campaign Messaging Drafts",
        "zone_category": "writing",
        "reliability": "reliable",
        "confidence": 75,
        "strengths": [
            "Maintains consistent tone when given 3-4 examples of your brand voice",
            "Adapts messaging style across different audiences and channels",
            "Generates multiple variations quickly for comparison"
        ],
        "weaknesses": [
            "Can drift from brand voice in longer pieces over 500 words",
            "May miss cultural nuances or regional sensitivities in messaging",
            "Struggles with humor that relies on company culture or inside references"
        ],
        "verification_needs": "Review longer pieces paragraph by paragraph for voice drift. Have someone from the target audience read for cultural appropriateness. Confirm all claims align with approved messaging guidelines."
    },
    {
        "category": "Human Resources",
        "name": "Policy Language Guidance",
        "zone_category": "documentation",
        "reliability": "unreliable",
        "confidence": 30,
        "strengths": [
            "Provides general frameworks for thinking about HR policy structure",
            "Structures policy checklists well as a starting point",
            "Explains common workplace regulations in plain language"
        ],
        "weaknesses": [
            "May reference outdated regulations or incorrect effective dates",
            "Misses jurisdiction-specific requirements that vary by state or locality",
            "Presents incorrect information confidently — cannot replace legal counsel"
        ],
        "verification_needs": "ALWAYS verify with employment attorney before acting on any guidance. Check all cited regulations against current government sources. Never use AI output as the sole basis for policy or compliance decisions."
    },
    {
        "category": "Finance",
        "name": "Budget Variance Narratives",
        "zone_category": "analysis",
        "reliability": "mixed",
        "confidence": 50,
        "strengths": [
            "Structures financial narratives clearly with logical flow",
            "Identifies obvious trends when given clean data",
            "Explains what numbers mean for a non-financial audience"
        ],
        "weaknesses": [
            "May attribute causation incorrectly — confuses correlation with cause",
            "Cannot know business context that drives financial performance",
            "Misses one-time events, settlements, or unusual items unless told"
        ],
        "verification_needs": "Verify every causal claim against actual business knowledge. Confirm all trend descriptions match the underlying data. Add context for unusual line items that AI cannot know about."
    },
    {
        "category": "Education",
        "name": "Discussion Prompt Generation",
        "zone_category": "creative",
        "reliability": "reliable",
        "confidence": 75,
        "strengths": [
            "Generates varied question types — open-ended, scenario-based, reflective",
            "Aligns prompts with learning objectives when clearly stated",
            "Creates appropriately challenging questions for a specified audience level"
        ],
        "weaknesses": [
            "May produce questions with ambiguous wording or multiple valid interpretations",
            "Struggles with highly specialized or niche subject areas",
            "Can generate prompts that assume cultural context not shared by all participants"
        ],
        "verification_needs": "Have a subject matter expert review for accuracy and relevance. Test prompts with a small group before wide use. Check for ambiguity and cultural assumptions."
    },
    {
        "category": "Operations",
        "name": "Vendor Correspondence Drafts",
        "zone_category": "communication",
        "reliability": "mixed",
        "confidence": 60,
        "strengths": [
            "Drafts professional correspondence with appropriate business tone",
            "Includes standard contractual considerations you might overlook",
            "Structures notices and requests clearly with proper formatting"
        ],
        "weaknesses": [
            "May include provisions that do not match your specific contract terms",
            "Cannot verify current status of vendor relationships or account history",
            "Misses organization-specific procedures for vendor communication"
        ],
        "verification_needs": "Verify all provisions match your actual contract terms. Confirm the appropriate contact and escalation path. Have procurement or legal review before sending anything with contractual implications."
    },
]

EXAMPLE_ENCOUNTERS = [
    {
        "category": "Project Management",
        "encounter_type": "success",
        "task_description": "Used AI to draft a risk register for a 75-person office relocation, asking it to identify potential risks across timeline, budget, operations, and personnel categories.",
        "outcome": "AI identified 12 risk categories with probability and impact ratings. 10 were directly relevant and useful. 2 were too generic but were easily refined into specific risks with one follow-up prompt providing building details and team structure.",
        "expected_result": "Expected to need significant manual rework, but the output was a strong starting point",
        "lessons": "AI is effective for generating risk checklists when given a specific project type and scope. The generic risks serve as reminders of categories you might overlook. Best used as a brainstorming accelerator, not a final product.",
        "tags": ["risk-management", "project-planning", "brainstorming"]
    },
    {
        "category": "Marketing",
        "encounter_type": "surprise",
        "task_description": "Asked AI to rewrite a formal internal announcement about a new employee wellness program into a friendly, conversational tone for the company newsletter. Provided the original memo and a description of the audience.",
        "outcome": "AI not only shifted the tone effectively but reorganized the content to lead with employee benefits rather than program logistics. The rewrite was more engaging than expected and required only minor edits to match company terminology.",
        "expected_result": "Expected mediocre results that would need heavy rewriting, since tone adaptation is subjective",
        "lessons": "AI handles tone shifts well when given clear examples of both the source and target voice. Providing audience details — not just 'make it friendlier' — produces dramatically better results.",
        "tags": ["content-adaptation", "internal-communications", "tone-shift"]
    },
    {
        "category": "Human Resources",
        "encounter_type": "failure",
        "task_description": "Asked AI to summarize new state paid leave requirements that took effect recently, including eligible employees, accrual rates, and employer obligations for a 300-person organization.",
        "outcome": "AI confidently provided a detailed summary with specific dates, accrual rates, and exemptions. However, the effective dates were wrong by 6 months, two key exemptions were missing entirely, and the accrual rate cited was from a draft version of the law, not the final enacted version.",
        "expected_result": "Expected a reliable summary of publicly available law that could be used for an internal compliance memo",
        "lessons": "AI is unreliable for current legal and regulatory information. It presents outdated or incorrect details with full confidence. Policy summaries must ALWAYS be verified against official government sources and reviewed by legal counsel before any action is taken.",
        "tags": ["workplace-policy", "compliance", "verification-critical"]
    },
    {
        "category": "Finance",
        "encounter_type": "failure",
        "task_description": "Asked AI to explain a significant revenue increase in Q3 compared to Q2, providing quarterly revenue figures for the past two years across three business units.",
        "outcome": "AI attributed the increase to 'seasonal demand patterns and market recovery' with a confident, detailed narrative. The actual cause was a one-time settlement of a large outstanding receivable — something AI could not possibly know from the numbers alone.",
        "expected_result": "Expected AI to at least flag that it could not determine causation from numbers alone",
        "lessons": "AI cannot know the business context behind financial data. It will confidently fill in causal explanations that sound plausible but are fabricated. When using AI for financial narratives, always provide the 'why' behind significant variances — never expect AI to infer it.",
        "tags": ["financial-analysis", "causation-error", "context-required"]
    },
    {
        "category": "Education",
        "encounter_type": "success",
        "task_description": "Used AI to generate 20 discussion prompts for a half-day leadership workshop aimed at 40 mid-level managers. Provided the learning objectives, participant profile, and session format.",
        "outcome": "AI generated 20 prompts across four leadership themes. 17 were directly usable — well-framed, open-ended, and appropriately challenging. 3 needed minor rewording to avoid jargon that would not resonate with the audience.",
        "expected_result": "Expected about half to be usable, with the rest requiring significant rework",
        "lessons": "AI excels at generating discussion prompts when given clear learning objectives and audience context. Specifying the participant level and what a productive discussion looks like for that group is key. Generating more than needed and curating the best ones is an efficient workflow.",
        "tags": ["workshop-design", "discussion-prompts", "content-generation"]
    },
    {
        "category": "Operations",
        "encounter_type": "surprise",
        "task_description": "Asked AI to draft a vendor non-renewal notice for a cleaning services provider whose 2-year contract was ending. Provided the vendor name, contract end date, and reason for non-renewal.",
        "outcome": "AI produced a professional notice that included considerations the user had not thought to include — 30-day notice period, equipment return obligations, key handoff expectations, and a request to confirm destruction of building access credentials. These were standard provisions that saved research time.",
        "expected_result": "Expected a generic template that would need heavy customization",
        "lessons": "AI is surprisingly good at drafting business correspondence that includes standard contractual and professional considerations. However, always verify that the provisions it includes actually match your specific contract terms before sending.",
        "tags": ["vendor-management", "business-correspondence", "contract-terms"]
    },
]
