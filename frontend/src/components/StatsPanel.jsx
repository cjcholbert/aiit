import { useState } from 'react';

export default function StatsPanel({ lessonId, stats }) {
  const storageKey = `statsPanel_lesson_${lessonId}_expanded`;
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      // ignore
    }
  };

  if (!stats || stats.length === 0) return null;

  return (
    <div className="stats-panel">
      <button className="stats-panel-toggle" onClick={toggle}>
        <span>Your Progress</span>
        <span className={`stats-panel-chevron ${expanded ? 'expanded' : ''}`}>&#9660;</span>
      </button>
      {expanded && (
        <div className="stats-panel-content">
          <div className="stats-panel-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stats-panel-card">
                <span className="stats-panel-value" style={{ color: stat.color || 'var(--accent-blue)' }}>
                  {stat.value ?? '-'}
                </span>
                <span className="stats-panel-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
