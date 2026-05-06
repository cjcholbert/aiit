// Shared configuration for modules and concepts
// Used by Dashboard.jsx and Sidebar.jsx

export const APP_NAME = 'Your AI Iteration';

// The Six Core Managerial Concepts
export const CONCEPTS = {
    contextAssembly: {
        name: 'Briefing Architecture',
        color: '#3a9080',
        description: 'Gathering and presenting relevant background information for AI collaboration'
    },
    qualityJudgment: {
        name: 'Output Calibration',
        color: '#3a9080',
        description: 'Critically evaluating AI outputs for accuracy and fitness for purpose'
    },
    taskDecomposition: {
        name: 'Work Sequencing',
        color: '#3a9080',
        description: 'Breaking complex problems into manageable, AI-appropriate components'
    },
    iterativeRefinement: {
        name: 'Feedback Cycles',
        color: '#3a9080',
        description: 'Progressively improving outputs through feedback cycles'
    },
    workflowIntegration: {
        name: 'AI Habit Design',
        color: '#3a9080',
        description: 'Embedding AI collaboration into existing work processes'
    },
    frontierRecognition: {
        name: 'Capability Mapping',
        color: '#3a9080',
        description: 'Understanding the current boundaries of AI capability'
    }
};

// Shown at the top of every module landing page, under the tagline
export const MODULE_PAGE_INTRO = "These aren't one-and-done lessons. Set them up the first time, then come back as your work changes.";

