import React, { useState, useEffect } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useLessonStats } from '../contexts/LessonStatsContext';
import SelfAssessmentChecklist from './SelfAssessmentChecklist';
import StatsPanel from './StatsPanel';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import './ProgressSidebar.css';

function ProgressSidebar({ lessonNumber }) {
  const { progress, loading, isLessonComplete, completionPercentage } = useProgress();
  const { stats: lessonStats } = useLessonStats();

  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem('ams_sidebar_open');
    return stored === null ? true : stored === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ams_sidebar_open', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const completedCount = progress
    ? Array.from({ length: 12 }, (_, i) => i + 1).filter(n => isLessonComplete(n)).length
    : 0;

  const percentage = completionPercentage ?? 0;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`progress-sidebar ${isOpen ? 'progress-sidebar--open' : 'progress-sidebar--collapsed'}`}>
        <div className="progress-sidebar__toggle-bar">
          {isOpen && <span className="progress-sidebar__title">Lesson Progress</span>}
          <button
            className="progress-sidebar__toggle-btn"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? '\u00AB' : '\u00BB'}
          </button>
        </div>

        {isOpen && (
          <div className="progress-sidebar__content">
            <div className="progress-sidebar__checklist">
              <SelfAssessmentChecklist
                lessonNumber={lessonNumber}
                criteria={LESSON_CRITERIA[lessonNumber]}
              />
            </div>

            {lessonStats && (
              <div className="progress-sidebar__stats">
                <StatsPanel stats={lessonStats} />
              </div>
            )}

            <div className="progress-sidebar__progress-section">
              <div className="progress-sidebar__progress-header">
                <span className="progress-sidebar__progress-label">{completedCount}/12 lessons</span>
                <span className="progress-sidebar__progress-value">{Math.round(percentage)}%</span>
              </div>
              <div className="progress-sidebar__progress-track">
                <div
                  className="progress-sidebar__progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile floating trigger */}
      <button
        className="progress-sidebar__mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open progress sidebar"
      >
        {'\u2630'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="progress-sidebar__overlay" onClick={() => setMobileOpen(false)}>
          <aside
            className="progress-sidebar__mobile-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="progress-sidebar__toggle-bar">
              <span className="progress-sidebar__title">Lesson Progress</span>
              <button
                className="progress-sidebar__toggle-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                {'\u2715'}
              </button>
            </div>

            <div className="progress-sidebar__content">
              <div className="progress-sidebar__checklist">
                <SelfAssessmentChecklist
                  lessonNumber={lessonNumber}
                  criteria={LESSON_CRITERIA[lessonNumber]}
                />
              </div>

              {lessonStats && (
                <div className="progress-sidebar__stats">
                  <StatsPanel stats={lessonStats} />
                </div>
              )}

              <div className="progress-sidebar__progress-section">
                <div className="progress-sidebar__progress-header">
                  <span className="progress-sidebar__progress-label">{completedCount}/12 lessons</span>
                  <span className="progress-sidebar__progress-value">{Math.round(percentage)}%</span>
                </div>
                <div className="progress-sidebar__progress-track">
                  <div
                    className="progress-sidebar__progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default ProgressSidebar;
