import { useNavigate } from 'react-router-dom';
import { MODULES } from '../config/modules';

// Flat lookup: lessonNumber -> title
const LESSON_TITLES = {};
MODULES.forEach(module => {
  module.lessons.forEach(l => {
    LESSON_TITLES[l.lesson] = l.title;
  });
});

export default function LessonNav({ lessonNumber }) {
  const navigate = useNavigate();
  const n = Number(lessonNumber);

  return (
    <div className="lesson-nav">
      {n > 1 && (
        <button
          className="lesson-nav-btn lesson-nav-btn--prev"
          onClick={() => navigate(`/lesson/${n - 1}`)}
          title={`Lesson ${n - 1}: ${LESSON_TITLES[n - 1]}`}
        >
          ← Lesson {n - 1}
        </button>
      )}
      {n < 12 && (
        <button
          className="lesson-nav-btn lesson-nav-btn--next"
          onClick={() => navigate(`/lesson/${n + 1}`)}
          title={`Lesson ${n + 1}: ${LESSON_TITLES[n + 1]}`}
        >
          Lesson {n + 1} →
        </button>
      )}
    </div>
  );
}