// Module definitions with lessons
export const MODULES = [
    {
        name: 'Foundation',
        slug: 'foundation',
        description: 'Learn to brief AI effectively, give feedback that lands, and build reusable context templates — the three habits every productive AI user starts with.',
        tagline: 'The three habits every productive AI user starts with.',
        synopsis: [
            'Most people first try AI by typing a question and hoping for the best. When the answer misses the mark, they blame the AI — or themselves for not "knowing how to prompt." The real issue is almost always the same: not enough context, vague feedback, and starting over from scratch every time.',
            "Foundation fixes that in three short lessons. You won't learn prompt-engineering tricks. You'll build three habits that quietly do most of the work: giving AI the briefing it actually needs, telling it what to fix in a way it can act on, and saving your best setups so the next task starts from a strong foothold instead of a blank box.",
            'If you only do one module, do this one.'
        ],
        outcomes: [
            'Write a project brief that gets you usable output on the first try, not the fifth.',
            'Spot the difference between "this looks fine" and "this is actually right" before you send anything onward.',
            'Build a reusable starting point for the kinds of tasks you do every week — drafts, reviews, summaries — so you stop re-explaining yourself.'
        ],
        color: '#e6f4ea',
        textColor: '#1a7f37',
        darkColor: '#1c3a2a',
        darkTextColor: '#7fbfaa',
        borderColor: '#a7d5b8',
        darkBorderColor: '#2a5a42',
        lessons: [
            {
                lesson: 1,
                title: 'Context Pattern Tracker',
                description: 'Paste in a real conversation you\'ve had with AI. The lesson shows you, in plain terms, where the conversation went off the rails and which kind of context you forgot to include.',
                usage: 'Use whenever a conversation goes sideways — diagnose, learn, save the pattern.',
                concept: 'contextAssembly',
                status: 'active'
            },
            {
                lesson: 2,
                title: 'Feedback Analyzer',
                description: '"Make it better" is the world\'s most common AI feedback, and it almost never works. This lesson walks you through what specific feedback sounds like and helps you grade your own.',
                usage: 'Run on real feedback you\'ve just given. Build a feel over time.',
                concept: 'iterativeRefinement',
                status: 'active'
            },
            {
                lesson: 3,
                title: 'Template Builder',
                description: 'Build one starting template for a task you actually do. Save it. Use it tomorrow. The point isn\'t to memorize prompt formats — it\'s to stop typing the same setup paragraph from memory every Monday morning.',
                usage: 'Build once, then add to it. Your templates grow with you.',
                concept: 'contextAssembly',
                status: 'active'
            },
        ]
    },
    {
        name: 'Documentation & Trust',
        slug: 'documentation-trust',
        description: 'Build the systems that make AI reliable — persistent context documents, a calibrated trust matrix, and verification checklists that catch mistakes before they land.',
        tagline: 'The systems that keep AI reliable when stakes go up.',
        synopsis: [
            'Foundation gets you fast wins. Documentation & Trust keeps the wheels on when the work matters. Most people lose trust in AI not because it\'s bad, but because they have no system for knowing *when* it\'s bad — so they either trust it on everything (and get burned) or trust it on nothing (and miss the point of using it).',
            'This module is the difference. You\'ll set up project context documents you don\'t have to re-explain every Monday, build a trust matrix that tells you at a glance which categories of work AI nails versus which still need your eyes, and create verification checklists for the outputs that actually matter — so the slop never makes it into the email, the deck, or the report.'
        ],
        outcomes: [
            'Maintain a living "this is who I am, what I\'m working on, and what I care about" document that AI can use across every conversation, instead of repeating yourself.',
            'Know — based on your own track record, not vibes — which kinds of AI output you can trust and which need a second pass.',
            'Build a 30-second verification checklist for anything important enough that a mistake would be embarrassing.'
        ],
        color: '#e0f0f8',
        textColor: '#1a6d8a',
        darkColor: '#1c2e3a',
        darkTextColor: '#7fbcd0',
        borderColor: '#a0cfe0',
        darkBorderColor: '#2a5a6e',
        lessons: [
            {
                lesson: 4,
                title: 'Context Documents',
                description: 'Build the project document AI should always have in mind. You\'ll set one up for a real project of yours, paste it in next time you ask AI for help, and feel the difference immediately.',
                usage: 'A living document. Update it as your project evolves.',
                concept: 'contextAssembly',
                status: 'active'
            },
            {
                lesson: 5,
                title: 'Trust Matrix',
                description: 'Score the kinds of work you do against how reliably AI handles them. Over time, this matrix tells you exactly when to lean on AI and when to take over.',
                usage: 'Update as you accumulate evidence. Your map sharpens with use.',
                concept: 'qualityJudgment',
                status: 'active'
            },
            {
                lesson: 6,
                title: 'Verification Tools',
                description: 'Build a tiny checklist for the outputs that actually leave your desk. Quick to use, hard to skip, catches the "looks right but isn\'t" mistakes before they go public.',
                usage: 'Build one per output type. Run before anything important goes out.',
                concept: 'qualityJudgment',
                status: 'active'
            },
        ]
    },
    {
        name: 'Workflow',
        slug: 'workflow',
        description: 'Get systematic about what you hand to AI and what you keep. Decompose tasks, build delegation templates, manage iteration passes, and embed AI into your reporting.',
        tagline: 'Stop using AI in spurts. Start working with it.',
        synopsis: [
            'Most people use AI like a calculator — pull it out for one task, put it away, repeat. That\'s why it never quite saves the time you thought it would. The leverage shows up when AI becomes part of *how* you work, not a separate stop on your to-do list.',
            'Workflow is the four lessons that move you from "AI sometimes" to "AI in the loop." You\'ll learn which tasks to hand off versus which to keep, build templates that turn one-off delegations into a repeatable habit, get systematic about how many iteration passes a piece of work actually needs, and design a status-reporting routine that keeps stakeholders in the loop without you writing a fresh update from scratch every Friday.'
        ],
        outcomes: [
            'Look at your week\'s task list and immediately know which items are AI-optimal, which are collaborative, and which are stay-with-you.',
            'Run delegations to AI the same way you\'d run them with a teammate — clear handoffs, clean check-ins, no surprises.',
            'Stop polishing past the point of diminishing returns and start shipping the right "good enough."',
            'Generate a real status report from your actual work without writing it from scratch.'
        ],
        color: '#fdf0e2',
        textColor: '#9a6700',
        darkColor: '#3a2e1c',
        darkTextColor: '#d4b070',
        borderColor: '#dfc088',
        darkBorderColor: '#6a5030',
        lessons: [
            {
                lesson: 7,
                title: 'Task Decomposer',
                description: 'Take a real task you\'re working on, break it down, and tag each piece for who should handle it — you, AI, or both. By the end you\'ll see your work differently.',
                usage: 'Run on each new task. The pattern recognition gets faster the more you use it.',
                concept: 'taskDecomposition',
                status: 'active'
            },
            {
                lesson: 8,
                title: 'Delegation Tracker',
                description: 'Build a delegation template for the kind of work you actually hand off, and run a real delegation through it. Sounds boring; saves hours per week.',
                usage: 'Build a delegation template once. Reuse it on every handoff after.',
                concept: 'taskDecomposition',
                status: 'active'
            },
            {
                lesson: 9,
                title: 'Iteration Passes',
                description: 'Learn the 70-85-95 rhythm: three deliberate iteration passes with specific goals each time. Stops both the "one and done" mistake and the "polish forever" trap.',
                usage: 'Apply to every piece of work you\'re refining. Becomes muscle memory.',
                concept: 'iterativeRefinement',
                status: 'active'
            },
            {
                lesson: 10,
                title: 'Status Reporter',
                description: 'Set up a structured status-report flow tied to the work you\'re already doing. Generate one live from a real project — you\'ll see how much friction this removes.',
                usage: 'Generate weekly or monthly. Replaces your blank-page Friday afternoon.',
                concept: 'workflowIntegration',
                status: 'active'
            },
        ]
    },
    {
        name: 'Advanced',
        slug: 'advanced',
        description: 'Know where AI breaks down and build your personal playbook. Map capability boundaries, log frontier encounters, and generate a reference card you can actually use.',
        tagline: 'Where AI breaks — and what to do when you hit that wall.',
        synopsis: [
            'The hardest skill in AI collaboration isn\'t getting good output. It\'s noticing — *before* you act on it — when the output is confidently wrong. Every regular AI user develops a feel for this eventually, but most never write it down, so the next person on their team learns it the hard way. And the next time the technology shifts, they have to re-learn it themselves.',
            'Advanced is two lessons. The first maps the territory: where AI is reliable, where it\'s hit-or-miss, where it\'s reliably wrong, and where you should not even let it try. The second turns everything you\'ve learned across all twelve lessons into a single one-page reference card that you can actually pin somewhere and use.',
            'This module is about not getting fooled, and about not losing what you\'ve built.'
        ],
        outcomes: [
            'Recognize the signature of a "frontier" task — one where AI is operating outside its reliable zone — before you commit to its answer.',
            'Keep a running log of frontier encounters so your map stays current as the technology changes.',
            'Walk away from this curriculum with a one-page card that reflects *your* work and *your* habits, not a generic prompting cheat sheet.'
        ],
        color: '#fde8e8',
        textColor: '#b32d2d',
        darkColor: '#3a1c1c',
        darkTextColor: '#d08f8f',
        borderColor: '#e0a0a0',
        darkBorderColor: '#6a2a2a',
        lessons: [
            {
                lesson: 11,
                title: 'Frontier Mapper',
                description: 'Map your own personal AI reliability zones — what works, what doesn\'t, what\'s worth experimenting on. Log a real frontier encounter and use it to update the map.',
                usage: 'A living log. Update each time you hit a wall.',
                concept: 'frontierRecognition',
                status: 'active'
            },
            {
                lesson: 12,
                title: 'Reference Card',
                description: 'Pull together everything you\'ve learned into one personalized reference card. Print it, save it, share it. This is the "what to do on Monday" output of the whole curriculum.',
                usage: 'Refresh quarterly. Everything you\'ve built, distilled to one page.',
                concept: 'workflowIntegration',
                status: 'active'
            }
        ]
    }
];
