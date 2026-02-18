import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import StatsPanel from '../components/StatsPanel';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';

// Trust level colors and guidelines
const TRUST_LEVELS = {
  high: {
    bg: 'var(--success-bg)',
    border: 'var(--border-color)',
    text: 'var(--accent-green)',
    label: 'High Trust',
    icon: '✅',
    description: 'Well-documented topics, established patterns, easy to test',
    action: 'Trust with basic verification',
  },
  medium: {
    bg: 'var(--warning-bg)',
    border: 'var(--border-color)',
    text: 'var(--accent-yellow)',
    label: 'Medium Trust',
    icon: '⚠️',
    description: 'Generally reliable but context-dependent, may have outdated info',
    action: 'Trust but verify carefully',
  },
  low: {
    bg: 'var(--error-bg)',
    border: 'var(--border-color)',
    text: 'var(--accent-red)',
    label: 'Low Trust',
    icon: '🚨',
    description: 'Requires domain expertise, rapidly changing field, your specific context unknown',
    action: 'Treat as starting point only',
  },
};

// Category colors
const CATEGORY_COLORS = {
  Code: 'var(--accent-blue)',
  Security: 'var(--accent-red)',
  Compliance: 'var(--accent-yellow)',
  Architecture: 'var(--accent-purple)',
  Documentation: 'var(--accent-green)',
  Analysis: 'var(--accent-blue)',
  Custom: 'var(--text-muted)',
};

// Output type prompts for personalization
const OUTPUT_TYPE_PROMPTS = [
  'What types of AI output do you use most in your work?',
  'Think about: code, documentation, analysis, recommendations...',
  'Consider what you ask AI to do daily or weekly.',
];

