import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import { useRecommendedLesson } from '../hooks/useRecommendedLesson';

export default function Analytics() {
    const api = useApi();
    const { user } = useAuth();
    const { lesson: recommendedLesson } = useRecommendedLesson();
    const [stats, setStats] = useState(null);
    const [lessonStats, setLessonStats] = useState([]);
    const [recentFeedback, setRecentFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const [overviewData, lessonsData, feedbackData] = await Promise.all([
                api.get(`/analytics/overview?range=${timeRange}`),
                api.get('/analytics/lessons'),
                api.get('/analytics/feedback/recent?limit=10')
            ]);
            setStats(overviewData);
            setLessonStats(lessonsData);
            setRecentFeedback(feedbackData);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getMaxViews = () => {
        if (!lessonStats.length) return 1;
        return Math.max(...lessonStats.map(l => l.views));
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'green';
        if (rating >= 3) return 'yellow';
        return 'red';
    };

    if (loading) {
        return (
            <div aria-busy={true}>
                <div className="page-header">
                    <h1 className="page-title">Analytics</h1>
                </div>
                <div className="loading" role="status">
                    <div className="spinner" aria-hidden="true"></div>
                    Loading analytics...
                </div>
            </div>
        );
    }

    return (
        <div aria-busy={false}>
            <div className="page-header">
                <h1 className="page-title">Analytics Dashboard</h1>
                <p className="page-description">
                    Track your learning progress and platform usage across all lessons.
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Time Range Selector */}
            <div className="analytics-time-range">
                {['day', 'week', 'month', 'all'].map(range => (
                    <button
                        key={range}
                        className={`btn ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTimeRange(range)}
                    >
                        {range === 'all' ? 'All Time' : `Past ${range.charAt(0).toUpperCase() + range.slice(1)}`}
                    </button>
                ))}
            </div>

            {/* Overview Stats */}
            {stats && (
                <div className="analytics-grid">
                    <div className="analytics-card">
                        <div className="analytics-value blue">{stats.total_sessions}</div>
                        <div className="analytics-label">Total Sessions</div>
                    </div>
                    <div className="analytics-card">
                        <div className="analytics-value green">{stats.lessons_visited}</div>
                        <div className="analytics-label">Lessons Visited</div>
                    </div>
                    <div className="analytics-card">
                        <div className="analytics-value purple">{stats.items_created}</div>
                        <div className="analytics-label">Items Created</div>
                    </div>
                    <div className="analytics-card">
                        <div className="analytics-value yellow">{stats.avg_session_minutes || 0}m</div>
                        <div className="analytics-label">Avg Session</div>
                    </div>
                </div>
            )}

            {recommendedLesson && (
                <div className="recommended-banner analytics-recommended">
                    <span className="recommended-banner-label">Next Recommended Lesson</span>
                    <Link to={`/lesson/${recommendedLesson}`} className="recommended-banner-link">
                        Lesson {recommendedLesson}
                    </Link>
                </div>
            )}

            {/* Lesson Usage Chart */}
            <div className="chart-container">
                <h2 className="analytics-section-title">Lesson Engagement</h2>
                <div className="bar-chart">
                    {lessonStats.map(lesson => (
                        <div className="bar-row" key={lesson.lesson}>
                            <span className="bar-label">Lesson {lesson.lesson}</span>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{ width: `${(lesson.views / getMaxViews()) * 100}%` }}
                                >
                                    {lesson.views}
                                </div>
                            </div>
                            <span className="bar-meta">
                                {lesson.items_created > 0 && <span>{lesson.items_created} items</span>}
                                {lesson.avg_rating != null && <span className={`badge badge-${getRatingColor(lesson.avg_rating)}`}>{lesson.avg_rating.toFixed(1)}</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Per-Lesson Detail */}
            {lessonStats.length > 0 && (
                <div className="card analytics-per-lesson-card">
                    <h2 className="analytics-section-title">Per-Lesson Detail</h2>
                    <div className="analytics-lesson-detail">
                        {lessonStats.map(lesson => (
                            <div key={lesson.lesson} className="analytics-lesson-row">
                                <span>Lesson {lesson.lesson}</span>
                                <span className="analytics-lesson-title-col">{lesson.title}</span>
                                <div className="analytics-lesson-stat">
                                    <strong>{lesson.items_created}</strong>
                                    items
                                </div>
                                <div className="analytics-lesson-stat">
                                    <strong>{lesson.views}</strong>
                                    views
                                </div>
                                <div className="analytics-lesson-stat">
                                    <strong>{lesson.avg_rating != null ? lesson.avg_rating.toFixed(1) : '-'}</strong>
                                    rating
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Summary */}
            {stats && (
                <div className="analytics-activity-grid">
                    <div className="card">
                        <h3 className="analytics-section-title">Most Active Lessons</h3>
                        {lessonStats
                            .sort((a, b) => b.views - a.views)
                            .slice(0, 5)
                            .map((lesson) => (
                                <div key={lesson.lesson} className="analytics-most-active-item">
                                    <span>Lesson {lesson.lesson}: {lesson.title}</span>
                                    <span className="badge badge-blue">{lesson.views} views</span>
                                </div>
                            ))}
                    </div>

                    <div className="card">
                        <h3 className="analytics-section-title">Learning Streak</h3>
                        <div className="analytics-streak-container">
                            <div className="analytics-streak-value">
                                {stats.current_streak || 0}
                            </div>
                            <div className="analytics-streak-label">Days in a row</div>
                            <div className="analytics-streak-detail">
                                Longest streak: {stats.longest_streak || 0} days
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Feedback */}
            {user?.is_admin && recentFeedback.length > 0 && (
                <div className="card">
                    <h3 className="analytics-section-title">Recent Feedback (Admin Only)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Lesson</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentFeedback.map(fb => (
                                <tr key={fb.id}>
                                    <td>{fb.lesson ? `Lesson ${fb.lesson}` : fb.page}</td>
                                    <td>
                                        <span className={`badge badge-${getRatingColor(fb.rating)}`}>
                                            {fb.rating}/5
                                        </span>
                                    </td>
                                    <td className="analytics-feedback-comment">
                                        {fb.comment || '-'}
                                    </td>
                                    <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Progress Over Time */}
            {stats?.weekly_activity && (
                <div className="card analytics-weekly-card">
                    <h3 className="analytics-section-title">Weekly Activity</h3>
                    <div className="analytics-weekly-chart">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                            const activity = stats.weekly_activity[idx] || 0;
                            const maxActivity = Math.max(...(stats.weekly_activity || [1]));
                            const height = maxActivity > 0 ? (activity / maxActivity) * 80 : 0;
                            return (
                                <div key={day} className="analytics-weekly-bar-wrapper">
                                    <div className="analytics-weekly-bar-container">
                                        <div
                                            className="analytics-weekly-bar"
                                            style={{ height: `${height}px`, minHeight: activity > 0 ? '4px' : '0' }}
                                        />
                                    </div>
                                    <div className="analytics-weekly-day">
                                        {day}
                                    </div>
                                    <div className="analytics-weekly-count">
                                        {activity}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
