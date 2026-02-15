import { useState, useEffect, createContext, useContext } from 'react';
import { useApi } from './useApi';

const ProgressContext = createContext(null);

/**
 * Provider that fetches and caches lesson progress summary.
 * Wrap around the app layout so Dashboard and Sidebar share the data.
 */
export function ProgressProvider({ children }) {
  const api = useApi();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const data = await api.get('/progress/summary');
      setProgress(data);
    } catch {
      // Silently fail - progress is supplementary
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <ProgressContext.Provider value={{ progress, loading, refresh: fetchProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Hook to access lesson progress data.
 * Returns { progress, loading, refresh, isLessonComplete(n) }
 */
export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    // Not inside provider - return safe defaults
    return {
      progress: null,
      loading: false,
      refresh: () => {},
      isLessonComplete: () => false,
      completionPercentage: 0,
    };
  }

  const isLessonComplete = (lessonNumber) => {
    if (!ctx.progress || !ctx.progress.lessons) return false;
    const lesson = ctx.progress.lessons.find((l) => l.lesson === lessonNumber);
    return lesson ? lesson.complete : false;
  };

  const completionPercentage = ctx.progress ? ctx.progress.completion_percentage : 0;

  return {
    progress: ctx.progress,
    loading: ctx.loading,
    refresh: ctx.refresh,
    isLessonComplete,
    completionPercentage,
  };
}
