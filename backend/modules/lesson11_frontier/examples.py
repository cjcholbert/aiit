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
            "Good at identifying common risk categories",
            "Structures risk registers well with probability and impact columns",
            "Generates mitigation strategies for generic risks"
        ],
        "weaknesses": [
            "Misses organization-specific risks tied to internal politics or history",
            "Over-generalizes probability estimates without real data",
            "Cannot account for relationships between team members that affect risk"
        ],
        "verification_needs": "Cross-reference with team leads who know the history. Validate probability estimates against actual project data. Add organization-specific risks manually."
    },
    {
        "category": "Marketing",
        "name": "Brand Voice Content Generation",
        "zone_category": "writing",
        "reliability": "reliable",
        "confidence": 80,
        "strengths": [
            "Maintains consistent tone once given 3-4 brand voice examples",
            "Adapts content style across different channels (social, email, web)",
            "Generates multiple variations quickly for A/B testing"
        ],
        "weaknesses": [
            "Can drift from brand voice in longer pieces over 1000 words",
            "May not catch cultural nuances or regional sensitivities",
            "Struggles with humor that relies on company inside knowledge"
        ],
        "verification_needs": "Review longer pieces paragraph by paragraph for voice drift. Have someone from the target audience read for cultural appropriateness. Check that all claims align with approved brand messaging."
    },
    {
        "category": "Human Resources",
        "name": "Employment Law Guidance",
        "zone_category": "analysis",
        "reliability": "unreliable",
        "confidence": 30,
        "strengths": [
            "Provides general frameworks for thinking about HR compliance",
            "Good at structuring compliance checklists as a starting point",
            "Can explain common legal concepts in plain language"
        ],
        "weaknesses": [
            "May cite outdated regulations or incorrect effective dates",
            "Misses jurisdiction-specific requirements that vary by state or country",
            "Cannot replace legal counsel — may present incorrect information confidently"
        ],
        "verification_needs": "ALWAYS verify with employment attorney before acting on any guidance. Check all cited regulations against current government sources. Never use AI output as the sole basis for compliance decisions."
    },
    {
        "category": "Finance",
        "name": "Financial Trend Analysis Narratives",
        "zone_category": "analysis",
        "reliability": "mixed",
        "confidence": 50,
        "strengths": [
            "Structures financial narratives clearly with logical flow",
            "Identifies obvious trends when given clean data",
            "Good at explaining what numbers mean for a non-financial audience"
        ],
        "weaknesses": [
            "May attribute causation incorrectly (correlation is not causation)",
            "Struggles with industry-specific context that drives financial performance",
            "Cannot know about one-time events, settlements, or unusual items without being told"
        ],
        "verification_needs": "Verify every causal claim against actual business knowledge. Check that all trend descriptions match the underlying data. Add context for unusual line items that AI cannot know about."
    },
    {
        "category": "Education",
        "name": "Assessment Question Generation",
        "zone_category": "creative",
        "reliability": "reliable",
        "confidence": 75,
        "strengths": [
            "Generates varied question types (multiple choice, short answer, scenario-based)",
            "Aligns questions with Bloom's taxonomy levels when instructed",
            "Creates plausible distractors for multiple choice questions"
        ],
        "weaknesses": [
            "May produce ambiguous answer choices that have more than one correct interpretation",
            "Struggles with highly specialized or niche subject areas",
            "Can generate questions that are culturally biased without realizing it"
        ],
        "verification_needs": "Have a subject matter expert review for accuracy. Test questions with a small group before wide use. Check for ambiguity in answer choices and cultural assumptions."
    },
    {
        "category": "Operations",
        "name": "Regulatory Compliance Summaries",
        "zone_category": "documentation",
        "reliability": "unreliable",
        "confidence": 35,
        "strengths": [
            "Provides good starting frameworks for compliance documentation",
            "Structures compliance matrices well with clear categories",
            "Can explain regulatory concepts in accessible language"
        ],
        "weaknesses": [
            "May miss recent regulatory changes or amendments",
            "Struggles with industry-specific requirements (HIPAA, SOX, FDA, etc.)",
            "Cannot verify whether your organization's current practices actually meet requirements"
        ],
        "verification_needs": "ALWAYS verify against current regulatory sources. Consult with compliance officers or legal counsel. Cross-reference with industry-specific guidance documents. Never rely solely on AI for compliance decisions."
    },
]

