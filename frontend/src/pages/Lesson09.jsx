import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// Pass indicator colors and labels
const PASS_STYLES = {
  1: { color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)', label: '70%', name: 'Structure & Approach', icon: '🏗️' },
  2: { color: 'var(--accent-blue)', bg: 'var(--bg-tertiary)', label: '85%', name: 'Robustness', icon: '🛡️' },
  3: { color: 'var(--accent-green)', bg: 'var(--bg-tertiary)', label: '95%', name: 'Production-Ready', icon: '🚀' },
};

export default function Lesson09() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [tasks, setTasks] = useState([]);
  const [passInfo, setPassInfo] = useState(null);
  const [transitionTemplates, setTransitionTemplates] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create task state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ task_name: '', target_outcome: '', notes: '' });

  // Import from Context Tracker state
  const [conversations, setConversations] = useState([]);
  const [showConvImport, setShowConvImport] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Selected task state (for Practice tab)
  const [selectedTask, setSelectedTask] = useState(null);
  const [passForm, setPassForm] = useState({ key_question_answer: '', feedback: '' });
  const [submittingPass, setSubmittingPass] = useState(false);

  // Fetch data
  const fetchTasks = async () => {
    try {
      const data = await api.get('/lesson9/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const fetchPassInfo = async () => {
    try {
      const data = await api.get('/lesson9/pass-info');
      setPassInfo(data);
    } catch (err) {
      console.error('Failed to fetch pass info:', err);
    }
  };

  const fetchTransitionTemplates = async () => {
    try {
      const data = await api.get('/lesson9/transition-templates');
      setTransitionTemplates(data);
    } catch (err) {
      console.error('Failed to fetch transition templates:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson9/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchPassInfo(), fetchTransitionTemplates(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handlers
  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson9/tasks/seed-examples', {});
      await fetchTasks();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL iteration tasks? This cannot be undone.')) return;
    try {
      for (const t of tasks) {
        await api.del(`/lesson9/tasks/${t.id}`);
      }
      await fetchTasks();
      await fetchStats();
      setSelectedTask(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.task_name.trim()) {
      setError('Task name is required');
      return;
    }
    try {
      const created = await api.post('/lesson9/tasks', newTask);
      await fetchTasks();
      await fetchStats();
      setShowCreateForm(false);
      setNewTask({ task_name: '', target_outcome: '', notes: '' });
      setSelectedTask(created);
      setActiveTab('practice');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.del(`/lesson9/tasks/${id}`);
      await fetchTasks();
      await fetchStats();
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectTask = async (id) => {
    try {
      const full = await api.get(`/lesson9/tasks/${id}`);
      setSelectedTask(full);
      setPassForm({ key_question_answer: '', feedback: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecordPass = async () => {
    if (!selectedTask || selectedTask.is_complete) return;
    if (!passForm.key_question_answer.trim() || !passForm.feedback.trim()) {
      setError('Both the key question answer and feedback are required');
      return;
    }

    setSubmittingPass(true);
    setError(null);

    try {
      const updated = await api.post(`/lesson9/tasks/${selectedTask.id}/passes`, passForm);
      setSelectedTask(updated);
      setPassForm({ key_question_answer: '', feedback: '' });
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingPass(false);
    }
  };

  const handleOpenConvImport = async () => {
    if (showConvImport) { setShowConvImport(false); return; }
    setLoadingConvs(true);
    try {
      const data = await api.get('/lesson1/conversations');
      setConversations(data);
      setShowConvImport(true);
    } catch (err) {
      setError('Could not load conversations from Context Tracker: ' + err.message);
    } finally {
      setLoadingConvs(false);
    }
  };

  const handleImportConversation = async (id) => {
    try {
      const conv = await api.get(`/lesson1/conversations/${id}`);
      const analysis = conv.analysis || {};
      setNewTask({
        ...newTask,
        task_name: analysis.topic || 'Imported conversation',
        target_outcome: analysis.coaching || '',
        notes: `Imported from Context Tracker conversation on ${new Date(conv.created_at).toLocaleDateString()}`
      });
      setShowConvImport(false);
      if (!showCreateForm) setShowCreateForm(true);
    } catch (err) {
      setError('Could not load conversation: ' + err.message);
    }
  };

  // Render pass progress indicator
  const renderPassProgress = (currentPass, isComplete) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[1, 2, 3].map((pass) => {
          const style = PASS_STYLES[pass];
          const isActive = pass === currentPass && !isComplete;
          const isCompleted = pass < currentPass || isComplete;

          return (
            <div
              key={pass}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '32px',
                borderRadius: '6px',
                background: isCompleted ? 'var(--success-bg)' : isActive ? style.bg : 'var(--bg-secondary)',
                border: isActive ? `2px solid ${style.color}` : '2px solid transparent',
                color: isCompleted ? 'var(--accent-green)' : isActive ? style.color : 'var(--text-muted)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
              }}
            >
              {isCompleted ? '[OK]' : style.label}
            </div>
          );
        })}
        {isComplete && (
          <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem', marginLeft: '8px' }}>Complete!</span>
        )}
      </div>
    );
  };

  // Render task card for list views
  const renderTaskCard = (task, onClick) => {
    const passStyle = PASS_STYLES[task.current_pass] || PASS_STYLES[1];

    return (
      <div
        key={task.id}
        className="card"
        style={{
          padding: '16px',
          cursor: 'pointer',
          background: task.is_complete ? 'var(--success-bg)' : passStyle.bg,
          borderLeft: task.is_complete ? '4px solid var(--accent-green)' : `4px solid ${passStyle.color}`,
        }}
        onClick={() => onClick(task.id)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h4 style={{ margin: 0 }}>{task.task_name}</h4>
          {task.is_complete && (
            <span style={{ background: 'var(--accent-green)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
              COMPLETE
            </span>
          )}
        </div>
        {renderPassProgress(task.current_pass, task.is_complete)}
        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {task.passes_completed}/3 passes recorded
        </div>
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
        <h1>Iteration Passes</h1>
        <p className="page-description">
          <strong>The Problem:</strong> Random iteration ("make it better") wastes cycles and leads to scope creep.
          Without structure, you'll keep tweaking without knowing when "done" is reached.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Use the 70-85-95 framework to iterate with purpose. Each pass has a specific
          focus and key question, so you know exactly what to evaluate and when to move on.
        </p>
      </header>

      {error && (
        <div className="error-banner" style={{ background: 'var(--error-bg)', padding: '12px', marginBottom: '16px', borderRadius: '8px', color: 'var(--accent-red)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['learn', 'practice', 'history', 'stats'].map((tab) => (
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
          <h2>The 70-85-95 Framework</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Stop iterating randomly. Use structured passes with specific focus areas and key questions to reach
            production-ready output efficiently.
          </p>

          {/* The Three Passes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {passInfo && Object.entries(passInfo).map(([num, info]) => {
              const style = PASS_STYLES[parseInt(num)];
              return (
                <div
                  key={num}
                  className="card"
                  style={{
                    padding: '24px',
                    background: style.bg,
                    borderTop: `4px solid ${style.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: style.color,
                    }}>
                      {info.label}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: style.color }}>{style.icon} {info.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pass {num}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FOCUS</div>
                    <div style={{ color: 'var(--text-muted)' }}>{info.focus}</div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>KEY QUESTION</div>
                    <div style={{ color: style.color, fontStyle: 'italic', fontSize: '1.1rem' }}>
                      "{info.key_question}"
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {info.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How It Works */}
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '24px' }}>
            <h3>How It Works</h3>
            <ol style={{ margin: '16px 0 0', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '2' }}>
              <li><strong>Create a task</strong> with a clear target outcome (what "done" looks like)</li>
              <li><strong>Pass 1 (70%):</strong> Get the structure right. Ask yourself: "Right problem, right way?"</li>
              <li><strong>Pass 2 (85%):</strong> Make it robust. Ask: "What will break in practice?"</li>
              <li><strong>Pass 3 (95%):</strong> Polish for production. Ask: "Will this work for its audience?"</li>
              <li><strong>Each pass:</strong> Answer the key question, record your iteration feedback, then advance</li>
            </ol>
          </div>

          {/* Transition Templates */}
          {transitionTemplates && (
            <div>
              <h3>Transition Prompts</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Use these templates when moving between passes to guide the AI's focus.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                {Object.entries(transitionTemplates).map(([key, template]) => (
                  <div key={key} className="card" style={{ padding: '20px' }}>
                    <h4 style={{ margin: '0 0 12px', color: 'var(--accent-blue)' }}>{template.name}</h4>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px' }}>
                      {template.template}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <div className="practice-section">
          {selectedTask ? (
            // Active task view
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedTask.task_name}</h2>
                  {selectedTask.target_outcome && (
                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
                      <strong>Target:</strong> {selectedTask.target_outcome}
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => { setSelectedTask(null); setPassForm({ key_question_answer: '', feedback: '' }); }}>
                  Back to List
                </button>
              </div>

              {/* Pass progress */}
              <div style={{ marginBottom: '24px' }}>
                {renderPassProgress(selectedTask.current_pass, selectedTask.is_complete)}
              </div>

              {/* Current pass form (if not complete) */}
              {!selectedTask.is_complete && selectedTask.current_pass_info && (
                <div className="card" style={{
                  padding: '24px',
                  background: PASS_STYLES[selectedTask.current_pass]?.bg || 'var(--bg-secondary)',
                  borderLeft: `4px solid ${PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)'}`,
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'var(--bg-secondary)',
                      fontWeight: 'bold',
                      color: PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)',
                    }}>
                      {selectedTask.current_pass_info.label}
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{selectedTask.current_pass_info.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedTask.current_pass_info.focus}</div>
                    </div>
                  </div>

                  {/* Key Question */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)' }}>
                      Key Question: "{selectedTask.current_pass_info.key_question}"
                    </label>
                    <textarea
                      value={passForm.key_question_answer}
                      onChange={(e) => setPassForm({ ...passForm, key_question_answer: e.target.value })}
                      placeholder={`Answer the question: ${selectedTask.current_pass_info.key_question}`}
                      className="input"
                      rows={3}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Feedback */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Iteration Feedback
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '8px' }}>
                        (What did you tell the AI to improve?)
                      </span>
                    </label>
                    <textarea
                      value={passForm.feedback}
                      onChange={(e) => setPassForm({ ...passForm, feedback: e.target.value })}
                      placeholder="Paste or describe the feedback you gave to the AI for this iteration pass..."
                      className="input"
                      rows={5}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleRecordPass}
                    disabled={submittingPass || !passForm.key_question_answer.trim() || !passForm.feedback.trim()}
                    style={{ padding: '12px 24px' }}
                  >
                    {submittingPass ? 'Recording...' : `Complete Pass ${selectedTask.current_pass} (${selectedTask.current_pass_info.label})`}
                  </button>
                </div>
              )}

              {/* Completed message */}
              {selectedTask.is_complete && (
                <div className="card" style={{ padding: '24px', background: 'var(--success-bg)', borderLeft: '4px solid var(--accent-green)', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 8px', color: 'var(--accent-green)' }}>Task Complete!</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    All three passes have been recorded. This task has been refined through the full 70-85-95 framework.
                  </p>
                </div>
              )}

              {/* Pass history */}
              {selectedTask.passes && selectedTask.passes.length > 0 && (
                <div>
                  <h3>Pass History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedTask.passes.map((pass, idx) => (
                      <div
                        key={idx}
                        className="card"
                        style={{
                          padding: '20px',
                          background: 'var(--bg-secondary)',
                          borderLeft: `4px solid ${PASS_STYLES[pass.pass_number]?.color || 'var(--text-secondary)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              background: PASS_STYLES[pass.pass_number]?.bg || 'var(--bg-tertiary)',
                              color: PASS_STYLES[pass.pass_number]?.color || 'var(--text-secondary)',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                            }}>
                              {pass.pass_label}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{pass.focus}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(pass.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>KEY QUESTION ANSWER</div>
                          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{pass.key_question_answer}"</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ITERATION FEEDBACK</div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
                            {pass.feedback}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : showCreateForm ? (
            // Create form
            <div className="card" style={{ padding: '24px' }}>
              <h2>Start New Iteration Task</h2>

              {/* Import from Context Tracker */}
              <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenConvImport}
                  disabled={loadingConvs}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loadingConvs ? 'Loading...' : showConvImport ? 'Hide Import' : 'Import from Context Tracker'}
                </button>

                {showConvImport && (
                  <div className="card" style={{ padding: '16px', marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 12px' }}>Select a Conversation</h4>
                    {conversations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        <p>No conversations saved yet.</p>
                        <p style={{ fontSize: '0.85rem' }}>
                          Go to <a href="/lesson/1" style={{ color: 'var(--accent-blue)' }}>Lesson 1 — Context Tracker</a> to analyze a conversation first.
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Task Name *</label>
                  <input
                    type="text"
                    value={newTask.task_name}
                    onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                    placeholder="e.g., Refactor Authentication Module"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>
                    Target Outcome
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '8px' }}>(What does "done" look like?)</span>
                  </label>
                  <textarea
                    value={newTask.target_outcome}
                    onChange={(e) => setNewTask({ ...newTask, target_outcome: e.target.value })}
                    placeholder="Describe the end state when this task is complete..."
                    className="input"
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Notes (optional)</label>
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    placeholder="Any additional context or notes..."
                    className="input"
                    rows={2}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button className="btn btn-primary" onClick={handleCreateTask}>
                    Create Task
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewTask({ task_name: '', target_outcome: '', notes: '' }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Task list
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Active Tasks</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {tasks.length === 0 && (
                    <button className="btn btn-secondary" onClick={handleSeedExamples}>
                      Load Examples
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                    + New Task
                  </button>
                  {tasks.length > 0 && (
                    <button className="btn btn-danger" onClick={handleClearAll}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {tasks.filter(t => !t.is_complete).length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h3>No active tasks</h3>
                  <p>Create a new task to start practicing the 70-85-95 iteration framework.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {tasks.filter(t => !t.is_complete).map((task) => renderTaskCard(task, handleSelectTask))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <h2>Completed Tasks</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Tasks that have gone through all three iteration passes (70% - 85% - 95%).
          </p>

          {tasks.filter(t => t.is_complete).length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No completed tasks yet</h3>
              <p>Complete a task through all three passes to see it here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {tasks.filter(t => t.is_complete).map((task) => (
                <div
                  key={task.id}
                  className="card"
                  style={{
                    padding: '16px',
                    background: 'var(--success-bg)',
                    borderLeft: '4px solid var(--accent-green)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>{task.task_name}</h4>
                    <span style={{ background: 'var(--accent-green)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      COMPLETE
                    </span>
                  </div>
                  {renderPassProgress(task.current_pass, task.is_complete)}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Completed {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        onClick={() => { handleSelectTask(task.id); setActiveTab('practice'); }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2>Iteration Statistics</h2>

          {stats && stats.total_tasks > 0 ? (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total_tasks}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Total Tasks</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.completed_tasks}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Completed</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.in_progress_tasks}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>In Progress</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.total_passes_recorded}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Passes Recorded</div>
                </div>
              </div>

              {/* Completion rate */}
              <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3>Completion Rate</h3>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Tasks Completed</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.completion_rate}%</span>
                  </div>
                  <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${stats.completion_rate}%`,
                        background: 'linear-gradient(90deg, var(--accent-green), var(--accent-green-hover))',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks by pass */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3>Tasks by Current Pass</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    In-progress tasks grouped by their current iteration stage
                  </p>
                  {Object.entries(stats.tasks_by_current_pass).map(([pass, count]) => {
                    const style = PASS_STYLES[parseInt(pass)];
                    return (
                      <div key={pass} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: style.bg,
                          color: style.color,
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          minWidth: '48px',
                          textAlign: 'center',
                        }}>
                          {style.label}
                        </div>
                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{style.icon} {style.name}</span>
                        <span style={{ fontWeight: 'bold' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h3>Your Pattern</h3>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Avg Passes per Completed Task</span>
                      <span style={{ fontWeight: 'bold' }}>{stats.avg_passes_per_completed_task}</span>
                    </div>
                  </div>
                  <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {stats.avg_passes_per_completed_task === 3
                      ? "You're consistently completing all three passes - excellent structured iteration!"
                      : stats.avg_passes_per_completed_task > 2.5
                      ? "Most tasks go through all passes. Keep up the thorough iteration practice."
                      : "Some tasks may be completing early. Consider whether all passes add value for each task."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No statistics yet</h3>
              <p>Create and iterate on some tasks to see your patterns.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
