import { useState } from 'react';
import LandingAnalysis from '../components/LandingAnalysis';
import './Landing.css';

const CONCEPTS = [
  {
    title: 'Context Assembly',
    description: 'Ever get a generic AI response and think "that\'s not what I meant"? You probably left out details you didn\'t realize mattered. Learn to spot your blind spots before they cost you another round of back-and-forth.'
  },
  {
    title: 'Quality Judgment',
    description: 'AI output can look polished even when it\'s wrong. Build your instinct for when to hit "use this" and when to pause and double-check — so you catch the mistakes that matter without wasting time on the ones that don\'t.'
  },
  {
    title: 'Task Decomposition',
    description: 'Some tasks AI nails in seconds. Others it butchers no matter how you ask. Get better at splitting your work so the right pieces go to AI and the right pieces stay with you.'
  },
  {
    title: 'Iterative Refinement',
    description: 'The first draft is never the final answer — and that\'s the point. Learn to give feedback that actually moves the needle, so you go from "close enough" to "exactly right" in fewer rounds.'
  },
  {
    title: 'Workflow Integration',
    description: 'One great AI experiment doesn\'t change how you work. Build repeatable habits that make AI a natural part of your day — not something you remember to try when you\'re already behind.'
  },
  {
    title: 'Frontier Recognition',
    description: 'AI is confidently wrong more often than you\'d think. Develop a feel for where the guardrails end, so you know when to push forward and when to take the wheel yourself.'
  }
];

const TABS = [
  { key: '6skills', label: '6 Skills' },
  { key: '12lessons', label: 'Practice Lesson' },
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState('6skills');

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-nav-title">The AI <span className="landing-nav-title-accent">Collaborator</span></span>
          <span className="landing-nav-tagline">Learn to Manage AI — Not Just Use It</span>
        </div>
      </nav>

      <div className="landing-content">
        <div className="tabs">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === '12lessons' && (
          <>
            <section className="landing-hero">
              <p className="landing-hero-subtitle">
                Practice with real scenarios, track your growth, and build habits that compound.
              </p>
            </section>

            <LandingAnalysis />


          </>
        )}

        {activeTab === '6skills' && (
          <section className="landing-concepts">
            <h2>Six Skills that separate productive AI collaborators from everyone else</h2>

            <div className="landing-concepts-grid">
              {CONCEPTS.map((c) => (
                <div key={c.title} className="landing-concept-card">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
