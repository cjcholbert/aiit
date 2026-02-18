import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, CONCEPTS, APP_NAME } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import { useApi } from '../hooks/useApi';

const CORE_CONCEPTS = [
    {
        id: 'contextAssembly',
        name: 'Context Assembly',
        color: '#4a9079',
        tagline: 'Curating the briefing that shapes AI output quality',
        description: 'Gathering and presenting relevant background information to enable effective AI collaboration. Identifying what information is needed, organizing it coherently, and providing sufficient detail without overwhelming noise.',
        lessons: [1, 3, 4]
    },
    {
        id: 'qualityJudgment',
        name: 'Quality Judgment',
        color: '#9079b0',
        tagline: 'Distinguishing "looks right" from "is right"',
        description: 'Critically evaluating AI-generated outputs for accuracy, completeness, and fitness for purpose. Recognizing errors, identifying gaps, and determining whether the output genuinely meets the intended need.',
        lessons: [5, 6]
    },
    {
        id: 'taskDecomposition',
        name: 'Task Decomposition',
        color: '#b08050',
        tagline: 'Breaking complex problems into AI-appropriate chunks',
        description: 'Breaking complex problems into smaller components that can be addressed sequentially or in parallel. Understanding which subtasks are AI-appropriate and where human judgment is required.',
        lessons: [7, 8]
    },
    {
        id: 'iterativeRefinement',
        name: 'Iterative Refinement',
        color: '#5090b0',
        tagline: 'Steering toward outcomes through successive approximations',
        description: 'Progressively improving outputs through cycles of feedback, adjustment, and revision. Knowing what to ask for, how to redirect, and when "good enough" has been reached.',
        lessons: [2, 9]
    },
    {
        id: 'workflowIntegration',
        name: 'Workflow Integration',
        color: '#b07050',
        tagline: 'Embedding AI into sustainable work patterns',
        description: 'Embedding AI collaboration into existing work processes in sustainable, practical ways. Identifying where AI adds genuine value and creating repeatable patterns.',
        lessons: [10, 12]
    },
    {
        id: 'frontierRecognition',
        name: 'Frontier Recognition',
        color: '#607090',
        tagline: 'Knowing the boundaries of AI capability',
        description: 'Understanding the current boundaries of AI capability—what it can and cannot do reliably, where it excels versus struggles, and how those boundaries are shifting.',
        lessons: [11]
    }
];

