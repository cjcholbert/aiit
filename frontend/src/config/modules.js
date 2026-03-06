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

// Module definitions with lessons
export const MODULES = [
    {
        name: 'Foundation',
        description: 'Learn to brief AI effectively, give feedback that lands, and build reusable context templates — the three habits every productive AI user starts with.',
        color: '#e6f4ea',
        textColor: '#1a7f37',
        darkColor: '#1c3a2a',
        darkTextColor: '#7fbfaa',
        borderColor: '#a7d5b8',
        darkBorderColor: '#2a5a42',
        lessons: [
            {
                lesson: 1,
                title: 'Context Tracker',
                description: 'Analyze conversation transcripts to identify context gaps and prompting patterns.',
                concept: 'contextAssembly',
                status: 'active'
            },
            {
                lesson: 2,
                title: 'Feedback Analyzer',
                description: 'Assess feedback quality and learn to give specific, actionable AI feedback.',
                concept: 'iterativeRefinement',
                status: 'active'
            },
            {
                lesson: 3,
                title: 'Template Builder',
                description: 'Create and manage reusable context templates for different task types.',
                concept: 'contextAssembly',
                status: 'active'
            },
        ]
    },
    {
        name: 'Documentation & Trust',
        description: 'Build the systems that make AI reliable — persistent context documents, a calibrated trust matrix, and verification checklists that catch mistakes before they land.',
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
                description: 'Manage project context documents for consistent AI collaboration.',
                concept: 'contextAssembly',
                status: 'active'
            },
            {
                lesson: 5,
                title: 'Trust Matrix',
                description: 'Build your trust calibration matrix and track prediction accuracy.',
                concept: 'qualityJudgment',
                status: 'active'
            },
            {
                lesson: 6,
                title: 'Verification Tools',
                description: 'Create verification checklists and skip-criteria for different outputs.',
                concept: 'qualityJudgment',
                status: 'active'
            },
        ]
    },
    {
        name: 'Workflow',
        description: 'Get systematic about what you hand to AI and what you keep. Decompose tasks, build delegation templates, manage iteration passes, and embed AI into your reporting.',
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
                description: 'Categorize tasks as AI-optimal, collaborative, or human-only.',
                concept: 'taskDecomposition',
                status: 'active'
            },
            {
                lesson: 8,
                title: 'Delegation Tracker',
                description: 'Build delegation templates and manage task sequences.',
                concept: 'taskDecomposition',
                status: 'active'
            },
            {
                lesson: 9,
                title: 'Iteration Passes',
                description: 'Track your 70%-85%-95% iteration passes with labeled feedback.',
                concept: 'iterativeRefinement',
                status: 'active'
            },
            {
                lesson: 10,
                title: 'Status Reporter',
                description: 'Design workflows and generate structured status reports.',
                concept: 'workflowIntegration',
                status: 'active'
            },
        ]
    },
    {
        name: 'Advanced',
        description: 'Know where AI breaks down and build your personal playbook. Map capability boundaries, log frontier encounters, and generate a reference card you can actually use.',
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
                description: 'Map reliability zones and log frontier encounters.',
                concept: 'frontierRecognition',
                status: 'active'
            },
            {
                lesson: 12,
                title: 'Reference Card',
                description: 'Generate your personal AI collaboration quick reference card.',
                concept: 'workflowIntegration',
                status: 'active'
            }
        ]
    }
];