EXAMPLE_ENCOUNTERS = [
    {
        "category": "Project Management",
        "encounter_type": "success",
        "task_description": "Used AI to draft a risk register for a facilities relocation project, asking it to identify potential risks across timeline, budget, operations, and personnel categories.",
        "outcome": "AI identified 12 risk categories with probability and impact ratings. 10 were directly relevant and useful. 2 were too generic (e.g., 'unforeseen circumstances') but were easily refined into specific risks with one follow-up prompt.",
        "expected_result": "Expected to need significant manual rework, but the output was a strong starting point",
        "lessons": "AI is effective for generating comprehensive risk checklists when given a specific project type. The generic risks it produces serve as useful reminders of categories you might overlook. Best used as a brainstorming accelerator, not a final product.",
        "tags": ["risk-management", "project-planning", "brainstorming"]
    },
    {
        "category": "Marketing",
        "encounter_type": "surprise",
        "task_description": "Asked AI to adapt a formal B2B email campaign into a casual B2C tone for a consumer product launch. Provided the original emails and the target audience profile.",
        "outcome": "AI not only shifted the tone effectively but restructured the email flow to match B2C buying patterns — shorter emails, more emotional hooks, clearer CTAs. The output was better than expected and required minimal editing.",
        "expected_result": "Expected mediocre results that would need heavy rewriting, since tone adaptation is subjective",
        "lessons": "AI can handle tone shifts surprisingly well when given clear examples of both the source and target voice. Providing audience profile details (not just 'make it casual') produces dramatically better results.",
        "tags": ["content-adaptation", "email-marketing", "tone-shift"]
    },
    {
        "category": "Human Resources",
        "encounter_type": "failure",
        "task_description": "Asked AI to summarize new state leave law requirements that took effect recently, including eligible employees, accrual rates, and employer obligations.",
        "outcome": "AI confidently provided a detailed summary with specific dates, accrual rates, and exemptions. However, the effective dates were wrong by 6 months, two key exemptions were missing entirely, and the accrual rate cited was from a draft version of the law, not the final enacted version.",
        "expected_result": "Expected a reliable summary of publicly available law that could be used for an internal compliance memo",
        "lessons": "AI is unreliable for current legal and regulatory information. It may present outdated or incorrect details with full confidence. Employment law summaries must ALWAYS be verified against official government sources and reviewed by legal counsel before any action is taken.",
        "tags": ["employment-law", "compliance", "verification-critical"]
    },
    {
        "category": "Finance",
        "encounter_type": "failure",
        "task_description": "Asked AI to explain a significant revenue spike in Q3 compared to Q2, providing it with quarterly revenue figures for the past two years.",
        "outcome": "AI attributed the spike to 'seasonal demand patterns and market recovery' with a confident, detailed narrative about consumer spending trends. The actual cause was a one-time contract settlement of a large outstanding receivable — something AI could not possibly know from the numbers alone.",
        "expected_result": "Expected AI to at least flag that it could not determine causation from numbers alone",
        "lessons": "AI cannot know the business context behind financial data. It will confidently fill in causal explanations that sound plausible but are fabricated. When using AI for financial narratives, always provide the 'why' behind significant variances — do not expect AI to infer it from numbers.",
        "tags": ["financial-analysis", "causation-error", "context-required"]
    },
    {
        "category": "Education",
        "encounter_type": "success",
        "task_description": "Used AI to generate 20 discussion prompts for a half-day leadership workshop aimed at mid-level managers. Provided the workshop learning objectives and the participant profile.",
        "outcome": "AI generated 20 discussion prompts across four leadership themes. 17 were directly usable — well-framed, open-ended, and appropriately challenging for the audience. 3 needed minor rewording to avoid jargon that would not resonate with non-academic participants.",
        "expected_result": "Expected about half to be usable, with the rest requiring significant rework",
        "lessons": "AI excels at generating discussion prompts when given clear learning objectives and audience context. The key is specifying the participant level and what 'good discussion' looks like for that group. Generating more than needed and curating the best ones is a highly efficient workflow.",
        "tags": ["workshop-design", "discussion-prompts", "content-generation"]
    },
    {
        "category": "Operations",
        "encounter_type": "surprise",
        "task_description": "Asked AI to draft a vendor termination notice for a service provider whose contract was ending. Provided the vendor name, contract end date, and reason for non-renewal.",
        "outcome": "AI produced a professional termination notice that included contractual considerations the user had not thought to include — 30-day notice period requirement, data return obligations, transition support expectations, and a request to confirm destruction of confidential information. These were standard contractual provisions that saved research time.",
        "expected_result": "Expected a generic, fill-in-the-blank template that would need heavy customization",
        "lessons": "AI is surprisingly good at drafting business correspondence that includes standard contractual and professional considerations. It draws from patterns across many contracts and notices. However, always verify that the provisions it includes actually match your specific contract terms.",
        "tags": ["vendor-management", "business-correspondence", "contract-terms"]
    },
]
