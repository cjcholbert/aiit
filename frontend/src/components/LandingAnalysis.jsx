import { useState, useEffect } from 'react';
import { AccordionSection } from './Accordion';

const API_BASE = import.meta.env.VITE_API_URL || '';

const RESULT_SECTIONS = [
  {
    key: 'coaching',
    title: 'Coaching',
    description: 'What was missing and how to fix it — a rewritten prompt that would have gotten a better result from the start.',
    fields: [
      {
        label: 'What Was Missing',
        subtext: 'The specific context your opening message left out that forced the AI to guess.',
        key: 'context_that_would_have_helped',
      },
      {
        label: 'Habit to Build',
        subtext: 'The one practice to adopt so this gap does not repeat in future conversations.',
        key: 'habit_to_build',
      },
      {
        label: 'Rewritten Opening Prompt',
        subtext: 'How your first message should have read — with all the missing context included.',
        key: 'prompt_rewrite',
        highlight: true,
      },
    ],
  },
  {
    key: 'pattern',
    title: 'Pattern',
    description: 'The category of context gap you fell into — a recurring blind spot that shows up across many AI users.',
    fields: [
      {
        label: 'Gap Category',
        subtext: 'The named type of context gap this conversation falls into.',
        key: 'category',
      },
      {
        label: 'Why This Pattern Matters',
        subtext: 'What this gap costs you in AI output quality and how recognising it changes your approach.',
        key: 'insight',
      },
    ],
  },
  {
    key: 'context_provided',
    title: 'Context Provided',
    description: 'What you did include in your opening prompt that gave the AI something useful to work with.',
    fields: [
      {
        label: 'What You Included',
        subtext: 'The context that was present in your opening message.',
        key: 'details',
      },
      {
        label: 'Why It Helped',
        subtext: 'What made this context effective — the signal that gave the AI traction. Keep doing this.',
        key: 'what_worked',
      },
    ],
  },
  {
    key: 'context_added_later',
    title: 'Context Added Later',
    description: 'Information that only came out mid-conversation — details that should have been in your first message.',
    fields: [
      {
        label: 'What Came Out Later',
        subtext: 'The information that only surfaced after the AI\'s first response.',
        key: 'details',
      },
      {
        label: 'What Triggered It',
        subtext: 'The moment or question in the conversation that revealed the missing context.',
        key: 'triggers',
      },
      {
        label: 'Could Have Been Upfront',
        subtext: 'Whether this context was available to you before the conversation started.',
        key: 'could_have_been_upfront',
        booleanText: [
          'Yes — this was knowable from the start and should have led your opening message.',
          'No — this was genuinely reactive information that only emerged through the conversation.',
        ],
      },
    ],
  },
];

export default function LandingAnalysis() {
  const [examples, setExamples] = useState([]);
  const [conversationText, setConversationText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/lesson1/examples`)
      .then(r => r.json())
      .then(data => {
        setExamples(data.examples || []);
      })
      .catch(() => {});
  }, []);

  const handleSelectExample = (title) => {
    const ex = examples.find(x => x.title === title);
    if (ex) {
      setConversationText(ex.raw_transcript);
      setAnalysis(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!conversationText.trim()) return;
    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    try {
      const res = await fetch(`${API_BASE}/lesson1/demo-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_transcript: conversationText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis failed.');
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="landing-analysis">
      <div className="landing-analysis-columns">

        {/* Left column — input */}
        <div className="landing-analysis-left">
          <select
            className="landing-analysis-select"
            value=""
            onChange={e => handleSelectExample(e.target.value)}
          >
            <option value="" disabled>Load an example…</option>
            {examples.map(ex => (
              <option key={ex.title} value={ex.title}>{ex.category}: {ex.title}</option>
            ))}
          </select>

          <textarea
            value={conversationText}
            onChange={e => setConversationText(e.target.value)}
            placeholder="Select an example above to load a conversation and analyze it…"
            className="landing-analysis-textarea"
          />

          <div className="landing-analysis-actions">
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!conversationText.trim() || analyzing}
            >
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </button>
            {analyzing && <div className="loading"><div className="spinner"></div>Analyzing with Claude…</div>}
          </div>

          {error && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--error-bg)', borderRadius: '8px', color: 'var(--accent-red)', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Right column — results or pre-analysis preview */}
        <div className="landing-analysis-right landing-result-accordions">
          {!analysis ? (
            <div className="landing-analysis-preview">
              <p className="landing-analysis-preview-title">What the analysis surfaces</p>
              <ul className="landing-analysis-preview-list">
                <li>
                  <span className="landing-analysis-preview-label">Coaching</span>
                  A rewritten version of your opening prompt with the missing context included, plus one habit to adopt.
                </li>
                <li>
                  <span className="landing-analysis-preview-label">Pattern</span>
                  The named category of context gap your conversation fell into — and why it matters.
                </li>
                <li>
                  <span className="landing-analysis-preview-label">Context Provided</span>
                  What you did include that gave the AI something useful to work with.
                </li>
                <li>
                  <span className="landing-analysis-preview-label">Context Added Later</span>
                  Information that only came out mid-conversation that should have been in your first message.
                </li>
              </ul>
            </div>
          ) : (
            RESULT_SECTIONS.map(section => {
              const data = analysis[section.key];
              return (
                <AccordionSection key={section.key + '-open'} title={section.title} defaultOpen={true}>
                  <p className="landing-result-description">{section.description}</p>
                  {data ? (
                    <div className="landing-result-fields">
                      {section.fields.map(field => {
                        const value = field.boolean
                        ? (data[field.key] ? 'Yes' : 'No')
                        : field.booleanText
                        ? (data[field.key] ? field.booleanText[0] : field.booleanText[1])
                        : data[field.key];
                        if (!value) return null;
                        return (
                          <div key={field.key} className="landing-result-field">
                            <div className="landing-result-field-label">{field.label}</div>
                            {field.subtext && <div className="landing-result-field-subtext">{field.subtext}</div>}
                            <div className={`landing-result-field-value ${field.highlight ? 'landing-result-highlight' : ''}`}>
                              {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </AccordionSection>
              );
            })
          )}
        </div>

      </div>

      {/* Fix #4 — conversion CTA after analysis */}
      {analysis && (
        <div className="landing-analysis-cta">
          <p className="landing-analysis-cta-text">
            Want to track patterns like this across all your AI conversations?
          </p>
          <a href="/register" className="btn btn-primary">
            Start the full course free →
          </a>
        </div>
      )}

    </div>
  );
}
