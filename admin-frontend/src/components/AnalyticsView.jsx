import { useState, useEffect } from 'react';

export default function AnalyticsView({ api, showError }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api('/admin/analytics/lessons');
      setLessons(data.lessons);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading analytics...</div>;
  }

  const totalItems = lessons.reduce((sum, l) => sum + l.total_items, 0);
  const activeLessons = lessons.filter((l) => l.total_items > 0).length;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalItems}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeLessons}</div>
          <div className="stat-label">Active Lessons</div>
        </div>
      </div>

      <div className="analytics-grid">
        {lessons.map((lesson) => (
          <div key={lesson.lesson} className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <div className="analytics-card-lesson">Lesson {lesson.lesson}</div>
                <div className="analytics-card-name">{lesson.lesson_name}</div>
              </div>
              <span className={`badge ${lesson.total_items > 0 ? 'badge-green' : 'badge-yellow'}`}>
                {lesson.total_items > 0 ? 'Active' : 'No data'}
              </span>
            </div>
            <div className="analytics-card-stats">
              <div className="analytics-stat">
                <div className="analytics-stat-value">{lesson.total_items}</div>
                <div className="analytics-stat-label">Items</div>
              </div>
              <div className="analytics-stat">
                <div className="analytics-stat-value">{lesson.unique_users}</div>
                <div className="analytics-stat-label">Users</div>
              </div>
              <div className="analytics-stat">
                <div className="analytics-stat-value">{lesson.avg_items_per_user}</div>
                <div className="analytics-stat-label">Avg/User</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
