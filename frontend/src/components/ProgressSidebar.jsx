import React, { useState, useEffect } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useLessonStats } from '../contexts/LessonStatsContext';
import SelfAssessmentChecklist from './SelfAssessmentChecklist';
import StatsPanel from './StatsPanel';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import { MODULES } from '../config/modules';
import './ProgressSidebar.css';

// Map lesson number → concept gradient CSS class
const LESSON_GRADIENT = {};
MODULES.forEach(m => m.lessons.forEach(l => {
  const concept = l.concept;
  LESSON_GRADIENT[l.lesson] = 'gradient-' + concept.replace(/([A-Z])/g, '-$1').toLowerCase();
}));

// Map lesson number → gradient color pair for inline use (progress bar, stats)
const LESSON_GRADIENT_COLORS = {
  1: ['#3ab088', '#2878a8'], 3: ['#3ab088', '#2878a8'], 4: ['#3ab088', '#2878a8'],
  5: ['#a07cc0', '#6040c8'], 6: ['#a07cc0', '#6040c8'],
  7: ['#c89040', '#c05030'], 8: ['#c89040', '#c05030'],
  2: ['#40a0c8', '#5060d0'], 9: ['#40a0c8', '#5060d0'],
  10: ['#c87848', '#c04068'], 12: ['#c87848', '#c04068'],
  11: ['#7088a8', '#4858b0'],
};

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

  const gradientCls = LESSON_GRADIENT[lessonNumber] || 'gradient-accent';
  const [gFrom, gTo] = LESSON_GRADIENT_COLORS[lessonNumber] || ['var(--accent-blue)', 'var(--accent-purple)'];
  const barGradient = `linear-gradient(90deg, ${gFrom}, ${gTo})`;
  const bgGradient = `linear-gradient(180deg, ${gFrom}18 0%, ${gTo}10 100%)`;

  const renderSidebarContent = () => (
    <div className="progress-sidebar__content">
      <div className="progress-sidebar__checklist">
        <SelfAssessmentChecklist
          lessonNumber={lessonNumber}
          criteria={LESSON_CRITERIA[lessonNumber]}
          accentColor={gFrom}
        />
      </div>

      {lessonStats && (
        <div className="progress-sidebar__stats">
          <StatsPanel stats={lessonStats} accentColor={gFrom} />
        </div>
      )}

      <div className="progress-sidebar__progress-section">
        <div className="progress-sidebar__progress-header">
          <span className="progress-sidebar__progress-label">{completedCount}/12 lessons</span>
          <span className={`progress-sidebar__progress-value ${gradientCls}`}>{Math.round(percentage)}%</span>
        </div>
        <div className="progress-sidebar__progress-track">
          <div
            className="progress-sidebar__progress-fill"
            style={{ width: `${percentage}%`, background: barGradient }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`progress-sidebar ${isOpen ? 'progress-sidebar--open' : 'progress-sidebar--collapsed'}`} style={{ background: bgGradient }}>
        <div className="progress-sidebar__toggle-bar">
          {isOpen && <span className={`progress-sidebar__title ${gradientCls}`}>Lesson Progress</span>}
          <button
            className="progress-sidebar__toggle-btn"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? '\u00AB' : '\u00BB'}
          </button>
        </div>

        {isOpen && renderSidebarContent()}
      </aside>

      {/* Mobile floating trigger */}
      <button
        className="progress-sidebar__mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open progress sidebar"
        style={{ background: barGradient }}
      >
        {'\u2630'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="progress-sidebar__overlay" onClick={() => setMobileOpen(false)}>
          <aside
            className="progress-sidebar__mobile-panel"
            onClick={e => e.stopPropagation()}
            style={{ background: bgGradient }}
          >
            <div className="progress-sidebar__toggle-bar">
              <span className={`progress-sidebar__title ${gradientCls}`}>Lesson Progress</span>
              <button
                className="progress-sidebar__toggle-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                {'\u2715'}
              </button>
            </div>

            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
}

export default ProgressSidebar;