const LESSON_CONTENT = {
    1: {
        problem: 'AI conversations fail when critical context is missing. You waste time on back-and-forth clarifications or get unusable outputs because you forgot to mention key constraints.',
        skill: 'Identify your personal context gaps by analyzing past conversations. Discover what information you consistently forget to provide so you can fix it upfront.',
        tabs: [
            { name: 'Concepts', description: 'Why context gaps derail AI conversations' },
            { name: 'Analysis', description: 'Analyze transcripts for context gaps and prompting patterns' },
            { name: 'History', description: 'View past analyses, patterns, and audit summaries' },
        ],
    },
    2: {
        problem: 'Vague feedback like "make it better" or "this isn\'t right" wastes iteration cycles and frustrates both you and the AI. Without specific, actionable feedback, you\'ll keep going in circles.',
        skill: 'Write feedback that identifies specific locations, states clear actions, and explains reasoning. Learn to spot vague patterns in your own feedback and rewrite them.',
        tabs: [
            { name: 'Concepts', description: 'Why your feedback is the bottleneck' },
            { name: 'Analysis', description: 'Score feedback quality and identify vague patterns' },
            { name: 'History', description: 'View past analyses and quality statistics' },
        ],
    },
    3: {
        problem: 'You keep forgetting to provide the same context over and over. Each conversation starts from scratch, and you waste time re-explaining your project, constraints, and preferences.',
        skill: 'Build reusable templates that capture the context AI needs upfront. Turn your Lesson 1 insights into structured prompts you can use consistently.',
        tabs: [
            { name: 'Concepts', description: 'Why templates transform your AI workflow' },
            { name: 'Builder', description: 'Build new context templates' },
            { name: 'Library', description: 'Manage saved templates' },
            { name: 'Suggestions', description: 'AI-generated template suggestions' },
        ],
    },
    4: {
        problem: 'Every new AI session starts from scratch. You waste time re-explaining project context, and the AI makes the same mistakes you\'ve already corrected in previous sessions.',
        skill: 'Maintain living context documents that capture project state, decisions, issues, and lessons. Start each session with full context for immediate productivity.',
        tabs: [
            { name: 'Concepts', description: 'Why every project needs a context doc' },
            { name: 'Documents', description: 'Create and manage context docs' },
            { name: 'Sessions', description: 'Track update sessions over time' },
        ],
    },
    5: {
        problem: 'You either over-verify everything (wasting time) or blindly trust AI output (introducing errors). Without calibrated judgment, you can\'t efficiently allocate your review effort.',
        skill: 'Build a personal trust matrix by tracking predictions about AI accuracy. Learn which output types you can trust and which require careful verification.',
        tabs: [
            { name: 'Concepts', description: 'Why you probably trust AI in the wrong places' },
            { name: 'Matrix', description: 'Build your trust calibration matrix' },
            { name: 'Predictions', description: 'Log and review accuracy predictions' },
            { name: 'Calibration', description: 'Calibration insights and trends' },
        ],
    },
    6: {
        problem: 'Without systematic verification, you either waste time over-checking outputs you could trust, or miss critical errors by under-checking outputs that needed scrutiny.',
        skill: 'Create reusable verification checklists tied to output types. Track which checks actually catch issues to refine your process over time.',
        tabs: [
            { name: 'Concepts', description: 'Checking AI output shouldn\'t be guesswork' },
            { name: 'Checklists', description: 'Create verification checklists' },
            { name: 'Iterate', description: 'Practice verification in timed sessions' },
        ],
    },
    7: {
        problem: 'Without decomposition skills, you either delegate tasks that need your judgment (getting poor results) or do everything yourself (wasting AI\'s potential).',
        skill: 'Break projects into subtasks and categorize each as AI-Optimal, Collaborative, or Human-Primary. Sequence tasks with dependencies to optimize the human-AI division of labor.',
        tabs: [
            { name: 'Concepts', description: 'Why "just ask AI to do it" fails on real projects' },
            { name: 'Decompose', description: 'Break down a project into tasks' },
        ],
    },
    8: {
        problem: 'Knowing what to delegate is only half the battle. Without structured delegation practices, you\'ll give vague instructions and get disappointing results.',
        skill: 'Create delegation templates with clear context, objectives, scope, deliverables, and success criteria. Execute decomposed tasks in sequence while tracking outcomes.',
        tabs: [
            { name: 'Concepts', description: 'Why "just handle this" gets bad results' },
            { name: 'Delegate', description: 'Create and execute delegation briefs' },
        ],
    },
    9: {
        problem: 'Random iteration ("make it better") wastes cycles and leads to scope creep. Without structure, you\'ll keep tweaking without knowing when "done" is reached.',
        skill: 'Use the 70-85-95 framework to iterate with purpose. Each pass has a specific focus and key question, so you know exactly what to evaluate and when to move on.',
        tabs: [
            { name: 'Concepts', description: 'Why "make it better" never works' },
            { name: 'Iterate', description: 'Practice structured iteration passes' },
            { name: 'History', description: 'Saved iteration sessions' },
        ],
    },
    10: {
        problem: 'Recurring tasks like status reports, meeting summaries, and client updates eat up valuable time when done manually each time.',
        skill: 'Design AI-integrated workflows for recurring tasks. Create templates, track inputs, and measure time savings to build sustainable AI collaboration habits.',
        tabs: [
            { name: 'Concepts', description: 'Why recurring tasks deserve their own workflow' },
            { name: 'Design', description: 'Design a reusable workflow' },
            { name: 'Run', description: 'Generate reports from workflows' },
        ],
    },
    11: {
        problem: 'AI capabilities change rapidly, and what worked yesterday may be outdated tomorrow. Without tracking the frontier, you can\'t anticipate what\'s possible or prepare for new opportunities.',
        skill: 'Map AI reliability zones and log frontier encounters to build your personal AI capability map. Track where AI excels, where it struggles, and where the boundaries are shifting.',
        tabs: [
            { name: 'Concepts', description: 'Why you need a personal AI capability map' },
            { name: 'Zones', description: 'Map AI reliability zones' },
            { name: 'Encounters', description: 'Log frontier encounters' },
        ],
    },
    12: {
        problem: 'All your learnings across lessons can be overwhelming to remember and apply consistently in daily work.',
        skill: 'Generate your personal AI collaboration quick reference card from your learnings across all lessons. Synthesize your insights into an actionable cheat sheet.',
        tabs: [
            { name: 'Concepts', description: 'Why a personal reference card matters' },
            { name: 'My Card', description: 'Generate your personal reference card' },
            { name: 'Challenge', description: 'Test your skills with real scenarios' },
        ],
    },
};

