function hasRealData(value) {
  if (value == null || value === '-' || value === 'N/A') return false;
  if (typeof value === 'number') return value > 0;
  // String values: check if there's any non-zero digit
  const str = String(value);
  return /[1-9]/.test(str);
}

export default function StatsPanel({ stats }) {
  if (!stats || stats.length === 0) return null;

  const showStats = stats.some(stat => hasRealData(stat.value));

  if (!showStats) {
    return (
      <div className="stats-panel">
        <p className="stats-panel-empty">Complete the activities to track your progress.</p>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h3 className="stats-panel-heading">Your Progress</h3>
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
  );
}
