import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, CONCEPTS, APP_NAME } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import { useApi } from '../hooks/useApi';

const BANNER_DISMISSED_KEY = 'ams_welcome_dismissed';
const LAST_LESSON_KEY = 'ams_last_lesson';

function getLastLesson() {
    try {
        return parseInt(localStorage.getItem(LAST_LESSON_KEY)) || null;
    } catch {
        return null;
    }
}

function isBannerDismissed() {
    try {
        return localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

export default function Dashboard() {
    const { theme } = useTheme();
    const { isLessonComplete, completionPercentage, progress } = useProgress();
    const [dismissed, setDismissed] = useState(isBannerDismissed);
    const api = useApi();
    const [lessonStats, setLessonStats] = useState({});

    useEffect(() => {
        api.get('/analytics/lessons').then(data => {
            const map = {};
            data.forEach(l => { map[l.lesson] = l; });
            setLessonStats(map);
        }).catch(() => {});
    }, []);

    const isNewUser = progress && progress.completed_count === 0;
    const showWelcome = isNewUser && !dismissed;
    const lastLesson = getLastLesson();
    const showContinue = !showWelcome && lastLesson && progress && progress.completed_count < 12;

    const handleDismiss = () => {
        localStorage.setItem(BANNER_DISMISSED_KEY, '1');
        setDismissed(true);
    };

    return (
        <div>
            {showWelcome && (
                <div className="welcome-banner">
                    <button className="welcome-banner-close" onClick={handleDismiss} aria-label="Dismiss">&times;</button>
                    <h2 className="welcome-banner-title">Welcome to {APP_NAME}</h2>
                    <p className="welcome-banner-text">
                        This curriculum covers 12 hands-on lessons organized into 4 modules. Each lesson builds practical skills
                        for effective AI collaboration — from assembling context to recognizing capability boundaries.
                    </p>
                    <Link to="/lesson/1" className="btn btn-primary welcome-banner-cta">
                        Start with Lesson 1: Context Tracker
                    </Link>
                </div>
            )}

            {showContinue && (
                <div className="continue-banner">
                    <span className="continue-banner-text">Continue where you left off:</span>
                    <Link to={`/lesson/${lastLesson}`} className="continue-banner-link">
                        Lesson {lastLesson}
                    </Link>
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">{APP_NAME}</h1>
                <p className="page-description">
                    12-lesson curriculum organized into 4 modules for mastering AI collaboration. Build systematic habits for effective AI partnership.
                </p>
                {progress && (
                    <div className="dashboard-progress-bar">
                        <div className="dashboard-progress-header">
                            <span className="dashboard-progress-label">Overall Progress</span>
                            <span className="dashboard-progress-pct">{completionPercentage}%</span>
                        </div>
                        <div className="dashboard-progress-track">
                            <div
                                className="dashboard-progress-fill"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <span className="dashboard-progress-detail">
                            {progress.completed_count} of {progress.total_count} lessons complete
                        </span>
                    </div>
                )}
            </div>

            {MODULES.map((module) => (
                <div key={module.name} style={{ marginBottom: '32px' }}>
                    <div
                        style={{
                            backgroundColor: theme === 'dark' ? module.darkColor : module.color,
                            borderLeft: `4px solid ${theme === 'dark' ? module.darkBorderColor : module.borderColor}`,
                            padding: '12px 16px',
                            borderRadius: '4px',
                            marginBottom: '16px'
                        }}
                    >
                        <h2 style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: theme === 'dark' ? module.darkTextColor : module.textColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
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
                                    className={`module-card ${complete ? 'module-card-complete' : ''}`}
                                    style={{
                                        opacity: lesson.status === 'coming' ? 0.6 : 1,
                                        cursor: lesson.status === 'coming' ? 'not-allowed' : 'pointer'
                                    }}
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
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '4px 8px',
                                            background: concept.color + '30',
                                            borderLeft: `3px solid ${concept.color}`,
                                            borderRadius: '0 4px 4px 0',
                                            fontSize: '0.7rem',
                                            color: concept.color,
                                            fontWeight: 500
                                        }}>
                                            {concept.name}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