export default function Lesson05() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('concepts');
  const [outputTypes, setOutputTypes] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New domain form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOutputType, setNewOutputType] = useState({
    name: '',
    category: 'Code',
    trust_level: 'medium',
    reasoning: '',
    verification_approach: '',
    examples: [],
  });
  const [newExample, setNewExample] = useState('');

  // Edit domain state
  const [editingOutputType, setEditingOutputType] = useState(null);
  const [editExample, setEditExample] = useState('');

  // New prediction form state
  const [newPrediction, setNewPrediction] = useState({
    output_type_id: '',
    output_description: '',
    confidence_rating: 5,
    uncertainty_notes: '',
  });

  // Verification form state
  const [verifyingPrediction, setVerifyingPrediction] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    was_correct: null,
    actual_issues: '',
    verification_method: '',
    verification_time_seconds: null,
    calibration_note: '',
  });

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);

  // Expanded domain view
  const [expandedOutputType, setExpandedOutputType] = useState(null);

  const fetchOutputTypes = async () => {
    try {
      const data = await api.get('/lesson5/output-types');
      setOutputTypes(data);
    } catch (err) {
      console.error('Failed to fetch outputTypes:', err);
    }
  };

  const fetchPredictions = async () => {
    try {
      const data = await api.get('/lesson5/predictions?limit=100');
      setPredictions(data);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson5/calibration/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await api.get('/lesson5/calibration/insights');
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOutputTypes(), fetchPredictions(), fetchStats(), fetchInsights()]);
      setLoading(false);
    };
    loadData();
  }, []);


  const handleSeedDefaults = async () => {
    try {
      const result = await api.post('/lesson5/output-types/seed-defaults', {});
      console.log('Seeded output types:', result);
      await fetchOutputTypes();
      setError(null);
    } catch (err) {
      console.error('Seed error:', err);
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL output types? This cannot be undone.')) return;
    try {
      // Delete each output type
      for (const ot of outputTypes) {
        await api.del(`/lesson5/output-types/${ot.id}`);
      }
      await fetchOutputTypes();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOutputType = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lesson5/output-types', newOutputType);
      await fetchOutputTypes();
      setShowAddForm(false);
      setNewOutputType({
        name: '',
        category: 'Code',
        trust_level: 'medium',
        reasoning: '',
        verification_approach: '',
        examples: [],
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateOutputType = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/lesson5/output-types/${editingOutputType.id}`, {
        name: editingOutputType.name,
        category: editingOutputType.category,
        trust_level: editingOutputType.trust_level,
        reasoning: editingOutputType.reasoning,
        verification_approach: editingOutputType.verification_approach,
        examples: editingOutputType.examples || [],
      });
      await fetchOutputTypes();
      setEditingOutputType(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteOutputType = async (id) => {
    if (!confirm('Delete this output type? Predictions linked to it will be kept.')) return;
    try {
      await api.del(`/lesson5/output-types/${id}`);
      await fetchOutputTypes();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePrediction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lesson5/predictions', newPrediction);
      await fetchPredictions();
      await fetchStats();
      setNewPrediction({
        output_type_id: '',
        output_description: '',
        confidence_rating: 5,
        uncertainty_notes: '',
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyPrediction = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/lesson5/predictions/${verifyingPrediction.id}/verify`, verificationForm);
      await fetchPredictions();
      await fetchStats();
      setVerifyingPrediction(null);
      setVerificationForm({
        was_correct: null,
        actual_issues: '',
        verification_method: '',
        verification_time_seconds: null,
        calibration_note: '',
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickVerify = async (prediction, wasCorrect) => {
    try {
      await api.put(`/lesson5/predictions/${prediction.id}/verify`, {
        was_correct: wasCorrect,
        verification_method: 'Quick verify',
      });
      await fetchPredictions();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post('/lesson5/calibration/analyze', {});
      await fetchInsights();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Determine if prediction was miscalibrated
  const getMiscalibrationType = (prediction) => {
    if (prediction.was_correct === null) return null;
    if (prediction.confidence_rating >= 7 && !prediction.was_correct) return 'over_trust';
    if (prediction.confidence_rating <= 4 && prediction.was_correct) return 'over_verify';
    return 'calibrated';
  };

  // Group outputTypes by trust level
  const outputTypesByLevel = {
    high: outputTypes.filter((d) => d.trust_level === 'high'),
    medium: outputTypes.filter((d) => d.trust_level === 'medium'),
    low: outputTypes.filter((d) => d.trust_level === 'low'),
  };

  // Separate predictions
  const pendingPredictions = predictions.filter((p) => p.was_correct === null);
  const verifiedPredictions = predictions.filter((p) => p.was_correct !== null);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading trust matrix...
      </div>
    );
  }

  return (
    <div>
      <div className="lesson-header">
        <div className="lesson-header-left">
          <h1 className="page-title">Trust Matrix</h1>
          <ConnectionCallout lessonNumber={2} lessonTitle="Feedback Analyzer" message="Predict which outputs will need review so you spend your effort where it matters most." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> You either over-verify everything (wasting time) or blindly trust AI output (introducing errors). Without calibrated judgment, you can't efficiently allocate your review effort.</p>
            <p><strong>The Skill:</strong> Build a personal trust matrix by tracking predictions about AI accuracy. Learn which output types you can trust and which require careful verification.</p>
          </div>

        </div>
        <div className="lesson-header-right">
          <StatsPanel stats={stats ? [
              { label: 'Predictions', value: stats.total_predictions, color: 'var(--accent-blue)' },
              { label: 'Verified', value: stats.verified_predictions, color: 'var(--accent-green)' },
              { label: 'AI Accuracy', value: stats.overall_accuracy != null ? `${stats.overall_accuracy}%` : '-', color: 'var(--accent-yellow)' },
              { label: 'Calibration', value: stats.calibration_score ?? '-', color: 'var(--accent-purple)' },
          ] : []} />

        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'concepts' ? 'active' : ''}`}
          onClick={() => setActiveTab('concepts')}
        >
          Concepts
        </button>
        <button
          className={`tab ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          Build Matrix
        </button>
        <button
          className={`tab ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          Track Predictions {pendingPredictions.length > 0 && `(${pendingPredictions.length} pending)`}
        </button>
        <button
          className={`tab ${activeTab === 'calibration' ? 'active' : ''}`}
          onClick={() => setActiveTab('calibration')}
        >
          Calibration
        </button>
      </div>

      {/* Learn Tab */}
      {activeTab === 'concepts' && (
        <div className="learn-section">
          <AccordionSection title="🧭 How This Lesson Works">
            <p className="text-secondary mb-md">
              Three practice areas that build your trust calibration skill:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">Build Matrix Tab — Map Your Output Types</h4>
                <p>List the kinds of AI output you use in your work — email drafts, data analysis,
                client proposals, meeting summaries — and assign each an initial trust level (high,
                medium, or low) based on your gut feeling. This is your starting hypothesis.</p>
                <button className="learn-tab-link" onClick={() => setActiveTab('matrix')}>Go to Build Matrix →</button>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">Track Predictions Tab — Test Your Instincts</h4>
                <p>Before you verify any AI output, rate your confidence (1-10) that it's correct.
                Then check it and record what you find. Over time, this reveals where your gut is
                right and where it misleads you.</p>
                <button className="learn-tab-link" onClick={() => setActiveTab('predictions')}>Go to Predictions →</button>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-purple">Calibration Tab — See Your Patterns</h4>
                <p>After 10+ predictions, the app analyzes where you over-trusted (were confident
                but wrong) and where you over-verified (were skeptical but right). This is your
                personal calibration report.</p>
                <button className="learn-tab-link" onClick={() => setActiveTab('calibration')}>Go to Calibration →</button>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Uncalibrated vs. Calibrated Trust">
            <div className="learn-comparison">
              <div className="learn-comparison-grid">
                <div className="learn-comparison-col">
                  <h4 className="poor">Treating All AI Output the Same</h4>
                  <div className="learn-comparison-item poor">
                    <div className="learn-comparison-scenario">Event Planning</div>
                    <p>You ask AI to draft a vendor outreach email and also to calculate the catering
                    budget based on 150 attendees. Both outputs look professional. You send the email
                    and submit the budget without checking either one.</p>
                  </div>
                  <div className="learn-comparison-item poor">
                    <p>The email was fine — tone, structure, all good. But the budget double-counted
                    the beverage line item, putting you $3,000 over. You only discover it when the
                    finance team questions the invoice.</p>
                  </div>
                </div>
                <div className="learn-comparison-col">
                  <h4 className="good">Allocating Review by Trust Level</h4>
                  <div className="learn-comparison-item good">
                    <div className="learn-comparison-scenario">Same Tasks — With a Trust Matrix</div>
                    <p>Your trust matrix shows email drafts at "high trust" (AI is consistently good at
                    tone and structure) but budget calculations at "low trust" (AI frequently makes
                    arithmetic and logic errors with numbers). So you skim the email in 30 seconds
                    but spend 5 minutes verifying every line of the budget.</p>
                  </div>
                  <div className="learn-comparison-item good">
                    <p>You catch the beverage double-count before it leaves your desk. Total review
                    time: 6 minutes, focused where it mattered.</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🎚️ What Trust Levels Actually Mean">
            <p className="text-secondary mb-md">
              Trust levels aren't about whether AI is "good" or "bad." They're about how much review
              effort a particular output type needs from you, based on real experience.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">High Trust — Quick Scan</h4>
                <p>Output types where AI is consistently reliable for your use case. You still glance
                at the result, but you're not expecting problems.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  Grammar and spelling corrections. Meeting agenda formatting. Rephrasing text
                  for a different tone. Generating standard email templates.
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-yellow">Medium Trust — Targeted Check</h4>
                <p>Output types where AI is usually right but makes predictable mistakes. You know
                which parts to double-check.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  Meeting summaries (check specific names and dates). Job descriptions (check legal
                  compliance language). Client-facing emails (check tone matches relationship).
                  Research summaries (verify key claims).
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-red">Low Trust — Full Review</h4>
                <p>Output types where AI frequently gets things wrong or where mistakes are costly.
                Treat AI output as a rough draft that needs serious editing.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  Financial calculations and projections. Legal or compliance language. Anything
                  referencing your company's specific policies. Recommendations about people
                  (hiring, performance, promotions).
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid learn-patterns-grid-mb">
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Assigning trust levels based on how the output <em>looks</em> rather than whether
                it's actually correct. AI is very good at producing confident, professional-looking
                text — even when the content is wrong.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Base trust levels on verified outcomes. A polished budget spreadsheet with wrong
                  numbers is still wrong. Track what you actually find when you check, not how you
                  feel when you read it.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Setting trust levels once and never updating them. Your first guesses about what
                AI gets right and wrong are often inaccurate.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Use the prediction tracking to test your assumptions. After 10+ verifications per
                  output type, you'll have real data. Adjust your trust levels based on what you find,
                  not what you assumed.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Applying one trust level to all AI output from the same conversation. "It got the
                first three things right, so the rest is probably fine too."</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Evaluate each output type independently. AI might write a perfect project timeline
                  in the same conversation where it miscalculates your resource costs. The task type
                  matters more than the session.
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Build Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="card">
          <div className="card-header-actions">
            <h2>Your Trust Matrix</h2>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
                + Add Output Type
              </button>
              {outputTypes.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Trust Level Legend */}
          <div className="trust-level-legend">
            <div className="trust-level-legend-title">TRUST LEVEL GUIDELINES</div>
            <div className="trust-level-legend-grid">
              {['high', 'medium', 'low'].map((level) => (
                <div key={level} className="trust-level-legend-item">
                  <div className="trust-level-legend-label" style={{ color: TRUST_LEVELS[level].text }}>
                    {TRUST_LEVELS[level].icon} {TRUST_LEVELS[level].label}
                  </div>
                  <div className="text-muted">{TRUST_LEVELS[level].description}</div>
                </div>
              ))}
            </div>
          </div>

          {outputTypes.length === 0 ? (
            <div className="empty-state">
              <h3 className="mb-md">No output types defined yet.</h3>
              <p className="text-muted mb-sm">{OUTPUT_TYPE_PROMPTS[0]}</p>
              <p className="text-muted text-italic mb-sm">{OUTPUT_TYPE_PROMPTS[1]}</p>
              <p className="text-muted mb-lg">{OUTPUT_TYPE_PROMPTS[2]}</p>
              <div className="btn-group flex-center">
                <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
                  Create Your Own
                </button>
              </div>
            </div>
          ) : (
            <div className="grid-3col">
              {['high', 'medium', 'low'].map((level) => (
                <div
                  key={level}
                  className="trust-level-column"
                  style={{ background: TRUST_LEVELS[level].bg }}
                >
                  <h3 style={{ color: TRUST_LEVELS[level].text }}>
                    {TRUST_LEVELS[level].icon} {level} Trust
                    <span className="trust-level-column-count">
                      ({outputTypesByLevel[level].length})
                    </span>
                  </h3>
                  <p className="trust-level-column-action">
                    {TRUST_LEVELS[level].action}
                  </p>

                  {outputTypesByLevel[level].map((domain) => (
                    <div
                      key={domain.id}
                      className="trust-level-card"
                      onClick={() => setExpandedOutputType(expandedOutputType === domain.id ? null : domain.id)}
                    >
                      <div className="flex-between-start mb-xs">
                        <div className="flex-1">
                          <div className="trust-level-card-name">{domain.name}</div>
                          <span
                            className="trust-level-card-category"
                            style={{ background: CATEGORY_COLORS[domain.category] || CATEGORY_COLORS.Custom }}
                          >
                            {domain.category}
                          </span>
                        </div>
                        <div className="btn-group" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm"
                            onClick={() => setEditingOutputType({ ...domain, examples: domain.examples || [] })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteOutputType(domain.id)}
                          >
                            X
                          </button>
                        </div>
                      </div>

                      {/* Expanded view with Why and Verification */}
                      {expandedOutputType === domain.id && (
                        <div className="trust-level-card-expanded">
                          {domain.reasoning && (
                            <div className="trust-level-card-field">
                              <div className="trust-level-card-field-label">WHY THIS TRUST LEVEL:</div>
                              <div className="trust-level-card-field-value">{domain.reasoning}</div>
                            </div>
                          )}
                          {domain.verification_approach && (
                            <div className="trust-level-card-field">
                              <div className="trust-level-card-field-label">HOW TO VERIFY:</div>
                              <div className="trust-level-card-field-value">{domain.verification_approach}</div>
                            </div>
                          )}
                          {!domain.reasoning && !domain.verification_approach && (
                            <div className="text-xs text-muted text-italic">
                              Click Edit to add reasoning and verification approach
                            </div>
                          )}
                        </div>
                      )}

                      {domain.prediction_count > 0 && (
                        <div className="trust-level-card-stats">
                          {domain.prediction_count} predictions ({domain.accuracy_rate.toFixed(0)}% accurate)
                        </div>
                      )}
                    </div>
                  ))}

                  {outputTypesByLevel[level].length === 0 && (
                    <div className="trust-level-empty">
                      No output types at this trust level
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Domain Modal */}
          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="flex-row items-center mb-sm">
                  <h3 className="no-margin">Add Output Type</h3>
                  <ExamplesDropdown
                    endpoint="/lesson5/examples"
                    onSelect={(example) => {
                      setNewOutputType({
                        ...newOutputType,
                        name: example.name || '',
                        category: example.category || 'Code',
                        trust_level: example.trust_level || 'medium',
                        reasoning: example.reasoning || '',
                        verification_approach: example.verification_approach || '',
                        examples: example.examples || [],
                      });
                    }}
                  />
                </div>
                <p className="text-muted text-sm mb-lg">
                  Think about types of AI output you use in your work. What do you ask AI to generate?
                </p>
                <form onSubmit={handleCreateOutputType}>
                  <div className="form-group">
                    <label>Output Type Name *</label>
                    <input
                      type="text"
                      value={newOutputType.name}
                      onChange={(e) => setNewOutputType({ ...newOutputType, name: e.target.value })}
                      placeholder="e.g., PowerShell Scripts, API Documentation, Email Drafts..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={newOutputType.category}
                      onChange={(e) => setNewOutputType({ ...newOutputType, category: e.target.value })}
                    >
                      {Object.keys(CATEGORY_COLORS).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Trust Level *</label>
                    <select
                      value={newOutputType.trust_level}
                      onChange={(e) => setNewOutputType({ ...newOutputType, trust_level: e.target.value })}
                    >
                      <option value="high">High Trust</option>
                      <option value="medium">Medium Trust</option>
                      <option value="low">Low Trust</option>
                    </select>
                    <div
                      className="trust-level-hint"
                      style={{ background: TRUST_LEVELS[newOutputType.trust_level].bg }}
                    >
                      <div className="trust-level-hint-action" style={{ color: TRUST_LEVELS[newOutputType.trust_level].text }}>
                        {TRUST_LEVELS[newOutputType.trust_level].action}
                      </div>
                      <div className="text-muted">
                        {TRUST_LEVELS[newOutputType.trust_level].description}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Why this trust level? *</label>
                    <textarea
                      value={newOutputType.reasoning}
                      onChange={(e) => setNewOutputType({ ...newOutputType, reasoning: e.target.value })}
                      placeholder="What makes AI output of this type more or less reliable for your work?"
                      rows={2}
                      required
                    />
                    <div className="form-hint">
                      Consider: training data quality, how quickly things change, your ability to spot errors
                    </div>
                  </div>

                  <div className="form-group">
                    <label>How will you verify? *</label>
                    <textarea
                      value={newOutputType.verification_approach}
                      onChange={(e) => setNewOutputType({ ...newOutputType, verification_approach: e.target.value })}
                      placeholder="What's your verification method for this type of output?"
                      rows={2}
                      required
                    />
                    <div className="form-hint">
                      Examples: Run the code, check official docs, test with known data, review with colleague
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Examples (optional)</label>
                    <div className="flex-row mb-sm">
                      <input
                        type="text"
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        placeholder="Add an example output type"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (newExample.trim()) {
                            setNewOutputType({ ...newOutputType, examples: [...newOutputType.examples, newExample.trim()] });
                            setNewExample('');
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {newOutputType.examples.length > 0 && (
                      <div className="tag-list">
                        {newOutputType.examples.map((ex, i) => (
                          <span key={i} className="tag">
                            {ex}
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => setNewOutputType({ ...newOutputType, examples: newOutputType.examples.filter((_, idx) => idx !== i) })}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="btn-group mt-lg justify-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Output Type
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Domain Modal */}
          {editingOutputType && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="mb-lg">Edit Output Type</h3>
                <form onSubmit={handleUpdateOutputType}>
                  <div className="form-group">
                    <label>Output Type Name *</label>
                    <input
                      type="text"
                      value={editingOutputType.name}
                      onChange={(e) => setEditingOutputType({ ...editingOutputType, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={editingOutputType.category}
                      onChange={(e) => setEditingOutputType({ ...editingOutputType, category: e.target.value })}
                    >
                      {Object.keys(CATEGORY_COLORS).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Trust Level *</label>
                    <select
                      value={editingOutputType.trust_level}
                      onChange={(e) => setEditingOutputType({ ...editingOutputType, trust_level: e.target.value })}
                    >
                      <option value="high">High Trust</option>
                      <option value="medium">Medium Trust</option>
                      <option value="low">Low Trust</option>
                    </select>
                    <div
                      className="trust-level-hint"
                      style={{ background: TRUST_LEVELS[editingOutputType.trust_level].bg }}
                    >
                      <div className="trust-level-hint-action" style={{ color: TRUST_LEVELS[editingOutputType.trust_level].text }}>
                        {TRUST_LEVELS[editingOutputType.trust_level].action}
                      </div>
                      <div className="text-muted">
                        {TRUST_LEVELS[editingOutputType.trust_level].description}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Why this trust level?</label>
                    <textarea
                      value={editingOutputType.reasoning || ''}
                      onChange={(e) => setEditingOutputType({ ...editingOutputType, reasoning: e.target.value })}
                      placeholder="What makes AI output of this type more or less reliable?"
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>How will you verify?</label>
                    <textarea
                      value={editingOutputType.verification_approach || ''}
                      onChange={(e) => setEditingOutputType({ ...editingOutputType, verification_approach: e.target.value })}
                      placeholder="What's your verification method?"
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Examples</label>
                    <div className="flex-row mb-sm">
                      <input
                        type="text"
                        value={editExample}
                        onChange={(e) => setEditExample(e.target.value)}
                        placeholder="Add an example"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (editExample.trim()) {
                            setEditingOutputType({ ...editingOutputType, examples: [...(editingOutputType.examples || []), editExample.trim()] });
                            setEditExample('');
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {editingOutputType.examples && editingOutputType.examples.length > 0 && (
                      <div className="tag-list">
                        {editingOutputType.examples.map((ex, i) => (
                          <span key={i} className="tag">
                            {ex}
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => setEditingOutputType({ ...editingOutputType, examples: editingOutputType.examples.filter((_, idx) => idx !== i) })}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="btn-group mt-lg justify-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingOutputType(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Track Predictions Tab */}
      {activeTab === 'predictions' && (
        <div>
          {/* Daily Practice Reminder */}
          <div className="daily-practice-banner">
            <span className="daily-practice-banner-icon">*</span>
            <div>
              <div className="daily-practice-banner-title">Daily Practice</div>
              <div className="daily-practice-banner-text">
                Before accepting any AI output, consciously rate your confidence and note why.
              </div>
            </div>
          </div>

          <div className="card mb-lg">
            <h2 className="mb-md">Log New Prediction</h2>
            <p className="text-muted mb-md">
              Before verifying AI output, rate your confidence (1-10) that it's correct as-is.
            </p>

            <form onSubmit={handleCreatePrediction}>
              <div className="grid-2col">
                <div className="form-group">
                  <label>Output Type</label>
                  <select
                    value={newPrediction.output_type_id}
                    onChange={(e) => setNewPrediction({ ...newPrediction, output_type_id: e.target.value })}
                  >
                    <option value="">-- Select output type --</option>
                    {outputTypes.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.trust_level})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Confidence (1-10) *</label>
                  <div className="confidence-row">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newPrediction.confidence_rating}
                      onChange={(e) => setNewPrediction({ ...newPrediction, confidence_rating: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span
                      className="confidence-display"
                      style={{
                        color: newPrediction.confidence_rating >= 7 ? 'var(--accent-green)' :
                               newPrediction.confidence_rating <= 4 ? 'var(--accent-red)' : 'var(--accent-yellow)'
                      }}
                    >
                      {newPrediction.confidence_rating}
                    </span>
                  </div>
                  <div className="form-hint">
                    1-4: Low confidence | 5-6: Medium | 7-10: High confidence
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>What is the AI output about? *</label>
                <textarea
                  value={newPrediction.output_description}
                  onChange={(e) => setNewPrediction({ ...newPrediction, output_description: e.target.value })}
                  placeholder="Describe the AI output you're about to verify..."
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label>What are you uncertain about?</label>
                <textarea
                  value={newPrediction.uncertainty_notes}
                  onChange={(e) => setNewPrediction({ ...newPrediction, uncertainty_notes: e.target.value })}
                  placeholder="Any specific parts you're less confident about? This helps track patterns."
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={!newPrediction.output_description}>
                Log Prediction
              </button>
            </form>
          </div>

          {/* Pending Predictions */}
          {pendingPredictions.length > 0 && (
            <div className="card mb-lg">
              <h2 className="mb-md">Pending Verification ({pendingPredictions.length})</h2>
              {pendingPredictions.map((pred) => (
                <div key={pred.id} className="prediction-card">
                  <div className="flex-between-start mb-sm">
                    <div>
                      <div className="prediction-card-title">{pred.output_description}</div>
                      <div className="prediction-card-meta">
                        {pred.output_type_name && <span>{pred.output_type_name} | </span>}
                        Confidence: {pred.confidence_rating}/10 | {new Date(pred.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleQuickVerify(pred, true)}
                      >
                        Correct
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleQuickVerify(pred, false)}
                      >
                        Wrong
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setVerifyingPrediction(pred);
                          setVerificationForm({
                            was_correct: null,
                            actual_issues: '',
                            verification_method: '',
                            verification_time_seconds: null,
                            calibration_note: '',
                          });
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                  {pred.uncertainty_notes && (
                    <div className="prediction-card-note">
                      Uncertainty: {pred.uncertainty_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Verification History */}
          <div className="card">
            <h2 className="mb-md">Verification History</h2>
            {verifiedPredictions.length === 0 ? (
              <div className="empty-state">
                <p>No verified predictions yet. Log some predictions and verify them to build your history.</p>
              </div>
            ) : (
              verifiedPredictions.slice(0, 20).map((pred) => {
                const miscalibration = getMiscalibrationType(pred);
                return (
                  <div
                    key={pred.id}
                    className={`prediction-card-verified ${pred.was_correct ? 'correct' : 'wrong'}`}
                  >
                    <div className="flex-between">
                      <div className="flex-1">
                        <div className="prediction-card-title">{pred.output_description}</div>
                        <div className="prediction-card-meta">
                          Confidence: {pred.confidence_rating}/10 |
                          Result: {pred.was_correct ? 'Correct' : 'Wrong'} |
                          {new Date(pred.verified_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex-row items-center">
                        {miscalibration === 'over_trust' && (
                          <span className="verification-badge verification-badge-overtrust">
                            Over-trusted
                          </span>
                        )}
                        {miscalibration === 'over_verify' && (
                          <span className="verification-badge verification-badge-oververify">
                            Over-verified
                          </span>
                        )}
                        <span className={`result-badge ${pred.was_correct ? 'result-badge-correct' : 'result-badge-wrong'}`}>
                          {pred.was_correct ? 'CORRECT' : 'WRONG'}
                        </span>
                      </div>
                    </div>
                    {pred.calibration_note && (
                      <div className="prediction-card-verified-note">
                        Note: {pred.calibration_note}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Verification Modal */}
          {verifyingPrediction && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="mb-sm">Verify Prediction</h3>
                <p className="text-secondary mb-sm">{verifyingPrediction.output_description}</p>
                <p className="text-muted text-sm mb-md">
                  Your confidence: {verifyingPrediction.confidence_rating}/10
                </p>

                <form onSubmit={handleVerifyPrediction}>
                  <div className="form-group">
                    <label>Was the output correct? *</label>
                    <div className="verify-choice-row">
                      <button
                        type="button"
                        className={`btn ${verificationForm.was_correct === true ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setVerificationForm({ ...verificationForm, was_correct: true })}
                      >
                        Yes, Correct
                      </button>
                      <button
                        type="button"
                        className={`btn ${verificationForm.was_correct === false ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => setVerificationForm({ ...verificationForm, was_correct: false })}
                      >
                        No, Wrong
                      </button>
                    </div>
                  </div>

                  {verificationForm.was_correct === false && (
                    <div className="form-group">
                      <label>What was wrong?</label>
                      <textarea
                        value={verificationForm.actual_issues}
                        onChange={(e) => setVerificationForm({ ...verificationForm, actual_issues: e.target.value })}
                        placeholder="Describe the issues you found..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>How did you verify?</label>
                    <input
                      type="text"
                      value={verificationForm.verification_method}
                      onChange={(e) => setVerificationForm({ ...verificationForm, verification_method: e.target.value })}
                      placeholder="e.g., Ran the code, checked documentation, tested output..."
                    />
                  </div>

                  {/* Calibration adjustment prompt */}
                  {verificationForm.was_correct !== null && (
                    <div className="form-group">
                      <label style={{ color: verificationForm.was_correct ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {verificationForm.was_correct && verifyingPrediction.confidence_rating <= 4 && (
                          <>You under-trusted this. What will you do differently?</>
                        )}
                        {!verificationForm.was_correct && verifyingPrediction.confidence_rating >= 7 && (
                          <>You over-trusted this. What will you do differently?</>
                        )}
                        {((verificationForm.was_correct && verifyingPrediction.confidence_rating > 4) ||
                          (!verificationForm.was_correct && verifyingPrediction.confidence_rating < 7)) && (
                          <>Calibration note (optional)</>
                        )}
                      </label>
                      <textarea
                        value={verificationForm.calibration_note}
                        onChange={(e) => setVerificationForm({ ...verificationForm, calibration_note: e.target.value })}
                        placeholder={
                          verificationForm.was_correct && verifyingPrediction.confidence_rating <= 4
                            ? "What made you doubt this when it was actually correct?"
                            : !verificationForm.was_correct && verifyingPrediction.confidence_rating >= 7
                            ? "What should have made you more cautious? How will you adjust?"
                            : "Any notes for future reference?"
                        }
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="btn-group mt-lg justify-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setVerifyingPrediction(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={verificationForm.was_correct === null}>
                      Save Verification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div className="card">
          <div className="card-header-actions">
            <h2>Calibration Analysis</h2>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing || (stats?.verified_predictions || 0) < 10}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Patterns'}
            </button>
          </div>

          <p className="text-muted mb-lg">
            Calibration means your confidence matches reality. Over-trust means you were confident but wrong.
            Over-verify means you doubted yourself but were right.
          </p>

          {(stats?.verified_predictions || 0) < 10 && (
            <div className="alert alert-info mb-lg">
              You need at least 10 verified predictions to generate AI insights.
              Current: {stats?.verified_predictions || 0}/10
            </div>
          )}

          {stats && stats.verified_predictions >= 1 && (
            <div className="calibration-stats-grid">
              <div className="calibration-stat" style={{ background: TRUST_LEVELS.low.bg }}>
                <div className="calibration-stat-value" style={{ color: TRUST_LEVELS.low.text }}>{stats.over_trust_count}</div>
                <div className="calibration-stat-label">Over-Trust</div>
                <div className="calibration-stat-description">High confidence (7-10) but wrong</div>
                {stats.over_trust_count > 0 && (
                  <div className="calibration-stat-action" style={{ color: TRUST_LEVELS.low.text }}>
                    Action: Be more skeptical in these areas
                  </div>
                )}
              </div>
              <div className="calibration-stat" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="calibration-stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.well_calibrated_count}</div>
                <div className="calibration-stat-label">Well Calibrated</div>
                <div className="calibration-stat-description">Confidence matched outcome</div>
              </div>
              <div className="calibration-stat" style={{ background: TRUST_LEVELS.medium.bg }}>
                <div className="calibration-stat-value" style={{ color: TRUST_LEVELS.medium.text }}>{stats.over_verify_count}</div>
                <div className="calibration-stat-label">Over-Verify</div>
                <div className="calibration-stat-description">Low confidence (1-4) but right</div>
                {stats.over_verify_count > 0 && (
                  <div className="calibration-stat-action" style={{ color: TRUST_LEVELS.medium.text }}>
                    Action: You can trust more in these areas
                  </div>
                )}
              </div>
            </div>
          )}

          {insights.length === 0 ? (
            <div>
              <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                Log 10+ predictions in the Predictions tab, then click "Analyze Patterns" to generate insights like these:
              </p>
              <div className="analysis-grid">
                <div className="analysis-card" style={{ opacity: 0.7, borderLeft: '4px solid var(--accent-red)' }}>
                  <h3>Over-Trust Alerts</h3>
                  <div className="field">
                    <div className="field-label">What It Means</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Output types where you predicted high accuracy but the AI was actually wrong — areas where your trust exceeds demonstrated reliability and extra verification is warranted.</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7, borderLeft: '4px solid var(--accent-yellow)' }}>
                  <h3>Over-Verify Alerts</h3>
                  <div className="field">
                    <div className="field-label">What It Means</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Output types where you predicted low accuracy but the AI was actually right — areas where you're spending verification time you could reclaim.</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7, borderLeft: '4px solid var(--accent-green)' }}>
                  <h3>Well-Calibrated</h3>
                  <div className="field">
                    <div className="field-label">What It Means</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Output types where your predictions match reality — your trust is correctly calibrated and your verification effort is well-allocated.</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7 }}>
                  <h3>Output Type Breakdown</h3>
                  <div className="field">
                    <div className="field-label">Per-Domain Insights</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Each insight is tied to a specific output type (e.g., code generation, email drafting, data analysis) so you can adjust trust per domain rather than treating all AI output the same.</div>
                  </div>
                </div>
              </div>
              <div className="learn-next-step" style={{ marginTop: '24px' }}>
                <h3>Start Building Your Trust Data</h3>
                <p>Go to the Predictions tab and log predictions about AI output accuracy. After 10+ entries, the calibration analysis will reveal where your intuitions are right and where they're off.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('predictions')}>Go to Predictions</button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="mb-md">AI-Generated Insights</h3>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="insight-card"
                  style={{
                    borderLeftColor:
                      insight.insight_type === 'over_trust' ? 'var(--accent-red)' :
                      insight.insight_type === 'over_verify' ? 'var(--accent-yellow)' :
                      insight.insight_type === 'well_calibrated' ? 'var(--accent-green)' :
                      'var(--accent-blue)',
                  }}
                >
                  <div className="insight-card-header">
                    <span
                      className="insight-card-type"
                      style={{
                        background:
                          insight.insight_type === 'over_trust' ? 'var(--error-bg)' :
                          insight.insight_type === 'over_verify' ? 'var(--warning-bg)' :
                          insight.insight_type === 'well_calibrated' ? 'var(--success-bg)' :
                          'var(--bg-tertiary)',
                        color:
                          insight.insight_type === 'over_trust' ? 'var(--accent-red)' :
                          insight.insight_type === 'over_verify' ? 'var(--accent-yellow)' :
                          insight.insight_type === 'well_calibrated' ? 'var(--accent-green)' :
                          'var(--accent-blue)',
                      }}
                    >
                      {insight.insight_type.replace('_', ' ')}
                    </span>
                    {insight.output_type_name && (
                      <span className="insight-card-domain">
                        {insight.output_type_name}
                      </span>
                    )}
                  </div>
                  <p className="no-margin">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
