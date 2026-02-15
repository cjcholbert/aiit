export default function StatsPanel({ stats }) {
  if (!stats || stats.length === 0) return null;

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
