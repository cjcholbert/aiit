import React, { useState, useEffect } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useLessonStats } from '../contexts/LessonStatsContext';
import SelfAssessmentChecklist from './SelfAssessmentChecklist';
import StatsPanel from './StatsPanel';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import { MODULES } from '../config/modules';
import { useTheme } from '../contexts/ThemeContext';
import './ProgressSidebar.css';

const TEAL_BY_THEME = {
  light: { main: '#3a9080', dark: '#2a8898' },
  dark: { main: '#4aaa98', dark: '#3aaab8' },
  'high-contrast': { main: '#5cc8b4', dark: '#4ac8d8' },
};

function getModuleForLesson(lessonNumber) {
  return MODULES.find(m => m.lessons.some(l => l.lesson === lessonNumber));
}

function ProgressSidebar({ lessonNumber }) {
  const { theme } = useTheme();
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

  const teal = TEAL_BY_THEME[theme] || TEAL_BY_THEME.light;

  const currentModule = getModuleForLesson(lessonNumber);
  const titleColor = currentModule
    ? (theme === 'dark' ? currentModule.darkTextColor : currentModule.textColor)
    : teal.main;

  const barGradient = `linear-gradient(90deg, ${teal.main}, ${teal.dark})`;

  const renderSidebarContent = () => (
    <div className="progress-sidebar__content">
      <div className="progress-sidebar__checklist">
        <SelfAssessmentChecklist
          lessonNumber={lessonNumber}
          criteria={LESSON_CRITERIA[lessonNumber]}
          accentColor={teal.main}
        />
      </div>

      {lessonStats && (
        <div className="progress-sidebar__stats">
          <StatsPanel stats={lessonStats} accentColor={teal.main} />
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
            style={{ width: `${percentage}%`, background: barGradient }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`progress-sidebar ${isOpen ? 'progress-sidebar--open' : 'progress-sidebar--collapsed'}`}>
        <div className="progress-sidebar__toggle-bar">
          {isOpen && <span className="progress-sidebar__title" style={{ color: titleColor }}>Lesson Progress</span>}
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
                     >
            <div className="progress-sidebar__toggle-bar">
              <span className="progress-sidebar__title" style={{ color: titleColor }}>Lesson Progress</span>
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
