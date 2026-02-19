import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import { useLessonStats } from '../contexts/LessonStatsContext';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';

// Pass indicator colors and labels
const PASS_STYLES = {
  1: { color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)', label: '70%', name: 'Structure & Approach', icon: '🏗️' },
  2: { color: 'var(--accent-blue)', bg: 'var(--bg-tertiary)', label: '85%', name: 'Robustness', icon: '🛡️' },
  3: { color: 'var(--accent-green)', bg: 'var(--bg-tertiary)', label: '95%', name: 'Production-Ready', icon: '🚀' },
};

export default function Lesson09() {
  const api = useApi();
  const { setStats: setSidebarStats } = useLessonStats();
  const [activeTab, setActiveTab] = useState('concepts');
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

  // AI feedback analysis state
  const [feedbackAnalysis, setFeedbackAnalysis] = useState({});  // keyed by pass_number
  const [analyzingPass, setAnalyzingPass] = useState(null);

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

  useEffect(() => {
    setSidebarStats(stats ? [
      { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-blue)' },
      { label: 'Completed', value: stats.completed_tasks, color: 'var(--accent-green)' },
      { label: 'In Progress', value: stats.in_progress_tasks, color: 'var(--accent-yellow)' },
      { label: 'Passes', value: stats.total_passes_recorded, color: 'var(--accent-purple)' },
    ] : null);
    return () => setSidebarStats(null);
  }, [stats, setSidebarStats]);

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
      setActiveTab('iterate');
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
      setFeedbackAnalysis({});
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

  const handleAnalyzeFeedback = async (passNumber) => {
    if (!selectedTask) return;
    setAnalyzingPass(passNumber);
    try {
      const result = await api.post(
        `/lesson9/tasks/${selectedTask.id}/analyze-feedback?pass_number=${passNumber}`,
        {}
      );
      setFeedbackAnalysis(prev => ({ ...prev, [passNumber]: result }));
      setError(null);
    } catch (err) {
      setError(err.message || 'Feedback analysis failed');
    } finally {
      setAnalyzingPass(null);
    }
  };

  const PATTERN_LABELS = {
    no_specifics: { label: 'Lacks Specifics', color: 'var(--accent-red)' },
    no_action: { label: 'No Clear Action', color: 'var(--accent-red)' },
    no_reason: { label: 'Missing Reasoning', color: 'var(--accent-yellow)' },
    subjective: { label: 'Purely Subjective', color: 'var(--accent-yellow)' },
    scope_creep: { label: 'Scope Creep', color: 'var(--accent-purple)' },
  };

  // Render pass progress indicator
  const renderPassProgress = (currentPass, isComplete) => {
    return (
      <div className="l9-pass-progress">
        {[1, 2, 3].map((pass) => {
          const style = PASS_STYLES[pass];
          const isActive = pass === currentPass && !isComplete;
          const isCompleted = pass < currentPass || isComplete;

          let className = 'l9-pass-step';
          if (isCompleted) className += ' l9-pass-step-completed';
          else if (!isActive) className += ' l9-pass-step-default';

          return (
            <div
              key={pass}
              className={className}
              style={isActive ? {
                background: style.bg,
                borderColor: style.color,
                color: style.color,
              } : undefined}
            >
              {isCompleted ? '[OK]' : style.label}
            </div>
          );
        })}
        {isComplete && (
          <span className="l9-pass-complete-label">Complete!</span>
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
        className="card l9-task-card"
        style={{
          background: task.is_complete ? 'var(--success-bg)' : passStyle.bg,
          borderLeft: task.is_complete ? '4px solid var(--accent-green)' : `4px solid ${passStyle.color}`,
        }}
        onClick={() => onClick(task.id)}
      >
        <div className="flex-between-start mb-md">
          <h4 className="no-margin">{task.task_name}</h4>
          {task.is_complete && (
            <span className="badge-complete">COMPLETE</span>
          )}
        </div>
        {renderPassProgress(task.current_pass, task.is_complete)}
        <div className="l9-task-meta">
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
      <div className="lesson-header">
        <div className="lesson-header-left">
          <h1>Iteration Passes</h1>
          <ConnectionCallout lessonNumber={2} lessonTitle="Feedback Analyzer" message="Apply specific feedback systematically using structured passes with clear purpose." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> Random iteration ("make it better") wastes cycles and leads to scope creep. Without structure, you'll keep tweaking without knowing when "done" is reached.</p>
            <p><strong>The Skill:</strong> Use the 70-85-95 framework to iterate with purpose. Each pass has a specific focus and key question, so you know exactly what to evaluate and when to move on.</p>
          </div>

        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['concepts', 'iterate', 'history'].map((tab) => (
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
              Three areas that build your structured iteration skill:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-blue">Practice Tab — Run Your Passes</h4>
                <p>Create a real task (or import one from Context Tracker), then work through each
                pass. For every pass you answer its key question and record the specific feedback
                you gave the AI. This builds the muscle of focusing on one thing at a time.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-green">Feedback Quality Check — Sharpen Your Requests</h4>
                <p>After recording a pass, use the "Check Feedback Quality" button to get an analysis
                of your iteration feedback. It flags vague language, scope creep, and misalignment
                with the pass focus — so your feedback improves with every task.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-purple">History Tab — See Your Progress</h4>
                <p>Review completed tasks to see how your iteration approach evolves. Over time you'll
                notice your Pass 1 feedback getting sharper and your total passes-to-done shrinking.
                That's the skill developing.</p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Random Tweaking vs. Structured Passes">
            <div className="learn-comparison">
              <div className="learn-comparison-grid">
                <div className="learn-comparison-col">
                  <h4 className="poor">Random Tweaking — No Focus Per Round</h4>
                  <div className="learn-comparison-item poor">
                    <div className="learn-comparison-scenario">Drafting a Quarterly Business Review</div>
                    <p>Round 1: "Make it more professional and fix the numbers and add a recommendation
                    section." Round 2: "The tone is better but now the executive summary is too long
                    and the chart descriptions are wrong." Round 3: "Can you shorten it but also add
                    more detail on Q3?" Round 4: "This is going in circles..."</p>
                  </div>
                  <div className="learn-comparison-item poor">
                    <p>Four rounds, 40+ minutes, and the output still has structural problems because
                    you never isolated what to fix first. Each round introduced new issues while
                    partially fixing old ones.</p>
                  </div>
                </div>
                <div className="learn-comparison-col">
                  <h4 className="good">Structured Passes — One Focus Per Round</h4>
                  <div className="learn-comparison-item good">
                    <div className="learn-comparison-scenario">Same Task — With 70-85-95</div>
                    <p>Pass 1 (Structure): "The QBR needs four sections: executive summary, key metrics,
                    department highlights, and recommendations. Move recommendations to the top — leadership
                    reads that first." Pass 2 (Accuracy): "The Q3 revenue figure should be $2.4M not $2.1M,
                    and the customer churn section understates the trend — it's been declining for three
                    quarters." Pass 3 (Polish): "This goes to the C-suite — make the executive summary
                    scannable in under 60 seconds and cut the jargon in the recommendations."</p>
                  </div>
                  <div className="learn-comparison-item good">
                    <p>Three passes, 20 minutes, and the output is actually ready. Each pass solved one
                    category of problems completely before moving on.</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🔬 The Three Passes — In Detail">
            <p className="text-secondary mb-md">
              Each pass targets a different layer of quality. Doing them in order prevents the
              "fix one thing, break another" cycle.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-muted">Pass 1: Structure and Completeness (70%)</h4>
                <p>
                  <strong>Key question: "Is the foundation right?"</strong><br />
                  Don't worry about word choice or polish yet. Focus entirely on whether the output
                  addresses the right problem in the right structure. Are the sections in the right
                  order? Is anything important missing? Is anything included that shouldn't be?
                </p>
                <div className="learn-pattern-label better">Example Feedback</div>
                <div className="learn-example-good">
                  "This event proposal needs three sections I don't see: a budget breakdown, a timeline
                  with milestones, and a risk mitigation plan. Also, move the venue options before
                  the catering section — venue choice drives all the other decisions."
                </div>
                <div className="learn-pattern-label avoid">Not This</div>
                <div className="learn-example-bad">
                  "This isn't quite right, can you improve it and make it more complete?"
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-blue">Pass 2: Accuracy and Tone (85%)</h4>
                <p>
                  <strong>Key question: "Are the details correct?"</strong><br />
                  Now that the structure is solid, check the content inside it. Are the facts right?
                  Do the numbers add up? Is the tone appropriate for the audience? This is where you
                  catch the errors that would undermine credibility.
                </p>
                <div className="learn-pattern-label better">Example Feedback</div>
                <div className="learn-example-good">
                  "Two corrections: the project kickoff date should be March 15, not March 1 — we
                  need two weeks for vendor contracts. Also, the tone in the client-facing sections
                  is too informal. Replace 'we'll figure it out' language with specific commitments
                  like 'we will deliver by [date].'"
                </div>
                <div className="learn-pattern-label avoid">Not This</div>
                <div className="learn-example-bad">
                  "Some of the details seem off and the tone isn't right for this audience."
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="learn-pattern-card-heading-green">Pass 3: Polish and Edge Cases (95%)</h4>
                <p>
                  <strong>Key question: "Is it ready for its audience?"</strong><br />
                  Structure is locked. Facts are verified. Now make it audience-ready. Would a
                  busy executive scan this in two minutes? Will an HR director find the compliance
                  language they expect? Does it handle the edge case your pickiest stakeholder
                  will ask about?
                </p>
                <div className="learn-pattern-label better">Example Feedback</div>
                <div className="learn-example-good">
                  "The finance team will want to know what happens if the vendor cancels within 30
                  days of the event — add a contingency line to the budget. Also, bold the three
                  key recommendations so they're visible in a quick scan. The rest is ready to send."
                </div>
                <div className="learn-pattern-label avoid">Not This</div>
                <div className="learn-example-bad">
                  "Can you just clean it up and make sure it's good to go?"
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid mb-lg">
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Jumping to polish before the structure is right. You spend 10 minutes perfecting
                the wording of a project update only to realize the entire section order needs to
                change — and your careful edits get lost in the restructure.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Always run Pass 1 first. Lock down what sections exist and in what order before
                  you care about how anything reads. It feels wasteful to ignore tone on the first
                  round, but it saves significant rework.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Combining multiple pass concerns into one round of feedback. "Fix the structure,
                update the numbers, and make it sound more professional" seems efficient but gives
                the AI too many competing priorities. It will partially address each one and fully
                address none.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  One pass, one focus. If you find yourself writing feedback that covers structure
                  AND tone AND edge cases, split it into separate passes. Three focused rounds
                  produce better results than one overloaded round.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Iterating past "good enough." After three passes your output is at 95%, but you
                keep going — tweaking word choices, rearranging sentences, chasing perfection. The
                fourth and fifth passes add minimal value while eating up your time.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  The framework stops at 95% on purpose. That last 5% almost always requires human
                  judgment that's faster to apply yourself than to explain to AI. After Pass 3, make
                  any final tweaks manually and ship it.
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Iterate Tab */}
      {activeTab === 'iterate' && (
        <div className="practice-section">
          {selectedTask ? (
            // Active task view
            <div>
              <div className="flex-between mb-md">
                <div>
                  <h2 className="no-margin">{selectedTask.task_name}</h2>
                  {selectedTask.target_outcome && (
                    <div className="text-secondary mt-xs text-sm">
                      <strong>Target:</strong> {selectedTask.target_outcome}
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => { setSelectedTask(null); setPassForm({ key_question_answer: '', feedback: '' }); }}>
                  Back to List
                </button>
              </div>

              {/* Pass progress */}
              <div className="mb-lg">
                {renderPassProgress(selectedTask.current_pass, selectedTask.is_complete)}
              </div>

              {/* Current pass form (if not complete) */}
              {!selectedTask.is_complete && selectedTask.current_pass_info && (
                <div className="card card-padded mb-lg" style={{
                  background: PASS_STYLES[selectedTask.current_pass]?.bg || 'var(--bg-secondary)',
                  borderLeft: `4px solid ${PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)'}`,
                }}>
                  <div className="flex-center gap-md mb-md">
                    <div className="l9-pass-label" style={{
                      color: PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)',
                    }}>
                      {selectedTask.current_pass_info.label}
                    </div>
                    <div>
                      <h3 className="no-margin">{selectedTask.current_pass_info.name}</h3>
                      <div className="l9-pass-focus">{selectedTask.current_pass_info.focus}</div>
                    </div>
                  </div>

                  {/* Key Question */}
                  <div className="mb-lg">
                    <label className="l9-key-question-label" style={{
                      color: PASS_STYLES[selectedTask.current_pass]?.color || 'var(--text-secondary)',
                    }}>
                      Key Question: "{selectedTask.current_pass_info.key_question}"
                    </label>
                    <textarea
                      value={passForm.key_question_answer}
                      onChange={(e) => setPassForm({ ...passForm, key_question_answer: e.target.value })}
                      placeholder={`Answer the question: ${selectedTask.current_pass_info.key_question}`}
                      className="input w-full"
                      rows={3}
                    />
                  </div>

                  {/* Feedback */}
                  <div className="mb-lg">
                    <label>
                      Iteration Feedback
                      <span className="l9-feedback-label-hint">
                        (What did you tell the AI to improve?)
                      </span>
                    </label>
                    <textarea
                      value={passForm.feedback}
                      onChange={(e) => setPassForm({ ...passForm, feedback: e.target.value })}
                      placeholder="Paste or describe the feedback you gave to the AI for this iteration pass..."
                      className="input w-full font-mono text-sm"
                      rows={5}
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleRecordPass}
                    disabled={submittingPass || !passForm.key_question_answer.trim() || !passForm.feedback.trim()}
                  >
                    {submittingPass ? 'Recording...' : `Complete Pass ${selectedTask.current_pass} (${selectedTask.current_pass_info.label})`}
                  </button>
                </div>
              )}

              {/* Completed message */}
              {selectedTask.is_complete && (
                <div className="card card-padded card-success mb-lg">
                  <h3 className="no-margin mb-sm learn-pattern-card-heading-green">Task Complete!</h3>
                  <p className="no-margin text-secondary">
                    All three passes have been recorded. This task has been refined through the full 70-85-95 framework.
                  </p>
                </div>
              )}

              {/* Pass history */}
              {selectedTask.passes && selectedTask.passes.length > 0 && (
                <div>
                  <h3>Pass History</h3>
                  <div className="flex-col gap-md">
                    {selectedTask.passes.map((pass, idx) => (
                      <div
                        key={idx}
                        className="card l9-pass-history-card"
                        style={{
                          borderLeft: `4px solid ${PASS_STYLES[pass.pass_number]?.color || 'var(--text-secondary)'}`,
                        }}
                      >
                        <div className="l9-pass-history-header">
                          <div className="flex-center gap-md">
                            <span className="l9-pass-badge" style={{
                              background: PASS_STYLES[pass.pass_number]?.bg || 'var(--bg-tertiary)',
                              color: PASS_STYLES[pass.pass_number]?.color || 'var(--text-secondary)',
                            }}>
                              {pass.pass_label}
                            </span>
                            <span className="text-secondary">{pass.focus}</span>
                          </div>
                          <span className="text-xxs text-muted">
                            {new Date(pass.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mb-md">
                          <div className="l9-section-label">KEY QUESTION ANSWER</div>
                          <div className="text-secondary text-italic">"{pass.key_question_answer}"</div>
                        </div>
                        <div>
                          <div className="l9-section-label">ITERATION FEEDBACK</div>
                          <pre className="l9-feedback-pre">
                            {pass.feedback}
                          </pre>
                        </div>

                        {/* Check Feedback Quality button */}
                        <div className="l9-feedback-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleAnalyzeFeedback(pass.pass_number)}
                            disabled={analyzingPass === pass.pass_number}
                          >
                            {analyzingPass === pass.pass_number ? 'Checking...' : 'Check Feedback Quality'}
                          </button>
                        </div>

                        {/* Feedback quality analysis results */}
                        {feedbackAnalysis[pass.pass_number] && (
                          <div className="l9-quality-results">
                            <div className="l9-quality-header">
                              <div className="l9-quality-score" data-quality={
                                feedbackAnalysis[pass.pass_number].quality_score >= 8 ? 'high' :
                                feedbackAnalysis[pass.pass_number].quality_score >= 5 ? 'medium' : 'low'
                              }>
                                {feedbackAnalysis[pass.pass_number].quality_score}/10
                              </div>
                              <span className="l9-quality-label">Feedback Quality</span>
                            </div>

                            {/* Detected patterns */}
                            {feedbackAnalysis[pass.pass_number].patterns_detected?.length > 0 && (
                              <div className="l9-patterns">
                                <div className="l9-patterns-label">Vague Patterns Detected:</div>
                                {feedbackAnalysis[pass.pass_number].patterns_detected.map((p, pi) => (
                                  <div key={pi} className={`l9-pattern-item l9-severity-${p.severity}`}>
                                    <div className="l9-pattern-header">
                                      <span className="l9-pattern-name">{PATTERN_LABELS[p.pattern]?.label || p.pattern}</span>
                                      <span className="l9-pattern-severity">{p.severity}</span>
                                    </div>
                                    {p.evidence && <div className="l9-pattern-evidence">"{p.evidence}"</div>}
                                    {p.fix && <div className="l9-pattern-fix">{p.fix}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {feedbackAnalysis[pass.pass_number].patterns_detected?.length === 0 && (
                              <div className="l9-no-patterns">No vague patterns detected — well-written feedback!</div>
                            )}

                            {/* Pass alignment */}
                            {feedbackAnalysis[pass.pass_number].pass_alignment && (
                              <div className="l9-alignment">
                                <span className={`l9-alignment-badge ${feedbackAnalysis[pass.pass_number].pass_alignment.aligned ? 'aligned' : 'misaligned'}`}>
                                  {feedbackAnalysis[pass.pass_number].pass_alignment.aligned ? 'Aligned with pass focus' : 'Misaligned with pass focus'}
                                </span>
                                <span className="l9-alignment-text">{feedbackAnalysis[pass.pass_number].pass_alignment.observation}</span>
                              </div>
                            )}

                            {/* Strengths */}
                            {feedbackAnalysis[pass.pass_number].strengths?.length > 0 && (
                              <div className="l9-strengths">
                                <strong>Strengths:</strong>
                                <ul>
                                  {feedbackAnalysis[pass.pass_number].strengths.map((s, si) => (
                                    <li key={si}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Improved version */}
                            {feedbackAnalysis[pass.pass_number].improved_version && feedbackAnalysis[pass.pass_number].patterns_detected?.length > 0 && (
                              <div className="l9-improved">
                                <div className="l9-improved-label">Improved Version:</div>
                                <pre className="l9-improved-text">{feedbackAnalysis[pass.pass_number].improved_version}</pre>
                              </div>
                            )}

                            {/* Coaching tip */}
                            {feedbackAnalysis[pass.pass_number].coaching_tip && (
                              <div className="l9-coaching-tip">
                                {feedbackAnalysis[pass.pass_number].coaching_tip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (showCreateForm || tasks.filter(t => !t.is_complete).length === 0) ? (
            // Create form
            <div className="card card-padded">
              <div className="flex-center gap-md">
                <h2 className="no-margin">Start New Iteration Task</h2>
                <ExamplesDropdown
                  endpoint="/lesson9/examples"
                  onSelect={(example) => {
                    setNewTask({
                      ...newTask,
                      task_name: example.task_name || '',
                      target_outcome: example.target_outcome || '',
                      notes: example.notes || '',
                    });
                  }}
                />
              </div>

              {/* Import from Context Tracker */}
              <div className="mt-md mb-md">
                <button
                  className="btn btn-secondary flex-center gap-sm"
                  onClick={handleOpenConvImport}
                  disabled={loadingConvs}
                >
                  {loadingConvs ? 'Loading...' : showConvImport ? 'Hide Import' : 'Import from Context Tracker'}
                </button>

                {showConvImport && (
                  <div className="card import-panel">
                    <h4 className="no-margin mb-md">Select a Conversation</h4>
                    {conversations.length === 0 ? (
                      <div className="empty-state">
                        <p>No conversations saved yet.</p>
                        <p className="empty-state-hint">
                          Go to <a href="/lesson/1" className="import-empty">Lesson 1 — Context Tracker</a> to analyze a conversation first.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-col gap-sm">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className="import-item"
                            onClick={() => handleImportConversation(conv.id)}
                          >
                            <div className="flex-between">
                              <strong>{conv.topic || 'Untitled'}</strong>
                              {conv.pattern_category && (
                                <span className="import-item-category">
                                  {conv.pattern_category}
                                </span>
                              )}
                            </div>
                            {conv.created_at && (
                              <div className="text-xs text-muted mt-xs">
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

              <div className="flex-col gap-md">
                <div>
                  <label>Task Name *</label>
                  <input
                    type="text"
                    value={newTask.task_name}
                    onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                    placeholder="e.g., Refactor Authentication Module"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label>
                    Target Outcome
                    <span className="l9-feedback-label-hint">(What does "done" look like?)</span>
                  </label>
                  <textarea
                    value={newTask.target_outcome}
                    onChange={(e) => setNewTask({ ...newTask, target_outcome: e.target.value })}
                    placeholder="Describe the end state when this task is complete..."
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label>Notes (optional)</label>
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    placeholder="Any additional context or notes..."
                    className="input w-full"
                    rows={2}
                  />
                </div>
                <div className="flex-center gap-md mt-sm">
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
              <div className="flex-between mb-md">
                <h2>Active Tasks</h2>
                <div className="flex-center gap-sm">
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

              {tasks.filter(t => !t.is_complete).length > 0 && (
                <div className="grid-auto-fill">
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
          <p className="text-secondary mb-lg">
            Tasks that have gone through all three iteration passes (70% - 85% - 95%).
          </p>

          {tasks.filter(t => t.is_complete).length > 0 ? (
            <div className="grid-auto-fill">
              {tasks.filter(t => t.is_complete).map((task) => (
                <div
                  key={task.id}
                  className="card card-compact card-success"
                >
                  <div className="flex-between-start mb-md">
                    <h4 className="no-margin">{task.task_name}</h4>
                    <span className="badge-complete">COMPLETE</span>
                  </div>
                  {renderPassProgress(task.current_pass, task.is_complete)}
                  <div className="flex-between mt-md">
                    <span className="text-xs text-secondary">
                      Completed {new Date(task.updated_at || task.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex-center gap-sm">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { handleSelectTask(task.id); setActiveTab('iterate'); }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                Complete a task through all three passes in the Iterate tab and you'll see:
              </p>
              <div className="analysis-grid">
                <div className="analysis-card" style={{ opacity: 0.7 }}>
                  <h3>70% Pass — Structure</h3>
                  <div className="field">
                    <div className="field-label">Key Question</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Is the overall structure and direction right? This pass focuses on getting the bones in place — organization, scope, and approach — before investing in polish.</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7 }}>
                  <h3>85% Pass — Substance</h3>
                  <div className="field">
                    <div className="field-label">Key Question</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Is the content accurate and complete? This pass focuses on correctness, gaps, and whether the output actually says what it needs to say.</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7 }}>
                  <h3>95% Pass — Polish</h3>
                  <div className="field">
                    <div className="field-label">Key Question</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Is this ready for its audience? This final pass focuses on tone, formatting, edge cases, and the details that separate "good enough" from "done right."</div>
                  </div>
                </div>
                <div className="analysis-card" style={{ opacity: 0.7 }}>
                  <h3>Completion Record</h3>
                  <div className="field">
                    <div className="field-label">What Gets Tracked</div>
                    <div className="field-value" style={{ color: 'var(--text-primary)' }}>Each completed task shows its name, the date completed, and a visual progress indicator across all three passes — building a record of your iteration discipline.</div>
                  </div>
                </div>
              </div>
              <div className="learn-next-step" style={{ marginTop: '24px' }}>
                <h3>Start Your First Iteration</h3>
                <p>Go to the Iterate tab, create a task, and work through the three passes. Completed tasks will appear here.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('iterate')}>Go to Iterate</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
