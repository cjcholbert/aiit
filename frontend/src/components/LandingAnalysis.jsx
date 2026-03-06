import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Parser (mirrors Lesson01 logic) ─────────────────────────────────────────

function parseWithLabels(text, userLabel, assistantLabel) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escape(userLabel)}|${escape(assistantLabel)})`, 'g');
  const parts = text.split(pattern).filter(p => p.trim());
  const messages = [];
  let role = null, content = '';
  for (const part of parts) {
    const p = part.trim();
    if (p === userLabel) {
      if (role && content.trim()) messages.push({ role, content: content.trim() });
      role = 'user'; content = '';
    } else if (p === assistantLabel) {
      if (role && content.trim()) messages.push({ role, content: content.trim() });
      role = 'assistant'; content = '';
    } else if (role) {
      content += part;
    }
  }
  if (role && content.trim()) messages.push({ role, content: content.trim() });
  return messages;
}

function convertToJSON(raw) {
  const LABEL_PATTERNS = [
    { user: 'You:', assistant: 'AI:' },
    { user: 'Human:', assistant: 'Assistant:' },
    { user: 'User:', assistant: 'Bot:' },
    { user: 'Me:', assistant: 'Claude:' },
    { user: 'Me:', assistant: 'ChatGPT:' },
    { user: 'Q:', assistant: 'A:' },
  ];

  const text = raw.trim();
  if (!text) return { error: 'No conversation text provided.' };

  try {
    const parsed = JSON.parse(text);
    if (parsed.messages) return { output: JSON.stringify(parsed, null, 2), stats: countMessages(parsed.messages) };
  } catch (_) {}

  for (const { user, assistant } of LABEL_PATTERNS) {
    if (text.includes(user) || text.includes(assistant)) {
      const messages = parseWithLabels(text, user, assistant);
      if (messages.length >= 2) {
        const result = { messages };
        return { output: JSON.stringify(result, null, 2), stats: countMessages(messages) };
      }
    }
  }

  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
  if (blocks.length >= 2) {
    const messages = blocks.map((b, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: b.trim() }));
    const result = { messages };
    return { output: JSON.stringify(result, null, 2), stats: countMessages(messages) };
  }

  return { error: 'Could not detect conversation format. Try selecting a different example.' };
}

function countMessages(messages) {
  return {
    total: messages.length,
    user: messages.filter(m => m.role === 'user').length,
    assistant: messages.filter(m => m.role === 'assistant').length,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LandingAnalysis() {
  const [examples, setExamples] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [conversationText, setConversationText] = useState('');
  const [parsedOutput, setParsedOutput] = useState('');
  const [parseStats, setParseStats] = useState(null);
  const [parseError, setParseError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/lesson1/examples`)
      .then(r => r.json())
      .then(data => {
        setExamples(data.examples || []);
        setCategories(data.categories || []);
      })
      .catch(() => {});
  }, []);

  const filteredExamples = selectedCategory
    ? examples.filter(e => e.category === selectedCategory)
    : examples;

  const handleSelectExample = (example) => {
    setConversationText(example.raw_transcript);
    setParsedOutput('');
    setParseStats(null);
    setParseError('');
    setAnalysis(null);
    setAnalyzeError('');
  };

  const handleParse = () => {
    setParseError('');
    setParsedOutput('');
    setParseStats(null);
    setAnalysis(null);
    const result = convertToJSON(conversationText);
    if (result.error) {
      setParseError(result.error);
    } else {
      setParsedOutput(result.output);
      setParseStats(result.stats);
    }
  };

  const handleAnalyze = async () => {
    if (!conversationText.trim()) return;
    setAnalyzing(true);
    setAnalyzeError('');
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
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="landing-analysis">
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Analyze Conversation</h2>

        {/* Examples dropdown */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="landing-analysis-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="landing-analysis-select"
            defaultValue=""
            onChange={e => {
              const ex = examples.find(x => x.title === e.target.value);
              if (ex) handleSelectExample(ex);
            }}
          >
            <option value="" disabled>Load an example…</option>
            {filteredExamples.map(ex => (
              <option key={ex.title} value={ex.title}>{ex.title}</option>
            ))}
          </select>
        </div>

        {/* Two-column: conversation + parsed preview */}
        <div className="analyze-paste-grid">
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Conversation</label>
            <textarea
              value={conversationText}
              onChange={e => setConversationText(e.target.value)}
              placeholder="Select an example above to load a conversation…"
              style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Parsed Preview</label>
            <textarea
              value={parsedOutput}
              readOnly
              placeholder="Parsed messages will appear here…"
              style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-tertiary)' }}
            />
          </div>
        </div>

        {parseStats && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-green)' }}>
            Parsed {parseStats.total} messages ({parseStats.user} user, {parseStats.assistant} assistant)
          </div>
        )}
        {parseError && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--error-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-red)' }}>
            {parseError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleParse} disabled={!conversationText.trim()}>
            Parse
          </button>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={!conversationText.trim() || analyzing}>
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
          {analyzing && (
            <div className="loading"><div className="spinner"></div>Analyzing with Claude…</div>
          )}
        </div>
      </div>

      {analyzeError && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--error-bg)', borderRadius: '8px', color: 'var(--accent-red)', fontSize: '13px' }}>
          {analyzeError}
        </div>
      )}

      {analysis && (
        <div className="analysis-grid" style={{ marginTop: '24px' }}>
          <div className="analysis-card">
            <h3>Coaching</h3>
            <div className="field">
              <div className="field-label">Context That Would Have Helped</div>
              <div className="field-value">{analysis.coaching?.context_that_would_have_helped}</div>
            </div>
            <div className="field">
              <div className="field-label">Habit to Build</div>
              <div className="field-value">{analysis.coaching?.habit_to_build}</div>
            </div>
            <div className="field">
              <div className="field-label">Improved Prompt</div>
              <div className="prompt-rewrite">{analysis.coaching?.prompt_rewrite}</div>
            </div>
          </div>

          <div className="analysis-card">
            <h3>Pattern</h3>
            <div className="field">
              <div className="field-label">Category</div>
              <div className="field-value">{analysis.pattern?.category}</div>
            </div>
            <div className="field">
              <div className="field-label">Insight</div>
              <div className="field-value">{analysis.pattern?.insight}</div>
            </div>
          </div>

          <div className="analysis-card">
            <h3>Context Provided</h3>
            <div className="field">
              <div className="field-label">Details</div>
              <div className="field-value">{analysis.context_provided?.details}</div>
            </div>
            <div className="field">
              <div className="field-label">What Worked</div>
              <div className="field-value">{analysis.context_provided?.what_worked}</div>
            </div>
          </div>

          <div className="analysis-card">
            <h3>Context Added Later</h3>
            <div className="field">
              <div className="field-label">Details</div>
              <div className="field-value">{analysis.context_added_later?.details}</div>
            </div>
            <div className="field">
              <div className="field-label">Could Have Been Upfront</div>
              <div className="field-value">{analysis.context_added_later?.could_have_been_upfront ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
