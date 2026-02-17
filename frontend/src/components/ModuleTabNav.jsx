import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MODULES } from '../config/modules';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../contexts/ThemeContext';
import './ModuleTabNav.css';

export default function ModuleTabNav() {
    const { theme } = useTheme();
    const { isLessonComplete } = useProgress();
    const location = useLocation();

    // Extract current lesson number from route (e.g. /lesson/3 -> 3)
    const match = location.pathname.match(/^\/lesson\/(\d+)/);
    const currentLesson = match ? parseInt(match[1], 10) : null;

    // Find which module contains the current lesson (for mobile accordion)
    const currentModuleIndex = currentLesson
        ? MODULES.findIndex(m => m.lessons.some(l => l.lesson === currentLesson))
        : 0;

    const [expandedModule, setExpandedModule] = useState(currentModuleIndex);

    const toggleModule = useCallback((index) => {
        setExpandedModule(prev => prev === index ? -1 : index);
    }, []);

    return (
        <nav className="module-tab-nav" aria-label="Module navigation">
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
                        <button
                            className="module-tab-label"
                            onClick={() => toggleModule(moduleIndex)}
                            aria-expanded={isExpanded}
                        >
                            <span className="module-tab-label-text">{module.name}</span>
                            <span className="module-tab-label-count">{completedCount}/{module.lessons.length}</span>
                            <span className="module-tab-label-arrow">{isExpanded ? '▾' : '▸'}</span>
                        </button>
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
