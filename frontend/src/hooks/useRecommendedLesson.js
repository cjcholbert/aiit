import { useProgress } from './useProgress';

const RECOMMENDED_ORDER = [1, 3, 5, 7, 2, 4, 6, 8, 9, 10, 11, 12];

/**
 * Returns the first incomplete lesson in recommended learning order.
 * Returns null if all lessons are complete.
 */
export function useRecommendedLesson() {
  const { progress, isLessonComplete, loading } = useProgress();

  if (loading || !progress) return { lesson: null, loading };

  const nextLesson = RECOMMENDED_ORDER.find((n) => !isLessonComplete(n));
  return { lesson: nextLesson || null, loading };
}
