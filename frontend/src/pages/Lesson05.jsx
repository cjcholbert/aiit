import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';

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
  const [activeTab, setActiveTab] = useState('learn');
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
      <div className="page-header">
        <h1 className="page-title">Trust Matrix</h1>
        <p className="page-description">
          <strong>The Problem:</strong> You either over-verify everything (wasting time) or blindly trust AI output
          (introducing errors). Without calibrated judgment, you can't efficiently allocate your review effort.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Build a personal trust matrix by tracking predictions about AI accuracy.
          Learn which output types you can trust and which require careful verification.
        </p>
        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>
            <strong>This lesson's goal:</strong> Create a trust matrix specific to YOUR work, track 10+ predictions, and identify where your calibration needs adjustment.
          </p>
        </div>

        <SelfAssessmentChecklist lessonNumber={5} criteria={LESSON_CRITERIA[5]} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          Learn
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
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
      </div>

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="learn-section">
          <div className="learn-intro">
            <h2>Why Trust Calibration Matters</h2>
            <p>
              Most people fall into one of two traps when working with AI: they either accept everything at face value
              (over-trusting) or they double-check every single detail (over-verifying). Both waste your time and energy.
              The key skill is knowing <em>when</em> to trust and <em>when</em> to verify.
            </p>
          </div>

          <div className="learn-key-insight">
            <strong>Key Insight:</strong> AI reliability varies dramatically by output type. The same AI that
            writes excellent summaries might produce unreliable legal citations. Calibrating your trust
            per output type — not per tool — is what separates effective AI collaborators from everyone else.
          </div>

          <h3>The Trust Calibration Cycle</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            This lesson uses a prediction-verification cycle to build your calibration skill:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>1. Categorize Output Types</h4>
              <p>Identify the types of AI output you use regularly — code, emails, summaries, analysis, recommendations — and assign each an initial trust level based on your experience.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>2. Predict Before You Verify</h4>
              <p>Before checking AI output, record your confidence level (1-10). This forces you to make your intuition explicit rather than relying on vague feelings about quality.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>3. Verify and Record</h4>
              <p>Check the output and record whether it was correct. Over time, you'll see patterns: where you over-trust (confident but wrong) and where you over-verify (skeptical but right).</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>4. Calibrate Your Judgment</h4>
              <p>After 10+ predictions, the AI analyzes your calibration patterns and shows you exactly where your trust instincts need adjustment — saving you time and catching more errors.</p>
            </div>
          </div>

          <div className="learn-comparison">
            <h3>Over-Trust vs. Over-Verify</h3>
            <div className="learn-comparison-grid">
              <div>
                <h4 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Over-Trust (Risky)</h4>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"AI-generated code always works — I just copy and paste it."</p>
                </div>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"The summary looks professional, so the facts must be right."</p>
                </div>
                <div style={{ background: 'var(--error-bg)', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"AI said the deadline is March 15, no need to double-check."</p>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>Calibrated Trust (Efficient)</h4>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0 }}>"AI code logic is usually sound, but I always test edge cases and error handling before deploying."</p>
                </div>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0 }}>"AI summaries capture the structure well, but I spot-check any specific numbers, dates, or proper nouns."</p>
                </div>
                <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ margin: 0 }}>"For factual claims, I verify against the source. For formatting and structure, I trust AI's output."</p>
                </div>
              </div>
            </div>
          </div>

          <div className="learn-next-step">
            <h3>Ready to Build Your Trust Matrix?</h3>
            <p>Start by identifying the AI output types you use most often, then track your predictions to discover your calibration patterns.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('matrix')}>
              Go to Build Matrix
            </button>
          </div>
        </div>
      )}

      {/* Build Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>Your Trust Matrix</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {outputTypes.length === 0 && (
                <button className="btn btn-primary" onClick={handleSeedDefaults}>
                  Load Starter Output Types
                </button>
              )}
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
          <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>TRUST LEVEL GUIDELINES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {['high', 'medium', 'low'].map((level) => (
                <div key={level} style={{ fontSize: '12px' }}>
                  <div style={{ color: TRUST_LEVELS[level].text, fontWeight: 'bold', marginBottom: '2px' }}>
                    {TRUST_LEVELS[level].icon} {TRUST_LEVELS[level].label}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{TRUST_LEVELS[level].description}</div>
                </div>
              ))}
            </div>
          </div>

          {outputTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>No output types defined yet.</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{OUTPUT_TYPE_PROMPTS[0]}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>{OUTPUT_TYPE_PROMPTS[1]}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{OUTPUT_TYPE_PROMPTS[2]}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleSeedDefaults}>
                  Start with Common Output Types
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
                  Create Your Own
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {['high', 'medium', 'low'].map((level) => (
                <div
                  key={level}
                  style={{
                    background: TRUST_LEVELS[level].bg,
                    border: `2px solid ${TRUST_LEVELS[level].border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    minHeight: '200px',
                  }}
                >
                  <h3 style={{ margin: '0 0 4px', color: TRUST_LEVELS[level].text, textTransform: 'capitalize' }}>
                    {TRUST_LEVELS[level].icon} {level} Trust
                    <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px', opacity: 0.8 }}>
                      ({outputTypesByLevel[level].length})
                    </span>
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {TRUST_LEVELS[level].action}
                  </p>

                  {outputTypesByLevel[level].map((domain) => (
                    <div
                      key={domain.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedOutputType(expandedOutputType === domain.id ? null : domain.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{domain.name}</div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: CATEGORY_COLORS[domain.category] || CATEGORY_COLORS.Custom,
                              color: 'white',
                            }}
                          >
                            {domain.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => setEditingOutputType({ ...domain, examples: domain.examples || [] })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleDeleteOutputType(domain.id)}
                          >
                            X
                          </button>
                        </div>
                      </div>

                      {/* Expanded view with Why and Verification */}
                      {expandedOutputType === domain.id && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                          {domain.reasoning && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>WHY THIS TRUST LEVEL:</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{domain.reasoning}</div>
                            </div>
                          )}
                          {domain.verification_approach && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>HOW TO VERIFY:</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{domain.verification_approach}</div>
                            </div>
                          )}
                          {!domain.reasoning && !domain.verification_approach && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Click Edit to add reasoning and verification approach
                            </div>
                          )}
                        </div>
                      )}

                      {domain.prediction_count > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          {domain.prediction_count} predictions ({domain.accuracy_rate.toFixed(0)}% accurate)
                        </div>
                      )}
                    </div>
                  ))}

                  {outputTypesByLevel[level].length === 0 && (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                      No output types at this trust level
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Domain Modal */}
          {showAddForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', width: '550px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                <h3 style={{ margin: '0 0 8px' }}>Add Output Type</h3>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                    <div style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: TRUST_LEVELS[newOutputType.trust_level].bg,
                      border: `1px solid ${TRUST_LEVELS[newOutputType.trust_level].border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}>
                      <div style={{ color: TRUST_LEVELS[newOutputType.trust_level].text, fontWeight: 'bold', marginBottom: '4px' }}>
                        {TRUST_LEVELS[newOutputType.trust_level].action}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Examples: Run the code, check official docs, test with known data, review with colleague
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Examples (optional)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        placeholder="Add an example output type"
                        style={{ flex: 1 }}
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {newOutputType.examples.map((ex, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'var(--bg-tertiary)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {ex}
                            <button
                              type="button"
                              onClick={() => setNewOutputType({ ...newOutputType, examples: newOutputType.examples.filter((_, idx) => idx !== i) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px' }}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', width: '550px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                <h3 style={{ margin: '0 0 20px' }}>Edit Output Type</h3>
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
                    <div style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: TRUST_LEVELS[editingOutputType.trust_level].bg,
                      border: `1px solid ${TRUST_LEVELS[editingOutputType.trust_level].border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}>
                      <div style={{ color: TRUST_LEVELS[editingOutputType.trust_level].text, fontWeight: 'bold', marginBottom: '4px' }}>
                        {TRUST_LEVELS[editingOutputType.trust_level].action}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
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
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={editExample}
                        onChange={(e) => setEditExample(e.target.value)}
                        placeholder="Add an example"
                        style={{ flex: 1 }}
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {editingOutputType.examples.map((ex, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'var(--bg-tertiary)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {ex}
                            <button
                              type="button"
                              onClick={() => setEditingOutputType({ ...editingOutputType, examples: editingOutputType.examples.filter((_, idx) => idx !== i) })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px' }}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>*</span>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>Daily Practice</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Before accepting any AI output, consciously rate your confidence and note why.
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px' }}>Log New Prediction</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Before verifying AI output, rate your confidence (1-10) that it's correct as-is.
            </p>

            <form onSubmit={handleCreatePrediction}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newPrediction.confidence_rating}
                      onChange={(e) => setNewPrediction({ ...newPrediction, confidence_rating: parseInt(e.target.value) })}
                      style={{ flex: 1 }}
                    />
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      width: '40px',
                      textAlign: 'center',
                      color: newPrediction.confidence_rating >= 7 ? 'var(--accent-green)' :
                             newPrediction.confidence_rating <= 4 ? 'var(--accent-red)' : 'var(--accent-yellow)'
                    }}>
                      {newPrediction.confidence_rating}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 16px' }}>Pending Verification ({pendingPredictions.length})</h2>
              {pendingPredictions.map((pred) => (
                <div
                  key={pred.id}
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{pred.output_description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {pred.output_type_name && <span>{pred.output_type_name} | </span>}
                        Confidence: {pred.confidence_rating}/10 | {new Date(pred.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--accent-green)', color: 'white' }}
                        onClick={() => handleQuickVerify(pred, true)}
                      >
                        Correct
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--accent-red)', color: 'white' }}
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
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Uncertainty: {pred.uncertainty_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Verification History */}
          <div className="card">
            <h2 style={{ margin: '0 0 16px' }}>Verification History</h2>
            {verifiedPredictions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No verified predictions yet. Log some predictions and verify them to build your history.
              </p>
            ) : (
              verifiedPredictions.slice(0, 20).map((pred) => {
                const miscalibration = getMiscalibrationType(pred);
                return (
                  <div
                    key={pred.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      borderLeft: `4px solid ${pred.was_correct ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{pred.output_description}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Confidence: {pred.confidence_rating}/10 |
                          Result: {pred.was_correct ? 'Correct' : 'Wrong'} |
                          {new Date(pred.verified_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {miscalibration === 'over_trust' && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--error-bg)', color: 'var(--accent-red)' }}>
                            Over-trusted
                          </span>
                        )}
                        {miscalibration === 'over_verify' && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--warning-bg)', color: 'var(--accent-yellow)' }}>
                            Over-verified
                          </span>
                        )}
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: pred.was_correct ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: pred.was_correct ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}
                        >
                          {pred.was_correct ? 'CORRECT' : 'WRONG'}
                        </span>
                      </div>
                    </div>
                    {pred.calibration_note && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
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
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', width: '550px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                <h3 style={{ margin: '0 0 8px' }}>Verify Prediction</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{verifyingPrediction.output_description}</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '12px' }}>
                  Your confidence: {verifyingPrediction.confidence_rating}/10
                </p>

                <form onSubmit={handleVerifyPrediction}>
                  <div className="form-group">
                    <label>Was the output correct? *</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        className={`btn ${verificationForm.was_correct === true ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                        onClick={() => setVerificationForm({ ...verificationForm, was_correct: true })}
                      >
                        Yes, Correct
                      </button>
                      <button
                        type="button"
                        className={`btn ${verificationForm.was_correct === false ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, background: verificationForm.was_correct === false ? 'var(--accent-red)' : undefined }}
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

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Calibration Analysis</h2>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing || (stats?.verified_predictions || 0) < 10}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Patterns'}
            </button>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Calibration means your confidence matches reality. Over-trust means you were confident but wrong.
            Over-verify means you doubted yourself but were right.
          </p>

          {(stats?.verified_predictions || 0) < 10 && (
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              You need at least 10 verified predictions to generate AI insights.
              Current: {stats?.verified_predictions || 0}/10
            </div>
          )}

          {stats && stats.verified_predictions >= 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: TRUST_LEVELS.low.bg, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: TRUST_LEVELS.low.text }}>{stats.over_trust_count}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Over-Trust</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>High confidence (7-10) but wrong</div>
                {stats.over_trust_count > 0 && (
                  <div style={{ fontSize: '11px', color: TRUST_LEVELS.low.text, marginTop: '8px' }}>
                    Action: Be more skeptical in these areas
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.well_calibrated_count}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Well Calibrated</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Confidence matched outcome</div>
              </div>
              <div style={{ background: TRUST_LEVELS.medium.bg, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: TRUST_LEVELS.medium.text }}>{stats.over_verify_count}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Over-Verify</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Low confidence (1-4) but right</div>
                {stats.over_verify_count > 0 && (
                  <div style={{ fontSize: '11px', color: TRUST_LEVELS.medium.text, marginTop: '8px' }}>
                    Action: You can trust more in these areas
                  </div>
                )}
              </div>
            </div>
          )}

          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>No insights yet. Click "Analyze Patterns" after logging 10+ predictions.</p>
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: '16px' }}>AI-Generated Insights</h3>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${
                      insight.insight_type === 'over_trust' ? 'var(--accent-red)' :
                      insight.insight_type === 'over_verify' ? 'var(--accent-yellow)' :
                      insight.insight_type === 'well_calibrated' ? 'var(--accent-green)' :
                      'var(--accent-blue)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
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
                        textTransform: 'capitalize',
                      }}
                    >
                      {insight.insight_type.replace('_', ' ')}
                    </span>
                    {insight.output_type_name && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {insight.output_type_name}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="card">
          <h2 style={{ margin: '0 0 20px' }}>Your Statistics</h2>

          {!stats || stats.total_predictions === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>No predictions logged yet. Start tracking your confidence in AI outputs to see your stats here.</p>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.total_predictions}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Total Predictions</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.verified_predictions}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Verified</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: TRUST_LEVELS.high.text }}>{stats.overall_accuracy.toFixed(0)}%</div>
                  <div style={{ color: 'var(--text-muted)' }}>AI Accuracy</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.calibration_score.toFixed(0)}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Calibration Score</div>
                </div>
              </div>

              {/* Confidence Analysis */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '12px' }}>Confidence Analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'var(--success-bg)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.avg_confidence_when_correct.toFixed(1)}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Avg Confidence When Correct</div>
                  </div>
                  <div style={{ background: 'var(--error-bg)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-red)' }}>{stats.avg_confidence_when_wrong.toFixed(1)}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Avg Confidence When Wrong</div>
                  </div>
                </div>
                {stats.avg_confidence_when_correct > 0 && stats.avg_confidence_when_wrong > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {stats.avg_confidence_when_correct - stats.avg_confidence_when_wrong > 2 ? (
                      <>Good calibration: You're more confident when right than when wrong.</>
                    ) : stats.avg_confidence_when_correct - stats.avg_confidence_when_wrong < 0 ? (
                      <>Calibration issue: You're often more confident when wrong. Review your over-trust cases.</>
                    ) : (
                      <>Your confidence is similar whether right or wrong. Work on distinguishing high vs. low confidence situations.</>
                    )}
                  </div>
                )}
              </div>

              {/* Stats by Trust Level */}
              {stats.by_trust_level && stats.by_trust_level.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '12px' }}>By Trust Level</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {stats.by_trust_level.map((level) => (
                      <div
                        key={level.trust_level}
                        style={{
                          background: TRUST_LEVELS[level.trust_level].bg,
                          border: `1px solid ${TRUST_LEVELS[level.trust_level].border}`,
                          borderRadius: '8px',
                          padding: '16px',
                        }}
                      >
                        <div style={{ color: TRUST_LEVELS[level.trust_level].text, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '8px' }}>
                          {level.trust_level} Trust
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <div>Predictions: {level.total_predictions}</div>
                          <div>Verified: {level.verified_predictions}</div>
                          <div>Accuracy: {level.accuracy_rate.toFixed(0)}%</div>
                          <div>Avg Confidence: {level.avg_confidence.toFixed(1)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats by Output Type */}
              {stats.by_output_type && stats.by_output_type.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '12px' }}>By Output Type</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)' }}>Output Type</th>
                        <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)' }}>Trust Level</th>
                        <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)' }}>Predictions</th>
                        <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)' }}>Accuracy</th>
                        <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)' }}>Avg Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.by_output_type.map((domain) => (
                        <tr key={domain.output_type_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px' }}>{domain.output_type_name}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                background: TRUST_LEVELS[domain.trust_level].bg,
                                color: TRUST_LEVELS[domain.trust_level].text,
                                textTransform: 'capitalize',
                              }}
                            >
                              {domain.trust_level}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>{domain.total_predictions}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>{domain.accuracy_rate.toFixed(0)}%</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>{domain.avg_confidence.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <LessonNav currentLesson={5} />
    </div>
  );
}
