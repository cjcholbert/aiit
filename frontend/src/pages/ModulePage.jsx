import { useParams, Link, Navigate } from 'react-router-dom';
import { MODULES, MODULE_PAGE_INTRO } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import './ModulePage.css';

export default function ModulePage() {
    const { slug } = useParams();
    const { theme } = useTheme();
    const { isLessonComplete } = useProgress();

    const module = MODULES.find((m) => m.slug === slug);
    if (!module) {
        return <Navigate to="/dashboard" replace />;
    }

    const isDark = theme === 'dark';
    const moduleColor = isDark ? module.darkColor : module.color;
    const moduleText = isDark ? module.darkTextColor : module.textColor;
    const moduleBorder = isDark ? module.darkBorderColor : module.borderColor;

    const firstLesson = module.lessons[0];
    const firstLessonHref = firstLesson ? `/lesson/${firstLesson.lesson}` : '/dashboard';

    return (
        <div
            className="module-page"
            style={{
                '--module-color': moduleColor,
                '--module-text': moduleText,
                '--module-border': moduleBorder,
            }}
        >
            <div className="module-page-breadcrumbs">
                <Link to="/dashboard" className="module-page-breadcrumb-link">← Back to dashboard</Link>
            </div>

            <header className="module-page-hero">
                <h1 className="module-page-title">{module.name}</h1>
                <p className="module-page-tagline">{module.tagline}</p>
                <p className="module-page-intro">{MODULE_PAGE_INTRO}</p>
            </header>

            <section className="module-page-section">
                {module.synopsis.map((paragraph, idx) => (
                    <p key={idx} className="module-page-synopsis">{paragraph}</p>
                ))}
            </section>

            <section className="module-page-section">
                <h2 className="module-page-section-title">What you'll be able to do</h2>
                <ul className="module-page-outcomes">
                    {module.outcomes.map((outcome, idx) => (
                        <li key={idx}>{outcome}</li>
                    ))}
                </ul>
            </section>

            <section className="module-page-section">
                <h2 className="module-page-section-title">
                    {module.lessons.length === 2 ? 'Two' : module.lessons.length === 3 ? 'Three' : module.lessons.length === 4 ? 'Four' : module.lessons.length} lessons
                </h2>
                <ol className="module-page-lessons">
                    {module.lessons.map((lesson) => {
                        const complete = isLessonComplete(lesson.lesson);
                        const comingSoon = lesson.status === 'coming';
                        return (
                            <li key={lesson.lesson} className="module-page-lesson">
                                <div className="module-page-lesson-header">
                                    <h3 className="module-page-lesson-title">
                                        <span className="module-page-lesson-number">{lesson.lesson}.</span>{' '}
                                        {lesson.title}
                                    </h3>
                                    {complete && (
                                        <span className="module-page-lesson-badge module-page-lesson-badge--complete" aria-label="Lesson complete">
                                            ✓ Complete
                                        </span>
                                    )}
                                    {comingSoon && (
                                        <span className="module-page-lesson-badge module-page-lesson-badge--coming">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>
                                <p className="module-page-lesson-description">{lesson.description}</p>
                                <p className="module-page-lesson-usage"><strong>{lesson.usage}</strong></p>
                                {!comingSoon && (
                                    <Link to={`/lesson/${lesson.lesson}`} className="module-page-lesson-link">
                                        Start lesson →
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </section>

            {firstLesson && firstLesson.status !== 'coming' && (
                <div className="module-page-cta">
                    <Link to={firstLessonHref} className="module-page-cta-button">
                        Start with Lesson {firstLesson.lesson} →
                    </Link>
                </div>
            )}
        </div>
    );
}
