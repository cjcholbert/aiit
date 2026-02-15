import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

// Category colors and info - using CSS custom properties for theme support
const CATEGORIES = {
  ai_optimal: {
    label: 'AI-Optimal',
    color: 'var(--accent-green)',
    bgClass: 'category-ai-optimal',
    description: 'Delegate freely - well-defined input/output, pattern-based work',
    icon: '🤖'
  },
  collaborative: {
    label: 'Collaborative',
    color: 'var(--accent-yellow)',
    bgClass: 'category-collaborative',
    description: 'Work together - requires judgment, benefits from your context + AI capability',
    icon: '🤝'
  },
  human_primary: {
    label: 'Human-Primary',
    color: 'var(--accent-red)',
    bgClass: 'category-human-primary',
    description: 'You lead - requires your authority, credentials, or institutional knowledge',
    icon: '👤'
  }
};

export default function Lesson07() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [decompositions, setDecompositions] = useState([]);
  const [categories, setCategories] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create decomposition state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ project_name: '', description: '', tasks: [] });
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'collaborative', reasoning: '' });

  // View/edit decomposition state
  const [selectedDecomp, setSelectedDecomp] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // AI Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch data
  const fetchDecompositions = async () => {
    try {
      const data = await api.get('/lesson7/decompositions');
      setDecompositions(data);
    } catch (err) {
      console.error('Failed to fetch decompositions:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/lesson7/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson7/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDecompositions(), fetchCategories(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handlers
  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson7/decompositions/seed-examples', {});
      await fetchDecompositions();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL decompositions? This cannot be undone.')) return;
    try {
      for (const d of decompositions) {
        await api.del(`/lesson7/decompositions/${d.id}`);
      }
      await fetchDecompositions();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    setNewProject({
      ...newProject,
      tasks: [...newProject.tasks, { ...newTask, order: newProject.tasks.length }]
    });
    setNewTask({ title: '', description: '', category: 'collaborative', reasoning: '' });
  };

  const handleRemoveTask = (index) => {
    setNewProject({
      ...newProject,
      tasks: newProject.tasks.filter((_, i) => i !== index)
    });
  };

  const handleCreateDecomposition = async () => {
    if (!newProject.project_name.trim()) {
      setError('Project name is required');
      return;
    }
    if (newProject.tasks.length === 0) {
      setError('Add at least one task');
      return;
    }
    try {
      await api.post('/lesson7/decompositions', newProject);
      await fetchDecompositions();
      await fetchStats();
      setShowCreateForm(false);
      setNewProject({ project_name: '', description: '', tasks: [] });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDecomposition = async (id) => {
    if (!confirm('Delete this decomposition?')) return;
    try {
      await api.del(`/lesson7/decompositions/${id}`);
      await fetchDecompositions();
      await fetchStats();
      if (selectedDecomp?.id === id) setSelectedDecomp(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDecomposition = async (id) => {
    try {
      const full = await api.get(`/lesson7/decompositions/${id}`);
      setSelectedDecomp(full);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedDecomp) return;
    try {
      const updated = await api.put(`/lesson7/decompositions/${selectedDecomp.id}/tasks/${taskId}`, {
        status: newStatus
      });
      setSelectedDecomp(updated);
      await fetchDecompositions();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveTask = async (taskId, direction) => {
    if (!selectedDecomp) return;
    const tasks = [...selectedDecomp.tasks];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= tasks.length) return;

    [tasks[idx], tasks[newIdx]] = [tasks[newIdx], tasks[idx]];
    const taskIds = tasks.map(t => t.id);

    try {
      const updated = await api.put(`/lesson7/decompositions/${selectedDecomp.id}/reorder`, taskIds);
      setSelectedDecomp(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnalyzeDecomposition = async () => {
    if (!selectedDecomp) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await api.post(`/lesson7/decompositions/${selectedDecomp.id}/analyze`, {});
      setAnalysis(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderCategoryBadge = (category) => {
    const cat = CATEGORIES[category] || CATEGORIES.collaborative;
    return (
      <span className={`category-badge ${cat.bgClass}`}>
        {cat.icon} {cat.label}
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
        <h1>Task Decomposer</h1>
        <p className="page-description">
          <strong>The Problem:</strong> Without decomposition skills, you either delegate tasks that need your judgment
          (getting poor results) or do everything yourself (wasting AI's potential). Learning to categorize tasks
          lets you optimize the human-AI division of labor.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Break projects into subtasks and categorize each as AI-Optimal (delegate freely),
          Collaborative (work together), or Human-Primary (you lead). Sequence tasks with dependencies so you know
          what to hand off, what to co-create, and where to insert decision gates.
        </p>
      </header>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={7} criteria={LESSON_CRITERIA[7]} />
        <StatsPanel stats={stats ? [
            { label: 'Decomposed', value: stats.total_decompositions, color: 'var(--accent-blue)' },
            { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-green)' },
            { label: 'Avg Tasks/Project', value: stats.avg_tasks_per_decomposition, color: 'var(--accent-yellow)' },
            { label: 'Decision Gates', value: stats.decision_gates_count, color: 'var(--accent-red)' },
        ] : []} />
      </div>

      {error && (
        <div className="error-banner" style={{ background: 'var(--error-bg)', padding: '12px', marginBottom: '16px', borderRadius: '8px', color: 'var(--accent-red)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['learn', 'decompose'].map((tab) => (
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
          <h2>The Three Categories</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Every task falls into one of three categories based on who should lead. Learn to recognize each type.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(categories || CATEGORIES).map(([key, cat]) => (
              <div
                key={key}
                className={`card ${CATEGORIES[key]?.bgClass || ''}`}
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>{CATEGORIES[key]?.icon}</span>
                  <h3 style={{ margin: 0, color: CATEGORIES[key]?.color }}>{cat.label || key}</h3>
                </div>
                <p style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>{cat.description}</p>

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Examples:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'var(--text-primary)' }}>
                    {(cat.examples || []).slice(0, 4).map((ex, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{ex}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-secondary)' }}>Signals:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'var(--text-primary)' }}>
                    {(cat.signals || []).slice(0, 3).map((sig, i) => (
                      <li key={i} style={{ marginBottom: '4px', fontSize: '0.875rem' }}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3>Quick Reference</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-primary)' }}>Ask yourself...</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-primary)' }}>If YES, likely...</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', color: 'var(--text-primary)' }}>Is the input/output well-defined and pattern-based?</td>
                  <td style={{ padding: '8px', color: 'var(--accent-green)' }}>AI-Optimal</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px', color: 'var(--text-primary)' }}>Does it need my expertise + AI capability?</td>
                  <td style={{ padding: '8px', color: 'var(--accent-yellow)' }}>Collaborative</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', color: 'var(--text-primary)' }}>Does it require my authority or confidential access?</td>
                  <td style={{ padding: '8px', color: 'var(--accent-red)' }}>Human-Primary</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decompose Tab */}
      {activeTab === 'decompose' && (
        <div className="decompose-section">
          {selectedDecomp ? (
            // View/Edit Decomposition
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedDecomp.project_name}</h2>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedDecomp.tasks.length} tasks
                  </div>
                </div>
                <div className="decomp-detail-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyzeDecomposition}
                    disabled={analyzing}
                  >
                    {analyzing ? 'Analyzing...' : 'Get AI Feedback'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setSelectedDecomp(null); setAnalysis(null); }}>
                    Back to List
                  </button>
                </div>
              </div>

              {/* Category summary */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                {Object.entries(selectedDecomp.categories || {}).map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderCategoryBadge(cat)}
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
              </div>

              {/* Task list */}
              <div>
                {selectedDecomp.tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="card"
                    style={{
                      padding: '16px',
                      marginBottom: '12px',
                      background: task.status === 'completed' ? 'var(--success-bg)' : 'var(--bg-secondary)',
                      opacity: task.status === 'completed' ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>#{idx + 1}</span>
                          <h4 style={{ margin: 0, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: 'var(--text-primary)' }}>
                            {task.title}
                          </h4>
                          {task.is_decision_gate && (
                            <span style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                              Decision Gate
                            </span>
                          )}
                        </div>
                        {task.description && <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>{task.description}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {renderCategoryBadge(task.category)}
                          {task.reasoning && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              "{task.reasoning}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '16px' }}>
                        <button
                          onClick={() => handleMoveTask(task.id, 'up')}
                          disabled={idx === 0}
                          style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1 }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveTask(task.id, 'down')}
                          disabled={idx === selectedDecomp.tasks.length - 1}
                          style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', cursor: idx === selectedDecomp.tasks.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === selectedDecomp.tasks.length - 1 ? 0.5 : 1 }}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      {task.status !== 'completed' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        >
                          Mark Complete
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                          onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Analysis Results */}
              {analyzing && (
                <div className="card l7-analysis-loading">
                  <div className="spinner"></div>
                  <span>Analyzing your categorizations with AI...</span>
                </div>
              )}

              {analysis && !analyzing && (
                <div className="l7-analysis-results">
                  <h3 className="l7-analysis-heading">AI Categorization Feedback</h3>

                  {/* Overall Assessment */}
                  <div className="card l7-overall-card">
                    <div className="l7-overall-header">
                      <div className="l7-score-badge" data-quality={
                        analysis.overall_assessment?.score >= 8 ? 'high' :
                        analysis.overall_assessment?.score >= 5 ? 'medium' : 'low'
                      }>
                        {analysis.overall_assessment?.score}/10
                      </div>
                      <div className="l7-overall-summary">
                        {analysis.overall_assessment?.summary}
                      </div>
                    </div>
                    {analysis.overall_assessment?.strengths?.length > 0 && (
                      <div className="l7-strengths">
                        <strong>Strengths:</strong>
                        <ul>
                          {analysis.overall_assessment.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.overall_assessment?.category_balance && (
                      <div className="l7-balance-note">
                        {analysis.overall_assessment.category_balance.observation}
                      </div>
                    )}
                  </div>

                  {/* Per-task Reviews */}
                  {analysis.task_reviews?.length > 0 && (
                    <div className="l7-task-reviews">
                      <h4>Task-by-Task Review</h4>
                      {analysis.task_reviews.map((review, i) => (
                        <div key={i} className={`card l7-task-review ${!review.is_correct ? 'l7-needs-change' : ''} ${review.is_borderline ? 'l7-borderline' : ''}`}>
                          <div className="l7-review-header">
                            <span className="l7-review-title">{review.task_title}</span>
                            <span className={`l7-review-verdict ${review.is_correct ? 'correct' : 'incorrect'}`}>
                              {review.is_correct ? 'Correct' : 'Reconsider'}
                            </span>
                          </div>
                          {!review.is_correct && (
                            <div className="l7-category-suggestion">
                              <span className="l7-cat-from">{CATEGORIES[review.assigned_category]?.label || review.assigned_category}</span>
                              <span className="l7-cat-arrow">&rarr;</span>
                              <span className="l7-cat-to">{CATEGORIES[review.recommended_category]?.label || review.recommended_category}</span>
                            </div>
                          )}
                          <p className="l7-review-reasoning">{review.reasoning}</p>
                          {review.is_borderline && review.borderline_note && (
                            <div className="l7-borderline-note">
                              Borderline: {review.borderline_note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dependency & Decision Gate Analysis */}
                  <div className="l7-analysis-grid">
                    {analysis.dependency_analysis && (
                      <div className="card l7-dep-card">
                        <h4>Sequencing</h4>
                        <div className="l7-seq-quality" data-quality={analysis.dependency_analysis.sequencing_quality}>
                          {analysis.dependency_analysis.sequencing_quality}
                        </div>
                        {analysis.dependency_analysis.issues?.length > 0 && (
                          <div className="l7-dep-issues">
                            {analysis.dependency_analysis.issues.map((issue, i) => (
                              <p key={i} className="l7-dep-issue">{issue}</p>
                            ))}
                          </div>
                        )}
                        {analysis.dependency_analysis.suggestions?.length > 0 && (
                          <div className="l7-dep-suggestions">
                            {analysis.dependency_analysis.suggestions.map((s, i) => (
                              <p key={i} className="l7-dep-suggestion">{s}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {analysis.decision_gates && (
                      <div className="card l7-gates-card">
                        <h4>Decision Gates</h4>
                        <div className="l7-gates-counts">
                          <span>Current: {analysis.decision_gates.current_count}</span>
                          <span>Recommended: {analysis.decision_gates.recommended_count}</span>
                        </div>
                        {analysis.decision_gates.missing_gates?.length > 0 && (
                          <div className="l7-missing-gates">
                            <strong>Missing gates:</strong>
                            <ul>
                              {analysis.decision_gates.missing_gates.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.decision_gates.unnecessary_gates?.length > 0 && (
                          <div className="l7-unnecessary-gates">
                            <strong>Unnecessary gates:</strong>
                            <ul>
                              {analysis.decision_gates.unnecessary_gates.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coaching */}
                  {analysis.coaching && (
                    <div className="card l7-coaching-card">
                      <h4>Coaching</h4>
                      <div className="l7-coaching-item">
                        <strong>Key Insight:</strong>
                        <p>{analysis.coaching.biggest_insight}</p>
                      </div>
                      {analysis.coaching.common_mistake && (
                        <div className="l7-coaching-item">
                          <strong>Pattern to Watch:</strong>
                          <p>{analysis.coaching.common_mistake}</p>
                        </div>
                      )}
                      <div className="l7-coaching-item l7-next-step">
                        <strong>Next Step:</strong>
                        <p>{analysis.coaching.next_step}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : showCreateForm ? (
            // Create Form
            <div className="card" style={{ padding: '24px' }}>
              <h2>Decompose a Project</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Project Name</label>
                  <input
                    type="text"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    placeholder="e.g., Build User Dashboard"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Description (optional)</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of the project..."
                    className="input"
                    rows={2}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Tasks list */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Tasks ({newProject.tasks.length})</label>
                  {newProject.tasks.map((task, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{task.title}</span>
                      {renderCategoryBadge(task.category)}
                      <button onClick={() => handleRemoveTask(idx)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                    </div>
                  ))}
                </div>

                {/* Add task form */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Add Task</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title..."
                      className="input"
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                        className="input"
                        style={{ flex: 1 }}
                      >
                        <option value="ai_optimal">🤖 AI-Optimal</option>
                        <option value="collaborative">🤝 Collaborative</option>
                        <option value="human_primary">👤 Human-Primary</option>
                      </select>
                      <input
                        type="text"
                        value={newTask.reasoning}
                        onChange={(e) => setNewTask({ ...newTask, reasoning: e.target.value })}
                        placeholder="Why this category? (optional)"
                        className="input"
                        style={{ flex: 2 }}
                      />
                    </div>
                    <button className="btn btn-secondary" onClick={handleAddTask}>+ Add Task</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn btn-primary" onClick={handleCreateDecomposition}>
                    Save Decomposition
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewProject({ project_name: '', description: '', tasks: [] }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Decomposition List
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Your Decompositions</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {decompositions.length === 0 && (
                    <button className="btn btn-secondary" onClick={handleSeedExamples}>
                      Load Examples
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                    + New Decomposition
                  </button>
                  {decompositions.length > 0 && (
                    <button className="btn btn-danger" onClick={handleClearAll}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {decompositions.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ color: 'var(--text-primary)' }}>No decompositions yet</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Break down a project into categorized tasks to practice decomposition skills.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                  {decompositions.map((decomp) => (
                    <div key={decomp.id} className="card" style={{ padding: '16px' }}>
                      <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>{decomp.project_name}</h3>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--accent-green)' }}>{decomp.ai_optimal_count} AI</span>
                        <span style={{ color: 'var(--accent-yellow)' }}>{decomp.collaborative_count} Collab</span>
                        <span style={{ color: 'var(--accent-red)' }}>{decomp.human_primary_count} Human</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{decomp.task_count} tasks ({decomp.completed_count} done)</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary" style={{ padding: '4px 12px' }} onClick={() => handleViewDecomposition(decomp.id)}>
                            View
                          </button>
                          <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => handleDeleteDecomposition(decomp.id)}>
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
        </div>
      )}

      <LessonNav currentLesson={7} />
    </div>
  );
}
