"""Lesson 1: Context Tracker - Example conversations organized by category.

Each example demonstrates a specific context assembly pattern (or anti-pattern)
that the analyzer can detect and coach on. These serve as learning material
for users who want to see what good and bad context assembly looks like
before analyzing their own conversations.
"""

EXAMPLE_CATEGORIES = ["Tech", "Managerial", "Admin", "Education", "Marketing", "Human Resources"]

EXAMPLE_CONVERSATIONS = [
    # =========================================================================
    # TECH (Software Development, IT Infrastructure, Debugging, Code Review)
    # =========================================================================
    {
        "category": "Tech",
        "title": "Debugging without specifying the language",
        "raw_transcript": (
            "User: My function keeps returning None instead of the expected value. "
            "Can you help me figure out why?\n"
            "Assistant: I'd be happy to help! Could you share the function code? "
            "Also, what programming language are you using, and what value do you "
            "expect it to return?\n"
            "User: Oh right, it's Python. Here's the function:\n\n"
            "def get_total(items):\n"
            "    total = 0\n"
            "    for item in items:\n"
            "        total += item['price']\n\n"
            "It should return the sum of all prices.\n"
            "Assistant: I see the issue. Your function calculates the total but "
            "never returns it. You're missing a return statement at the end. "
            "Add `return total` after the loop. In Python, functions without an "
            "explicit return statement return None by default."
        ),
        "description": (
            "The user omits the programming language and the actual code in "
            "their first message. The assistant has to ask for both before it "
            "can help. Demonstrates the 'Progressive Discovery' pattern where "
            "essential context trickles in over multiple turns."
        ),
    },
    {
        "category": "Tech",
        "title": "Wrong assumption about framework version",
        "raw_transcript": (
            "User: I'm trying to set up authentication in my React app. "
            "I added a useHistory hook but I'm getting an error that says "
            "useHistory is not a function.\n"
            "Assistant: That error typically happens when React Router isn't "
            "installed or imported correctly. Make sure you have "
            "react-router-dom installed and import it like this:\n\n"
            "import { useHistory } from 'react-router-dom';\n\n"
            "Then use it inside your component: const history = useHistory();\n"
            "User: I already have that import. I'm using React Router v6, "
            "which I probably should have mentioned.\n"
            "Assistant: That explains it. React Router v6 removed useHistory "
            "entirely and replaced it with useNavigate. You need to change "
            "your code to:\n\n"
            "import { useNavigate } from 'react-router-dom';\n"
            "const navigate = useNavigate();\n\n"
            "Then instead of history.push('/dashboard'), use "
            "navigate('/dashboard'). The v6 migration was a significant "
            "breaking change that caught a lot of developers off guard."
        ),
        "description": (
            "The assistant assumes an older version of React Router and gives "
            "advice that doesn't apply. The user has to correct the assumption "
            "by specifying the version. Classic 'Reactive Correction' pattern "
            "where missing version info leads to wrong guidance."
        ),
    },
    {
        "category": "Tech",
        "title": "Server error without environment details",
        "raw_transcript": (
            "User: My API is returning 500 errors intermittently. It works "
            "fine sometimes and then just breaks. Can you help?\n"
            "Assistant: Intermittent 500 errors could be caused by several "
            "things: memory issues, database connection pool exhaustion, "
            "race conditions, or external service timeouts. Could you share:\n"
            "1. What framework and language your API uses\n"
            "2. Where it's deployed (cloud, local, container)\n"
            "3. Any relevant error logs\n"
            "4. Does it happen under specific load conditions?\n"
            "User: It's a Node.js Express API deployed on a single EC2 t2.micro "
            "instance. Here's the error from CloudWatch: "
            "'FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript "
            "heap out of memory'. It seems to happen mostly during business hours.\n"
            "Assistant: The error message tells the whole story. Your t2.micro "
            "instance has only 1 GB of memory, and your Node.js process is "
            "running out of heap space during peak traffic. You have a few options:\n\n"
            "1. Upgrade to a larger instance (t3.small or t3.medium)\n"
            "2. Set Node's max heap size: --max-old-space-size=512\n"
            "3. Investigate memory leaks using --inspect and Chrome DevTools\n"
            "4. Add a process manager like PM2 with auto-restart on crash\n\n"
            "Since it correlates with business hours, the immediate fix is "
            "upgrading the instance, but you should also profile for leaks."
        ),
        "description": (
            "User reports a vague server error without any environment context. "
            "The assistant correctly asks for critical details before guessing. "
            "Once the environment info and logs are provided, the root cause "
            "is immediately clear. Shows how missing deployment context wastes "
            "an entire turn."
        ),
    },
    {
        "category": "Tech",
        "title": "Well-structured code review request",
        "raw_transcript": (
            "User: I need a code review for a Python database connection module. "
            "Context: This is for a FastAPI service running in Docker, connecting "
            "to PostgreSQL via asyncpg. We use SQLAlchemy 2.0 async sessions. "
            "The module handles connection pooling and retry logic. Our main "
            "concern is whether the pool configuration is appropriate for ~200 "
            "concurrent users. Here's the code:\n\n"
            "engine = create_async_engine(\n"
            "    DATABASE_URL,\n"
            "    pool_size=5,\n"
            "    max_overflow=10,\n"
            "    pool_timeout=30,\n"
            "    pool_recycle=1800\n"
            ")\n\n"
            "Assistant: Good setup overall. For 200 concurrent users, your pool "
            "configuration needs adjustment:\n\n"
            "1. pool_size=5 is too low. With 200 concurrent users, even with "
            "fast queries, you'll hit pool exhaustion. Recommend pool_size=20 "
            "as a starting point.\n"
            "2. max_overflow=10 means your absolute max is 15 connections. "
            "Bump to max_overflow=20 for a total ceiling of 40.\n"
            "3. pool_timeout=30 is reasonable but consider adding "
            "pool_pre_ping=True to handle stale connections after the "
            "1800-second recycle.\n"
            "4. Make sure your PostgreSQL max_connections is set higher than "
            "your total pool ceiling across all service replicas.\n\n"
            "The retry logic and async session pattern look solid for "
            "the FastAPI + asyncpg stack."
        ),
        "description": (
            "A well-structured request that provides technology stack, deployment "
            "context, the specific concern (pool sizing for 200 users), and the "
            "relevant code. The assistant can give targeted, actionable advice "
            "in a single turn. This is the 'Well-Structured' pattern to aspire to."
        ),
    },
    {
        "category": "Tech",
        "title": "CI/CD pipeline failure with missing config context",
        "raw_transcript": (
            "User: My CI pipeline keeps failing on the test step. The tests "
            "pass locally but fail in CI. What could be wrong?\n"
            "Assistant: There are many reasons tests pass locally but fail in CI. "
            "Common causes include:\n"
            "- Environment variable differences\n"
            "- Different OS (macOS locally vs. Linux in CI)\n"
            "- Missing system dependencies\n"
            "- Database or service dependencies not available\n"
            "- Different Python/Node versions\n\n"
            "Could you share your CI configuration file and the specific "
            "test failure output?\n"
            "User: We use GitHub Actions. The error is "
            "'django.db.utils.OperationalError: could not connect to server: "
            "Connection refused'. We use PostgreSQL and it works fine locally "
            "because I have Postgres running.\n"
            "Assistant: Your CI environment doesn't have a PostgreSQL "
            "service running. In GitHub Actions, you need to add a service "
            "container for Postgres in your workflow file. Add this to your "
            "job definition:\n\n"
            "services:\n"
            "  postgres:\n"
            "    image: postgres:15\n"
            "    env:\n"
            "      POSTGRES_PASSWORD: postgres\n"
            "      POSTGRES_DB: test_db\n"
            "    ports:\n"
            "      - 5432:5432\n"
            "    options: >-\n"
            "      --health-cmd pg_isready\n"
            "      --health-interval 10s\n"
            "      --health-timeout 5s\n"
            "      --health-retries 5\n\n"
            "Then set your DATABASE_URL env var in the test step to point to "
            "localhost:5432. The key insight: your local environment has "
            "implicit dependencies that CI doesn't know about."
        ),
        "description": (
            "User doesn't mention the CI platform, the test framework, or the "
            "error message initially. The 'Assumption Cascade' almost starts "
            "when the assistant lists generic possibilities, but the user "
            "provides the error on the second turn, revealing the actual issue "
            "is a missing service dependency in CI."
        ),
    },
    {
        "category": "Tech",
        "title": "Docker networking issue across compose services",
        "raw_transcript": (
            "User: My app can't connect to the database. I keep getting "
            "connection refused errors.\n"
            "Assistant: Let me help troubleshoot. What type of database are you "
            "using, and how are both the app and database running? Are they on "
            "the same machine, in Docker containers, or deployed separately?\n"
            "User: Both are in Docker. The database is MySQL and the app is a "
            "Spring Boot service. I'm connecting to localhost:3306 in my "
            "application.properties.\n"
            "Assistant: That's the problem. In Docker, each container has its "
            "own network namespace, so 'localhost' inside your app container "
            "refers to the app container itself, not the MySQL container. "
            "If you're using Docker Compose, replace 'localhost' with the "
            "service name of your MySQL container. For example, if your "
            "docker-compose.yml defines the database service as 'db', your "
            "connection string should be:\n\n"
            "spring.datasource.url=jdbc:mysql://db:3306/mydb\n\n"
            "Docker Compose creates a shared network where services can reach "
            "each other by service name."
        ),
        "description": (
            "User omits the critical detail that both services are in Docker, "
            "which completely changes the debugging approach. The use of "
            "'localhost' in a containerized environment is a classic gotcha. "
            "Shows 'Progressive Discovery' where each turn reveals more about "
            "the actual architecture."
        ),
    },

    # =========================================================================
    # MANAGERIAL (Team Leadership, Project Management, Decision-Making, Strategy)
    # =========================================================================
    {
        "category": "Managerial",
        "title": "Reorganization plan without team context",
        "raw_transcript": (
            "User: I need to restructure my department. Can you help me "
            "create a new org chart?\n"
            "Assistant: I'd be glad to help with the restructuring. To create "
            "an effective org chart, I need some context:\n"
            "1. How many people are in the department currently?\n"
            "2. What functions or roles exist today?\n"
            "3. What's driving the restructuring (growth, efficiency, new strategy)?\n"
            "4. Do you have any constraints (budget, headcount freeze, etc.)?\n"
            "User: We have 24 people across three teams: frontend (8), backend (10), "
            "and QA (6). We're moving to a product-based structure because our "
            "current functional teams create too many handoffs. We have two main "
            "products. No new headcount available.\n"
            "Assistant: With 24 people, two products, and no new headcount, "
            "here's a product-aligned structure:\n\n"
            "Product A Team (12): 4 frontend, 5 backend, 3 QA\n"
            "Product B Team (12): 4 frontend, 5 backend, 3 QA\n\n"
            "Each team owns their product end-to-end, eliminating cross-team "
            "handoffs. Consider adding a Tech Lead role in each team from "
            "existing senior engineers. Keep a weekly cross-product sync to "
            "share learnings and prevent duplicate work. The main risk is "
            "knowledge silos, so plan for quarterly rotation opportunities."
        ),
        "description": (
            "The user asks for an org chart without any information about team "
            "size, current structure, or the reason for restructuring. The "
            "assistant has to pull all of this out before giving useful advice. "
            "Demonstrates the 'Progressive Discovery' pattern in a management "
            "context."
        ),
    },
    {
        "category": "Managerial",
        "title": "Project timeline estimate with wrong scope assumption",
        "raw_transcript": (
            "User: How long should it take to build a customer portal?\n"
            "Assistant: A customer portal typically takes 3-6 months for a "
            "mid-sized team, depending on complexity. A basic portal with "
            "login, account management, and support ticket submission might "
            "be done in 8-12 weeks. A more complex one with real-time "
            "dashboards, integrations, and self-service features could take "
            "6+ months. What features are you planning to include?\n"
            "User: It's actually much simpler than that. We just need a page "
            "where customers can download their invoices and update their "
            "billing address. We already have an API for both. The team is "
            "two developers.\n"
            "Assistant: With an existing API and only two features (invoice "
            "download and billing address update), this is a 2-4 week project "
            "for two developers. Here's a rough breakdown:\n\n"
            "Week 1: Auth integration, invoice listing and download UI\n"
            "Week 2: Billing address form, validation, API integration\n"
            "Week 3: Testing, polish, responsive design\n"
            "Week 4: Buffer for edge cases and deployment\n\n"
            "My earlier estimate assumed a full-featured portal from scratch. "
            "The existing API eliminates most of the backend work, which "
            "dramatically changes the timeline."
        ),
        "description": (
            "The assistant assumes a large-scope portal and gives a much longer "
            "estimate. The user has to correct the scope by providing the actual "
            "feature list and mentioning existing infrastructure. Classic "
            "'Reactive Correction' where missing scope context leads to a "
            "wildly different initial answer."
        ),
    },
    {
        "category": "Managerial",
        "title": "Stakeholder communication plan with full context",
        "raw_transcript": (
            "User: I need to communicate a project delay to stakeholders. "
            "Context: We're 3 weeks behind on a data migration project. The "
            "original deadline was March 15, and we're now targeting April 5. "
            "Root cause is that the legacy database had undocumented custom "
            "fields that require manual mapping. Stakeholders include the CFO "
            "(cares about budget impact), the VP of Operations (cares about "
            "go-live date for new system), and the IT Director (cares about "
            "technical risk). Budget impact is minimal since the team is "
            "salaried. No downstream projects are blocked yet, but a further "
            "delay would affect the Q2 reporting timeline.\n"
            "Assistant: Here's a stakeholder-specific communication plan:\n\n"
            "For the CFO: Lead with the good news that budget impact is "
            "minimal. Frame the 3-week delay as a quality investment that "
            "prevents data integrity issues that would be far more expensive "
            "to fix after go-live.\n\n"
            "For the VP of Operations: Focus on the new April 5 date with "
            "confidence. Explain the root cause (undocumented fields) is now "
            "fully scoped, so no further surprises are expected. Emphasize "
            "Q2 reporting is still achievable.\n\n"
            "For the IT Director: Be transparent about the technical discovery. "
            "Share the mapping approach for custom fields and your mitigation "
            "plan. They'll appreciate the detail.\n\n"
            "Send individual messages rather than a group email. Each person "
            "needs to hear what matters to them."
        ),
        "description": (
            "Excellent context assembly. The user provides the delay duration, "
            "root cause, each stakeholder's priorities, budget impact, and "
            "downstream risks. The assistant can immediately produce a tailored "
            "communication plan. This is the 'Well-Structured' pattern that "
            "shows how front-loading context saves time."
        ),
    },
    {
        "category": "Managerial",
        "title": "Hiring decision without knowing the team gap",
        "raw_transcript": (
            "User: Should I hire a senior developer or two junior developers? "
            "I have budget for either.\n"
            "Assistant: Both options have merits. A senior developer brings "
            "immediate productivity, mentoring capability, and architectural "
            "judgment. Two juniors give you more hands and long-term growth "
            "potential but require mentoring investment. The right choice "
            "depends on your current team composition. Do you already have "
            "senior engineers who can mentor? What's the nature of the work?\n"
            "User: Good questions. We have 4 mid-level devs but no senior "
            "engineer at all. The team struggles with architecture decisions "
            "and we've accumulated a lot of technical debt. Nobody is confident "
            "reviewing each other's code on the complex parts.\n"
            "Assistant: Hire the senior developer, without question. Your team "
            "has a leadership gap, not a capacity gap. Adding two more juniors "
            "to a team with no senior engineer would actually make things worse "
            "because you'd have more people writing code with no one qualified "
            "to set architectural direction or review complex work. The senior "
            "hire will:\n\n"
            "1. Establish code review standards and architectural patterns\n"
            "2. Start addressing the technical debt strategically\n"
            "3. Level up your four mid-level devs (some may grow into senior roles)\n"
            "4. Reduce the hidden cost of rework from poor architectural choices\n\n"
            "Once the team has senior guidance and your mid-levels grow, you'll "
            "be in a much better position to add junior developers later."
        ),
        "description": (
            "The user frames this as a simple either/or without providing team "
            "context. The assistant asks the right question about team "
            "composition. Once the user reveals there's no senior engineer "
            "at all, the answer becomes obvious. Demonstrates 'Progressive "
            "Discovery' where one critical missing fact changes the advice "
            "completely."
        ),
    },
    {
        "category": "Managerial",
        "title": "Vendor selection with assumed industry context",
        "raw_transcript": (
            "User: We need to pick a project management tool. We've narrowed "
            "it to Jira and Monday.com. Which one should we use?\n"
            "Assistant: Both are excellent tools. Jira is better for software "
            "development teams that use agile methodologies, with strong sprint "
            "planning and developer integrations. Monday.com is more flexible "
            "and visually intuitive, great for cross-functional teams. I'd "
            "generally recommend Jira for dev teams and Monday.com for "
            "business teams.\n"
            "User: We're actually a construction project management firm, not "
            "a software company. Our teams are in the field and need mobile "
            "access. We track permits, inspections, and subcontractor schedules.\n"
            "Assistant: That changes my recommendation significantly. Neither "
            "Jira nor Monday.com is ideal for construction project management. "
            "Your field teams need mobile-first tools with offline capability, "
            "and your workflows around permits and inspections are specialized. "
            "Consider Procore or Buildertrend, which are purpose-built for "
            "construction. If you're committed to the two options, Monday.com "
            "is the better choice because of its flexible workflows and better "
            "mobile experience, but you'd be adapting a general tool to a "
            "specialized need."
        ),
        "description": (
            "The assistant assumes a tech company context and gives generic "
            "advice about dev teams vs. business teams. The user reveals "
            "they're in construction, which makes the entire initial analysis "
            "irrelevant. Strong 'Assumption Cascade' pattern where missing "
            "industry context leads to fundamentally wrong framing."
        ),
    },

    # =========================================================================
    # ADMIN (Office Operations, Scheduling, Procurement, Compliance)
    # =========================================================================
    {
        "category": "Admin",
        "title": "Office relocation checklist without constraints",
        "raw_transcript": (
            "User: We're moving offices. Can you give me a relocation checklist?\n"
            "Assistant: Here's a comprehensive office relocation checklist:\n\n"
            "6 months out: Hire a commercial moving company, plan new layout, "
            "notify landlord\n"
            "3 months out: Order furniture, plan IT infrastructure, update "
            "business address\n"
            "1 month out: Pack non-essentials, coordinate utility transfers\n"
            "Move week: Final packing, IT setup, employee communication\n\n"
            "Would you like me to expand on any of these phases?\n"
            "User: The move is in 3 weeks. It's a small office, 12 people, "
            "and we're just moving two floors up in the same building. We "
            "don't need new furniture. The main concern is not losing more "
            "than a half day of productivity.\n"
            "Assistant: That's a very different situation. For an in-building "
            "move with 12 people in 3 weeks, here's your focused checklist:\n\n"
            "This week: Confirm elevator booking with building management, "
            "verify the new space has enough network drops and power outlets, "
            "order any needed cables or adapters\n\n"
            "Next week: Have each person box personal items and label their "
            "equipment. IT tests network ports on the new floor. Print new "
            "floor plan with desk assignments\n\n"
            "Move day: IT moves and reconnects equipment in the morning "
            "(start at 6 AM if possible). Employees arrive after lunch to "
            "unpack and test. You'll lose about 4 hours of productivity, "
            "not a full day.\n\n"
            "The key is pre-labeling everything and pre-testing the network "
            "jacks upstairs."
        ),
        "description": (
            "The assistant provides a massive 6-month checklist when the actual "
            "move is a minor in-building shuffle in 3 weeks. Without knowing "
            "the timeline, scale, or constraints, the first response is almost "
            "entirely useless. Classic 'Reactive Correction' where scope context "
            "changes everything."
        ),
    },
    {
        "category": "Admin",
        "title": "Procurement approval process setup",
        "raw_transcript": (
            "User: I need to set up a procurement approval process. We're a "
            "50-person company and currently have no formal process. People just "
            "email the CEO for approval on everything, which is bottlenecking "
            "decisions. Purchases range from $50 office supplies to $50,000 "
            "software contracts. We use QuickBooks for accounting and Slack for "
            "communication. Budget owners are the 5 department heads.\n"
            "Assistant: Here's a tiered procurement approval process that "
            "removes the CEO bottleneck:\n\n"
            "Tier 1 (Under $500): Department head approves directly. No CEO "
            "involvement. Track in a shared spreadsheet or QuickBooks PO.\n\n"
            "Tier 2 ($500-$5,000): Department head approves, then Finance "
            "reviews for budget availability. 2-day turnaround target.\n\n"
            "Tier 3 ($5,000-$25,000): Department head submits, Finance reviews, "
            "CEO gives final approval. 5-day turnaround.\n\n"
            "Tier 4 (Over $25,000): Full proposal required with 3 vendor "
            "quotes. Department head, Finance, and CEO all sign off.\n\n"
            "For implementation: Create a Slack channel called "
            "#procurement-requests. Use a simple Google Form to submit "
            "requests with amount, vendor, justification, and urgency. "
            "This integrates with your existing tools without adding new "
            "software."
        ),
        "description": (
            "Excellent upfront context. The user provides company size, current "
            "pain point, purchase range, existing tools, and who the budget "
            "owners are. The assistant can deliver a complete, actionable "
            "process in one turn. This is the 'Well-Structured' pattern for "
            "admin tasks."
        ),
    },
    {
        "category": "Admin",
        "title": "Travel policy without knowing company norms",
        "raw_transcript": (
            "User: Can you write a company travel policy?\n"
            "Assistant: Here's a standard corporate travel policy:\n\n"
            "Flights: Economy class for domestic, business class for "
            "international flights over 6 hours. Book at least 14 days in "
            "advance.\n"
            "Hotels: Up to $250/night in major cities, $175/night elsewhere.\n"
            "Meals: Up to $75/day with receipts.\n"
            "Approval: All travel requires manager approval 2 weeks in advance.\n\n"
            "Would you like me to add more sections?\n"
            "User: Those hotel rates are way too high for us. We're a small "
            "nonprofit. Our whole travel budget for the year is $30,000 for "
            "15 employees. Most travel is to conferences and site visits "
            "within our state. Nobody flies business class. We also need to "
            "comply with our grant requirements, which means every expense "
            "needs documentation.\n"
            "Assistant: Here's a nonprofit-appropriate travel policy:\n\n"
            "Flights: Economy only, always. Book lowest available fare at "
            "least 21 days out. Use fare comparison tools and document "
            "the search.\n"
            "Hotels: Government per diem rates (GSA.gov) for your area, "
            "typically $90-130/night. Share rooms at conferences when possible.\n"
            "Meals: Federal per diem rates for the travel location.\n"
            "Mileage: IRS standard rate for personal vehicle use.\n"
            "Documentation: Receipt required for every expense over $25. "
            "Grant code must be noted on every expense report.\n"
            "Approval: Director approval required. No exceptions.\n"
            "Annual cap: Track against the $30,000 annual budget quarterly.\n\n"
            "All of this aligns with standard nonprofit grant compliance "
            "requirements. Keep receipts for 7 years."
        ),
        "description": (
            "The assistant assumes a standard corporate context and suggests "
            "business class and $250/night hotels. The user reveals they're a "
            "small nonprofit with grant compliance needs. The entire first "
            "response is inappropriate. Shows 'Assumption Cascade' where "
            "missing organizational context leads to wrong defaults."
        ),
    },
    {
        "category": "Admin",
        "title": "Conference room scheduling conflict",
        "raw_transcript": (
            "User: We keep having conference room booking conflicts. "
            "People double-book rooms and meetings get disrupted. How do "
            "I fix this?\n"
            "Assistant: The most reliable fix is a centralized booking system. "
            "If you use Google Workspace, set up Calendar Resources for each "
            "room. If you use Microsoft 365, create Room Mailboxes. Both show "
            "real-time availability. What calendar platform does your office use?\n"
            "User: We use Google Workspace and we actually already have "
            "Calendar Resources set up. The problem is people book rooms and "
            "then don't show up, so others can't use them. We have 3 rooms "
            "for 60 people.\n"
            "Assistant: The issue isn't booking technology, it's room scarcity "
            "and no-show behavior. With 3 rooms for 60 people, you're "
            "chronically undersupplied. Here are targeted fixes:\n\n"
            "1. Auto-release: Enable 'auto-decline if organizer doesn't "
            "check in' using the room's display tablet or a 10-minute "
            "check-in window in Google Calendar settings.\n"
            "2. Meeting time limits: Set maximum booking durations of 1 hour "
            "during peak hours (9 AM - 3 PM).\n"
            "3. Standing meetings audit: Review recurring bookings monthly "
            "and cancel any that aren't being used.\n"
            "4. Designate alternatives: Identify 2-3 informal meeting spaces "
            "(lounge, empty desks) and encourage their use for 2-person chats.\n\n"
            "The ratio of 3 rooms per 60 people is below the recommended "
            "1:15. Long-term, you need at least 1 more room."
        ),
        "description": (
            "The assistant initially suggests calendar resources, which the "
            "user already has. The real problem is behavioral (no-shows) and "
            "structural (too few rooms). Demonstrates 'Progressive Discovery' "
            "where the first response addresses the wrong layer of the problem "
            "because the user didn't specify what they'd already tried."
        ),
    },
    {
        "category": "Admin",
        "title": "Compliance deadline tracking with vague scope",
        "raw_transcript": (
            "User: I need to track compliance deadlines. Can you set up "
            "a system for me?\n"
            "Assistant: I can help you design a compliance tracking system. "
            "What type of compliance are we talking about? Some examples:\n"
            "- Financial (SOX, tax filings)\n"
            "- Privacy (GDPR, CCPA)\n"
            "- Industry-specific (HIPAA, PCI-DSS)\n"
            "- Employment law (OSHA, EEOC reporting)\n"
            "- Business licenses and permits\n\n"
            "Also, how many deadlines are we talking about, and who's "
            "responsible for tracking them currently?\n"
            "User: It's mainly business licenses, insurance renewals, and "
            "annual state filings. About 20 deadlines per year. Right now "
            "our office manager tracks them in her head and occasionally "
            "misses one. We got fined $2,000 last month for a late "
            "business license renewal.\n"
            "Assistant: For 20 annual deadlines, you don't need compliance "
            "software. Here's a practical system:\n\n"
            "1. Create a shared Google Sheet with columns: Item, Due Date, "
            "Lead Time Needed, Owner, Status, Renewal Cost\n"
            "2. Set up Google Calendar reminders at 60 days, 30 days, and "
            "7 days before each deadline\n"
            "3. Add a recurring monthly 15-minute 'compliance check' meeting "
            "for the office manager and a backup person\n"
            "4. Assign a backup owner for each deadline (bus factor of 1 is "
            "what caused the missed renewal)\n\n"
            "The $2,000 fine makes the business case. This system takes "
            "about 2 hours to set up and prevents that from happening again."
        ),
        "description": (
            "The user asks about 'compliance' without specifying what kind, "
            "how many deadlines, or current process. The assistant correctly "
            "asks rather than assuming enterprise-grade compliance needs. "
            "Once scoped, the solution is appropriately simple. Shows "
            "'Progressive Discovery' where the assistant avoids over-engineering "
            "by asking first."
        ),
    },

    # =========================================================================
    # EDUCATION (Teaching, Curriculum Design, Student Assessment, Training)
    # =========================================================================
    {
        "category": "Education",
        "title": "Lesson plan request without grade level",
        "raw_transcript": (
            "User: I need a lesson plan about photosynthesis.\n"
            "Assistant: I'd be happy to create a photosynthesis lesson plan. "
            "To make it appropriate and effective, I need to know:\n"
            "1. What grade level or age group?\n"
            "2. How long is the class period?\n"
            "3. Any specific standards you need to align to (NGSS, state standards)?\n"
            "4. Do you have access to lab materials or is this classroom-only?\n"
            "User: It's for 7th grade, 50-minute period. We follow NGSS and I "
            "have basic lab supplies. The students did a unit on cells last "
            "month so they know about chloroplasts.\n"
            "Assistant: Here's your 50-minute 7th grade photosynthesis lesson, "
            "building on their existing cell knowledge:\n\n"
            "Warm-up (5 min): Show a plant in sunlight and one kept in the dark "
            "for a week. Ask: 'What happened and why?' Connect to chloroplasts "
            "they learned about.\n\n"
            "Direct instruction (15 min): Photosynthesis equation, inputs and "
            "outputs. Use an analogy: chloroplasts are like tiny solar panels "
            "inside the cell.\n\n"
            "Lab activity (20 min): Elodea in water with bromothymol blue "
            "indicator. Students observe color change in light vs. dark "
            "conditions, proving CO2 is consumed.\n\n"
            "Wrap-up (10 min): Students draw the photosynthesis process inside "
            "a chloroplast diagram. Exit ticket: 'What would happen to "
            "photosynthesis if all the chloroplasts were removed from a leaf?'\n\n"
            "NGSS alignment: MS-LS1-6 (photosynthesis role in energy flow)."
        ),
        "description": (
            "Asking for a lesson plan without specifying grade level makes it "
            "impossible to calibrate vocabulary, complexity, or activities. "
            "The assistant asks before wasting a turn on a college-level or "
            "kindergarten response. Once context is provided, the lesson builds "
            "on prior knowledge. 'Progressive Discovery' pattern."
        ),
    },
    {
        "category": "Education",
        "title": "Assessment rubric with wrong format assumption",
        "raw_transcript": (
            "User: I need a rubric for a student project on climate change.\n"
            "Assistant: Here's a research paper rubric for a climate change "
            "project:\n\n"
            "Thesis Statement (20%): Clear, arguable thesis about a climate "
            "change topic\n"
            "Evidence & Sources (30%): Minimum 5 peer-reviewed sources, "
            "properly cited in APA format\n"
            "Analysis (30%): Critical analysis connecting evidence to thesis\n"
            "Writing Quality (20%): Grammar, organization, academic tone\n\n"
            "Each criterion rated: Exemplary (4), Proficient (3), "
            "Developing (2), Beginning (1).\n"
            "User: Sorry, I should have said this is a group presentation, "
            "not a paper. 10th grade environmental science. Groups of 4 "
            "students present for 10 minutes on a specific climate change "
            "impact in their local community.\n"
            "Assistant: Very different assessment. Here's a group presentation "
            "rubric for 10th grade:\n\n"
            "Local Impact Research (25%): Identified a specific, local climate "
            "impact with supporting data. Not generic global facts.\n\n"
            "Group Collaboration (20%): All 4 members contributed visibly. "
            "Smooth transitions between speakers.\n\n"
            "Presentation Quality (25%): Stayed within 10 minutes. Visuals "
            "support the content. Engaged the audience.\n\n"
            "Scientific Accuracy (20%): Claims supported by credible sources. "
            "Correct use of scientific terminology.\n\n"
            "Q&A Handling (10%): Group answered audience questions knowledgeably.\n\n"
            "Include a peer evaluation form where group members rate each "
            "other's contribution to prevent free-riding."
        ),
        "description": (
            "The assistant assumes a research paper format and builds a "
            "writing-focused rubric. The actual assignment is a group "
            "presentation, which requires entirely different criteria. "
            "Classic 'Reactive Correction' where missing assignment format "
            "context leads to an unusable first response."
        ),
    },
    {
        "category": "Education",
        "title": "Differentiated instruction plan with full context",
        "raw_transcript": (
            "User: I need a differentiated reading activity for my 4th grade "
            "class. Context: 22 students. Reading levels range from 2nd grade "
            "to 6th grade equivalent. 4 students have IEPs for reading "
            "comprehension, and 3 are advanced readers who finish early and "
            "get bored. We're reading 'Charlotte's Web'. I have 45 minutes, "
            "a classroom set of the book, a smart board, and a listening "
            "center with 6 headphones.\n"
            "Assistant: Here's a three-tier differentiated reading activity:\n\n"
            "Group A - Supported Readers (4 IEP students + 2-3 others):\n"
            "Listening center with audiobook of the chapter while following "
            "along. Then complete a graphic organizer matching characters to "
            "their actions (visual support). You or an aide work with this "
            "group.\n\n"
            "Group B - On-Level Readers (12-13 students):\n"
            "Partner reading aloud, alternating paragraphs. Each pair answers "
            "3 text-dependent questions on a worksheet. Questions require "
            "finding evidence in the text.\n\n"
            "Group C - Advanced Readers (3 students + any who finish early):\n"
            "Read independently, then write a diary entry from Charlotte's "
            "perspective about the events in the chapter. Extension: compare "
            "Charlotte's point of view to Wilbur's.\n\n"
            "Rotation: Groups A and B swap after 20 minutes so the listening "
            "center serves both. Smart board displays a timer and group "
            "assignments. This uses all 6 headphones and keeps your advanced "
            "readers engaged with higher-order thinking."
        ),
        "description": (
            "Outstanding context assembly. The teacher provides class size, "
            "reading level range, IEP details, specific book, time constraint, "
            "and available resources including technology. The assistant "
            "delivers a fully implementable plan in one turn with no "
            "back-and-forth needed. 'Well-Structured' pattern for education."
        ),
    },
    {
        "category": "Education",
        "title": "Online course design ignoring learner demographics",
        "raw_transcript": (
            "User: I'm building an online course about data analysis. "
            "What platform and structure should I use?\n"
            "Assistant: For an online data analysis course, I'd recommend "
            "building it on Udemy or Teachable. Structure it as 8-10 modules "
            "with video lectures (10-15 minutes each), coding exercises, and "
            "quizzes. Start with basic statistics, move to Python and pandas, "
            "then cover visualization with matplotlib. Price it at $49-99.\n"
            "User: This isn't for sale. It's an internal training program for "
            "our accounting team. They're 8 accountants aged 40-55 who use "
            "Excel daily but have never written code. They need to learn "
            "Power Query and pivot tables to automate their monthly reporting. "
            "They have 2 hours per week for training over 6 weeks.\n"
            "Assistant: Completely different approach needed. Forget Python and "
            "external platforms. Here's your internal Excel upskilling program:\n\n"
            "Platform: Use your existing Microsoft Teams or SharePoint. Record "
            "screen shares they can rewatch. No new tool to learn.\n\n"
            "Week 1: Power Query basics - importing and connecting data sources "
            "they already use\n"
            "Week 2: Power Query transformations - cleaning their actual "
            "monthly data\n"
            "Week 3: Pivot tables fundamentals using their real reports\n"
            "Week 4: Advanced pivots - calculated fields, slicers, grouping\n"
            "Week 5: Combining Power Query + Pivot Tables for end-to-end "
            "automation\n"
            "Week 6: Each person automates one of their own monthly reports\n\n"
            "Key: Use their actual spreadsheets as training material. "
            "Non-technical adults learn fastest when the examples are from "
            "their real work."
        ),
        "description": (
            "The assistant assumes a public course for aspiring data analysts "
            "and recommends Python and a marketplace platform. The actual "
            "audience is non-technical accountants who need Excel skills for "
            "internal use. Every assumption in the first response is wrong. "
            "'Assumption Cascade' pattern where missing audience context "
            "derails the entire recommendation."
        ),
    },
    {
        "category": "Education",
        "title": "Student engagement strategy for remote class",
        "raw_transcript": (
            "User: My students aren't participating in class discussions. "
            "I ask questions and get silence. Any tips?\n"
            "Assistant: Low participation is a common challenge. Try these "
            "strategies:\n"
            "1. Think-Pair-Share: Give students time to think, discuss with "
            "a neighbor, then share with the class\n"
            "2. Cold calling with warmth: Let students know you'll call on "
            "people randomly, but frame it supportively\n"
            "3. Use entry tickets: Students write a response before class "
            "discussion begins\n"
            "4. Small group discussions before whole-class sharing\n"
            "User: I should mention this is a remote class on Zoom. 30 college "
            "freshmen. They keep their cameras off and won't unmute. "
            "Think-Pair-Share doesn't really work when everyone's a black "
            "square on a screen.\n"
            "Assistant: Remote engagement is a fundamentally different challenge. "
            "You're fighting Zoom fatigue, anonymity, and social anxiety. "
            "Here's what works for remote college freshmen:\n\n"
            "1. Chat-first participation: Ask the question, have everyone type "
            "answers in chat simultaneously. Low-pressure and you get 30 "
            "responses instead of 1.\n"
            "2. Polls: Use Zoom polls for quick opinion questions, then discuss "
            "the results. Students engage because they're curious about the "
            "aggregate.\n"
            "3. Breakout rooms (2-3 people): This IS your Think-Pair-Share "
            "equivalent. 3 minutes, then each room reports one takeaway in chat.\n"
            "4. Collaborative docs: Share a Google Doc where students add ideas "
            "in real time. They participate without unmuting.\n"
            "5. Camera policy: Require cameras for breakout rooms only, not "
            "the main session. Reduces pressure.\n\n"
            "The core principle: make participation low-stakes and text-based "
            "first. Unmuting in front of 30 people feels like public speaking "
            "to freshmen."
        ),
        "description": (
            "The assistant gives in-person classroom strategies that don't "
            "apply to a remote Zoom setting. The format of instruction "
            "completely changes what engagement strategies are viable. "
            "'Reactive Correction' pattern where missing delivery format "
            "context leads to impractical advice."
        ),
    },

    # =========================================================================
    # MARKETING (Campaigns, Content Strategy, Analytics, Branding, Social Media)
    # =========================================================================
    {
        "category": "Marketing",
        "title": "Social media strategy without audience context",
        "raw_transcript": (
            "User: I need a social media content calendar for next month. "
            "Can you create one?\n"
            "Assistant: Here's a content calendar framework for next month:\n\n"
            "Week 1: Brand awareness posts, behind-the-scenes content\n"
            "Week 2: Educational/value posts, customer testimonials\n"
            "Week 3: Product features, user-generated content\n"
            "Week 4: Promotional offers, engagement posts\n\n"
            "Post 3-5 times per week on Instagram, daily on Twitter, and "
            "2-3 times per week on LinkedIn. Mix reels, carousels, and "
            "stories.\n"
            "User: We're a B2B industrial valve manufacturer. Our audience "
            "is engineers and procurement managers at water treatment plants. "
            "We're only on LinkedIn. We have one person doing marketing "
            "part-time, so 3-5 posts per week is not realistic.\n"
            "Assistant: For a B2B valve manufacturer on LinkedIn targeting "
            "engineers, forget the consumer playbook. Here's a realistic "
            "calendar for one part-time marketer:\n\n"
            "Post twice per week (Tuesday and Thursday mornings):\n\n"
            "Week 1: Technical case study from a recent installation. "
            "Post a photo of the valve in use with performance data.\n"
            "Week 2: Industry regulation update relevant to water treatment. "
            "Add your commentary on what it means for plant operators.\n"
            "Week 3: Engineer spotlight or project highlight. Tag the "
            "customer's company for reach.\n"
            "Week 4: Product comparison or spec sheet as a carousel. "
            "Engineers love data in visual formats.\n\n"
            "Content that works for B2B industrial: application photos, "
            "technical specs, compliance updates, project case studies. "
            "Content that doesn't work: memes, trending audio, behind-the-scenes."
        ),
        "description": (
            "The assistant creates a generic B2C content calendar with "
            "Instagram Reels and daily Twitter posts. The actual client is a "
            "niche B2B manufacturer with one part-time marketer on LinkedIn "
            "only. Every platform recommendation and content type is wrong. "
            "'Assumption Cascade' where missing industry and audience context "
            "produces unusable output."
        ),
    },
    {
        "category": "Marketing",
        "title": "Email campaign with wrong assumption about list size",
        "raw_transcript": (
            "User: I want to set up an email drip campaign for new signups. "
            "What should the sequence look like?\n"
            "Assistant: Here's a standard 7-email welcome drip sequence:\n\n"
            "Email 1 (Day 0): Welcome + quick win\n"
            "Email 2 (Day 2): Core feature walkthrough\n"
            "Email 3 (Day 5): Customer success story\n"
            "Email 4 (Day 8): Advanced tips\n"
            "Email 5 (Day 12): Integration highlight\n"
            "Email 6 (Day 18): Check-in, ask for feedback\n"
            "Email 7 (Day 25): Upgrade offer or next step\n\n"
            "Use segmentation based on engagement to adjust timing.\n"
            "User: We're a local dog grooming business. We get maybe 5 new "
            "signups per week from our website booking form. A 7-email "
            "sequence feels like way too much for someone who just wants "
            "their dog groomed. I don't want to annoy people.\n"
            "Assistant: You're right, a 7-email SaaS-style drip is overkill "
            "for a local service business. Here's what works:\n\n"
            "Email 1 (Immediate): Booking confirmation with what to expect "
            "at the appointment (bring vaccination records, arrive 5 min "
            "early, etc.)\n\n"
            "Email 2 (Day after first visit): Thank you + before/after photo "
            "of their dog (with permission). Include a 'book next appointment' "
            "link.\n\n"
            "Email 3 (4 weeks later): Grooming reminder based on their dog's "
            "breed schedule. Direct booking link.\n\n"
            "That's it. Three emails, all providing value, none pushy. "
            "For 5 signups a week, you can even personalize these with the "
            "dog's name. Small list size is actually an advantage."
        ),
        "description": (
            "The assistant assumes a SaaS or e-commerce business with a large "
            "list and builds an aggressive drip sequence. The actual business "
            "is a local dog groomer with 5 signups per week. The scale, tone, "
            "and number of emails are all miscalibrated. 'Reactive Correction' "
            "where business type context changes the approach entirely."
        ),
    },
    {
        "category": "Marketing",
        "title": "Product launch plan with full context",
        "raw_transcript": (
            "User: I'm launching a new product next month and need a marketing "
            "plan. Context: It's a premium ergonomic keyboard priced at $189, "
            "targeting remote software developers. We have an existing audience "
            "of 12,000 email subscribers from our previous keyboard product, "
            "plus 8,000 followers on Twitter/X. Budget is $5,000 for the launch. "
            "The keyboard's main differentiator is a built-in macro pad that "
            "integrates with VS Code and JetBrains IDEs. We have 50 units "
            "available for early reviewers.\n"
            "Assistant: Here's your launch plan leveraging your existing "
            "audience and developer niche:\n\n"
            "Pre-launch (2 weeks before):\n"
            "- Email teaser to your 12K list with a waitlist link. Segment "
            "by previous purchasers (they'll convert highest).\n"
            "- Send 30 of the 50 review units to developer YouTube creators "
            "and tech bloggers. Target channels with 5K-50K subscribers "
            "(they're responsive and their audiences are engaged).\n"
            "- Reserve 20 units for Twitter giveaways and developer community "
            "seeding (r/MechanicalKeyboards, Hacker News Show HN).\n\n"
            "Launch day:\n"
            "- Email blast to full list with launch discount ($169 for first "
            "48 hours)\n"
            "- Twitter thread showing the VS Code and JetBrains integration "
            "with GIFs. Developers share workflow tools.\n"
            "- Post on Product Hunt (free, high-intent tech audience)\n\n"
            "Budget allocation:\n"
            "- $2,000: Sponsored posts with 3-4 developer newsletter sponsors "
            "(Bytes, TLDR, JavaScript Weekly)\n"
            "- $1,500: Twitter/Reddit ads targeting developer interests\n"
            "- $1,000: Review unit shipping and packaging\n"
            "- $500: Product Hunt launch assets and contingency\n\n"
            "The IDE integration is your hook. Lead with that in every piece "
            "of content."
        ),
        "description": (
            "Excellent context assembly for a marketing plan. The user "
            "provides product details, price point, target audience, existing "
            "audience size, budget, key differentiator, and available inventory "
            "for promotion. The assistant delivers a complete, budget-allocated "
            "plan in one turn. 'Well-Structured' pattern."
        ),
    },
    {
        "category": "Marketing",
        "title": "SEO strategy without knowing current state",
        "raw_transcript": (
            "User: Our website isn't ranking on Google. How do we fix our SEO?\n"
            "Assistant: Here are the fundamentals to improve your SEO:\n\n"
            "1. Keyword research: Use tools like Ahrefs or SEMrush to find "
            "relevant keywords\n"
            "2. On-page optimization: Optimize title tags, meta descriptions, "
            "and header tags\n"
            "3. Content creation: Publish blog posts targeting long-tail keywords\n"
            "4. Technical SEO: Improve site speed, mobile responsiveness, and "
            "fix crawl errors\n"
            "5. Link building: Get backlinks from authoritative sites\n\n"
            "Would you like me to go deeper on any of these?\n"
            "User: We've actually done all of that. We've been blogging for "
            "two years and have 150 posts. Our site speed is fine and we're "
            "mobile responsive. The problem is we used to rank on page 1 "
            "for our main keyword and dropped to page 4 after Google's last "
            "algorithm update. We're an affiliate review site in the mattress "
            "niche.\n"
            "Assistant: That's a very specific and well-known problem. Google's "
            "recent Helpful Content Update and product review updates have "
            "specifically targeted affiliate review sites that lack first-hand "
            "experience. Mattress affiliate sites were hit particularly hard. "
            "Here's what's likely happening and how to recover:\n\n"
            "1. Add genuine first-hand experience signals: Include original "
            "photos of you testing mattresses, video reviews, and specific "
            "details only someone who used the product would know.\n"
            "2. E-E-A-T signals: Add author bios with credentials, link to "
            "real social profiles, show why your reviewers are qualified.\n"
            "3. Reduce thin affiliate pages: Consolidate or remove low-value "
            "comparison pages that exist just for affiliate links.\n"
            "4. Diversify beyond affiliate: Add genuinely helpful sleep content "
            "that doesn't sell anything.\n\n"
            "This is a 3-6 month recovery process, not a quick fix. The "
            "algorithm specifically devalued the type of content affiliate "
            "sites produce."
        ),
        "description": (
            "The assistant starts with generic SEO advice the user has already "
            "implemented. The real problem is an algorithm penalty specific to "
            "affiliate review sites. Without knowing the site type, current "
            "SEO maturity, and the specific ranking drop, the first response "
            "is wasted. 'Progressive Discovery' pattern."
        ),
    },
    {
        "category": "Marketing",
        "title": "Brand voice guide without existing brand context",
        "raw_transcript": (
            "User: I need to create a brand voice guide for our content team.\n"
            "Assistant: Here's a brand voice framework you can customize:\n\n"
            "Voice attributes: Professional, approachable, knowledgeable\n"
            "Tone spectrum: Formal in whitepapers, conversational on social\n"
            "We say: 'We're here to help', 'Let's figure this out together'\n"
            "We don't say: Jargon, slang, overly casual language\n\n"
            "Do you want me to flesh out any of these sections?\n"
            "User: Those voice attributes don't fit us at all. We're a craft "
            "beer brewery. Our brand is irreverent, a little weird, and we "
            "never take ourselves seriously. Our beer names are puns and our "
            "Instagram is full of memes. Our audience is 25-35 year olds who "
            "hate corporate speak. The content team is 2 people who need "
            "guardrails so the voice stays consistent across our taproom "
            "menus, social posts, and email newsletters.\n"
            "Assistant: Totally different vibe. Here's your brewery brand "
            "voice guide:\n\n"
            "Voice: Irreverent, playful, clever, self-aware\n"
            "We are: The friend who always has a good joke. Smart but never "
            "pretentious. Beer nerds, not beer snobs.\n"
            "We are NOT: Corporate. Serious. Talking down to anyone.\n\n"
            "We say: 'This IPA hits different (and yes, we know everyone "
            "says that)', 'Our new stout is called Darth Bader - we're not "
            "sorry'\n"
            "We don't say: 'Artisanal handcrafted beverage experience', "
            "'Dear valued customer'\n\n"
            "Pun policy: Always. Beer names, email subject lines, menu "
            "descriptions. If it makes you groan, it's on brand.\n\n"
            "Tone by channel:\n"
            "- Instagram: Maximum meme energy. Reply to comments like a human.\n"
            "- Email: Still fun but has a point. Subject line = pun, body = "
            "value (events, new releases).\n"
            "- Taproom menus: Beer descriptions are mini comedy bits. Keep "
            "tasting notes real though.\n\n"
            "This gives your two content people a clear lane to create in "
            "without a style meeting every time."
        ),
        "description": (
            "The assistant defaults to a generic corporate voice guide that "
            "is the opposite of the brewery's actual personality. Missing "
            "brand identity, audience, and channel context leads to a "
            "completely unusable first output. 'Assumption Cascade' where "
            "the default professional tone assumption is wrong."
        ),
    },

    # =========================================================================
    # HUMAN RESOURCES (Hiring, Performance Reviews, Employee Relations, Policies)
    # =========================================================================
    {
        "category": "Human Resources",
        "title": "Performance review template without knowing the role type",
        "raw_transcript": (
            "User: I need a performance review template.\n"
            "Assistant: Here's a standard annual performance review template:\n\n"
            "Section 1: Goals and Objectives (40%)\n"
            "- Did the employee meet their quarterly OKRs?\n"
            "- Quality of deliverables\n\n"
            "Section 2: Core Competencies (30%)\n"
            "- Communication, teamwork, problem-solving, leadership\n\n"
            "Section 3: Professional Development (15%)\n"
            "- Skills growth, training completed\n\n"
            "Section 4: Overall Rating (15%)\n"
            "- 1-5 scale with calibration guidelines\n\n"
            "Each section includes self-assessment and manager assessment.\n"
            "User: This is for warehouse employees. They don't have OKRs or "
            "quarterly goals. I need to evaluate attendance, safety compliance, "
            "picking accuracy, and teamwork. We have 40 warehouse staff and "
            "reviews need to be quick because supervisors have limited time "
            "to write them.\n"
            "Assistant: Here's a warehouse-specific performance review designed "
            "for speed:\n\n"
            "Format: Checkbox + brief comment (supervisors can complete in "
            "10 minutes)\n\n"
            "Section 1: Attendance & Reliability (25%)\n"
            "- Unexcused absences this period: ___\n"
            "- Punctuality: [ ] Excellent [ ] Acceptable [ ] Needs improvement\n"
            "- Volunteered for overtime when needed: [ ] Yes [ ] No [ ] N/A\n\n"
            "Section 2: Safety (25%)\n"
            "- Safety incidents this period: ___\n"
            "- PPE compliance: [ ] Always [ ] Usually [ ] Inconsistent\n"
            "- Completed required safety training: [ ] Yes [ ] No\n\n"
            "Section 3: Performance (35%)\n"
            "- Picking accuracy rate: ___%\n"
            "- Meets daily quota: [ ] Consistently [ ] Usually [ ] Rarely\n"
            "- Equipment handling: [ ] Careful [ ] Acceptable [ ] Careless\n\n"
            "Section 4: Teamwork (15%)\n"
            "- Works well with team: [ ] Yes [ ] Sometimes [ ] No\n"
            "- Helps others when own work is complete: [ ] Yes [ ] No\n\n"
            "Overall: [ ] Exceeds [ ] Meets [ ] Below Expectations\n"
            "Supervisor comments (2-3 sentences required): ___"
        ),
        "description": (
            "The assistant builds a knowledge-worker review template with OKRs "
            "and competency frameworks. The actual need is for warehouse staff "
            "where attendance, safety, and picking accuracy are what matter. "
            "'Reactive Correction' pattern where missing role context produces "
            "an irrelevant template."
        ),
    },
    {
        "category": "Human Resources",
        "title": "Job posting without role level or industry",
        "raw_transcript": (
            "User: Can you write a job posting for a marketing manager?\n"
            "Assistant: Here's a marketing manager job posting:\n\n"
            "Marketing Manager\n\n"
            "We're looking for an experienced Marketing Manager to lead our "
            "marketing efforts. You'll develop and execute marketing strategies, "
            "manage a team of 3-5 marketers, oversee our brand presence, and "
            "drive lead generation.\n\n"
            "Requirements:\n"
            "- 5-7 years of marketing experience\n"
            "- 2+ years managing a team\n"
            "- Experience with marketing automation (HubSpot, Marketo)\n"
            "- Strong analytical skills\n"
            "- Bachelor's degree in Marketing or related field\n\n"
            "Benefits: Health, dental, vision, 401k match, unlimited PTO\n"
            "User: A few corrections. This is for a small healthcare clinic. "
            "The 'team' is just this one person plus a freelance designer. "
            "We need someone who can actually do the work, not just manage "
            "strategy. They'll handle our website, patient newsletters, local "
            "advertising, and referral program. Budget is $55-65k which means "
            "we need someone with 2-3 years experience, not 5-7. We're in "
            "rural Minnesota so remote is fine but must know healthcare "
            "marketing regulations.\n"
            "Assistant: Here's the corrected posting:\n\n"
            "Marketing Coordinator - Healthcare Clinic (Remote OK)\n\n"
            "Join our growing family healthcare clinic as our first dedicated "
            "marketing hire. This is a hands-on role where you'll execute "
            "our marketing from end to end, working with one freelance "
            "designer.\n\n"
            "What you'll do:\n"
            "- Manage and update our clinic website (WordPress)\n"
            "- Create and send monthly patient newsletters\n"
            "- Run local advertising (Google Local, Facebook, local print)\n"
            "- Grow our physician referral program\n"
            "- Ensure all marketing complies with HIPAA and healthcare "
            "advertising regulations\n\n"
            "You'll thrive here if you:\n"
            "- Have 2-3 years of hands-on marketing experience\n"
            "- Can write, design (basic), and analyze results yourself\n"
            "- Understand healthcare marketing compliance (or are eager to learn)\n"
            "- Are comfortable being a team of one\n\n"
            "Salary: $55,000-$65,000 + health benefits\n"
            "Location: Remote with occasional visits to our Minnesota clinic\n\n"
            "Note: I changed the title to Marketing Coordinator to match the "
            "experience level and salary range. 'Manager' at $55-65k would "
            "attract the wrong candidates."
        ),
        "description": (
            "The assistant builds a generic corporate marketing manager posting "
            "with team management, automation platforms, and requirements that "
            "don't match the actual role. The user has to correct the scope, "
            "budget, experience level, and industry. Nearly every detail in "
            "the first response is wrong. 'Assumption Cascade' pattern."
        ),
    },
    {
        "category": "Human Resources",
        "title": "Well-structured PIP documentation request",
        "raw_transcript": (
            "User: I need to document a performance improvement plan (PIP). "
            "Context: Employee is a customer service rep, 2 years with us. "
            "Issue: Their average call resolution time is 12 minutes vs. the "
            "team average of 7 minutes. Customer satisfaction scores dropped "
            "from 4.2 to 3.1 over 3 months. They received verbal coaching "
            "twice (January 10 and February 3) with no improvement. They are "
            "otherwise well-liked by the team and have no attendance issues. "
            "We want to give them a genuine chance to improve, not just "
            "create a paper trail for termination. PIP duration: 30 days. "
            "Our HR policy requires measurable goals and weekly check-ins.\n"
            "Assistant: Here's a PIP designed for genuine improvement:\n\n"
            "PERFORMANCE IMPROVEMENT PLAN\n"
            "Employee: [Name] | Role: Customer Service Representative\n"
            "Manager: [Name] | HR: [Name]\n"
            "Period: [Start Date] - [+30 days]\n\n"
            "Performance Gap:\n"
            "- Call resolution time: Currently 12 min (team avg: 7 min)\n"
            "- Customer satisfaction: Currently 3.1 (team avg: 4.2)\n"
            "- Prior coaching: Verbal on 1/10 and 2/3 without improvement\n\n"
            "Goals (must meet ALL by end of 30 days):\n"
            "1. Reduce average call resolution time to 9 minutes or less\n"
            "   (Note: targeting team average would be unrealistic in 30 "
            "   days, so 9 min is a meaningful but achievable step)\n"
            "2. Raise customer satisfaction score to 3.7 or above\n"
            "3. Complete call handling refresher training by Day 10\n\n"
            "Support provided:\n"
            "- 4 hours shadowing the top-performing rep in Week 1\n"
            "- Manager listens to 3 calls per week and provides same-day "
            "feedback\n"
            "- Weekly 30-minute 1:1 every Monday (progress review)\n\n"
            "Weekly milestones:\n"
            "Week 1: Complete shadowing, identify 3 specific techniques to adopt\n"
            "Week 2: Resolution time at 10.5 min or less\n"
            "Week 3: Resolution time at 9.5 min or less, CSAT at 3.5+\n"
            "Week 4: Meet final targets, demonstrate consistency\n\n"
            "Outcome if goals met: PIP closed, return to normal status\n"
            "Outcome if goals not met: Termination or role reassignment\n\n"
            "This structure shows the employee exactly what 'improvement' "
            "means and gives them real support. The graduated weekly targets "
            "make progress visible."
        ),
        "description": (
            "The user provides the employee's role, specific metrics, history "
            "of prior coaching, team context, intent (genuine improvement), "
            "duration, and policy requirements. The assistant produces a "
            "complete, fair, and legally sound PIP document in one turn. "
            "'Well-Structured' pattern for HR documentation."
        ),
    },
    {
        "category": "Human Resources",
        "title": "Onboarding checklist with assumed company size",
        "raw_transcript": (
            "User: Can you create an employee onboarding checklist?\n"
            "Assistant: Here's a comprehensive onboarding checklist:\n\n"
            "Pre-arrival:\n"
            "- Send offer letter and benefits enrollment packet\n"
            "- Set up workstation with IT\n"
            "- Create accounts in HRIS (BambooHR/Workday)\n"
            "- Assign onboarding buddy\n\n"
            "Day 1:\n"
            "- Office tour and team introductions\n"
            "- HR orientation (benefits, handbook, policies)\n"
            "- IT setup (laptop, email, Slack, VPN)\n"
            "- Meet with manager for 30/60/90 day goals\n\n"
            "Week 1: Department orientation, tool training, shadowing\n"
            "Month 1: Complete all compliance training, first project assigned\n"
            "Month 3: 90-day review with manager\n\n"
            "User: We're a 6-person startup. There's no HRIS, no IT department, "
            "no onboarding buddy program, and no HR team. I'm the founder and "
            "I handle everything. We just hired person number 7 and I want to "
            "make sure I don't forget anything important. They start Monday.\n"
            "Assistant: Here's your startup-founder onboarding checklist for "
            "Monday:\n\n"
            "Before Monday:\n"
            "- [ ] Send a welcome email: start time, parking info, what to "
            "bring (ID for I-9, direct deposit info)\n"
            "- [ ] Buy their laptop or confirm BYOD policy\n"
            "- [ ] Create their Google Workspace account and add to Slack\n"
            "- [ ] Print or prepare: offer letter (if not signed digitally), "
            "W-4, I-9, state tax form, direct deposit form\n"
            "- [ ] Add them to any shared drives, repos, or project tools\n\n"
            "Monday morning:\n"
            "- [ ] Complete I-9 (they must show original ID documents in person)\n"
            "- [ ] Walk through the signed offer letter and any equity/benefits\n"
            "- [ ] 30-minute 'how we work' conversation: communication norms, "
            "work hours, who does what\n"
            "- [ ] Pair them with whoever is doing the most similar work for "
            "their first week\n"
            "- [ ] Give them one small, completable task on Day 1 so they feel "
            "productive\n\n"
            "First two weeks:\n"
            "- [ ] 15-minute daily check-in (just 'what questions do you have?')\n"
            "- [ ] Introduce them to any key vendors, clients, or partners\n"
            "- [ ] Set clear expectations for their first 30 days\n\n"
            "Legal must-haves you might forget as a founder:\n"
            "- I-9 must be completed within 3 business days of start\n"
            "- Workers' comp insurance must cover them from Day 1\n"
            "- If you're in a state with mandatory harassment training, schedule it"
        ),
        "description": (
            "The assistant assumes a mid-size company with an HR department, "
            "IT team, HRIS, and formal programs. The actual situation is a "
            "6-person startup where the founder does everything. The first "
            "response references tools and processes that don't exist. "
            "'Reactive Correction' where company size context changes the "
            "entire approach."
        ),
    },
    {
        "category": "Human Resources",
        "title": "Conflict resolution without knowing the parties",
        "raw_transcript": (
            "User: Two employees are in conflict and it's affecting the team. "
            "How should I handle it?\n"
            "Assistant: Employee conflict should be addressed promptly. Here's "
            "a general framework:\n\n"
            "1. Meet with each person separately to understand their perspective\n"
            "2. Identify the root cause (personality clash, work style, "
            "competition for resources)\n"
            "3. Bring them together for a mediated conversation\n"
            "4. Establish clear agreements and follow up\n\n"
            "What's the nature of the conflict? Are they peers, or is there "
            "a reporting relationship involved?\n"
            "User: One is a senior engineer who's been here 8 years. The other "
            "is a new engineering manager hired 3 months ago who is technically "
            "the senior engineer's boss. The senior engineer is undermining the "
            "new manager in meetings, dismissing her decisions in front of the "
            "team, and going directly to the VP of Engineering to overrule her. "
            "Three other engineers have told me they don't know who to listen to. "
            "I'm the HR business partner.\n"
            "Assistant: This isn't a personality conflict, it's an authority "
            "challenge. The senior engineer is rejecting the new manager's "
            "legitimacy, and it's creating a leadership vacuum for the team. "
            "Here's the approach:\n\n"
            "Step 1 - Align with the VP of Engineering first:\n"
            "The VP needs to stop accepting the end-run. If the VP entertains "
            "direct appeals from the senior engineer, they're inadvertently "
            "undermining their own hire. Get the VP to redirect the senior "
            "engineer back to the manager.\n\n"
            "Step 2 - Meet with the senior engineer (you + VP together):\n"
            "Be direct: 'We've observed that you're challenging [manager]'s "
            "decisions publicly. That's not acceptable regardless of tenure.' "
            "Acknowledge their experience but clarify the reporting structure "
            "is not optional.\n\n"
            "Step 3 - Support the new manager:\n"
            "Coach her on establishing authority without being authoritarian. "
            "Suggest she have a 1:1 with the senior engineer to find ways to "
            "leverage their expertise (code architecture decisions, mentoring) "
            "while maintaining decision-making authority.\n\n"
            "Step 4 - Team communication:\n"
            "The manager needs to hold a brief team meeting to clarify "
            "decision-making authority and escalation paths.\n\n"
            "Timeline: This needs to resolve within 2 weeks. If the senior "
            "engineer continues after the direct conversation, it becomes a "
            "documented performance issue."
        ),
        "description": (
            "The initial request gives no details about the people involved, "
            "their roles, or the nature of the conflict. The assistant gives "
            "a generic framework and correctly asks for details. Once the "
            "power dynamic is revealed (senior IC undermining new manager), "
            "the advice becomes very specific and different from a peer "
            "conflict. 'Progressive Discovery' pattern."
        ),
    },
    {
        "category": "Human Resources",
        "title": "Remote work policy drafted without knowing current state",
        "raw_transcript": (
            "User: We need a remote work policy. Can you write one?\n"
            "Assistant: Here's a remote work policy:\n\n"
            "Eligibility: All employees after 90-day probation period.\n"
            "Schedule: Up to 3 days remote per week. Core hours 10 AM - 3 PM.\n"
            "Equipment: Company provides laptop, monitor, and $500 home office "
            "stipend.\n"
            "Communication: Available on Slack during core hours. Camera on "
            "for meetings.\n"
            "Performance: Evaluated on output, not hours.\n"
            "Security: VPN required. No public Wi-Fi for sensitive work.\n\n"
            "User: A few things. We're fully remote already, not hybrid. We have "
            "employees in 4 states and 2 countries. We don't have a physical "
            "office at all. The policy isn't about allowing remote work, it's "
            "about standardizing expectations for our existing remote workforce. "
            "Main issues: people working odd hours without telling anyone, timezone "
            "coordination problems, and a few people who we suspect are working "
            "second jobs during our hours.\n"
            "Assistant: Very different policy needed. Here's a fully-remote "
            "workforce standards policy:\n\n"
            "Working Hours & Availability:\n"
            "- Declare your working hours in your Slack profile and calendar. "
            "Changes require 1-week notice to your manager.\n"
            "- Overlap requirement: All employees must be available during "
            "2 PM - 5 PM ET regardless of timezone (adjust for international).\n"
            "- Response time: Slack messages during your declared hours must "
            "be acknowledged within 1 hour.\n\n"
            "Transparency:\n"
            "- Calendar must reflect actual availability. Block focus time, "
            "but don't go dark for full days without notice.\n"
            "- Unresponsiveness during declared hours for 2+ hours without "
            "explanation is treated the same as not showing up to an office.\n\n"
            "Outside Employment:\n"
            "- Outside employment must be disclosed and approved in writing. "
            "This isn't about controlling personal time; it's about preventing "
            "conflicts of interest and ensuring full commitment during your "
            "declared hours.\n\n"
            "Multi-State/International Compliance:\n"
            "- Employees may not relocate to a new state or country without "
            "30 days' notice. (New jurisdictions create tax and labor law "
            "obligations for the company.)\n"
            "- Work from a different country temporarily: allowed up to "
            "30 days/year with manager approval.\n\n"
            "This addresses your actual pain points instead of solving the "
            "wrong problem."
        ),
        "description": (
            "The assistant writes a hybrid work permission policy when the "
            "company is already fully remote. The real need is standardizing "
            "expectations for a distributed team across states and countries. "
            "'Assumption Cascade' where assuming the company has an office "
            "produces an irrelevant policy."
        ),
    },
]
