import { createContext, useContext, useState, useCallback } from 'react';

const LessonStatsContext = createContext({ stats: null, setStats: () => {} });

export function LessonStatsProvider({ children }) {
  const [stats, setStatsState] = useState(null);
  const setStats = useCallback((s) => setStatsState(s), []);
  return (
    <LessonStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </LessonStatsContext.Provider>
  );
}

export function useLessonStats() {
  return useContext(LessonStatsContext);
}
