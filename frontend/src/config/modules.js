// Shared configuration for modules and concepts
// Used by Dashboard.jsx and Sidebar.jsx

export const APP_NAME = 'The AI Collaborator';

// The Six Core Managerial Concepts
export const CONCEPTS = {
    contextAssembly: {
        name: 'Context Assembly',
        color: '#4a9079',
        description: 'Gathering and presenting relevant background information for AI collaboration'
    },
    qualityJudgment: {
        name: 'Quality Judgment',
        color: '#9079b0',
        description: 'Critically evaluating AI outputs for accuracy and fitness for purpose'
    },
    taskDecomposition: {
        name: 'Task Decomposition',
        color: '#b08050',
        description: 'Breaking complex problems into manageable, AI-appropriate components'
    },
    iterativeRefinement: {
        name: 'Iterative Refinement',
        color: '#5090b0',
        description: 'Progressively improving outputs through feedback cycles'
    },
    workflowIntegration: {
        name: 'Workflow Integration',
        color: '#b07050',
        description: 'Embedding AI collaboration into existing work processes'
    },
    frontierRecognition: {
        name: 'Frontier Recognition',
        color: '#607090',
        description: 'Understanding the current boundaries of AI capability'
    }
};

// Module definitions with lessons
export const MODULES = [
    {
        name: 'Foundation',
        color: '#2d4a3e',
        textColor: '#7fbfaa',
        borderColor: '#4a7a6a',
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
        color: '#3d3a50',
        textColor: '#a8a3c4',
        borderColor: '#6a6590',
        lessons: [
            {
                lesson: 4,
                title: 'Context Docs',
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
        color: '#4a3d2d',
        textColor: '#c4a87a',
        borderColor: '#7a6a4a',
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
        color: '#3d4a50',
        textColor: '#8fb4c4',
        borderColor: '#5a7a8a',
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
