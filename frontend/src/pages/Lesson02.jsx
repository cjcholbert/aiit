import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// Quality level styles
const QUALITY_STYLES = {
  specific: { color: 'var(--accent-green)', bg: 'var(--success-bg)', label: 'Specific', icon: '🎯' },
  adequate: { color: 'var(--accent-yellow)', bg: 'var(--warning-bg)', label: 'Adequate', icon: '📝' },
  vague: { color: 'var(--accent-red)', bg: 'var(--error-bg)', label: 'Vague', icon: '🌫️' },
};

export default function Lesson02() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [entries, setEntries] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analyze state
  const [feedbackInput, setFeedbackInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('other');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Selected entry state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rewriteInput, setRewriteInput] = useState('');

  // Fetch data
  const fetchEntries = async () => {
    try {
      const data = await api.get('/lesson2/entries');
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const fetchPatterns = async () => {
    try {
      const data = await api.get('/lesson2/patterns');
      setPatterns(data);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson2/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEntries(), fetchPatterns(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handlers
  const handleAnalyze = async (saveEntry = false) => {
    if (!feedbackInput.trim()) {
      setError('Please enter some feedback to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      if (saveEntry) {
        const entry = await api.post('/lesson2/entries', {
          feedback: feedbackInput,
          context: contextInput,
          category: categoryInput,
        });
        setAnalysisResult(entry.analysis);
        await fetchEntries();
        await fetchStats();
      } else {
        const result = await api.post('/lesson2/analyze', {
          feedback: feedbackInput,
          context: contextInput,
          category: categoryInput,
        });
        setAnalysisResult(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    setFeedbackInput('');
    setContextInput('');
    setCategoryInput('other');
    setAnalysisResult(null);
  };

  const handleSelectEntry = async (id) => {
    try {
      const entry = await api.get(`/lesson2/entries/${id}`);
      setSelectedEntry(entry);
      setRewriteInput(entry.rewritten_feedback || '');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveRewrite = async () => {
    if (!selectedEntry) return;
    try {
      const updated = await api.put(`/lesson2/entries/${selectedEntry.id}`, {
        rewritten_feedback: rewriteInput,
      });
      setSelectedEntry(updated);
      await fetchEntries();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleExample = async () => {
    if (!selectedEntry) return;
    try {
      const updated = await api.put(`/lesson2/entries/${selectedEntry.id}`, {
        is_example: !selectedEntry.is_example,
      });
      setSelectedEntry(updated);
      await fetchEntries();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.del(`/lesson2/entries/${id}`);
      await fetchEntries();
      await fetchStats();
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson2/entries/seed-examples', {});
      await fetchEntries();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL feedback entries? This cannot be undone.')) return;
    try {
      for (const e of entries) {
        await api.del(`/lesson2/entries/${e.id}`);
      }
      await fetchEntries();
      await fetchStats();
      setSelectedEntry(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render quality badge
  const renderQualityBadge = (level, score) => {
    const style = QUALITY_STYLES[level] || QUALITY_STYLES.vague;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: style.bg,
          color: style.color,
          padding: '4px 12px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}>
          {style.icon} {style.label}
        </span>
        <span style={{ color: style.color, fontWeight: 'bold' }}>{score}/10</span>
      </div>
    );
  };

  // Render analysis result
  const renderAnalysis = (analysis, showRewriteSuggestion = true) => {
    if (!analysis) return null;

    const style = QUALITY_STYLES[analysis.quality_level] || QUALITY_STYLES.vague;

    return (
      <div className="card" style={{ padding: '20px', background: style.bg, borderLeft: `4px solid ${style.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>Analysis Result</h4>
          {renderQualityBadge(analysis.quality_level, analysis.quality_score)}
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{analysis.summary}</p>

        {/* Issues */}
        {analysis.issues && analysis.issues.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ margin: '0 0 8px', color: 'var(--accent-red)' }}>Issues Found</h5>
            {analysis.issues.map((issue, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--accent-red)' }}>[X]</span>
                  <strong>{patterns?.[issue.pattern]?.name || issue.pattern}</strong>
                </div>
                <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{issue.description}</p>
                <p style={{ margin: '4px 0', color: 'var(--accent-blue)', fontSize: '0.85rem' }}>
                  <strong>Fix:</strong> {issue.suggestion}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ margin: '0 0 8px', color: 'var(--accent-green)' }}>Strengths</h5>
            {analysis.strengths.map((strength, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <span style={{ color: 'var(--accent-green)' }}>[OK]</span>
                <span>{strength}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rewrite suggestion */}
        {showRewriteSuggestion && analysis.rewrite_suggestion && (
          <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px', borderLeft: '3px solid #60a5fa' }}>
            <h5 style={{ margin: '0 0 8px', color: 'var(--accent-blue)' }}>How to Improve</h5>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {analysis.rewrite_suggestion}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Feedback Analyzer</h1>
        <p className="page-description">
          <strong>The Problem:</strong> Vague feedback like "make it better" or "this isn't right" wastes iteration
          cycles and frustrates both you and the AI. Without specific, actionable feedback, you'll keep going in circles.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Write feedback that identifies specific locations, states clear actions,
          and explains reasoning. Learn to spot vague patterns in your own feedback and rewrite them.
        </p>
      </header>

      {error && (
        <div className="error-banner" style={{ background: 'var(--error-bg)', padding: '12px', marginBottom: '16px', borderRadius: '8px', color: 'var(--accent-red)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['learn', 'analyze', 'history', 'stats'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="learn-section">
          <h2>Vague vs. Specific Feedback</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Learn to recognize these common patterns of vague feedback and how to fix them.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {patterns && Object.entries(patterns).map(([key, pattern]) => (
              <div key={key} className="card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px', color: 'var(--accent-red)' }}>{pattern.name}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>{pattern.description}</p>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>EXAMPLES (Avoid)</div>
                  {pattern.examples.map((ex, idx) => (
                    <div key={idx} style={{
                      background: 'var(--error-bg)',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      color: 'var(--accent-red)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      "{ex}"
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HOW TO FIX</div>
                  <div style={{
                    background: 'var(--success-bg)',
                    padding: '12px',
                    borderRadius: '4px',
                    color: 'var(--accent-green)',
                    fontSize: '0.9rem'
                  }}>
                    {pattern.fix}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Good vs Bad Examples */}
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3>Side-by-Side Comparison</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <h4 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Vague (Avoid)</h4>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"This code doesn't work right."</p>
                </div>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"Make the writing better."</p>
                </div>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"I don't like how this looks."</p>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>Specific (Use)</h4>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0 }}>"The validate_email function on line 42 returns True for inputs without an @ symbol. Add a check for @ and return False if missing."</p>
                </div>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0 }}>"The introduction is 150 words. Shorten it to under 50 words and start with a question to hook the reader."</p>
                </div>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ margin: 0 }}>"The submit button blends into the background. Change it to a contrasting color (#0078d4) and increase padding to 12px 24px."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && (
        <div className="analyze-section">
          {selectedEntry ? (
            // View/Edit Entry
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Feedback Entry</h2>
                <button className="btn btn-secondary" onClick={() => { setSelectedEntry(null); setRewriteInput(''); }}>
                  Back
                </button>
              </div>

              {/* Original feedback */}
              <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px' }}>Original Feedback</h4>
                {selectedEntry.context && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Context: {selectedEntry.context}
                  </div>
                )}
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedEntry.original_feedback}</p>
                </div>
              </div>

              {/* Analysis */}
              {renderAnalysis(selectedEntry.analysis, true)}

              {/* Rewrite section */}
              <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>Your Rewrite</h4>
                  <button
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 12px',
                      background: selectedEntry.is_example ? 'var(--accent-green)' : 'var(--bg-tertiary)'
                    }}
                    onClick={handleToggleExample}
                  >
                    {selectedEntry.is_example ? 'Saved as Example' : 'Save as Example'}
                  </button>
                </div>
                <textarea
                  value={rewriteInput}
                  onChange={(e) => setRewriteInput(e.target.value)}
                  placeholder="Write an improved, specific version of this feedback..."
                  className="input"
                  rows={5}
                  style={{ width: '100%', marginBottom: '12px' }}
                />
                <button className="btn btn-primary" onClick={handleSaveRewrite}>
                  Save Rewrite
                </button>
              </div>
            </div>
          ) : (
            // Analyze new feedback
            <div>
              <h2>Analyze Your Feedback</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Paste feedback you've given (or are about to give) to an AI. We'll analyze it for vague patterns
                and suggest improvements.
              </p>

              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Your Feedback *</label>
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Paste the feedback you gave or plan to give..."
                    className="input"
                    rows={5}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                      Context <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={contextInput}
                      onChange={(e) => setContextInput(e.target.value)}
                      placeholder="e.g., Code review, article editing, UI feedback..."
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px' }}>Category</label>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="code">Code</option>
                      <option value="writing">Writing</option>
                      <option value="design">Design</option>
                      <option value="analysis">Analysis</option>
                      <option value="documentation">Documentation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAnalyze(false)}
                    disabled={analyzing || !feedbackInput.trim()}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Only'}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-green)' }}
                    onClick={() => handleAnalyze(true)}
                    disabled={analyzing || !feedbackInput.trim()}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze & Save'}
                  </button>
                  {analysisResult && (
                    <button className="btn btn-secondary" onClick={handleClearAnalysis}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Analysis result */}
              {analysisResult && renderAnalysis(analysisResult)}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Feedback History</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {entries.length === 0 && (
                <button className="btn btn-secondary" onClick={handleSeedExamples}>
                  Load Examples
                </button>
              )}
              {entries.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAll} style={{ background: 'var(--accent-red)' }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No feedback entries yet</h3>
              <p>Analyze some feedback to start tracking your patterns.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {entries.map((entry) => {
                const style = QUALITY_STYLES[entry.quality_level] || QUALITY_STYLES.vague;
                return (
                  <div
                    key={entry.id}
                    className="card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${style.color}`,
                      background: entry.is_example ? 'var(--success-bg)' : 'var(--bg-secondary)'
                    }}
                    onClick={() => { handleSelectEntry(entry.id); setActiveTab('analyze'); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          {renderQualityBadge(entry.quality_level, entry.quality_score)}
                          {entry.is_example && (
                            <span style={{ background: 'var(--accent-green)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                              EXAMPLE
                            </span>
                          )}
                          {entry.has_rewrite && (
                            <span style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                              REWRITTEN
                            </span>
                          )}
                          {entry.category && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{entry.category}</span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{entry.original_feedback}</p>
                      </div>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', background: 'var(--accent-red)', marginLeft: '12px' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2>Feedback Quality Statistics</h2>

          {stats && stats.total_entries > 0 ? (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total_entries}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Total Entries</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.avg_quality_score}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Avg Score</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.examples_saved}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Examples Saved</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.rewrites_completed}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Rewrites Done</div>
                </div>
              </div>

              {/* Quality distribution */}
              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3>Quality Distribution</h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  {Object.entries(stats.entries_by_level).map(([level, count]) => {
                    const style = QUALITY_STYLES[level] || QUALITY_STYLES.vague;
                    const percentage = Math.round((count / stats.total_entries) * 100);
                    return (
                      <div key={level} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: style.color }}>{style.icon} {style.label}</span>
                          <span style={{ fontWeight: 'bold' }}>{count} ({percentage}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: style.color,
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Common issues */}
              {stats.common_issues && stats.common_issues.length > 0 && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3>Your Common Issues</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    These are the vague patterns you fall into most often.
                  </p>
                  {stats.common_issues.map((issue, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--accent-red)' }}>{issue.name}</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                          {patterns?.[issue.pattern]?.description}
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-red)' }}>{issue.count}x</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Improvement rate */}
              <div className="card" style={{ padding: '24px' }}>
                <h3>Improvement Rate</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Percentage of vague feedback that you've rewritten to be more specific.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1, height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats.improvement_rate}%`,
                      background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                      borderRadius: '6px'
                    }} />
                  </div>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-green)', minWidth: '60px' }}>
                    {stats.improvement_rate}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No statistics yet</h3>
              <p>Analyze some feedback to see your patterns.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
