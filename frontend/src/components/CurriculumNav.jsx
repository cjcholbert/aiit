import { Link } from 'react-router-dom';
import { MODULES } from '../config/modules';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../contexts/ThemeContext';
import './CurriculumNav.css';

export default function CurriculumNav({ currentLesson }) {
    const { theme } = useTheme();
    const { isLessonComplete } = useProgress();

    return (
        <nav className="curriculum-nav" aria-label="Curriculum navigation">
            {MODULES.map((module) => {
                const moduleColor = theme === 'dark' ? module.darkColor : module.color;
                const moduleText = theme === 'dark' ? module.darkTextColor : module.textColor;
                const moduleBorder = theme === 'dark' ? module.darkBorderColor : module.borderColor;

                return (
                    <div
                        className="curriculum-nav-group"
                        key={module.name}
                        style={{
                            '--module-color': moduleColor,
                            '--module-text': moduleText,
                            '--module-border': moduleBorder,
                        }}
                    >
                        <span className="curriculum-nav-label">{module.name}</span>
                        <div className="curriculum-nav-pills">
                            {module.lessons.map((lesson) => {
                                const isCurrent = lesson.lesson === currentLesson;
                                const isComplete = isLessonComplete(lesson.lesson);

                                return (
                                    <Link
                                        key={lesson.lesson}
                                        to={`/lesson/${lesson.lesson}`}
                                        className={`curriculum-nav-pill${isCurrent ? ' curriculum-nav-pill--current' : ''}${isComplete ? ' curriculum-nav-pill--complete' : ''}`}
                                        title={`Lesson ${lesson.lesson}: ${lesson.title}`}
                                        aria-current={isCurrent ? 'page' : undefined}
                                    >
                                        <span className="curriculum-nav-pill-num">{lesson.lesson}</span>
                                        {isComplete && !isCurrent && (
                                            <span className="curriculum-nav-check" aria-label="Complete">✓</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}
