import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import { useLessonStats } from '../contexts/LessonStatsContext';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';

// Quality level styles
const QUALITY_STYLES = {
  specific: { color: 'var(--accent-green)', bg: 'var(--success-bg)', label: 'Specific', icon: '🎯' },
  adequate: { color: 'var(--accent-yellow)', bg: 'var(--warning-bg)', label: 'Adequate', icon: '📝' },
  vague: { color: 'var(--accent-red)', bg: 'var(--error-bg)', label: 'Vague', icon: '🌫️' },
};

export default function Lesson02() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('concepts');
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

  // Import from Context Tracker state
  const [conversations, setConversations] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Selected entry state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rewriteInput, setRewriteInput] = useState('');

  const { setStats: setSidebarStats } = useLessonStats();

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

  useEffect(() => {
    setSidebarStats([
      { label: 'Total Entries', value: stats?.total_entries ?? '-', color: 'var(--accent-blue)' },
      { label: 'Avg Score', value: stats?.avg_quality_score ?? '-', color: 'var(--accent-yellow)' },
      { label: 'Examples Saved', value: stats?.examples_saved ?? '-', color: 'var(--accent-green)' },
      { label: 'Rewrites Done', value: stats?.rewrites_completed ?? '-', color: 'var(--accent-purple)' },
    ]);
    return () => setSidebarStats(null);
  }, [stats, setSidebarStats]);


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

  const handleOpenImport = async () => {
    if (showImport) {
      setShowImport(false);
      return;
    }
    setLoadingConversations(true);
    try {
      const data = await api.get('/lesson1/conversations');
      setConversations(data);
      setShowImport(true);
    } catch (err) {
      setError('Could not load conversations from Context Tracker: ' + err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleImportConversation = async (id) => {
    try {
      const conv = await api.get(`/lesson1/conversations/${id}`);
      setFeedbackInput(conv.raw_transcript || '');
      setContextInput(conv.topic || '');
      setShowImport(false);
    } catch (err) {
      setError('Could not load conversation: ' + err.message);
    }
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
          <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px', borderLeft: '3px solid var(--accent-blue)' }}>
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
      <div className="lesson-header">
        <div className="lesson-header-left">
          <h1>Feedback Analyzer</h1>
          <ConnectionCallout lessonNumber={1} lessonTitle="Context Tracker" message="Spot vague feedback patterns and rewrite them into specific, actionable directions that get better results faster." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> Vague feedback like "make it better" or "this isn't right" wastes iteration cycles and frustrates both you and the AI. Without specific, actionable feedback, you'll keep going in circles.</p>
            <p><strong>The Skill:</strong> Write feedback that identifies specific locations, states clear actions, and explains reasoning. Learn to spot vague patterns in your own feedback and rewrite them.</p>
          </div>

        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ background: 'var(--error-bg)', padding: '12px', marginBottom: '16px', borderRadius: '8px', color: 'var(--accent-red)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['concepts', 'analysis', 'history'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Learn Tab */}
      {activeTab === 'concepts' && (
        <div className="learn-section">
          <AccordionSection title="🧭 How This Lesson Works">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Two practice areas to sharpen your feedback skills:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 style={{ color: 'var(--accent-blue)' }}>Analyze Tab — Score Your Feedback</h4>
                <p>Paste feedback you've given (or are about to give) to an AI. The tool scores it for
                specificity, identifies vague patterns, and shows you exactly how to rewrite it. You
                can save entries to track improvement over time.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 style={{ color: 'var(--accent-green)' }}>History Tab — Track Your Patterns</h4>
                <p>See all your analyzed feedback entries, quality scores, and most common vague patterns.
                Practice rewriting your weakest entries and save your best rewrites as reference examples.</p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Vague Feedback vs. Specific Feedback">
            <div className="learn-comparison">
            <div className="learn-comparison-grid">
              <div className="learn-comparison-col">
                <h4 className="poor">Vague (AI Has to Guess)</h4>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Marketing Copy Review</div>
                  <p>"This isn't right. Make it better."</p>
                </div>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Presentation Slides</div>
                  <p>"The slides need work. They don't feel professional."</p>
                </div>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Hiring Process</div>
                  <p>"The job posting isn't attracting the right candidates."</p>
                </div>
              </div>
              <div className="learn-comparison-col">
                <h4 className="good">Specific (AI Can Act Immediately)</h4>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Marketing Copy Review</div>
                  <p>"The headline is too generic — replace 'Solutions for Your Business' with something
                  that names our target audience (HR directors at mid-size companies). Also, the CTA in the
                  last paragraph says 'learn more' — change it to 'Book a 15-minute demo' with a specific link."</p>
                </div>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Presentation Slides</div>
                  <p>"Slides 3-5 have too much text — limit each to 3 bullet points max, with no bullet
                  longer than 12 words. Move the detailed data to speaker notes. Slide 7 needs a chart
                  instead of a table to make the year-over-year trend visible at a glance."</p>
                </div>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Hiring Process</div>
                  <p>"The job posting lists 12 requirements — pare it down to 5 must-haves and move the rest
                  to a 'nice to have' section. Add the salary range ($65-80K) since postings with ranges get
                  3x more applications. Change 'rockstar developer' to specific skills like 'experience with
                  React and REST APIs'."</p>
                </div>
              </div>
            </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🔑 The Five Patterns of Vague Feedback">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            These are the patterns the Analyze tab identifies. Once you learn to spot them, you'll catch
            yourself before hitting send.
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>Judgment Without Direction</h4>
              <p>You state an opinion but don't say what to change. The AI knows you're unhappy but
              not what would make you happy.</p>
              <div className="learn-example-bad">"I don't like this tone."</div>
              <div className="learn-example-good">"The tone is too casual for our board audience.
              Replace contractions with formal phrasing and remove the jokes in paragraphs 2 and 4."</div>
            </div>

            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>Vague Qualifiers</h4>
              <p>Words like "better," "more," "different," or "improved" without specifying a direction
              or measurable target.</p>
              <div className="learn-example-bad">"Make it more engaging."</div>
              <div className="learn-example-good">"Start each section with a question that speaks to a
              common frustration our customers have. Replace the bulleted features list with a before/after
              comparison."</div>
            </div>

            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>Missing Location</h4>
              <p>You describe a problem but don't point to where it occurs. The AI has to scan
              everything trying to find it.</p>
              <div className="learn-example-bad">"There's an error in the numbers."</div>
              <div className="learn-example-good">"The revenue figure in the Q3 column of the summary
              table shows $1.2M, but our actual Q3 revenue was $1.4M. Update it and recalculate the
              year-to-date total in the last row."</div>
            </div>

            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>Contradictory Instructions</h4>
              <p>You ask for two things that conflict without acknowledging the tension, leaving AI
              to pick one and get it wrong.</p>
              <div className="learn-example-bad">"Make it shorter but include more detail."</div>
              <div className="learn-example-good">"Keep the executive summary under 200 words — just
              the key findings. Move the methodology details and supporting data into an appendix
              section at the end."</div>
            </div>

            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>Absent Reasoning</h4>
              <p>You say what to change but not why. Without understanding the goal, AI may make
              the change in a way that creates new problems.</p>
              <div className="learn-example-bad">"Remove the third paragraph."</div>
              <div className="learn-example-good">"Remove the third paragraph — it covers pricing, and
              we don't want to mention pricing until the follow-up meeting. Replace it with a sentence
              about next steps."</div>
            </div>
          </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Stacking multiple pieces of vague feedback in one message, hoping AI will figure out
                which matters most. "Fix the formatting, improve the flow, and make it shorter."</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Give one specific instruction at a time, or number them in priority order: "1. Reduce to
                  under 300 words by cutting the background section. 2. Move the recommendation to the first
                  paragraph. 3. Bold the three action items."
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Starting fresh instead of iterating. When the output is 70% right, some people throw
                it away and re-prompt from scratch rather than giving targeted fixes.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Name what's working and what's not: "The structure and key points are good. Change the
                  opening paragraph to lead with the cost savings data instead of the project background, and
                  cut the last two bullets — they're nice-to-haves, not essentials."
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analysis' && (
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

              {/* Import from Context Tracker */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenImport}
                  disabled={loadingConversations}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loadingConversations ? 'Loading...' : showImport ? 'Hide Import' : 'Import from Context Tracker'}
                </button>

                {showImport && (
                  <div className="card" style={{ padding: '16px', marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 12px' }}>Select a Conversation</h4>
                    {conversations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        <p>No conversations saved yet.</p>
                        <p style={{ fontSize: '0.85rem' }}>
                          Go to <a href="/lesson/1" style={{ color: 'var(--accent-blue)' }}>Lesson 1 — Context Tracker</a> to analyze and save a conversation first.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => handleImportConversation(conv.id)}
                            style={{
                              padding: '12px',
                              background: 'var(--bg-tertiary)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid var(--border-color)',
                              transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{conv.topic || 'Untitled'}</strong>
                              {conv.pattern_category && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)',
                                }}>
                                  {conv.pattern_category}
                                </span>
                              )}
                            </div>
                            {conv.created_at && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {new Date(conv.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Your Feedback *</label>
                    <ExamplesDropdown
                      endpoint="/lesson2/examples"
                      onSelect={(example) => {
                        setFeedbackInput(example.original_feedback || '');
                        setContextInput(example.context || '');
                        setCategoryInput(example.feedback_category || 'other');
                      }}
                    />
                  </div>
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

      {/* History Tab — accordion layout */}
      {activeTab === 'history' && (
        <div className="learn-section">
          <AccordionSection title={`📋 Feedback History (${entries.length})`}>
            {entries.length === 0 ? (
              <div>
                <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                  Analyze feedback in the Analysis tab and you'll receive the following for each entry:
                </p>
                <div className="analysis-grid">
                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                    <h3>Quality Score</h3>
                    <div className="field">
                      <div className="field-label">Rating</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>A score from 1-10 measuring how specific and actionable your feedback is, rated as Specific, Adequate, or Vague.</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Summary</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>A plain-language assessment of what your feedback communicates and where it falls short.</div>
                    </div>
                  </div>
                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                    <h3>Issues Found</h3>
                    <div className="field">
                      <div className="field-label">Pattern</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>The type of vagueness detected — such as judgment without direction ("this doesn't work") or missing location ("fix the formatting").</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Suggestion</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>A concrete rewrite showing how to make that specific piece of feedback actionable.</div>
                    </div>
                  </div>
                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                    <h3>Strengths</h3>
                    <div className="field">
                      <div className="field-label">What Worked</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>Elements of your feedback that were already specific and useful — so you know what to keep doing.</div>
                    </div>
                  </div>
                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                    <h3>Rewrite Suggestion</h3>
                    <div className="field">
                      <div className="field-label">Improved Version</div>
                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>A full rewrite of your original feedback that adds specificity, location, and clear next steps.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button className="btn btn-danger" onClick={handleClearAll}>
                    Clear All
                  </button>
                </div>
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
                        onClick={() => { handleSelectEntry(entry.id); setActiveTab('analysis'); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
                            style={{ padding: '4px 8px', marginLeft: '12px' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="📊 Quality Statistics">
            {stats && stats.total_entries > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Quality distribution */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ marginTop: 0 }}>Quality Distribution</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {Object.entries(stats.entries_by_level).map(([level, count]) => {
                      const style = QUALITY_STYLES[level] || QUALITY_STYLES.vague;
                      const percentage = Math.round((count / stats.total_entries) * 100);
                      return (
                        <div key={level}>
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
                  <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0 }}>Your Common Issues</h3>
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
                  <h3 style={{ marginTop: 0 }}>Improvement Rate</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Percentage of vague feedback that you've rewritten to be more specific.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${stats.improvement_rate}%`,
                        background: 'linear-gradient(90deg, var(--accent-green), var(--accent-green-hover))',
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
          </AccordionSection>

        </div>
      )}
    </div>
  );
}
