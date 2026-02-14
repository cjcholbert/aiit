export default function StatsGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{stats.total_users}</div>
        <div className="stat-label">Total Users</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.active_users}</div>
        <div className="stat-label">Active Users</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.total_conversations}</div>
        <div className="stat-label">Conversations</div>
      </div>
    </div>
  );
}
