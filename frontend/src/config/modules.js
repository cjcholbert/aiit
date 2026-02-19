// Shared configuration for modules and concepts
// Used by Dashboard.jsx and Sidebar.jsx

export const APP_NAME = 'Your AI Iteration';

// The Six Core Managerial Concepts
export const CONCEPTS = {
    contextAssembly: {
        name: 'Context Assembly',
        color: '#3a9080',
        description: 'Gathering and presenting relevant background information for AI collaboration'
    },
    qualityJudgment: {
        name: 'Quality Judgment',
        color: '#3a9080',
        description: 'Critically evaluating AI outputs for accuracy and fitness for purpose'
    },
    taskDecomposition: {
        name: 'Task Decomposition',
        color: '#3a9080',
        description: 'Breaking complex problems into manageable, AI-appropriate components'
    },
    iterativeRefinement: {
        name: 'Iterative Refinement',
        color: '#3a9080',
        description: 'Progressively improving outputs through feedback cycles'
    },
    workflowIntegration: {
        name: 'Workflow Integration',
        color: '#3a9080',
        description: 'Embedding AI collaboration into existing work processes'
    },
    frontierRecognition: {
        name: 'Frontier Recognition',
        color: '#3a9080',
        description: 'Understanding the current boundaries of AI capability'
    }
};

// Module definitions with lessons
export const MODULES = [
    {
        name: 'Foundation',
        color: '#e8f5f2',
        textColor: '#2d7a6c',
        darkColor: '#1c3a2a',
        darkTextColor: '#7fbfaa',
        borderColor: '#b0ddd4',
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
        color: '#dff0ec',
        textColor: '#2a7065',
        darkColor: '#2a2540',
        darkTextColor: '#b8a8d8',
        borderColor: '#9dd0c6',
        darkBorderColor: '#4a3d6a',
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
        color: '#d6ebe6',
        textColor: '#26665a',
        darkColor: '#3a2e1c',
        darkTextColor: '#d4b070',
        borderColor: '#8ac4b8',
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
        color: '#cde6e0',
        textColor: '#225c52',
        darkColor: '#1c2e3a',
        darkTextColor: '#8fb8d0',
        borderColor: '#78b8aa',
        darkBorderColor: '#2a4a5e',
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
