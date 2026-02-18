import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import StatsPanel from '../components/StatsPanel';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';

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
  const [activeTab, setActiveTab] = useState('concepts');
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
      <div className="lesson-header">
        <div className="lesson-header-left">
          <h1>Task Decomposer</h1>
          <ConnectionCallout lessonNumber={1} lessonTitle="Context Tracker" message="The better you understand a project's details, the better you can break it into the right pieces." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> Without decomposition skills, you either delegate tasks that need your judgment (getting poor results) or do everything yourself (wasting AI's potential). Learning to categorize tasks lets you optimize the human-AI division of labor.</p>
            <p><strong>The Skill:</strong> Break projects into subtasks and categorize each as AI-Optimal (delegate freely), Collaborative (work together), or Human-Primary (you lead). Sequence tasks with dependencies so you know what to hand off, what to co-create, and where to insert decision gates.</p>
          </div>

        </div>
        <div className="lesson-header-right">
          <StatsPanel stats={stats ? [
              { label: 'Decomposed', value: stats.total_decompositions, color: 'var(--accent-blue)' },
              { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-green)' },
              { label: 'Avg Tasks/Project', value: stats.avg_tasks_per_decomposition, color: 'var(--accent-yellow)' },
              { label: 'Decision Gates', value: stats.decision_gates_count, color: 'var(--accent-red)' },
          ] : []} />

        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss btn btn-secondary btn-sm" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['concepts', 'decompose'].map((tab) => (
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
            <p className="text-secondary mb-md">
              One practice area to build your decomposition muscle:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">Decompose Tab — Break Down a Real Project</h4>
                <p>Pick a project you are working on (or about to start). Break it into individual tasks,
                categorize each one as AI-Optimal, Collaborative, or Human-Primary, and sequence them
                with dependencies. Then get AI feedback on your categorizations.</p>
                <button className="learn-tab-link" onClick={() => setActiveTab('decompose')}>Go to Decompose →</button>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Dumping vs. Decomposing">
            <div className="learn-comparison">
              <div className="learn-comparison-grid">
                <div className="learn-comparison-col">
                  <h4 className="poor">Dumping the Whole Project on AI</h4>
                  <div className="learn-comparison-item poor">
                    <div className="learn-comparison-scenario">Quarterly Business Review Prep</div>
                    <p>"Help me prepare our Q1 business review presentation for the leadership team."</p>
                  </div>
                  <div className="learn-comparison-item poor">
                    <p>AI produces a generic slide outline. You spend hours reworking it because it
                    missed your company's format, included wrong metrics, and suggested a narrative
                    that contradicts what your VP wants to emphasize.</p>
                  </div>
                </div>
                <div className="learn-comparison-col">
                  <h4 className="good">Decomposing, Then Delegating Strategically</h4>
                  <div className="learn-comparison-item good">
                    <div className="learn-comparison-scenario">Same QBR — Decomposed First</div>
                    <p>You break the QBR into tasks: pull revenue data (AI-Optimal), draft executive
                    summary (Collaborative), decide which initiatives to highlight (Human-Primary),
                    format slides to company template (AI-Optimal), rehearse talking points (Human-Primary).</p>
                  </div>
                  <div className="learn-comparison-item good">
                    <p>Each task gets the right approach. AI handles the data-heavy and formatting work.
                    You lead the strategic decisions. The result is done faster and fits what leadership
                    actually wants.</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🔑 The Three Categories">
            <p className="text-secondary mb-md">
              Every subtask falls into one of three categories. The key is knowing which signals to look for.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">AI-Optimal — Delegate Freely</h4>
                <p>The input and output are well-defined, the task is pattern-based, and there is low risk if
                the result needs a small correction.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  <strong>Event planning:</strong> Researching venue options within budget and location constraints<br/>
                  <strong>Marketing:</strong> Drafting 10 subject line variations for an email campaign<br/>
                  <strong>Finance:</strong> Summarizing expense reports into a formatted table<br/>
                  <strong>HR:</strong> Rewriting a job posting for a different platform's format
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-yellow">Collaborative — Work Together</h4>
                <p>The task benefits from AI's speed or breadth, but requires your domain knowledge,
                judgment, or context to get right.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  <strong>Event planning:</strong> Designing the run-of-show (you know the audience; AI structures the timeline)<br/>
                  <strong>Marketing:</strong> Writing a case study (you provide client details; AI shapes the narrative)<br/>
                  <strong>Finance:</strong> Analyzing budget variances (AI spots patterns; you explain why they happened)<br/>
                  <strong>HR:</strong> Drafting performance review talking points (you assess performance; AI helps with phrasing)
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-red">Human-Primary — You Lead</h4>
                <p>The task requires your authority, access to confidential information, relationships,
                or judgment calls that cannot be delegated.</p>
                <div className="learn-pattern-label better">Examples</div>
                <div className="learn-example-good">
                  <strong>Event planning:</strong> Getting budget approval from the CFO<br/>
                  <strong>Marketing:</strong> Deciding which client testimonials to feature (involves relationship sensitivity)<br/>
                  <strong>Finance:</strong> Presenting the quarterly results to the board<br/>
                  <strong>HR:</strong> Having a difficult conversation with an underperforming employee
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚦 Decision Gates: Knowing When to Pause">
            <p className="text-secondary mb-md">
              Not every task flows automatically into the next. A decision gate is a point where you need to
              review results and make a choice before continuing.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">When to Insert a Decision Gate</h4>
                <p>Add a gate any time the next task depends on a judgment call, not just the previous task's output.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  <strong>Project:</strong> Client proposal<br/>
                  <strong>Task 3:</strong> AI drafts three pricing options (AI-Optimal)<br/>
                  <strong>DECISION GATE:</strong> You choose which pricing option to present to the client<br/>
                  <strong>Task 4:</strong> AI writes the full proposal around the selected option (Collaborative)
                </div>
                <p className="l7-gate-note">
                  Without this gate, AI would pick a pricing option for you — a decision that affects the
                  entire client relationship.
                </p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid learn-patterns-grid-mb">
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Making tasks too large. "Create the marketing strategy" is not a single task — it contains
                research, analysis, creative work, and decision-making all bundled together.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Break it down until each task has one clear deliverable. "Research competitor pricing in
                  our market segment" is a task. "Create the marketing strategy" is a project.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Marking everything as "Collaborative" to avoid thinking about categorization. This defeats
                the purpose — you end up micromanaging tasks AI could handle alone and under-investing in
                tasks that need your full attention.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Be honest about each task. Ask: "If AI did this completely wrong, how bad would it be?"
                  Low stakes with clear criteria = AI-Optimal. High stakes or subjective judgment = Human-Primary.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Forgetting to sequence tasks with dependencies. You ask AI to draft a project timeline
                before you have decided which team members are available — then the timeline is useless.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Map dependencies before you start. If Task B needs the output of Task A, put A first
                  and insert a decision gate if A's output requires your review before B can begin.
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Decompose Tab */}
      {activeTab === 'decompose' && (
        <div className="decompose-section">
          {selectedDecomp ? (
            // View/Edit Decomposition
            <div>
              <div className="flex-between mb-md">
                <div>
                  <h2 className="no-margin">{selectedDecomp.project_name}</h2>
                  <div className="text-secondary mt-xs">
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
              <div className="l7-category-summary">
                {Object.entries(selectedDecomp.categories || {}).map(([cat, count]) => (
                  <div key={cat} className="l7-category-summary-item">
                    {renderCategoryBadge(cat)}
                    <span className="l7-category-summary-count">{count}</span>
                  </div>
                ))}
              </div>

              {/* Task list */}
              <div>
                {selectedDecomp.tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`card l7-task-card ${task.status === 'completed' ? 'l7-task-card-completed' : 'l7-task-card-default'}`}
                  >
                    <div className="l7-task-layout">
                      <div className="l7-task-body">
                        <div className="l7-task-title-row">
                          <span className="l7-task-number">#{idx + 1}</span>
                          <h4 className={`l7-task-title ${task.status === 'completed' ? 'l7-task-title-done' : ''}`}>
                            {task.title}
                          </h4>
                          {task.is_decision_gate && (
                            <span className="l7-decision-gate-badge">
                              Decision Gate
                            </span>
                          )}
                        </div>
                        {task.description && <p className="l7-task-description">{task.description}</p>}
                        <div className="l7-task-meta-row">
                          {renderCategoryBadge(task.category)}
                          {task.reasoning && (
                            <span className="l7-task-reasoning">
                              "{task.reasoning}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="l7-reorder-col">
                        <button
                          className="l7-reorder-btn"
                          onClick={() => handleMoveTask(task.id, 'up')}
                          disabled={idx === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="l7-reorder-btn"
                          onClick={() => handleMoveTask(task.id, 'down')}
                          disabled={idx === selectedDecomp.tasks.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <div className="l7-task-actions">
                      {task.status !== 'completed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        >
                          Mark Complete
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <button
                          className="btn btn-secondary btn-sm"
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
            <div className="card card-padded">
              <div className="l7-create-form-header">
                <h2>Decompose a Project</h2>
                <ExamplesDropdown
                  endpoint="/lesson7/examples"
                  onSelect={(example) => {
                    setNewProject({
                      ...newProject,
                      project_name: example.project_name || '',
                      description: example.description || '',
                      tasks: example.tasks || [],
                    });
                  }}
                />
              </div>
              <div className="l7-form-stack">
                <div>
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    placeholder="e.g., Build User Dashboard"
                    className="input"
                  />
                </div>

                <div>
                  <label>Description (optional)</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of the project..."
                    className="input"
                    rows={2}
                  />
                </div>

                {/* Tasks list */}
                <div>
                  <label className="mb-sm">Tasks ({newProject.tasks.length})</label>
                  {newProject.tasks.map((task, idx) => (
                    <div key={idx} className="l7-task-list-item">
                      <span className="text-muted">#{idx + 1}</span>
                      <span className="flex-1">{task.title}</span>
                      {renderCategoryBadge(task.category)}
                      <button className="l7-task-remove-btn" onClick={() => handleRemoveTask(idx)}>×</button>
                    </div>
                  ))}
                </div>

                {/* Add task form */}
                <div className="l7-add-task-panel">
                  <h4>Add Task</h4>
                  <div className="l7-add-task-fields">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title..."
                      className="input"
                    />
                    <div className="form-row">
                      <select
                        value={newTask.category}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                        className="input flex-1"
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
                        className="input flex-2"
                      />
                    </div>
                    <button className="btn btn-secondary" onClick={handleAddTask}>+ Add Task</button>
                  </div>
                </div>

                <div className="button-group-mt">
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
              <div className="flex-between mb-md">
                <h2>Your Decompositions</h2>
                <div className="gap-sm flex-center">
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
                <div>
                  <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                    Decompose a project above and you'll get a structured breakdown with:
                  </p>
                  <div className="analysis-grid">
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Task Categories</h3>
                      <div className="field">
                        <div className="field-label">AI-Optimal</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Tasks where AI can work independently with minimal oversight — well-defined, repeatable, and low-risk if the output needs minor correction.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Collaborative</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Tasks where AI does the heavy lifting but you steer direction and make judgment calls — the human-AI sweet spot for complex work.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Human-Primary</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Tasks requiring your expertise, relationships, or judgment that AI can't reliably replicate — knowing what stays with you is as important as knowing what to delegate.</div>
                      </div>
                    </div>
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Task Details</h3>
                      <div className="field">
                        <div className="field-label">Dependencies &amp; Sequencing</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Each task includes a reasoning for its category and an execution order, so you know what to tackle first and what depends on what.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Decision Gates</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Key checkpoints where you need to review AI output before proceeding — preventing cascading errors in dependent tasks.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid-auto-fill">
                  {decompositions.map((decomp) => (
                    <div key={decomp.id} className="card l7-decomp-card">
                      <h3>{decomp.project_name}</h3>
                      <div className="l7-decomp-card-stats">
                        <span className="color-accent-green">{decomp.ai_optimal_count} AI</span>
                        <span className="color-accent-yellow">{decomp.collaborative_count} Collab</span>
                        <span className="color-accent-red">{decomp.human_primary_count} Human</span>
                      </div>
                      <div className="l7-decomp-card-footer">
                        <span className="l7-decomp-card-footer-info">{decomp.task_count} tasks ({decomp.completed_count} done)</span>
                        <div className="gap-sm flex-center">
                          <button className="btn btn-primary btn-sm" onClick={() => handleViewDecomposition(decomp.id)}>
                            View
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDecomposition(decomp.id)}>
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

    </div>
  );
}
