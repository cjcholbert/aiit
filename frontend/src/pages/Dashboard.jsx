import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, CONCEPTS, APP_NAME } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import GettingStartedOverlay from '../components/GettingStartedOverlay';
import { useApi } from '../hooks/useApi';

const BANNER_DISMISSED_KEY = 'ams_welcome_dismissed';

function isBannerDismissed() {
    try {
        return localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

export default function Dashboard() {
    const { theme } = useTheme();
    const { isLessonComplete, progress } = useProgress();
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

    const handleDismiss = () => {
        localStorage.setItem(BANNER_DISMISSED_KEY, '1');
        setDismissed(true);
    };

    return (
        <div>
            <GettingStartedOverlay />
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

            <div className="page-header">
                <h1 className="page-title">{APP_NAME}</h1>
                <p className="page-description">
                    12-lesson curriculum organized into 4 modules for mastering AI collaboration. Build systematic habits for effective AI partnership.
                </p>
            </div>

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
        </div>
    );
}
