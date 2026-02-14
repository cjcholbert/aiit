import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useLocation } from 'react-router-dom';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(null);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const location = useLocation();

    // Extract lesson number from path
    const getLessonFromPath = () => {
        const match = location.pathname.match(/\/lesson\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    };

    const handleSubmit = async () => {
        if (!rating) return;

        setLoading(true);
        try {
            await api.post('/analytics/feedback', {
                lesson: getLessonFromPath(),
                page: location.pathname,
                rating,
                comment: comment.trim() || null
            });
            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setRating(null);
                setComment('');
            }, 2000);
        } catch (err) {
            console.error('Failed to submit feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const ratingEmojis = [
        { value: 1, emoji: ':(', label: 'Poor' },
        { value: 2, emoji: ':|', label: 'Fair' },
        { value: 3, emoji: ':)', label: 'Good' },
        { value: 4, emoji: ':D', label: 'Great' },
        { value: 5, emoji: '<3', label: 'Love it' }
    ];

    return (
        <div className="feedback-widget">
            {isOpen && (
                <div className="feedback-panel">
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Thanks!</div>
                            <p style={{ color: 'var(--text-secondary)' }}>Your feedback helps us improve.</p>
                        </div>
                    ) : (
                        <>
                            <h3>How's this lesson?</h3>
                            <div className="rating-buttons">
                                {ratingEmojis.map(({ value, emoji, label }) => (
                                    <button
                                        key={value}
                                        className={`rating-btn ${rating === value ? 'selected' : ''}`}
                                        onClick={() => setRating(value)}
                                        title={label}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="form-group">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Any additional feedback? (optional)"
                                    rows={3}
                                    style={{ minHeight: '80px' }}
                                />
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={!rating || loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? 'Sending...' : 'Submit Feedback'}
                            </button>
                        </>
                    )}
                </div>
            )}
            <button
                className="feedback-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Give feedback"
            >
                {isOpen ? 'X' : '?'}
            </button>
        </div>
    );
}
