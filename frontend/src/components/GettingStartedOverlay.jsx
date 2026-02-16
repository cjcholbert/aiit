import { useState } from 'react';
import { Link } from 'react-router-dom';

const SEEN_KEY = 'ams_getting_started_seen';

function isSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

const STEPS = [
  {
    title: 'Pick a Lesson',
    description: 'Start with any lesson that interests you. We recommend beginning with Lesson 1: Context Tracker to build a strong foundation.',
  },
  {
    title: 'Practice the Skill',
    description: 'Each lesson has hands-on exercises. Paste real conversations, create templates, and track your AI interactions using the built-in tools.',
  },
  {
    title: 'Complete the Checklist',
    description: 'Every lesson has a self-assessment checklist. Complete all criteria to mark the lesson done and track your progress across the curriculum.',
  },
];

export default function GettingStartedOverlay() {
  const [visible, setVisible] = useState(!isSeen());
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="getting-started-overlay" onClick={dismiss}>
      <div className="getting-started-modal" onClick={(e) => e.stopPropagation()}>
        <button className="getting-started-close" onClick={dismiss} aria-label="Close">&times;</button>
        <h2 className="getting-started-title">Getting Started</h2>

        <div className="getting-started-steps">
          {STEPS.map((s, i) => (
            <button
              key={i}
              className={`getting-started-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
              onClick={() => setStep(i)}
            >
              <span className="getting-started-step-number">{i + 1}</span>
              <span className="getting-started-step-title">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="getting-started-content">
          <p>{STEPS[step].description}</p>
        </div>

        <div className="getting-started-actions">
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <Link to="/lesson/1" className="btn btn-primary" onClick={dismiss}>
              Start Learning
            </Link>
          )}
          <button className="btn btn-secondary" onClick={dismiss}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
