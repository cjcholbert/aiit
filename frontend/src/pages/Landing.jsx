import { Link } from 'react-router-dom';
import './Landing.css';

const CONCEPTS = [
  {
    title: 'Context Assembly',
    description: 'Know what information to provide, from what sources, and why. Make the unstated explicit.'
  },
  {
    title: 'Quality Judgment',
    description: 'Calibrate when to trust AI output and when to verify. Distinguish "looks right" from "is right."'
  },
  {
    title: 'Task Decomposition',
    description: 'Break work into AI-appropriate chunks. Identify which subtasks to delegate vs. own.'
  },
  {
    title: 'Iterative Refinement',
    description: 'Move from 70% to 95% through structured feedback loops. First outputs are drafts, not products.'
  },
  {
    title: 'Workflow Integration',
    description: 'Embed AI into existing processes effectively. Build sustainable habits, not one-off experiments.'
  },
  {
    title: 'Frontier Recognition',
    description: 'Know when you\'re outside AI\'s reliable boundaries. "Can attempt" differs from "can do well."'
  }
];

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">AI Manager Skills</div>
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
              <li>Prompt engineering tricks</li>
              <li>Tool-specific tutorials</li>
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
