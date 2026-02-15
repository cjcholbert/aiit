import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import ConnectionCallout from '../components/ConnectionCallout';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

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
      </header>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={9} criteria={LESSON_CRITERIA[9]} />
        <StatsPanel stats={stats ? [
            { label: 'Total Tasks', value: stats.total_tasks, color: 'var(--accent-blue)' },
            { label: 'Completed', value: stats.completed_tasks, color: 'var(--accent-green)' },
            { label: 'In Progress', value: stats.in_progress_tasks, color: 'var(--accent-yellow)' },
            { label: 'Passes', value: stats.total_passes_recorded, color: 'var(--accent-purple)' },
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
        {['learn', 'practice', 'history'].map((tab) => (
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
            <p><strong>The Problem:</strong> Random iteration ("make it better") wastes cycles and leads to scope creep. Without structure, you'll keep tweaking without knowing when "done" is reached.</p>
            <p><strong>The Skill:</strong> Use the 70-85-95 framework to iterate with purpose. Each pass has a specific focus and key question, so you know exactly what to evaluate and when to move on.</p>
          </div>

          <ConnectionCallout
            lessonNumber={2}
            lessonTitle="Feedback Analyzer"
            message="Lesson 2 taught you to give specific, actionable feedback instead of vague requests. Now you'll apply that skill systematically — using structured passes so each round of feedback has a clear purpose and you know exactly when you're done."
          />

          <div className="learn-intro">
            <h2>Why "Make It Better" Never Works</h2>
            <p>
              Your manager asks you to use AI to draft a quarterly business review for the leadership
              team. The first version comes back and it's... okay. The structure is off, some numbers
              feel wrong, and the tone is too casual for the audience. So you tell the AI "make it
              better." It changes a few things. You say "more professional." It adjusts the tone but
              now the key recommendations are buried. Three more rounds of back-and-forth later, you've
              spent 45 minutes and the output is different — but not necessarily better.
            </p>
            <p>
              The problem isn't the AI. It's that "make it better" gives no direction. Each round of
              feedback tries to fix everything at once, so nothing gets fixed well. You end up chasing
              your tail, fixing the tone while breaking the structure, then fixing the structure while
              losing the tone.
            </p>
          </div>

          <div className="learn-key-insight">
            <strong>Key Insight:</strong> Effective iteration is not about more rounds — it's about
            focused rounds. The 70-85-95 framework gives each pass a single job. Pass 1 locks down
            structure. Pass 2 nails accuracy. Pass 3 polishes for the audience. Three deliberate
            passes beat ten random ones every time.
          </div>

          <h3>How This Lesson Works</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Three areas that build your structured iteration skill:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>Practice Tab — Run Your Passes</h4>
              <p>Create a real task (or import one from Context Tracker), then work through each
              pass. For every pass you answer its key question and record the specific feedback
              you gave the AI. This builds the muscle of focusing on one thing at a time.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>Feedback Quality Check — Sharpen Your Requests</h4>
              <p>After recording a pass, use the "Check Feedback Quality" button to get an analysis
              of your iteration feedback. It flags vague language, scope creep, and misalignment
              with the pass focus — so your feedback improves with every task.</p>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>History Tab — See Your Progress</h4>
              <p>Review completed tasks to see how your iteration approach evolves. Over time you'll
              notice your Pass 1 feedback getting sharper and your total passes-to-done shrinking.
              That's the skill developing.</p>
            </div>
          </div>

          <div className="learn-comparison">
            <h3>Random Tweaking vs. Structured Passes</h3>
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

          <h3>The Three Passes — In Detail</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Each pass targets a different layer of quality. Doing them in order prevents the
            "fix one thing, break another" cycle.
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--text-secondary)' }}>Pass 1: Structure and Completeness (70%)</h4>
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
              <h4 style={{ color: 'var(--accent-blue)' }}>Pass 2: Accuracy and Tone (85%)</h4>
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
              <h4 style={{ color: 'var(--accent-green)' }}>Pass 3: Polish and Edge Cases (95%)</h4>
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

          <h3>Common Mistakes</h3>
          <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
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

          <div className="learn-next-step">
            <h3>Ready to Iterate with Purpose?</h3>
            <p>Pick a real task you're working on — a report, a proposal, a client email, a project
            plan — and run it through all three passes. You'll feel the difference between "make it
            better" and knowing exactly what to fix at each stage.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('practice')}>
              Go to Practice
            </button>
          </div>
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

      <LessonNav currentLesson={9} />
    </div>
  );
}