const DASHBOARD_TABS = [
    { key: 'concepts', label: 'Concepts' },
    { key: 'modules', label: 'Modules' },
    { key: 'curriculum', label: 'Curriculum' },
];

export default function Dashboard() {
    const { theme } = useTheme();
    const { isLessonComplete } = useProgress();
    const api = useApi();
    const [activeTab, setActiveTab] = useState('concepts');
    const [lessonStats, setLessonStats] = useState({});

    useEffect(() => {
        api.get('/analytics/lessons').then(data => {
            const map = {};
            data.forEach(l => { map[l.lesson] = l; });
            setLessonStats(map);
        }).catch(() => {});
    }, []);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <h1 className="page-title">{APP_NAME}</h1>
                    <Link to="/lesson/1" className="btn btn-primary">Begin Course</Link>
                </div>
                <p className="page-description">
                    12 hands-on lessons across 4 modules. Build systematic habits for effective AI collaboration.
                </p>
            </div>

            <div className="tabs">
                {DASHBOARD_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`tab ${activeTab === key ? 'active' : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'concepts' && (
                <>
                    <p className="dashboard-section-description">Six managerial skills that form the foundation of effective AI collaboration.</p>

                    <div className="core-concepts-grid">
                        {CORE_CONCEPTS.map((concept) => (
                            <div
                                key={concept.id}
                                className="core-concept-card"
                                style={{ '--concept-accent': concept.color }}
                            >
                                <div className="core-concept-header">
                                    <h3 className="core-concept-name">{concept.name}</h3>
                                    <span className="core-concept-tagline">{concept.tagline}</span>
                                </div>
                                <p className="core-concept-description">{concept.description}</p>
                                <div className="core-concept-lessons">
                                    {concept.lessons.map(num => (
                                        <Link key={num} to={`/lesson/${num}`} className="core-concept-lesson-link">
                                            L{num}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'modules' && (
                <>
                    <p className="dashboard-section-description">12 lessons organized into 4 progressive modules.</p>

                    {MODULES.map((module) => (
                        <div key={module.name} className="module-section">
                            <div
                                className="module-section-header"
                                style={{
                                    '--module-bg': theme === 'dark' ? module.darkColor : module.color,
                                    '--module-border': theme === 'dark' ? module.darkBorderColor : module.borderColor,
                                    '--module-text': theme === 'dark' ? module.darkTextColor : module.textColor
                                }}
                            >
                                <h2 className="module-section-title">
                                    {module.name}
                                </h2>
                            </div>
                            <div className="module-grid">
                                {module.lessons.map((lesson) => {
                                    const concept = CONCEPTS[lesson.concept];
                                    const complete = isLessonComplete(lesson.lesson);
                                    return (
                                        <Link
                                            key={lesson.lesson}
                                            to={lesson.status === 'active' ? `/lesson/${lesson.lesson}` : '#'}
                                            className={`module-card ${complete ? 'module-card-complete' : ''} ${lesson.status === 'coming' ? 'module-card--coming' : ''}`}
                                            onClick={(e) => {
                                                if (lesson.status === 'coming') e.preventDefault();
                                            }}
                                        >
                                            <div className="module-card-header">
                                                <span className="module-card-number">Lesson {lesson.lesson}</span>
                                                {complete && (
                                                    <span className="lesson-complete-badge" title="Lesson complete">
                                                        &#x2713;
                                                    </span>
                                                )}
                                                {lesson.status === 'coming' && (
                                                    <span className="badge badge-blue">Coming Soon</span>
                                                )}
                                            </div>
                                            <h3 className="module-card-title">{lesson.title}</h3>
                                            <p className="module-card-description">{lesson.description}</p>
                                            {lessonStats[lesson.lesson] && (lessonStats[lesson.lesson].items_created > 0 || lessonStats[lesson.lesson].views > 0) && (
                                                <div className="module-card-stats">
                                                    {lessonStats[lesson.lesson].items_created > 0 && (
                                                        <span>{lessonStats[lesson.lesson].items_created} items</span>
                                                    )}
                                                    {lessonStats[lesson.lesson].views > 0 && (
                                                        <span>{lessonStats[lesson.lesson].views} views</span>
                                                    )}
                                                </div>
                                            )}
                                            {concept && (
                                                <div
                                                    className="concept-tag"
                                                    style={{
                                                        '--concept-color': concept.color,
                                                        '--concept-color-bg': concept.color + '30'
                                                    }}
                                                >
                                                    {concept.name}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {activeTab === 'curriculum' && (
                <div className="curriculum-page">
                    <p className="dashboard-section-description">
                        Each lesson targets a specific managerial AI skill through interactive exercises, building systematic habits for effective AI collaboration.
                    </p>

                    {MODULES.map((module) => (
                        <div key={module.name} className="curriculum-module-section">
                            <div
                                className="curriculum-module-header"
                                style={{
                                    backgroundColor: theme === 'dark' ? module.darkColor : module.color,
                                    borderLeftColor: theme === 'dark' ? module.darkBorderColor : module.borderColor,
                                    color: theme === 'dark' ? module.darkTextColor : module.textColor,
                                }}
                            >
                                <h2 className="curriculum-module-name">{module.name}</h2>
                                <span className="curriculum-module-count">
                                    {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                                </span>
                            </div>

                            {module.lessons.map((lesson) => {
                                const concept = CONCEPTS[lesson.concept];
                                const content = LESSON_CONTENT[lesson.lesson];

                                return (
                                    <div key={lesson.lesson} className="curriculum-lesson-card">
                                        <div className="curriculum-lesson-header">
                                            <div className="curriculum-lesson-title-group">
                                                <span className="curriculum-lesson-number">Lesson {lesson.lesson}</span>
                                                <h3 className="curriculum-lesson-name">{lesson.title}</h3>
                                            </div>
                                            {concept && (
                                                <span
                                                    className="curriculum-concept-badge"
                                                    style={{
                                                        background: concept.color + '20',
                                                        borderColor: concept.color,
                                                        color: concept.color,
                                                    }}
                                                >
                                                    {concept.name}
                                                </span>
                                            )}
                                        </div>

                                        <p className="curriculum-lesson-desc">{lesson.description}</p>

                                        {content && (
                                            <>
                                                <div className="curriculum-narrative">
                                                    <div className="curriculum-problem">
                                                        <span className="curriculum-label">The Problem</span>
                                                        <p>{content.problem}</p>
                                                    </div>
                                                    <div className="curriculum-skill">
                                                        <span className="curriculum-label">The Skill</span>
                                                        <p>{content.skill}</p>
                                                    </div>
                                                </div>

                                                <div className="curriculum-tabs-grid">
                                                    {content.tabs.map((tab) => (
                                                        <div key={tab.name} className="curriculum-tab-item">
                                                            <span className="curriculum-tab-name">{tab.name}</span>
                                                            <span className="curriculum-tab-desc">{tab.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <div className="curriculum-lesson-footer">
                                            <Link
                                                to={`/lesson/${lesson.lesson}`}
                                                className="curriculum-lesson-link"
                                            >
                                                Open Lesson &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
