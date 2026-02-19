import { Link } from 'react-router-dom';
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

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-nav-title">The AI Collaborator</span>
          <span className="landing-nav-byline">brought to you by <strong>Your AI Iteration</strong></span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login">Sign In</Link>
          <Link to="/register" className="btn-landing-primary">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Learn to <span className="accent">manage AI</span> — not just use it</h1>
        <p className="landing-hero-subtitle">
          12 hands-on lessons that build the six managerial skills separating
          productive AI collaborators from everyone else. Practice with real
          scenarios, track your growth, and build habits that compound.
        </p>
        <div className="landing-hero-cta">
          <Link to="/register" className="btn-hero btn-hero-primary">Start Learning</Link>
          <Link to="/login" className="btn-hero btn-hero-secondary">Sign In</Link>
        </div>
      </section>

      <section className="landing-problem">
        <h2>Most AI training teaches the wrong thing</h2>
        <div className="landing-problem-grid">
          <div className="landing-problem-col">
            <h3>Typical AI training</h3>
            <ul className="problem-list">
              <li>Prompt tricks without the judgment to apply them</li>
              <li>Tool training that expires when the UI changes</li>
              <li>One-shot demos that don't stick</li>
              <li>No framework for when AI fails</li>
            </ul>
          </div>
          <div className="landing-problem-col">
            <h3>This platform</h3>
            <ul className="solution-list">
              <li>Transferable managerial skills</li>
              <li>Works with any AI tool</li>
              <li>Practice-based habit building</li>
              <li>Know exactly when to trust and when to verify</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-concepts">
        <h2>Six skills that make the difference</h2>
        <div className="landing-concepts-grid">
          {CONCEPTS.map((c) => (
            <div key={c.title} className="landing-concept-card">
              <h3>{c.title}</h3>
              <p>{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-how">
        <h2>How it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-number">1</div>
            <h3>Learn</h3>
            <p>Each lesson introduces a concept with clear definitions and real-world context.</p>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">2</div>
            <h3>Practice</h3>
            <p>Interactive exercises analyze your actual AI conversations and workflows.</p>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">3</div>
            <h3>Track</h3>
            <p>Personal dashboards show your growth across all six skills over time.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to level up?</h2>
        <p>All 12 lessons available from day one. No sequential unlocking. Start wherever your skills need the most work.</p>
        <Link to="/register" className="btn-hero btn-hero-primary">Start Learning</Link>
      </section>
    </div>
  );
}
