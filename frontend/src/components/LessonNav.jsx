import { Link } from 'react-router-dom';

const LESSONS = [
    { num: 1, title: 'Context Tracker' },
    { num: 2, title: 'Feedback Analyzer' },
    { num: 3, title: 'Template Builder' },
    { num: 4, title: 'Context Docs' },
    { num: 5, title: 'Trust Matrix' },
    { num: 6, title: 'Verification Tools' },
    { num: 7, title: 'Task Decomposer' },
    { num: 8, title: 'Delegation Tracker' },
    { num: 9, title: 'Iteration Passes' },
    { num: 10, title: 'Status Reporter' },
    { num: 11, title: 'Frontier Mapper' },
    { num: 12, title: 'Reference Card' },
];

export default function LessonNav({ currentLesson }) {
    const prev = LESSONS.find(l => l.num === currentLesson - 1);
    const next = LESSONS.find(l => l.num === currentLesson + 1);

    return (
        <nav className="lesson-nav" aria-label="Lesson navigation">
            <div className="lesson-nav-inner">
                {prev ? (
                    <Link to={`/lesson/${prev.num}`} className="lesson-nav-link lesson-nav-prev">
                        <span className="lesson-nav-direction">Previous</span>
                        <span className="lesson-nav-title">Lesson {prev.num}: {prev.title}</span>
                    </Link>
                ) : (
                    <span />
                )}
                {next ? (
                    <Link to={`/lesson/${next.num}`} className="lesson-nav-link lesson-nav-next">
                        <span className="lesson-nav-direction">Next</span>
                        <span className="lesson-nav-title">Lesson {next.num}: {next.title}</span>
                    </Link>
                ) : (
                    <span />
                )}
            </div>
        </nav>
    );
}
