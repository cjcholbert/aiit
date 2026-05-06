import { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MODULES } from '../config/modules';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../contexts/ThemeContext';
import './ModuleTabNav.css';

export default function ModuleTabNav() {
    const { theme } = useTheme();
    const { isLessonComplete } = useProgress();
    const location = useLocation();

    // Extract current lesson or module from route
    const lessonMatch = location.pathname.match(/^\/lesson\/(\d+)/);
    const currentLesson = lessonMatch ? parseInt(lessonMatch[1], 10) : null;
    const moduleMatch = location.pathname.match(/^\/module\/([^/]+)/);
    const currentModuleSlug = moduleMatch ? moduleMatch[1] : null;

    // Find which module is "current" — by lesson, then by module slug, fall back to 0
    const currentModuleIndex = currentLesson
        ? MODULES.findIndex(m => m.lessons.some(l => l.lesson === currentLesson))
        : currentModuleSlug
            ? Math.max(0, MODULES.findIndex(m => m.slug === currentModuleSlug))
            : 0;

    const [expandedModule, setExpandedModule] = useState(currentModuleIndex);

    // Keep expansion in sync as the user navigates between lessons/modules
    useEffect(() => {
        setExpandedModule(currentModuleIndex);
    }, [currentModuleIndex]);

    const toggleModule = useCallback((index) => {
        setExpandedModule(prev => prev === index ? -1 : index);
    }, []);

    const currentModule = MODULES[currentModuleIndex];
    const activeBorder = currentModule
        ? (theme === 'dark' ? currentModule.darkBorderColor : currentModule.borderColor)
        : 'var(--border-color)';

    return (
        <nav className="module-tab-nav" aria-label="Module navigation" style={{ borderBottomColor: activeBorder }}>
            {MODULES.map((module, moduleIndex) => {
                const moduleColor = theme === 'dark' ? module.darkColor : module.color;
                const moduleText = theme === 'dark' ? module.darkTextColor : module.textColor;
                const moduleBorder = theme === 'dark' ? module.darkBorderColor : module.borderColor;
                const isExpanded = expandedModule === moduleIndex;
                const completedCount = module.lessons.filter(l => isLessonComplete(l.lesson)).length;

                return (
                    <div
                        className={`module-tab-group ${isExpanded ? 'module-tab-group--expanded' : ''}`}
                        key={module.name}
                        style={{
                            '--module-color': moduleColor,
                            '--module-text': moduleText,
                            '--module-border': moduleBorder,
                        }}
                    >
                        <div className="module-tab-label">
                            <Link
                                to={`/module/${module.slug}`}
                                className="module-tab-label-link"
                                aria-current={currentModuleSlug === module.slug ? 'page' : undefined}
                            >
                                <span className="module-tab-label-text">{module.name}</span>
                                <span className="module-tab-label-count">{completedCount}/{module.lessons.length}</span>
                            </Link>
                            <button
                                className="module-tab-label-toggle"
                                onClick={() => toggleModule(moduleIndex)}
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Collapse ${module.name} lessons` : `Expand ${module.name} lessons`}
                            >
                                <span className="module-tab-label-arrow">{isExpanded ? '▾' : '▸'}</span>
                            </button>
                        </div>
                        <ul className={`module-tab-lessons ${isExpanded ? 'module-tab-lessons--open' : ''}`}>
                            {module.lessons.map((lesson) => {
                                const isCurrent = lesson.lesson === currentLesson;
                                const isComplete = isLessonComplete(lesson.lesson);

                                const classes = [
                                    'module-tab-lesson',
                                    isCurrent && 'module-tab-lesson--current',
                                    isComplete && 'module-tab-lesson--complete',
                                ].filter(Boolean).join(' ');

                                return (
                                    <li key={lesson.lesson}>
                                        <Link
                                            to={`/lesson/${lesson.lesson}`}
                                            className={classes}
                                            aria-current={isCurrent ? 'page' : undefined}
                                        >
                                            <span className="module-tab-lesson-num">{lesson.lesson}</span>
                                            <span className="module-tab-lesson-title">{lesson.title}</span>
                                            {isComplete && (
                                                <span className="module-tab-check" aria-label="Complete">✓</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </nav>
    );
}
