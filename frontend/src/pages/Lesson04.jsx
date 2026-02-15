import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

// Priority colors
const PRIORITY_COLORS = {
  high: { color: 'var(--accent-red)', bg: 'var(--error-bg)', icon: '🔴', label: 'High' },
  medium: { color: 'var(--accent-yellow)', bg: 'var(--warning-bg)', icon: '🟡', label: 'Medium' },
  low: { color: 'var(--accent-green)', bg: 'var(--success-bg)', icon: '🟢', label: 'Low' }
};

// Issue status colors
const STATUS_COLORS = {
  open: { color: 'var(--accent-red)', bg: 'var(--error-bg)', icon: '🔓', label: 'Open' },
  resolved: { color: 'var(--accent-green)', bg: 'var(--success-bg)', icon: '✅', label: 'Resolved' },
  wont_fix: { color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)', icon: '🚫', label: "Won't Fix" }
};

export default function Lesson04() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [docs, setDocs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Document editing state
  const [editingDoc, setEditingDoc] = useState(null);
  const [docForm, setDocForm] = useState({
    project_name: '',
    description: '',
    current_state: { complete: [], in_progress: [], blocked: [] },
    key_decisions: [],
    known_issues: [],
    lessons_learned: [],
    next_goals: [],
    content: ''
  });

  // Session state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sessionGoals, setSessionGoals] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Viewing state
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);

  // Temp inputs for adding items
  const [tempInputs, setTempInputs] = useState({
    complete: '', in_progress: '', blocked: '',
    decision: '', reasoning: '',
    issue: '', workaround: '',
    lesson: '', lessonContext: '',
    goal: '', priority: 'medium'
  });

  // Fetch data
  const fetchDocs = async () => {
    try {
      const data = await api.get('/lesson4/docs');
      setDocs(data);
    } catch (err) {
      console.error('Failed to fetch docs:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await api.get('/lesson4/sessions');
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const data = await api.get('/lesson4/sessions/active');
      setActiveSession(data);
    } catch (err) {
      console.error('Failed to fetch active session:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson4/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDocs(), fetchSessions(), fetchActiveSession(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Document form handlers
  const resetDocForm = () => {
    setDocForm({
      project_name: '',
      description: '',
      current_state: { complete: [], in_progress: [], blocked: [] },
      key_decisions: [],
      known_issues: [],
      lessons_learned: [],
      next_goals: [],
      content: ''
    });
    setEditingDoc(null);
    setTempInputs({
      complete: '', in_progress: '', blocked: '',
      decision: '', reasoning: '',
      issue: '', workaround: '',
      lesson: '', lessonContext: '',
      goal: '', priority: 'medium'
    });
  };

  const handleEditDoc = async (id) => {
    try {
      const doc = await api.get(`/lesson4/docs/${id}`);
      setDocForm({
        project_name: doc.project_name,
        description: doc.description || '',
        current_state: doc.current_state || { complete: [], in_progress: [], blocked: [] },
        key_decisions: doc.key_decisions || [],
        known_issues: doc.known_issues || [],
        lessons_learned: doc.lessons_learned || [],
        next_goals: doc.next_goals || [],
        content: doc.content || ''
      });
      setEditingDoc(doc);
      setActiveTab('docs');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveDoc = async () => {
    if (!docForm.project_name.trim()) {
      setError('Project name is required');
      return;
    }

    setError(null);
    try {
      if (editingDoc) {
        await api.put(`/lesson4/docs/${editingDoc.id}`, docForm);
      } else {
        await api.post('/lesson4/docs', docForm);
      }
      await fetchDocs();
      await fetchStats();
      resetDocForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this context document and all its sessions?')) return;
    try {
      await api.del(`/lesson4/docs/${id}`);
      await fetchDocs();
      await fetchSessions();
      await fetchStats();
      if (editingDoc?.id === id) resetDocForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Add item helpers
  const addStateItem = (type) => {
    if (!tempInputs[type].trim()) return;
    setDocForm(prev => ({
      ...prev,
      current_state: {
        ...prev.current_state,
        [type]: [...prev.current_state[type], tempInputs[type].trim()]
      }
    }));
    setTempInputs(prev => ({ ...prev, [type]: '' }));
  };

  const removeStateItem = (type, index) => {
    setDocForm(prev => ({
      ...prev,
      current_state: {
        ...prev.current_state,
        [type]: prev.current_state[type].filter((_, i) => i !== index)
      }
    }));
  };

  const addDecision = () => {
    if (!tempInputs.decision.trim()) return;
    setDocForm(prev => ({
      ...prev,
      key_decisions: [...prev.key_decisions, {
        decision: tempInputs.decision.trim(),
        reasoning: tempInputs.reasoning.trim(),
        date: new Date().toISOString().split('T')[0]
      }]
    }));
    setTempInputs(prev => ({ ...prev, decision: '', reasoning: '' }));
  };

  const removeDecision = (index) => {
    setDocForm(prev => ({
      ...prev,
      key_decisions: prev.key_decisions.filter((_, i) => i !== index)
    }));
  };

  const addIssue = () => {
    if (!tempInputs.issue.trim()) return;
    setDocForm(prev => ({
      ...prev,
      known_issues: [...prev.known_issues, {
        issue: tempInputs.issue.trim(),
        workaround: tempInputs.workaround.trim(),
        status: 'open'
      }]
    }));
    setTempInputs(prev => ({ ...prev, issue: '', workaround: '' }));
  };

  const removeIssue = (index) => {
    setDocForm(prev => ({
      ...prev,
      known_issues: prev.known_issues.filter((_, i) => i !== index)
    }));
  };

  const addLesson = () => {
    if (!tempInputs.lesson.trim()) return;
    setDocForm(prev => ({
      ...prev,
      lessons_learned: [...prev.lessons_learned, {
        lesson: tempInputs.lesson.trim(),
        context: tempInputs.lessonContext.trim(),
        date: new Date().toISOString().split('T')[0]
      }]
    }));
    setTempInputs(prev => ({ ...prev, lesson: '', lessonContext: '' }));
  };

  const removeLesson = (index) => {
    setDocForm(prev => ({
      ...prev,
      lessons_learned: prev.lessons_learned.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (!tempInputs.goal.trim()) return;
    setDocForm(prev => ({
      ...prev,
      next_goals: [...prev.next_goals, {
        goal: tempInputs.goal.trim(),
        priority: tempInputs.priority
      }]
    }));
    setTempInputs(prev => ({ ...prev, goal: '', priority: 'medium' }));
  };

  const removeGoal = (index) => {
    setDocForm(prev => ({
      ...prev,
      next_goals: prev.next_goals.filter((_, i) => i !== index)
    }));
  };

  // Session handlers
  const handleStartSession = async () => {
    if (!selectedDoc) {
      setError('Select a project first');
      return;
    }

    try {
      const goals = sessionGoals.split('\n').filter(g => g.trim());
      await api.post('/lesson4/sessions', {
        context_doc_id: selectedDoc.id,
        goals: goals
      });
      await fetchSessions();
      await fetchActiveSession();
      setSessionGoals('');

      // Generate prompt
      const promptResult = await api.post('/lesson4/generate-prompt', {
        context_doc_id: selectedDoc.id
      });
      setGeneratedPrompt(promptResult.prompt);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await api.post(`/lesson4/sessions/${activeSession.id}/end`);
      await fetchSessions();
      await fetchActiveSession();
      await fetchStats();
      setGeneratedPrompt('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGeneratePrompt = async (docId) => {
    try {
      const result = await api.post('/lesson4/generate-prompt', {
        context_doc_id: docId
      });
      setGeneratedPrompt(result.prompt);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson4/docs/seed-examples', {});
      await fetchDocs();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render priority badge
  const renderPriorityBadge = (priority) => {
    const style = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '0.75rem',
      }}>
        {style.icon} {style.label}
      </span>
    );
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const style = STATUS_COLORS[status] || STATUS_COLORS.open;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '0.75rem',
      }}>
        {style.icon} {style.label}
      </span>
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
        <h1>Context Docs</h1>
        <p className="page-description">
          <strong>The Problem:</strong> Every new AI session starts from scratch. You waste time re-explaining
          project context, and the AI makes the same mistakes you've already corrected in previous sessions.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Maintain living context documents that capture project state, decisions,
          issues, and lessons. Start each session with full context for immediate productivity.
        </p>
      </header>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={4} criteria={LESSON_CRITERIA[4]} />
        <StatsPanel stats={stats ? [
            { label: 'Documents', value: stats.total_docs, color: 'var(--accent-blue)' },
            { label: 'Sessions', value: stats.total_sessions, color: 'var(--accent-green)' },
            { label: 'This Week', value: stats.sessions_this_week, color: 'var(--accent-yellow)' },
            { label: 'Avg Quality', value: stats.avg_context_quality, color: 'var(--accent-purple)' },
            { label: 'Avg Continuity', value: stats.avg_continuity_rating, color: 'var(--accent-blue)' },
        ] : []} />
      </div>

      {error && (
        <div className="error-banner" style={{ background: 'var(--error-bg)', padding: '12px', marginBottom: '16px', borderRadius: '8px', color: 'var(--accent-red)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* Active Session Banner */}
      {activeSession && (
        <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: 'var(--accent-green)' }}>Active Session:</strong> {activeSession.project_name}
              <span style={{ color: 'var(--text-secondary)', marginLeft: '16px' }}>
                Started {new Date(activeSession.started_at).toLocaleTimeString()}
              </span>
            </div>
            <button className="btn btn-primary" onClick={handleEndSession}>
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['learn', 'docs', 'sessions'].map((tab) => (
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
      {activeTab === 'learn' && (
        <div className="learn-section">
          <h2>Context Persistence</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Maintain continuity across AI sessions by documenting project context systematically.
          </p>

          {/* What to Include */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>What to Include in a Context Document</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent-blue)', marginTop: 0 }}>Current State</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  What's complete, in progress, and blocked. Gives AI immediate situational awareness.
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent-purple)', marginTop: 0 }}>Key Decisions</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Important decisions made with reasoning. Prevents AI from suggesting already-rejected approaches.
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent-red)', marginTop: 0 }}>Known Issues</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Issues encountered with workarounds. Saves time debugging known problems.
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent-green)', marginTop: 0 }}>Lessons Learned</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Insights from previous sessions. Helps AI avoid past mistakes.
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--accent-yellow)', marginTop: 0 }}>Next Goals</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Specific tasks for upcoming sessions. Provides clear direction.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>The Session Workflow</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '8px 14px', borderRadius: '50%', fontWeight: 'bold' }}>1</span>
                <div>
                  <strong>Start Session</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Generate context prompt and share with AI at session start
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '8px 14px', borderRadius: '50%', fontWeight: 'bold' }}>2</span>
                <div>
                  <strong>Work on Project</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    AI has full context from the start - no re-explaining needed
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '8px 14px', borderRadius: '50%', fontWeight: 'bold' }}>3</span>
                <div>
                  <strong>End Session</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Update context doc with accomplishments, new decisions, issues found
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '8px 14px', borderRadius: '50%', fontWeight: 'bold' }}>4</span>
                <div>
                  <strong>Rate Quality</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Assess how helpful the context was - refine document format over time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0 }}>Benefits of Context Persistence</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
              <li>First response quality improves dramatically</li>
              <li>No need to re-explain project background each session</li>
              <li>AI avoids suggesting previously rejected approaches</li>
              <li>Issues aren't rediscovered - workarounds are documented</li>
              <li>Sessions feel continuous rather than disconnected</li>
              <li>Knowledge compounds across sessions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Docs Tab */}
      {activeTab === 'docs' && (
        <div className="docs-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>{editingDoc ? 'Edit Document' : 'Create Document'}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {docs.length === 0 && (
                <button className="btn btn-secondary" onClick={handleSeedExamples}>
                  Load Examples
                </button>
              )}
              {editingDoc && (
                <button className="btn btn-secondary" onClick={resetDocForm}>
                  New Document
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            {/* Document Form */}
            <div className="card" style={{ padding: '24px' }}>
              {/* Basic Info */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Project Name *</label>
                <input
                  type="text"
                  value={docForm.project_name}
                  onChange={(e) => setDocForm({ ...docForm, project_name: e.target.value })}
                  placeholder="e.g., API Refactoring Project"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  placeholder="Brief project description"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Current State */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-blue)' }}>Current State</h4>

                {['complete', 'in_progress', 'blocked'].map((type) => (
                  <div key={type} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
                      {type.replace('_', ' ')}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={tempInputs[type]}
                        onChange={(e) => setTempInputs({ ...tempInputs, [type]: e.target.value })}
                        placeholder={`Add ${type.replace('_', ' ')} item`}
                        className="input"
                        style={{ flex: 1 }}
                        onKeyPress={(e) => e.key === 'Enter' && addStateItem(type)}
                      />
                      <button className="btn btn-secondary" onClick={() => addStateItem(type)}>+</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {docForm.current_state[type].map((item, idx) => (
                        <span key={idx} style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          {item}
                          <button onClick={() => removeStateItem(type, idx)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>x</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Decisions */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-purple)' }}>Key Decisions</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tempInputs.decision}
                    onChange={(e) => setTempInputs({ ...tempInputs, decision: e.target.value })}
                    placeholder="Decision"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={tempInputs.reasoning}
                    onChange={(e) => setTempInputs({ ...tempInputs, reasoning: e.target.value })}
                    placeholder="Reasoning"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary" onClick={addDecision}>+</button>
                </div>
                {docForm.key_decisions.map((d, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{d.decision}</strong>
                      {d.reasoning && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>- {d.reasoning}</span>}
                    </div>
                    <button onClick={() => removeDecision(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>x</button>
                  </div>
                ))}
              </div>

              {/* Known Issues */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-red)' }}>Known Issues</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tempInputs.issue}
                    onChange={(e) => setTempInputs({ ...tempInputs, issue: e.target.value })}
                    placeholder="Issue"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={tempInputs.workaround}
                    onChange={(e) => setTempInputs({ ...tempInputs, workaround: e.target.value })}
                    placeholder="Workaround"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary" onClick={addIssue}>+</button>
                </div>
                {docForm.known_issues.map((i, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{i.issue}</strong>
                      {i.workaround && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>- {i.workaround}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {renderStatusBadge(i.status)}
                      <button onClick={() => removeIssue(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>x</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lessons Learned */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-green)' }}>Lessons Learned</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tempInputs.lesson}
                    onChange={(e) => setTempInputs({ ...tempInputs, lesson: e.target.value })}
                    placeholder="Lesson"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={tempInputs.lessonContext}
                    onChange={(e) => setTempInputs({ ...tempInputs, lessonContext: e.target.value })}
                    placeholder="Context"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary" onClick={addLesson}>+</button>
                </div>
                {docForm.lessons_learned.map((l, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{l.lesson}</strong>
                      {l.context && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>- {l.context}</span>}
                    </div>
                    <button onClick={() => removeLesson(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>x</button>
                  </div>
                ))}
              </div>

              {/* Next Goals */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-yellow)' }}>Next Goals</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tempInputs.goal}
                    onChange={(e) => setTempInputs({ ...tempInputs, goal: e.target.value })}
                    placeholder="Goal"
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <select
                    value={tempInputs.priority}
                    onChange={(e) => setTempInputs({ ...tempInputs, priority: e.target.value })}
                    className="input"
                    style={{ width: '100px' }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button className="btn btn-secondary" onClick={addGoal}>+</button>
                </div>
                {docForm.next_goals.map((g, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{g.goal}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {renderPriorityBadge(g.priority)}
                      <button onClick={() => removeGoal(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>x</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Additional Notes</label>
                <textarea
                  value={docForm.content}
                  onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                  placeholder="Any other context..."
                  className="input"
                  rows={4}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveDoc}
                style={{ width: '100%' }}
              >
                {editingDoc ? 'Update Document' : 'Create Document'}
              </button>
            </div>

            {/* Document List */}
            <div>
              <h3 style={{ marginTop: 0 }}>Your Documents</h3>
              {docs.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No documents yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        border: editingDoc?.id === doc.id ? '2px solid var(--accent-blue)' : 'none',
                        opacity: doc.is_active ? 1 : 0.6
                      }}
                      onClick={() => handleEditDoc(doc.id)}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{doc.project_name}</div>
                      {doc.description && (
                        <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {doc.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>v{doc.version} | {doc.session_count} sessions</span>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--accent-red)', color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="sessions-section">
          <h2>Work Sessions</h2>

          {/* Start New Session */}
          {!activeSession && (
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0 }}>Start New Session</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Select Project</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {docs.filter(d => d.is_active).map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '12px',
                          background: selectedDoc?.id === doc.id ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: selectedDoc?.id === doc.id ? '2px solid var(--accent-blue)' : '2px solid transparent'
                        }}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div style={{ fontWeight: 'bold' }}>{doc.project_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{doc.session_count} previous sessions</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Session Goals (one per line)</label>
                  <textarea
                    value={sessionGoals}
                    onChange={(e) => setSessionGoals(e.target.value)}
                    placeholder="What do you want to accomplish?"
                    className="input"
                    rows={5}
                    style={{ width: '100%', marginBottom: '12px' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleStartSession}
                    disabled={!selectedDoc}
                    style={{ width: '100%' }}
                  >
                    Start Session & Generate Prompt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Prompt */}
          {generatedPrompt && (
            <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Context Prompt</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                >
                  Copy to Clipboard
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Share this with your AI assistant at the start of your session:
              </p>
              <pre style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.85rem', maxHeight: '400px', overflowY: 'auto' }}>
                {generatedPrompt}
              </pre>
            </div>
          )}

          {/* Session History */}
          <h3>Session History</h3>
          {sessions.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No sessions yet. Start one above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="card"
                  style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{session.project_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(session.started_at).toLocaleDateString()} {new Date(session.started_at).toLocaleTimeString()}
                      {session.ended_at ? (
                        <span style={{ marginLeft: '8px', color: 'var(--accent-green)' }}>Completed</span>
                      ) : (
                        <span style={{ marginLeft: '8px', color: 'var(--accent-yellow)' }}>In Progress</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {session.accomplishment_count > 0 && (
                      <span style={{ color: 'var(--accent-green)' }}>{session.accomplishment_count} accomplishments</span>
                    )}
                    {session.context_quality_rating && (
                      <span style={{ color: 'var(--accent-purple)' }}>Quality: {session.context_quality_rating}/10</span>
                    )}
                    {session.continuity_rating && (
                      <span style={{ color: 'var(--accent-blue)' }}>Continuity: {session.continuity_rating}/10</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <LessonNav currentLesson={4} />
    </div>
  );
}
