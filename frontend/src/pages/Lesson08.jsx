import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import { useLessonStats } from '../contexts/LessonStatsContext';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';

// Task status colors - mapped to CSS classes
const STATUS_COLORS = {
  pending: { bgClass: 'l8-status-pending', colorClass: 'text-secondary', label: 'Pending', icon: '⏳' },
  delegated: { bgClass: 'l8-status-delegated', colorClass: 'color-accent-blue', label: 'Delegated', icon: '📤' },
  reviewing: { bgClass: 'l8-status-reviewing', colorClass: 'color-accent-yellow', label: 'Reviewing', icon: '👀' },
  completed: { bgClass: 'l8-status-completed', colorClass: 'color-accent-green', label: 'Completed', icon: '✅' },
  blocked: { bgClass: 'l8-status-blocked', colorClass: 'color-accent-red', label: 'Blocked', icon: '🚫' }
};

// Map status to card background CSS class
const STATUS_CARD_BG = {
  pending: 'l7-task-card-default',
  delegated: 'l7-task-card-default',
  reviewing: '',
  completed: 'l7-task-card-completed',
  blocked: ''
};

const CATEGORY_INFO = {
  ai_optimal: { colorClass: 'color-accent-green', icon: '🤖', label: 'AI-Optimal' },
  collaborative: { colorClass: 'color-accent-yellow', icon: '🤝', label: 'Collaborative' },
  human_primary: { colorClass: 'color-accent-red', icon: '👤', label: 'Human-Primary' }
};

