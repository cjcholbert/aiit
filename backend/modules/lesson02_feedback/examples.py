"""Lesson 2: Feedback Analyzer - Example feedback by professional category.

Six categorized feedback examples showing the spectrum from vague to specific.
Students can load these to practice analyzing and rewriting feedback.
"""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_FEEDBACK = [
    {
        "category": "Project Management",
        "title": "Vague feedback on a project status report",
        "original_feedback": (
            "This doesn't capture the real situation. The report makes it sound "
            "like everything is fine but our team knows it's not. Can you fix it "
            "so it reflects what's actually happening?"
        ),
        "context": (
            "AI generated a weekly project status report for a facilities "
            "renovation project. The report showed all tasks as 'on track' based "
            "on the timeline data provided, but the project manager knows that "
            "the contractor has verbally warned about a two-week delay on the "
            "electrical work, and the permit approval is still pending."
        ),
        "feedback_category": "writing",
    },
    {
        "category": "Marketing",
        "title": "Specific feedback on email campaign copy",
        "original_feedback": (
            "The subject line uses passive voice. Change 'Your Q3 strategy could "
            "be unlocked' to the imperative 'Unlock your Q3 strategy now.' In the "
            "body, the second paragraph repeats the value proposition from the "
            "first paragraph almost word for word. Replace the second paragraph "
            "with a single customer proof point: 'Greenfield Corp reduced their "
            "planning cycle by 40 percent in one quarter.' Also, the call-to-action "
            "button says 'Learn More' which is generic. Change it to 'See the "
            "case study' to match the proof point and give readers a specific "
            "reason to click."
        ),
        "context": (
            "AI drafted a promotional email for a business consulting firm's "
            "quarterly strategy workshop. The email targets mid-market CFOs and "
            "COOs. The firm's brand voice is direct, confident, and data-driven."
        ),
        "feedback_category": "writing",
    },
    {
        "category": "Human Resources",
        "title": "Vague feedback on a job description",
        "original_feedback": (
            "This doesn't sound like us. It's too formal and corporate. Can you "
            "make it better? It needs to attract the right kind of people."
        ),
        "context": (
            "AI drafted a job description for an Office Coordinator position at "
            "a 50-person creative agency. The agency has a casual culture, uses "
            "first names with everyone including the CEO, and values personality "
            "in their communications. The AI produced a traditional job "
            "description with formal language like 'The ideal candidate will "
            "possess strong organizational acumen.'"
        ),
        "feedback_category": "writing",
    },
    {
        "category": "Finance",
        "title": "Specific feedback on a variance analysis",
        "original_feedback": (
            "The revenue variance explanation attributes the shortfall to "
            "'market conditions' but our CRM data shows we lost three named "
            "accounts worth $2.1M total: Riverside Medical ($900K), Lakewood "
            "Partners ($750K), and Summit Holdings ($450K). Replace the 'market "
            "conditions' language with these specific account losses and add that "
            "two of the three cited pricing as the reason for leaving. Also, the "
            "expense section shows travel at 15 percent over budget but does not "
            "mention that $40K of that was the unplanned investor roadshow in "
            "September, which was a one-time cost. Add that context so the board "
            "does not assume travel spending is structurally over budget."
        ),
        "context": (
            "AI generated a quarterly budget variance report for the CFO to "
            "present to the board of directors. The report covered Q3 actuals "
            "versus plan across revenue, COGS, and operating expenses."
        ),
        "feedback_category": "analysis",
    },
    {
        "category": "Education",
        "title": "Vague feedback on a training outline",
        "original_feedback": (
            "Needs more engagement. The participants are going to zone out after "
            "the first 20 minutes if we keep it like this. Make it more "
            "interactive and hands-on."
        ),
        "context": (
            "AI created a three-hour new employee orientation outline covering "
            "company history, benefits enrollment, safety procedures, and team "
            "introductions. The outline was structured as four consecutive lecture "
            "blocks with a single Q&A at the end."
        ),
        "feedback_category": "design",
    },
    {
        "category": "Operations",
        "title": "Specific feedback on a process document",
        "original_feedback": (
            "Step 4 says 'notify the team' but does not specify which channel "
            "or the timeframe. Change it to 'Post a message in the #ops-alerts "
            "Slack channel within 15 minutes of discovering the issue, tagging "
            "@ops-leads.' Also, Step 7 says 'escalate if unresolved' but the "
            "escalation path is missing. Add: 'If the issue is not resolved "
            "within 2 hours, email the Regional Operations Director with the "
            "incident number, a summary of actions taken, and the current status.' "
            "Without these specifics, the night shift staff will not know what "
            "to do when a problem occurs outside business hours."
        ),
        "context": (
            "AI drafted a standard operating procedure for handling equipment "
            "malfunctions at a distribution center. The procedure is meant to be "
            "followed by warehouse staff on all three shifts, including the night "
            "shift when no managers are on-site."
        ),
        "feedback_category": "documentation",
    },
]
