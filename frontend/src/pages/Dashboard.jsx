import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, CONCEPTS, APP_NAME } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import { useApi } from '../hooks/useApi';

const LESSON_TITLES = {};
MODULES.forEach(m => m.lessons.forEach(l => { LESSON_TITLES[l.lesson] = l.title; }));

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


const DASHBOARD_TABS = [
    { key: 'concepts', label: 'Concepts' },
    { key: 'modules', label: 'Modules' },
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
                                        <span key={num} className="core-concept-lesson-tag">
                                            {LESSON_TITLES[num]}
                                        </span>
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
                                        <div
                                            key={lesson.lesson}
                                            className={`module-card ${complete ? 'module-card-complete' : ''} ${lesson.status === 'coming' ? 'module-card--coming' : ''}`}
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}

        </div>
    );
}
