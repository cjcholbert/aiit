import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import ConnectionCallout from '../components/ConnectionCallout';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

// Task status colors
const STATUS_COLORS = {
  pending: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', label: 'Pending', icon: '⏳' },
  delegated: { bg: 'var(--bg-tertiary)', color: 'var(--accent-blue)', label: 'Delegated', icon: '📤' },
  reviewing: { bg: 'var(--warning-bg)', color: 'var(--accent-yellow)', label: 'Reviewing', icon: '👀' },
  completed: { bg: 'var(--success-bg)', color: 'var(--accent-green)', label: 'Completed', icon: '✅' },
  blocked: { bg: 'var(--error-bg)', color: 'var(--accent-red)', label: 'Blocked', icon: '🚫' }
};

const CATEGORY_INFO = {
  ai_optimal: { color: 'var(--accent-green)', icon: '🤖', label: 'AI-Optimal' },
  collaborative: { color: 'var(--accent-yellow)', icon: '🤝', label: 'Collaborative' },
  human_primary: { color: 'var(--accent-red)', icon: '👤', label: 'Human-Primary' }
};

export default function Lesson08() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
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
      <span style={{
        background: s.bg,
        color: s.color,
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold'
      }}>
        {s.icon} {s.label}
      </span>
    );
  };

  const renderCategoryBadge = (category) => {
    const cat = CATEGORY_INFO[category] || CATEGORY_INFO.ai_optimal;
    return (
      <span style={{
        color: cat.color,
        fontSize: '0.875rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {cat.icon} {cat.label}
      </span>
    );
  };

  const renderTaskCard = (task, idx) => (
    <div
      key={task.id}
      className="card"
      style={{
        padding: '16px',
        marginBottom: '12px',
        background: STATUS_COLORS[task.status]?.bg || 'var(--bg-secondary)',
        borderLeft: task.is_decision_gate ? '4px solid var(--accent-blue)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h4 style={{ margin: 0 }}>{task.title}</h4>
            {task.is_decision_gate && (
              <span style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                Decision Gate
              </span>
            )}
          </div>
          {renderStatusBadge(task.status)}
        </div>
        {/* Status actions */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {task.status === 'pending' && (
            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => handleUpdateTaskStatus(task.id, 'delegated')}>Delegate</button>
          )}
          {task.status === 'delegated' && (
            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => handleUpdateTaskStatus(task.id, 'reviewing')}>Review</button>
          )}
          {task.status === 'reviewing' && (
            <>
              <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--accent-green)' }}
                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}>Approve</button>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleUpdateTaskStatus(task.id, 'delegated')}>Revise</button>
            </>
          )}
          {task.status === 'completed' && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => handleUpdateTaskStatus(task.id, 'reviewing')}>Reopen</button>
          )}
          {task.status === 'blocked' && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}>Unblock</button>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px', fontSize: '0.85rem' }}>{task.description}</p>
      )}

      {/* AI Review Results */}
      {task.ai_review && (
        <div style={{
          padding: '12px',
          background: task.ai_review.overall_pass ? 'var(--success-bg)' : 'var(--error-bg)',
          borderRadius: '8px',
          border: `1px solid ${task.ai_review.overall_pass ? 'var(--accent-green)' : 'var(--accent-red)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ color: task.ai_review.overall_pass ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {task.ai_review.overall_pass ? 'PASSED' : 'NEEDS WORK'}
            </strong>
          </div>

          {task.ai_review.criteria_results?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {task.ai_review.criteria_results.map((result, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <span style={{ color: result.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {result.passed ? '[OK]' : '[X]'}
                  </span>
                  <span style={{ fontSize: '0.85rem' }}>{result.criterion}</span>
                </div>
              ))}
            </div>
          )}

          {task.ai_review.summary && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.ai_review.summary}</div>
          )}

          {task.ai_review.suggestions?.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong style={{ color: 'var(--accent-yellow)', fontSize: '0.75rem' }}>Suggestions:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                {task.ai_review.suggestions.map((s, i) => (
                  <li key={i} style={{ fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Show if no review yet */}
      {!task.ai_review && task.status !== 'pending' && (
        <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
      <header className="page-header">
        <h1>Delegation Tracker</h1>
      </header>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={8} criteria={LESSON_CRITERIA[8]} />
        <StatsPanel stats={stats ? [
            { label: 'Delegations', value: stats.total_delegations, color: 'var(--accent-blue)' },
            { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-blue)' },
            { label: 'Completed', value: stats.tasks_completed, color: 'var(--accent-green)' },
            { label: 'Pending', value: stats.tasks_pending, color: 'var(--accent-yellow)' },
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
        {['learn', 'delegate'].map((tab) => (
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
          <div className="learn-problem-skill">
            <p><strong>The Problem:</strong> Knowing what to delegate is only half the battle. Without structured delegation practices, you'll give vague instructions and get disappointing results, or spend more time explaining than doing the work yourself.</p>
            <p><strong>The Skill:</strong> Create delegation templates with clear context, objectives, scope, deliverables, and success criteria. Then execute decomposed tasks in sequence, tracking what you delegated, what you received, and what decisions you made at each gate.</p>
          </div>

          <ConnectionCallout
            lessonNumber={7}
            lessonTitle="Task Decomposer"
            message="Lesson 7 helped you break projects into categorized subtasks. Now learn to delegate those tasks effectively — with enough structure that AI delivers what you actually need on the first try."
          />

          <div className="learn-intro">
            <h2>Why "Just Handle This" Gets You Bad Results</h2>
            <p>
              You have decomposed your project into tasks and identified which ones are AI-Optimal. Great.
              Now you open your AI tool and type: "Write a follow-up email to the client." The AI produces
              something generic and slightly off-tone. You rewrite half of it yourself. Next task: "Summarize
              these meeting notes." Another generic output that misses the action items your boss cares about.
            </p>
            <p>
              The problem is not your task selection — it is your handoff. Delegating to AI is like delegating
              to a new team member: you get out what you put in. A vague instruction gets a vague result.
              A structured delegation — with context, clear objectives, and success criteria — gets something
              you can actually use.
            </p>
          </div>

          <div className="learn-key-insight">
            <strong>Key Insight:</strong> A delegation template is not bureaucratic overhead — it is the
            difference between getting usable output on the first try and burning three rounds of revision.
            Spending 2 minutes writing a clear handoff saves 15 minutes of rework.
          </div>

          <h3>How This Lesson Works</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            One practice area to build your delegation skill:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>Delegate Tab — Create and Execute Delegations</h4>
              <p>Build a delegation with a template (context, objectives, scope, deliverables, success
              criteria), add your task sequence, then execute each task through the Delegate-Receive-Review-Decide
              workflow. You can import tasks directly from Lesson 7.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('delegate')}>Go to Delegate →</button>
            </div>
          </div>

          <div className="learn-comparison">
            <h3>Vague Handoff vs. Structured Delegation</h3>
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

          <h3>The Five Elements of a Good Delegation</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Each element answers a question that, if left unanswered, leads to a bad result.
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>1. Context</h4>
              <p>What does AI need to know about the situation? Background, audience, constraints, relevant history.</p>
              <div className="learn-pattern-label better">Example</div>
              <div className="learn-example-good">
                "We are a 50-person consulting firm preparing for an annual client dinner. Budget is $15,000.
                The venue must be within 20 minutes of downtown Portland. Last year we used a steakhouse and
                received feedback that we should offer more dietary options."
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>2. Objective</h4>
              <p>What should the output accomplish? Not just what it <em>is</em>, but what it is <em>for</em>.</p>
              <div className="learn-pattern-label better">Example</div>
              <div className="learn-example-good">
                "Create a comparison table of 5 venue options that I can present to my manager for a final
                decision. The table should make it easy to compare on price, capacity, menu flexibility, and
                distance from downtown."
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>3. Scope</h4>
              <p>What is included and what is explicitly out of bounds? Prevents AI from going too broad or too narrow.</p>
              <div className="learn-pattern-label better">Example</div>
              <div className="learn-example-good">
                "Include: venue name, address, estimated cost for 50 guests, menu style, and one
                notable feature. Exclude: detailed menu pricing, availability dates (I will call
                to check), and entertainment options."
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>4. Deliverables</h4>
              <p>What is the specific output format? A table, an email draft, a bullet list, a slide outline?</p>
              <div className="learn-pattern-label better">Example</div>
              <div className="learn-example-good">
                "A markdown table with columns: Venue Name | Location | Est. Cost (50 guests) | Menu Style |
                Key Feature. Plus a one-paragraph recommendation at the bottom explaining which venue
                best fits our constraints."
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-red)' }}>5. Success Criteria</h4>
              <p>How will you judge whether the output is done? These should be specific enough to check in under a minute.</p>
              <div className="learn-pattern-label better">Example</div>
              <div className="learn-example-good">
                "All 5 venues must be real restaurants in the Portland metro area. All prices must be
                within the $15,000 budget. At least 2 venues must offer vegetarian/vegan entrees. The
                recommendation must reference at least two of our stated constraints."
              </div>
            </div>
          </div>

          <h3>The Delegation Workflow</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            For each task in your sequence, follow this four-step loop:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>1. Delegate</h4>
              <p>Hand off the task with your structured prompt. Include the relevant parts of your delegation
              template plus any task-specific instructions.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>2. Receive</h4>
              <p>Capture the AI's output. Do not start editing yet — just read it through once to understand
              what you got back.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>3. Review</h4>
              <p>Check the output against your success criteria. Does it meet each one? Note what passed and
              what fell short.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>4. Decide</h4>
              <p>Three options: Approve (meets criteria, move on), Revise (send back with specific feedback),
              or Escalate (this task needs a different approach or human judgment).</p>
            </div>
          </div>

          <h3>Common Mistakes</h3>
          <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
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

          <div className="learn-next-step">
            <h3>Ready to Delegate Your First Task?</h3>
            <p>Start by importing a decomposition from Lesson 7, or create a new delegation from scratch.
            Focus on writing clear success criteria — that single habit will improve your delegation results
            more than anything else.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('delegate')}>
              Go to Delegate
            </button>
          </div>
        </div>
      )}

      {/* Delegate Tab */}
      {activeTab === 'delegate' && (
        <div className="delegate-section">
          {selectedDelegation ? (
            // View/Execute Delegation
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedDelegation.name}</h2>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedDelegation.task_sequence.length} tasks in sequence
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => { setSelectedDelegation(null); setSharedOutput(''); setSelectedTaskId(null); }}>
                  Back to List
                </button>
              </div>

              {/* Template display */}
              {selectedDelegation.template && (
                <div className="card" style={{ padding: '16px', marginBottom: '24px', background: 'var(--bg-secondary)' }}>
                  <h4 style={{ margin: '0 0 8px' }}>Delegation Template</h4>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {selectedDelegation.template}
                  </pre>
                </div>
              )}

              {/* Single Output Area */}
              <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-blue)' }}>
                <h4 style={{ margin: '0 0 12px', color: 'var(--accent-blue)' }}>Paste AI Output</h4>
                <textarea
                  value={sharedOutput}
                  onChange={(e) => setSharedOutput(e.target.value)}
                  placeholder="Paste your AI conversation or output here..."
                  className="input"
                  rows={5}
                  style={{ width: '100%', marginBottom: '12px', fontSize: '0.9rem' }}
                />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={selectedTaskId || ''}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="input"
                    style={{ flex: 1, minWidth: '200px' }}
                  >
                    <option value="">-- Select task to analyze --</option>
                    {selectedDelegation.task_sequence.map((task, idx) => (
                      <option key={task.id} value={task.id}>
                        #{idx + 1} {task.title} ({CATEGORY_INFO[task.category]?.label})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-purple)', padding: '10px 20px' }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* AI-Optimal Tasks */}
                    {grouped.ai_optimal.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '1.25rem' }}>🤖</span>
                          <h4 style={{ margin: 0, color: 'var(--accent-green)' }}>AI-Optimal Tasks</h4>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({grouped.ai_optimal.length})</span>
                        </div>
                        {grouped.ai_optimal.map((task, idx) => renderTaskCard(task, idx))}
                      </div>
                    )}

                    {/* Collaborative Tasks */}
                    {grouped.collaborative.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '1.25rem' }}>🤝</span>
                          <h4 style={{ margin: 0, color: 'var(--accent-yellow)' }}>Collaborative Tasks</h4>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({grouped.collaborative.length})</span>
                        </div>
                        {grouped.collaborative.map((task, idx) => renderTaskCard(task, idx))}
                      </div>
                    )}

                    {/* Human-Primary Tasks */}
                    {grouped.human_primary.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '1.25rem' }}>👤</span>
                          <h4 style={{ margin: 0, color: 'var(--accent-red)' }}>Human-Primary Tasks</h4>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({grouped.human_primary.length})</span>
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
            <div className="card" style={{ padding: '24px' }}>
              <h2>Create Delegation</h2>

              {/* Import from Task Decomposer */}
              <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenDecompImport}
                  disabled={loadingDecomps}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loadingDecomps ? 'Loading...' : showDecompImport ? 'Hide Import' : 'Import from Task Decomposer'}
                </button>

                {showDecompImport && (
                  <div className="card" style={{ padding: '16px', marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 12px' }}>Select a Decomposition</h4>
                    {decompositions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        <p>No decompositions saved yet.</p>
                        <p style={{ fontSize: '0.85rem' }}>
                          Go to <a href="/lesson/7" style={{ color: 'var(--accent-blue)' }}>Lesson 7 — Task Decomposer</a> to break down a project first.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {decompositions.map((decomp) => (
                          <div
                            key={decomp.id}
                            onClick={() => handleImportDecomposition(decomp.id)}
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
                              <strong style={{ color: 'var(--text-primary)' }}>{decomp.project_name || 'Untitled'}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {decomp.task_count || 0} tasks
                              </span>
                            </div>
                            {decomp.categories && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.75rem' }}>
                                {decomp.categories.ai_optimal > 0 && (
                                  <span style={{ color: 'var(--accent-green)' }}>{decomp.categories.ai_optimal} AI-Optimal</span>
                                )}
                                {decomp.categories.collaborative > 0 && (
                                  <span style={{ color: 'var(--accent-yellow)' }}>{decomp.categories.collaborative} Collaborative</span>
                                )}
                                {decomp.categories.human_primary > 0 && (
                                  <span style={{ color: 'var(--accent-red)' }}>{decomp.categories.human_primary} Human</span>
                                )}
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
                  <label style={{ display: 'block', marginBottom: '4px' }}>Delegation Name</label>
                  <input
                    type="text"
                    value={newDelegation.name}
                    onChange={(e) => setNewDelegation({ ...newDelegation, name: e.target.value })}
                    placeholder="e.g., API Documentation Sprint"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Template builder */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>
                    Delegation Template
                    <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(optional)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {templateElements && Object.entries(templateElements).map(([key, el]) => (
                      <button
                        key={key}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
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
                    className="input"
                    rows={8}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Task sequence */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Task Sequence ({newDelegation.task_sequence.length})</label>
                  {newDelegation.task_sequence.map((task, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span style={{ flex: 1 }}>{task.title}</span>
                      {renderCategoryBadge(task.category)}
                      {task.is_decision_gate && (
                        <span style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Gate</span>
                      )}
                      <button onClick={() => handleRemoveTask(idx)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>x</button>
                    </div>
                  ))}
                </div>

                {/* Add task form */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px' }}>Add Task to Sequence</h4>
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
                        <option value="ai_optimal">AI-Optimal</option>
                        <option value="collaborative">Collaborative</option>
                        <option value="human_primary">Human-Primary</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
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
              <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
                <h3 style={{ margin: '0 0 12px', color: 'var(--accent-blue)' }}>How to Use Delegation Tracker</h3>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  <li><strong>Create a Delegation</strong> - Define a project with a template containing context, objectives, and success criteria</li>
                  <li><strong>Add Tasks</strong> - Break the work into sequential tasks (AI-optimal, collaborative, or human-primary)</li>
                  <li><strong>Execute the Workflow</strong> - For each task:
                    <ul style={{ marginTop: '4px', marginBottom: '4px' }}>
                      <li><strong>Delegate</strong>: Copy the prompt to your AI tool and mark as "Delegated"</li>
                      <li><strong>Receive</strong>: Paste the AI's response into "Output Received"</li>
                      <li><strong>Review</strong>: Click "Analyze with AI" to auto-check against success criteria</li>
                      <li><strong>Decide</strong>: Approve, request revision, or mark blocked</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Your Delegations</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {delegations.length === 0 && (
                    <button className="btn btn-secondary" onClick={handleSeedExamples}>
                      Load Examples
                    </button>
                  )}
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
                <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h3>No delegations yet</h3>
                  <p>Create a delegation to practice structured AI task handoffs.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                  {delegations.map((deleg) => (
                    <div key={deleg.id} className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0 }}>{deleg.name}</h3>
                        {deleg.has_template && (
                          <span style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            Template
                          </span>
                        )}
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {deleg.task_count} tasks ({deleg.completed_count} done)
                        </div>
                        {deleg.current_task && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '4px' }}>
                            Current: {deleg.current_task}
                          </div>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: deleg.task_count > 0 ? `${(deleg.completed_count / deleg.task_count) * 100}%` : '0%',
                            background: 'var(--accent-green)',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ padding: '4px 12px' }} onClick={() => handleViewDelegation(deleg.id)}>
                          Open
                        </button>
                        <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => handleDeleteDelegation(deleg.id)}>
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

      <LessonNav currentLesson={8} />
    </div>
  );
}