export default function Lesson08() {
  const api = useApi();
  const { setStats: setSidebarStats } = useLessonStats();
  const [activeTab, setActiveTab] = useState('concepts');
  const [delegations, setDelegations] = useState([]);
  const [templateElements, setTemplateElements] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create delegation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDelegation, setNewDelegation] = useState({ name: '', template: '', task_sequence: [], notes: '' });
  const [newTask, setNewTask] = useState({
    title: '', description: '', category: 'ai_optimal', prompt: '', expected_output: '', is_decision_gate: false
  });

  // View/edit delegation state
  const [selectedDelegation, setSelectedDelegation] = useState(null);
  const [analyzingTaskId, setAnalyzingTaskId] = useState(null);
  const [sharedOutput, setSharedOutput] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Import from Task Decomposer state
  const [decompositions, setDecompositions] = useState([]);
  const [showDecompImport, setShowDecompImport] = useState(false);
  const [loadingDecomps, setLoadingDecomps] = useState(false);

  // Fetch data
  const fetchDelegations = async () => {
    try {
      const data = await api.get('/lesson8/delegations');
      setDelegations(data);
    } catch (err) {
      console.error('Failed to fetch delegations:', err);
    }
  };

  const fetchTemplateElements = async () => {
    try {
      const data = await api.get('/lesson8/template-elements');
      setTemplateElements(data);
    } catch (err) {
      console.error('Failed to fetch template elements:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson8/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDelegations(), fetchTemplateElements(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    setSidebarStats(stats ? [
      { label: 'Delegations', value: stats.total_delegations, color: 'var(--accent-blue)' },
      { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-blue)' },
      { label: 'Completed', value: stats.tasks_completed, color: 'var(--accent-green)' },
      { label: 'Pending', value: stats.tasks_pending, color: 'var(--accent-yellow)' },
    ] : []);
    return () => setSidebarStats(null);
  }, [stats, setSidebarStats]);

  // Handlers
  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson8/delegations/seed-examples', {});
      await fetchDelegations();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL delegations? This cannot be undone.')) return;
    try {
      for (const d of delegations) {
        await api.del(`/lesson8/delegations/${d.id}`);
      }
      await fetchDelegations();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    setNewDelegation({
      ...newDelegation,
      task_sequence: [...newDelegation.task_sequence, { ...newTask, order: newDelegation.task_sequence.length }]
    });
    setNewTask({ title: '', description: '', category: 'ai_optimal', prompt: '', expected_output: '', is_decision_gate: false });
  };

  const handleRemoveTask = (index) => {
    setNewDelegation({
      ...newDelegation,
      task_sequence: newDelegation.task_sequence.filter((_, i) => i !== index)
    });
  };

  const handleCreateDelegation = async () => {
    if (!newDelegation.name.trim()) {
      setError('Delegation name is required');
      return;
    }
    try {
      await api.post('/lesson8/delegations', newDelegation);
      await fetchDelegations();
      await fetchStats();
      setShowCreateForm(false);
      setNewDelegation({ name: '', template: '', task_sequence: [], notes: '' });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDelegation = async (id) => {
    if (!confirm('Delete this delegation?')) return;
    try {
      await api.del(`/lesson8/delegations/${id}`);
      await fetchDelegations();
      await fetchStats();
      if (selectedDelegation?.id === id) setSelectedDelegation(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDelegation = async (id) => {
    try {
      const full = await api.get(`/lesson8/delegations/${id}`);
      setSelectedDelegation(full);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (!selectedDelegation) return;
    try {
      const updated = await api.put(`/lesson8/delegations/${selectedDelegation.id}/tasks/${taskId}`, {
        status: newStatus
      });
      setSelectedDelegation(updated);
      await fetchDelegations();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTaskOutput = async (taskId, field, value) => {
    if (!selectedDelegation) return;
    try {
      const updated = await api.put(`/lesson8/delegations/${selectedDelegation.id}/tasks/${taskId}`, {
        [field]: value
      });
      setSelectedDelegation(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnalyzeTask = async (taskId, rawOutput) => {
    if (!selectedDelegation || !rawOutput?.trim()) {
      setError('Please paste some output to analyze');
      return;
    }
    setAnalyzingTaskId(taskId);
    setError(null);
    try {
      const review = await api.post(
        `/lesson8/delegations/${selectedDelegation.id}/tasks/${taskId}/analyze`,
        { raw_output: rawOutput }
      );
      // Refresh the delegation to get updated task with ai_review
      const updated = await api.get(`/lesson8/delegations/${selectedDelegation.id}`);
      setSelectedDelegation(updated);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzingTaskId(null);
    }
  };

  const handleAnalyzeSelectedTask = async () => {
    if (!selectedTaskId) {
      setError('Please select a task to analyze');
      return;
    }
    if (!sharedOutput?.trim()) {
      setError('Please paste output to analyze');
      return;
    }
    await handleAnalyzeTask(selectedTaskId, sharedOutput);
  };

  const getTasksByCategory = (tasks) => {
    return {
      ai_optimal: tasks.filter(t => t.category === 'ai_optimal'),
      collaborative: tasks.filter(t => t.category === 'collaborative'),
      human_primary: tasks.filter(t => t.category === 'human_primary')
    };
  };

  const handleOpenDecompImport = async () => {
    if (showDecompImport) { setShowDecompImport(false); return; }
    setLoadingDecomps(true);
    try {
      const data = await api.get('/lesson7/decompositions');
      setDecompositions(data);
      setShowDecompImport(true);
    } catch (err) {
      setError('Could not load decompositions from Task Decomposer: ' + err.message);
    } finally {
      setLoadingDecomps(false);
    }
  };

  const handleImportDecomposition = async (id) => {
    try {
      const decomp = await api.get(`/lesson7/decompositions/${id}`);
      setNewDelegation({
        ...newDelegation,
        name: decomp.project_name || '',
        task_sequence: (decomp.tasks || []).map((task, idx) => ({
          title: task.title || '',
          description: task.description || '',
          category: task.category || 'ai_optimal',
          prompt: '',
          expected_output: '',
          is_decision_gate: task.is_decision_gate || false,
          order: idx
        }))
      });
      setShowDecompImport(false);
      if (!showCreateForm) setShowCreateForm(true);
    } catch (err) {
      setError('Could not load decomposition: ' + err.message);
    }
  };

  const applyTemplateSection = (section) => {
    if (!templateElements?.[section]) return;
    const placeholder = templateElements[section].placeholder;
    const current = newDelegation.template;
    const header = `## ${templateElements[section].label}\n`;
    setNewDelegation({
      ...newDelegation,
      template: current + (current ? '\n\n' : '') + header + placeholder
    });
  };

  const renderStatusBadge = (status) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
      <span className={`l8-status-badge ${s.bgClass}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const renderCategoryBadge = (category) => {
    const cat = CATEGORY_INFO[category] || CATEGORY_INFO.ai_optimal;
    return (
      <span className={`l8-category-text ${cat.colorClass}`}>
        {cat.icon} {cat.label}
      </span>
    );
  };

  const renderTaskCard = (task, idx) => (
    <div
      key={task.id}
      className={`card l8-task-card ${task.is_decision_gate ? 'l8-task-card-gate' : ''} ${STATUS_CARD_BG[task.status] || ''}`}
    >
      <div className="l8-task-header">
        <div>
          <div className="l8-task-title-row">
            <h4>{task.title}</h4>
            {task.is_decision_gate && (
              <span className="l7-decision-gate-badge">
                Decision Gate
              </span>
            )}
          </div>
          {renderStatusBadge(task.status)}
        </div>
        {/* Status actions */}
        <div className="l8-status-actions">
          {task.status === 'pending' && (
            <button className="btn btn-primary btn-sm"
              onClick={() => handleUpdateTaskStatus(task.id, 'delegated')}>Delegate</button>
          )}
          {task.status === 'delegated' && (
            <button className="btn btn-primary btn-sm"
              onClick={() => handleUpdateTaskStatus(task.id, 'reviewing')}>Review</button>
          )}
          {task.status === 'reviewing' && (
            <>
              <button className="btn btn-primary btn-sm"
                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}>Approve</button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => handleUpdateTaskStatus(task.id, 'delegated')}>Revise</button>
            </>
          )}
          {task.status === 'completed' && (
            <button className="btn btn-secondary btn-sm"
              onClick={() => handleUpdateTaskStatus(task.id, 'reviewing')}>Reopen</button>
          )}
          {task.status === 'blocked' && (
            <button className="btn btn-secondary btn-sm"
              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}>Unblock</button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="l8-task-description">{task.description}</p>
      )}

      {/* AI Review Results */}
      {task.ai_review && (
        <div className={`l8-review-box ${task.ai_review.overall_pass ? 'l8-review-pass' : 'l8-review-fail'}`}>
          <div className="l8-review-header">
            <strong className={task.ai_review.overall_pass ? 'l8-review-verdict-pass' : 'l8-review-verdict-fail'}>
              {task.ai_review.overall_pass ? 'PASSED' : 'NEEDS WORK'}
            </strong>
          </div>

          {task.ai_review.criteria_results?.length > 0 && (
            <div className="l8-review-criteria">
              {task.ai_review.criteria_results.map((result, i) => (
                <div key={i} className="l8-review-criterion">
                  <span className={result.passed ? 'l8-review-criterion-pass' : 'l8-review-criterion-fail'}>
                    {result.passed ? '[OK]' : '[X]'}
                  </span>
                  <span className="l8-review-criterion-text">{result.criterion}</span>
                </div>
              ))}
            </div>
          )}

          {task.ai_review.summary && (
            <div className="l8-review-summary">{task.ai_review.summary}</div>
          )}

          {task.ai_review.suggestions?.length > 0 && (
            <div className="l8-review-suggestions">
              <strong>Suggestions:</strong>
              <ul>
                {task.ai_review.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Show if no review yet */}
      {!task.ai_review && task.status !== 'pending' && (
        <div className="l8-no-review">
          No AI review yet. Paste output above and select this task to analyze.
        </div>
      )}
    </div>
  );

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
          <h1>Delegation Tracker</h1>
          <ConnectionCallout lessonNumber={7} lessonTitle="Task Decomposer" message="Delegate decomposed tasks effectively so AI delivers what you need on the first try." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> Knowing what to delegate is only half the battle. Without structured delegation practices, you'll give vague instructions and get disappointing results, or spend more time explaining than doing the work yourself.</p>
            <p><strong>The Skill:</strong> Create delegation templates with clear context, objectives, scope, deliverables, and success criteria. Then execute decomposed tasks in sequence, tracking what you delegated, what you received, and what decisions you made at each gate.</p>
          </div>

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
        {['concepts', 'delegate'].map((tab) => (
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
              One practice area to build your delegation skill:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">Delegate Tab — Create and Execute Delegations</h4>
                <p>Build a delegation with a template (context, objectives, scope, deliverables, success
                criteria), add your task sequence, then execute each task through the Delegate-Receive-Review-Decide
                workflow. You can import tasks directly from Lesson 7.</p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Vague Handoff vs. Structured Delegation">
            <div className="learn-comparison">
              <div className="learn-comparison-grid">
                <div className="learn-comparison-col">
                  <h4 className="poor">Tossing Tasks Over the Wall</h4>
                  <div className="learn-comparison-item poor">
                    <div className="learn-comparison-scenario">Writing Client Follow-up Emails</div>
                    <p>"Write a follow-up email to the client about the project."</p>
                  </div>
                  <div className="learn-comparison-item poor">
                    <p>AI writes a generic "Thanks for meeting!" email. It misses that the client raised
                    concerns about the timeline, uses the wrong tone (too casual for this account), and
                    does not include the next steps you promised. You end up rewriting the entire thing.</p>
                  </div>
                </div>
                <div className="learn-comparison-col">
                  <h4 className="good">Structured Delegation</h4>
                  <div className="learn-comparison-item good">
                    <div className="learn-comparison-scenario">Same Task — With a Delegation Template</div>
                    <p><strong>Context:</strong> Post-meeting follow-up for Acme Corp, a formal enterprise client.
                    They expressed concern about our March 15 deadline during yesterday's call.<br/>
                    <strong>Objective:</strong> Reassure the client while confirming next steps.<br/>
                    <strong>Scope:</strong> One email, 150-200 words, professional tone.<br/>
                    <strong>Deliverables:</strong> Email draft with subject line.<br/>
                    <strong>Success criteria:</strong> Acknowledges their timeline concern, confirms we will
                    deliver the first milestone by Feb 28, includes meeting link for next check-in.</p>
                  </div>
                  <div className="learn-comparison-item good">
                    <p>AI produces a usable email on the first try. Minor tweaks only — you adjust one phrase
                    and send it in under a minute.</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="📐 The Five Elements of a Good Delegation">
            <p className="text-secondary mb-md">
              Each element answers a question that, if left unanswered, leads to a bad result.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">1. Context</h4>
                <p>What does AI need to know about the situation? Background, audience, constraints, relevant history.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  "We are a 50-person consulting firm preparing for an annual client dinner. Budget is $15,000.
                  The venue must be within 20 minutes of downtown Portland. Last year we used a steakhouse and
                  received feedback that we should offer more dietary options."
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-purple">2. Objective</h4>
                <p>What should the output accomplish? Not just what it <em>is</em>, but what it is <em>for</em>.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  "Create a comparison table of 5 venue options that I can present to my manager for a final
                  decision. The table should make it easy to compare on price, capacity, menu flexibility, and
                  distance from downtown."
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-yellow">3. Scope</h4>
                <p>What is included and what is explicitly out of bounds? Prevents AI from going too broad or too narrow.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  "Include: venue name, address, estimated cost for 50 guests, menu style, and one
                  notable feature. Exclude: detailed menu pricing, availability dates (I will call
                  to check), and entertainment options."
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">4. Deliverables</h4>
                <p>What is the specific output format? A table, an email draft, a bullet list, a slide outline?</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  "A markdown table with columns: Venue Name | Location | Est. Cost (50 guests) | Menu Style |
                  Key Feature. Plus a one-paragraph recommendation at the bottom explaining which venue
                  best fits our constraints."
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-red">5. Success Criteria</h4>
                <p>How will you judge whether the output is done? These should be specific enough to check in under a minute.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  "All 5 venues must be real restaurants in the Portland metro area. All prices must be
                  within the $15,000 budget. At least 2 venues must offer vegetarian/vegan entrees. The
                  recommendation must reference at least two of our stated constraints."
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🔄 The Delegation Workflow">
            <p className="text-secondary mb-md">
              For each task in your sequence, follow this four-step loop:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">1. Delegate</h4>
                <p>Hand off the task with your structured prompt. Include the relevant parts of your delegation
                template plus any task-specific instructions.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-yellow">2. Receive</h4>
                <p>Capture the AI's output. Do not start editing yet — just read it through once to understand
                what you got back.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-purple">3. Review</h4>
                <p>Check the output against your success criteria. Does it meet each one? Note what passed and
                what fell short.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">4. Decide</h4>
                <p>Three options: Approve (meets criteria, move on), Revise (send back with specific feedback),
                or Escalate (this task needs a different approach or human judgment).</p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid learn-patterns-grid-mb">
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Skipping success criteria because "I'll know good output when I see it." Without criteria,
                you end up in endless revision loops because you keep noticing new things to fix.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Write 2-3 specific, checkable criteria before you delegate. "Includes all five budget
                  line items" is checkable. "Looks professional" is not.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Writing a perfect template but reusing it without updating the context. Last month's
                delegation for the Q4 report does not work for Q1 — the numbers, priorities, and audience
                reactions have all changed.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Treat templates as starting points, not copy-paste solutions. Update the context and
                  success criteria each time, even if the structure stays the same.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Delegating Human-Primary tasks and wondering why the results are bad. Asking AI to "decide
                which vendor to go with" when the decision involves internal politics and budget tradeoffs
                only you understand.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Revisit your Lesson 7 decomposition. If a task keeps failing, it may be miscategorized.
                  Move it to Collaborative (you provide judgment, AI helps structure) or Human-Primary
                  (you do it, AI assists at the edges).
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Delegate Tab */}
      {activeTab === 'delegate' && (
        <div className="delegate-section">
          {selectedDelegation ? (
            // View/Execute Delegation
            <div>
              <div className="flex-between mb-md">
                <div>
                  <h2 className="no-margin">{selectedDelegation.name}</h2>
                  <div className="text-secondary mt-xs">
                    {selectedDelegation.task_sequence.length} tasks in sequence
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => { setSelectedDelegation(null); setSharedOutput(''); setSelectedTaskId(null); }}>
                  Back to List
                </button>
              </div>

              {/* Template display */}
              {selectedDelegation.template && (
                <div className="card l8-template-display">
                  <h4>Delegation Template</h4>
                  <pre>
                    {selectedDelegation.template}
                  </pre>
                </div>
              )}

              {/* Single Output Area */}
              <div className="card l8-output-paste-area">
                <h4>Paste AI Output</h4>
                <textarea
                  value={sharedOutput}
                  onChange={(e) => setSharedOutput(e.target.value)}
                  placeholder="Paste your AI conversation or output here..."
                  className="input l8-output-paste-textarea"
                  rows={5}
                />
                <div className="l8-output-paste-controls">
                  <select
                    value={selectedTaskId || ''}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="input"
                  >
                    <option value="">-- Select task to analyze --</option>
                    {selectedDelegation.task_sequence.map((task, idx) => (
                      <option key={task.id} value={task.id}>
                        #{idx + 1} {task.title} ({CATEGORY_INFO[task.category]?.label})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn l8-btn-analyze"
                    onClick={handleAnalyzeSelectedTask}
                    disabled={!selectedTaskId || !sharedOutput?.trim() || analyzingTaskId}
                  >
                    {analyzingTaskId ? 'Analyzing...' : 'Analyze with AI'}
                  </button>
                </div>
              </div>

              {/* Results by Category */}
              <h3>Results by Category</h3>
              {(() => {
                const grouped = getTasksByCategory(selectedDelegation.task_sequence);
                return (
                  <div className="l8-category-groups-stack">
                    {/* AI-Optimal Tasks */}
                    {grouped.ai_optimal.length > 0 && (
                      <div>
                        <div className="l8-category-group-header">
                          <span className="l8-category-group-icon">🤖</span>
                          <h4 className="color-accent-green">AI-Optimal Tasks</h4>
                          <span className="l8-category-group-count">({grouped.ai_optimal.length})</span>
                        </div>
                        {grouped.ai_optimal.map((task, idx) => renderTaskCard(task, idx))}
                      </div>
                    )}

                    {/* Collaborative Tasks */}
                    {grouped.collaborative.length > 0 && (
                      <div>
                        <div className="l8-category-group-header">
                          <span className="l8-category-group-icon">🤝</span>
                          <h4 className="color-accent-yellow">Collaborative Tasks</h4>
                          <span className="l8-category-group-count">({grouped.collaborative.length})</span>
                        </div>
                        {grouped.collaborative.map((task, idx) => renderTaskCard(task, idx))}
                      </div>
                    )}

                    {/* Human-Primary Tasks */}
                    {grouped.human_primary.length > 0 && (
                      <div>
                        <div className="l8-category-group-header">
                          <span className="l8-category-group-icon">👤</span>
                          <h4 className="color-accent-red">Human-Primary Tasks</h4>
                          <span className="l8-category-group-count">({grouped.human_primary.length})</span>
                        </div>
                        {grouped.human_primary.map((task, idx) => renderTaskCard(task, idx))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : showCreateForm ? (
            // Create Form
            <div className="card card-padded">
              <div className="l8-create-form-header">
                <h2>Create Delegation</h2>
                <ExamplesDropdown
                  endpoint="/lesson8/examples"
                  onSelect={(example) => {
                    setNewDelegation({
                      ...newDelegation,
                      name: example.name || '',
                      template: example.template || '',
                      task_sequence: example.task_sequence || [],
                      notes: example.notes || '',
                    });
                  }}
                />
              </div>

              {/* Import from Task Decomposer */}
              <div className="l8-import-section">
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenDecompImport}
                  disabled={loadingDecomps}
                >
                  {loadingDecomps ? 'Loading...' : showDecompImport ? 'Hide Import' : 'Import from Task Decomposer'}
                </button>

                {showDecompImport && (
                  <div className="card import-panel">
                    <h4 className="no-margin mb-md">Select a Decomposition</h4>
                    {decompositions.length === 0 ? (
                      <div className="import-empty">
                        <p>No decompositions saved yet.</p>
                        <p className="import-empty-hint">
                          Go to <a href="/lesson/7">Lesson 7 — Task Decomposer</a> to break down a project first.
                        </p>
                      </div>
                    ) : (
                      <div className="import-list">
                        {decompositions.map((decomp) => (
                          <div
                            key={decomp.id}
                            className="import-item"
                            onClick={() => handleImportDecomposition(decomp.id)}
                          >
                            <div className="import-item-header">
                              <strong>{decomp.project_name || 'Untitled'}</strong>
                              <span className="import-item-count">
                                {decomp.task_count || 0} tasks
                              </span>
                            </div>
                            <div className="l8-import-item-categories">
                                {decomp.ai_optimal_count > 0 && (
                                  <span className="color-accent-green">{decomp.ai_optimal_count} AI-Optimal</span>
                                )}
                                {decomp.collaborative_count > 0 && (
                                  <span className="color-accent-yellow">{decomp.collaborative_count} Collaborative</span>
                                )}
                                {decomp.human_primary_count > 0 && (
                                  <span className="color-accent-red">{decomp.human_primary_count} Human</span>
                                )}
                              </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="l8-form-stack">
                <div>
                  <label>Delegation Name</label>
                  <input
                    type="text"
                    value={newDelegation.name}
                    onChange={(e) => setNewDelegation({ ...newDelegation, name: e.target.value })}
                    placeholder="e.g., API Documentation Sprint"
                    className="input"
                  />
                </div>

                {/* Template builder */}
                <div>
                  <label>
                    Delegation Template
                    <span className="l8-label-hint">(optional)</span>
                  </label>
                  <div className="l8-template-btn-row">
                    {templateElements && Object.entries(templateElements).map(([key, el]) => (
                      <button
                        key={key}
                        className="btn btn-secondary btn-sm"
                        onClick={() => applyTemplateSection(key)}
                      >
                        + {el.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newDelegation.template}
                    onChange={(e) => setNewDelegation({ ...newDelegation, template: e.target.value })}
                    placeholder="Build your delegation template using the buttons above, or write your own..."
                    className="input l8-template-textarea"
                    rows={8}
                  />
                </div>

                {/* Task sequence */}
                <div>
                  <label className="mb-sm">Task Sequence ({newDelegation.task_sequence.length})</label>
                  {newDelegation.task_sequence.map((task, idx) => (
                    <div key={idx} className="l8-task-list-item">
                      <span className="text-muted">#{idx + 1}</span>
                      <span className="flex-1">{task.title}</span>
                      {renderCategoryBadge(task.category)}
                      {task.is_decision_gate && (
                        <span className="l8-gate-label-sm">Gate</span>
                      )}
                      <button className="l8-task-remove-btn" onClick={() => handleRemoveTask(idx)}>x</button>
                    </div>
                  ))}
                </div>

                {/* Add task form */}
                <div className="l8-add-task-panel">
                  <h4>Add Task to Sequence</h4>
                  <div className="l8-add-task-fields">
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
                        <option value="ai_optimal">AI-Optimal</option>
                        <option value="collaborative">Collaborative</option>
                        <option value="human_primary">Human-Primary</option>
                      </select>
                      <label className="l8-checkbox-label">
                        <input
                          type="checkbox"
                          checked={newTask.is_decision_gate}
                          onChange={(e) => setNewTask({ ...newTask, is_decision_gate: e.target.checked })}
                        />
                        Decision Gate
                      </label>
                    </div>
                    <textarea
                      value={newTask.prompt}
                      onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                      placeholder="Delegation prompt for this task (optional)..."
                      className="input"
                      rows={2}
                    />
                    <button className="btn btn-secondary" onClick={handleAddTask}>+ Add Task</button>
                  </div>
                </div>

                <div className="button-group-mt">
                  <button className="btn btn-primary" onClick={handleCreateDelegation}>
                    Save Delegation
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewDelegation({ name: '', template: '', task_sequence: [], notes: '' }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Delegation List
            <div>
              {/* Explanation Section */}
              <div className="l8-how-to-box">
                <h3>How to Use Delegation Tracker</h3>
                <ol>
                  <li><strong>Create a Delegation</strong> - Define a project with a template containing context, objectives, and success criteria</li>
                  <li><strong>Add Tasks</strong> - Break the work into sequential tasks (AI-optimal, collaborative, or human-primary)</li>
                  <li><strong>Execute the Workflow</strong> - For each task:
                    <ul>
                      <li><strong>Delegate</strong>: Copy the prompt to your AI tool and mark as "Delegated"</li>
                      <li><strong>Receive</strong>: Paste the AI's response into "Output Received"</li>
                      <li><strong>Review</strong>: Click "Analyze with AI" to auto-check against success criteria</li>
                      <li><strong>Decide</strong>: Approve, request revision, or mark blocked</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="flex-between mb-md">
                <h2>Your Delegations</h2>
                <div className="gap-sm flex-center">
                  <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                    + New Delegation
                  </button>
                  {delegations.length > 0 && (
                    <button className="btn btn-danger" onClick={handleClearAll}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {delegations.length === 0 ? (
                <div>
                  <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                    Create a delegation above and you'll build a structured handoff brief with:
                  </p>
                  <div className="analysis-grid">
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Delegation Brief</h3>
                      <div className="field">
                        <div className="field-label">Context &amp; Objective</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>The background information and clear goal for the task — the difference between "handle this" and giving AI enough to actually succeed on the first attempt.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Scope &amp; Deliverables</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Explicit boundaries on what's included, what's not, and what the finished output should look like — preventing scope drift and misaligned expectations.</div>
                      </div>
                    </div>
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Execution Tracking</h3>
                      <div className="field">
                        <div className="field-label">Task Sequence</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Tasks from your decomposition executed in order, with progress tracked per task so you can see where in the workflow you are.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Success Criteria</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Measurable conditions that define "done" — so both you and the AI know when the task meets the bar without subjective guesswork.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid-auto-fill">
                  {delegations.map((deleg) => (
                    <div key={deleg.id} className="card l8-deleg-card">
                      <div className="l8-deleg-card-header">
                        <h3>{deleg.name}</h3>
                        {deleg.has_template && (
                          <span className="l8-template-badge">
                            Template
                          </span>
                        )}
                      </div>
                      <div className="l8-deleg-card-info">
                        <div className="l8-deleg-card-tasks">
                          {deleg.task_count} tasks ({deleg.completed_count} done)
                        </div>
                        {deleg.current_task && (
                          <div className="l8-deleg-card-current">
                            Current: {deleg.current_task}
                          </div>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="l8-progress-track">
                        <div
                          className="l8-progress-fill"
                          style={{
                            width: deleg.task_count > 0 ? `${(deleg.completed_count / deleg.task_count) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      <div className="l8-deleg-card-footer">
                        <button className="btn btn-primary btn-sm" onClick={() => handleViewDelegation(deleg.id)}>
                          Open
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDelegation(deleg.id)}>
                          Delete
                        </button>
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
