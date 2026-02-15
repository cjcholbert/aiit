import { useState, useEffect, useCallback } from 'react';
import { useProgress } from '../hooks/useProgress';

const STORAGE_KEY = 'ams_milestones_shown';

const MILESTONES = [
    {
        id: 'first_lesson',
        check: (progress) => progress.completed_count >= 1,
        message: 'First lesson complete! You\'ve taken the first step toward systematic AI collaboration.',
    },
    {
        id: 'three_lessons',
        check: (progress) => progress.completed_count >= 3,
        message: '3 lessons complete. You\'re building a strong foundation for AI partnership.',
    },
    {
        id: 'six_lessons',
        check: (progress) => progress.completed_count >= 6,
        message: 'Halfway there! 6 of 12 lessons done. Your AI collaboration skills are taking shape.',
    },
    {
        id: 'nine_lessons',
        check: (progress) => progress.completed_count >= 9,
        message: '9 lessons complete. You\'re approaching mastery of AI managerial skills.',
    },
    {
        id: 'all_lessons',
        check: (progress) => progress.completed_count >= 12,
        message: 'All 12 lessons complete! You\'ve mastered the full AI collaboration curriculum.',
    },
];

function getShownMilestones() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function markMilestoneShown(id) {
    const shown = getShownMilestones();
    if (!shown.includes(id)) {
        shown.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
    }
}

export default function CelebrationToast() {
    const { progress } = useProgress();
    const [toast, setToast] = useState(null);
    const [exiting, setExiting] = useState(false);

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setToast(null);
            setExiting(false);
        }, 300);
    }, []);

    useEffect(() => {
        if (!progress) return;

        const shown = getShownMilestones();
        // Find the first unshown milestone that's been achieved (check in order)
        const newMilestone = MILESTONES.find(
            (m) => !shown.includes(m.id) && m.check(progress)
        );

        if (newMilestone) {
            markMilestoneShown(newMilestone.id);
            setToast(newMilestone);
            setExiting(false);
        }
    }, [progress]);

    // Auto-dismiss after 5 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(dismiss, 5000);
        return () => clearTimeout(timer);
    }, [toast, dismiss]);

    if (!toast) return null;

    return (
        <div className={`celebration-toast ${exiting ? 'celebration-toast-exit' : ''}`}>
            <div className="celebration-toast-content">
                <span className="celebration-toast-icon">&#x2713;</span>
                <p className="celebration-toast-message">{toast.message}</p>
                <button
                    className="celebration-toast-close"
                    onClick={dismiss}
                    aria-label="Dismiss"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}
