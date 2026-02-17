import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import ConnectionCallout from '../components/ConnectionCallout';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';
import ExamplesDropdown from '../components/ExamplesDropdown';

// Frequency colors
const FREQUENCY_COLORS = {
  daily: { color: 'var(--accent-blue)', bg: 'var(--bg-tertiary)', icon: '📅', label: 'Daily' },
  weekly: { color: 'var(--accent-purple)', bg: 'var(--bg-tertiary)', icon: '📆', label: 'Weekly' },
  biweekly: { color: 'var(--accent-yellow)', bg: 'var(--bg-tertiary)', icon: '🗓️', label: 'Biweekly' },
  monthly: { color: 'var(--accent-green)', bg: 'var(--bg-tertiary)', icon: '📊', label: 'Monthly' }
};

export default function Lesson10() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [frequencies, setFrequencies] = useState({});
  const [criteria, setCriteria] = useState({});
  const [qualityChecks, setQualityChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Design tab state
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    estimated_time_minutes: 30,
    inputs: [],
    steps: [],
    prompt_template: '',
    quality_checks: []
  });

  // Run tab state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [qualityScore, setQualityScore] = useState(7);
  const [reportNotes, setReportNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Import from Context Docs state
  const [contextDocs, setContextDocs] = useState([]);
  const [showDocImport, setShowDocImport] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // View report state
  const [viewingReport, setViewingReport] = useState(null);

  // Fetch data
  const fetchTemplates = async () => {
    try {
      const data = await api.get('/lesson10/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api.get('/lesson10/reports');
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson10/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [freqData, criteriaData, checksData] = await Promise.all([
        api.get('/lesson10/frequencies'),
        api.get('/lesson10/criteria'),
        api.get('/lesson10/quality-checks')
      ]);
      setFrequencies(freqData);
      setCriteria(criteriaData);
      setQualityChecks(checksData);
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTemplates(),
        fetchReports(),
        fetchStats(),
        fetchReferenceData()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Template form handlers
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      frequency: 'weekly',
      estimated_time_minutes: 30,
      inputs: [],
      steps: [],
      prompt_template: '',
      quality_checks: []
    });
    setEditingTemplate(null);
  };

  const handleEditTemplate = async (id) => {
    try {
      const template = await api.get(`/lesson10/templates/${id}`);
      setTemplateForm({
        name: template.name,
        description: template.description || '',
        frequency: template.frequency,
        estimated_time_minutes: template.estimated_time_minutes || 30,
        inputs: template.inputs || [],
        steps: template.steps || [],
        prompt_template: template.prompt_template || '',
        quality_checks: template.quality_checks || []
      });
      setEditingTemplate(template);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddInput = () => {
    setTemplateForm(prev => ({
      ...prev,
      inputs: [...prev.inputs, { name: '', type: 'text', description: '', required: true }]
    }));
  };

  const handleUpdateInput = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      inputs: prev.inputs.map((inp, i) =>
        i === index ? { ...inp, [field]: value } : inp
      )
    }));
  };

  const handleRemoveInput = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index)
    }));
  };

  const handleAddStep = () => {
    setTemplateForm(prev => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, description: '', is_ai_step: false }]
    }));
  };

  const handleUpdateStep = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleRemoveStep = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    }));
  };

  const handleToggleQualityCheck = (checkId) => {
    setTemplateForm(prev => ({
      ...prev,
      quality_checks: prev.quality_checks.includes(checkId)
        ? prev.quality_checks.filter(id => id !== checkId)
        : [...prev.quality_checks, checkId]
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingTemplate) {
        await api.put(`/lesson10/templates/${editingTemplate.id}`, templateForm);
      } else {
        await api.post('/lesson10/templates', templateForm);
      }
      await fetchTemplates();
      await fetchStats();
      resetTemplateForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template and all its reports?')) return;
    try {
      await api.del(`/lesson10/templates/${id}`);
      await fetchTemplates();
      await fetchReports();
      await fetchStats();
      if (editingTemplate?.id === id) resetTemplateForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenDocImport = async () => {
    if (showDocImport) { setShowDocImport(false); return; }
    setLoadingDocs(true);
    try {
      const data = await api.get('/lesson4/docs');
      setContextDocs(data);
      setShowDocImport(true);
    } catch (err) {
      setError('Could not load context docs from Context Docs: ' + err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleImportContextDoc = async (id) => {
    try {
      const doc = await api.get(`/lesson4/docs/${id}`);
      const parts = [];
      if (doc.description) parts.push(`Project: ${doc.description}`);
      if (doc.current_state) {
        const state = doc.current_state;
        if (state.complete?.length) parts.push(`Completed: ${state.complete.join(', ')}`);
        if (state.in_progress?.length) parts.push(`In Progress: ${state.in_progress.join(', ')}`);
        if (state.blocked?.length) parts.push(`Blocked: ${state.blocked.join(', ')}`);
      }
      if (doc.key_decisions?.length) parts.push(`Key Decisions: ${doc.key_decisions.join('; ')}`);
      if (doc.known_issues?.length) parts.push(`Known Issues: ${doc.known_issues.join('; ')}`);

      const summary = parts.join('\n');
      const newValues = { ...inputValues };

      Object.keys(newValues).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('status') || lowerKey.includes('project') || lowerKey.includes('update') || lowerKey.includes('summary')) {
          newValues[key] = summary;
        } else if (lowerKey.includes('accomplishment') || lowerKey.includes('complete')) {
          newValues[key] = (doc.current_state?.complete || []).join('\n');
        } else if (lowerKey.includes('blocker') || lowerKey.includes('block') || lowerKey.includes('issue')) {
          newValues[key] = [...(doc.current_state?.blocked || []), ...(doc.known_issues || [])].join('\n');
        } else if (lowerKey.includes('goal') || lowerKey.includes('next') || lowerKey.includes('plan')) {
          newValues[key] = (doc.next_goals || []).join('\n');
        }
      });

      const anyFilled = Object.values(newValues).some(v => v && v.trim());
      if (!anyFilled && Object.keys(newValues).length > 0) {
        const firstKey = Object.keys(newValues)[0];
        newValues[firstKey] = summary;
      }

      setInputValues(newValues);
      setShowDocImport(false);
    } catch (err) {
      setError('Could not load context doc: ' + err.message);
    }
  };

  // Run workflow handlers
  const handleSelectTemplate = async (id) => {
    try {
      const template = await api.get(`/lesson10/templates/${id}`);
      setSelectedTemplate(template);
      // Initialize input values
      const values = {};
      (template.inputs || []).forEach(inp => {
        values[inp.name] = '';
      });
      setInputValues(values);
      setGeneratedContent('');
      setActualTime('');
      setQualityScore(7);
      setReportNotes('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGeneratePrompt = () => {
    if (!selectedTemplate) return;

    let prompt = selectedTemplate.prompt_template || '';

    // Replace {{variable}} placeholders
    Object.entries(inputValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, value || `[${key}]`);
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    prompt = prompt.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      return inputValues[varName] ? content : '';
    });

    setGeneratedContent(prompt);
  };

  const handleSaveReport = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    setError(null);

    try {
      await api.post('/lesson10/reports', {
        template_id: selectedTemplate.id,
        title: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        inputs_used: inputValues,
        generated_content: generatedContent,
        actual_time_minutes: actualTime ? parseInt(actualTime) : null,
        quality_score: qualityScore,
        notes: reportNotes
      });
      await fetchReports();
      await fetchStats();
      setSelectedTemplate(null);
      setActiveTab('run');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      const report = await api.get(`/lesson10/reports/${id}`);
      setViewingReport(report);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.del(`/lesson10/reports/${id}`);
      await fetchReports();
      await fetchStats();
      if (viewingReport?.id === id) setViewingReport(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSeedExamples = async () => {
    try {
      await api.post('/lesson10/templates/seed-examples', {});
      await fetchTemplates();
      await fetchStats();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render frequency badge
  const renderFrequencyBadge = (frequency) => {
    const style = FREQUENCY_COLORS[frequency] || FREQUENCY_COLORS.weekly;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        textTransform: 'capitalize'
      }}>
        {frequency}
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
        <h1>Status Reporter</h1>
      </header>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={10} criteria={LESSON_CRITERIA[10]} />
        <StatsPanel stats={stats ? [
            { label: 'Templates', value: stats.total_templates, color: 'var(--accent-blue)' },
            { label: 'Reports', value: stats.total_reports, color: 'var(--accent-blue)' },
            { label: 'Min Saved', value: stats.total_time_saved_minutes, color: 'var(--accent-green)' },
            { label: 'Avg Quality', value: stats.avg_quality_score, color: 'var(--accent-purple)' },
            { label: 'This Week', value: stats.reports_this_week, color: 'var(--accent-yellow)' },
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
        {['learn', 'design', 'run'].map((tab) => (
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
            <p><strong>The Problem:</strong> Recurring tasks like status reports, meeting summaries, and client updates eat up valuable time when done manually each time. Without a systematic approach, you're reinventing the wheel with every iteration.</p>
            <p><strong>The Skill:</strong> Design AI-integrated workflows for recurring tasks. Create templates, track inputs, and measure time savings to build sustainable AI collaboration habits.</p>
          </div>

          <ConnectionCallout
            lessonNumber={4}
            lessonTitle="Context Docs"
            message="Lesson 4 taught you to keep living project documents so AI never loses track of where you are. Status Reporter takes the next step: turning recurring reports and updates into repeatable AI workflows you can run on a schedule."
          />

          <div className="learn-intro">
            <h2>Why Recurring Tasks Deserve Their Own Workflow</h2>
            <p>
              Every Friday you write the same team status email. Every month you pull together the same
              client report. Every quarter you compile the same business review slides. Each time, you
              start from scratch — opening old emails for the format, hunting down the right data,
              and spending 45 minutes on something that should take 15.
            </p>
            <p>
              The real power of AI is not in one-off tasks. It is in the tasks you do repeatedly.
              When you build a workflow template once, every future run becomes faster, more consistent,
              and easier to hand off to a colleague.
            </p>
          </div>

          <div className="learn-key-insight">
            <strong>Key Insight:</strong> A repeatable AI workflow has three parts: defined inputs
            (what changes each time), a prompt template (the instructions that stay the same), and
            quality checks (how you verify the output before sending). Design all three once, then
            just fill in the blanks each time you run it.
          </div>

          <h3>How This Lesson Works</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Two practice areas to build sustainable AI workflow habits:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>Design Tab — Build Your Workflow Templates</h4>
              <p>Create a template for a recurring task. Define what information you need to gather
              each time, write the prompt with placeholders, and choose quality checks to run before
              you use the output.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('design')}>Go to Design →</button>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>Run Tab — Execute and Track Results</h4>
              <p>Run your workflow by filling in the inputs, generating the prompt, and recording how
              long it took and how good the output was. Over time, you will see your time savings
              add up and spot which templates need improvement.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('run')}>Go to Run →</button>
            </div>
          </div>

          <div className="learn-comparison">
            <h3>Ad-Hoc AI Use vs. Designed Workflow</h3>
            <div className="learn-comparison-grid">
              <div className="learn-comparison-col">
                <h4 className="poor">Starting from Scratch Every Time</h4>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Monthly Client Report</div>
                  <p>"Hey AI, can you write a report for my client about what we did this month?
                  Oh wait, I need to include the metrics too. And format it like last time. Actually,
                  let me find last month's email to see what I included..."</p>
                </div>
                <div className="learn-comparison-item poor">
                  <p>Takes 40 minutes. Forgets to include the budget section. Client asks why the
                  format changed from last month. You spend another 15 minutes fixing it.</p>
                </div>
              </div>
              <div className="learn-comparison-col">
                <h4 className="good">Running a Designed Workflow</h4>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Same Report — With a Workflow Template</div>
                  <p>Open your "Monthly Client Report" template. Fill in this month's accomplishments,
                  metrics, and next steps. Click generate. The prompt already includes the format,
                  tone, and sections the client expects.</p>
                </div>
                <div className="learn-comparison-item good">
                  <p>Takes 15 minutes. Same format every time. Quality checks remind you to verify
                  the numbers before sending. You track that you are saving 25 minutes per report.</p>
                </div>
              </div>
            </div>
          </div>

          <h3>What Makes a Task Worth Turning Into a Workflow</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Not every AI task needs a formal workflow. Focus on tasks that have these qualities:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>It Recurs on a Schedule</h4>
              <p>Weekly team updates, monthly reports, quarterly reviews. If you do it more than
              twice, it is worth templating.</p>
              <div className="learn-pattern-label better">Good Candidate</div>
              <div className="learn-example-good">
                Weekly team status email — same format, different data each week.
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>The Structure Stays the Same</h4>
              <p>The sections, format, and tone are consistent. Only the specific content changes.
              If every instance is wildly different, a template will not help much.</p>
              <div className="learn-pattern-label better">Good Candidate</div>
              <div className="learn-example-good">
                Meeting follow-up emails — always include decisions made, action items, next meeting date.
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>You Can Identify the Inputs</h4>
              <p>You know what changes each time and can name those variables. The rest is boilerplate
              that AI can handle consistently.</p>
              <div className="learn-pattern-label better">Good Candidate</div>
              <div className="learn-example-good">
                New hire welcome email — inputs are name, role, start date, manager, and team. Everything
                else is standard.
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>Quality Is Verifiable</h4>
              <p>You can check the output against clear criteria before using it. "Does it include
              all required sections? Are the numbers accurate? Is the tone right for this audience?"</p>
              <div className="learn-pattern-label better">Good Candidate</div>
              <div className="learn-example-good">
                Expense report summary — you can verify totals match receipts and categories are correct.
              </div>
            </div>
          </div>

          <h3>Anatomy of a Good Workflow Template</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            When you design your template in the Design tab, you will fill in four parts:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>1. Inputs</h4>
              <p>The variables that change each time you run the workflow. Name them clearly so
              anyone could fill them in.</p>
              <div className="learn-example-good">
                <strong>Input:</strong> accomplishments (What the team completed this week)<br/>
                <strong>Input:</strong> blockers (Any issues preventing progress)<br/>
                <strong>Input:</strong> next_week_priorities (Top 3 goals for next week)
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>2. Steps</h4>
              <p>The sequence of actions: gather data, run the AI prompt, review, send. Mark which
              steps involve AI and which are human tasks.</p>
              <div className="learn-example-good">
                <strong>Step 1 (Human):</strong> Collect team updates from Slack<br/>
                <strong>Step 2 (AI):</strong> Draft status email from inputs<br/>
                <strong>Step 3 (Human):</strong> Verify accuracy and send
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>3. Prompt Template</h4>
              <p>The AI instructions with {'{{placeholders}}'} where your inputs go. This is the
              part that stays the same every run.</p>
              <div className="learn-example-good">
                "Write a team status email for this week. Accomplishments: {'{{accomplishments}}'}.
                Blockers: {'{{blockers}}'}. Use a professional but friendly tone. Keep it under 200 words."
              </div>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>4. Quality Checks</h4>
              <p>What to verify before using the output. These act as your checklist so you catch
              issues before they reach the recipient.</p>
              <div className="learn-example-good">
                <strong>Check:</strong> All team members' contributions are mentioned<br/>
                <strong>Check:</strong> No confidential project details are included<br/>
                <strong>Check:</strong> Tone matches previous emails
              </div>
            </div>
          </div>

          <h3>Common Mistakes</h3>
          <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Creating a template for a task you do once. The setup time is not worth it for
              one-off work. Save templates for tasks you repeat at least monthly.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                Start with your most frequent recurring task — the one you dread every week. Once
                that workflow is running smoothly, add more.
              </div>
            </div>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Skipping the quality checks. You generate the output, glance at it, and send it.
              Two months later you realize the AI has been including outdated information in every
              report.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                Add at least two quality checks to every template. Make them specific: "Verify all
                dollar amounts match the source spreadsheet" is better than "Check for accuracy."
              </div>
            </div>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Never tracking time. You assume the workflow saves time, but you have no data to
              prove it — or to notice when a template is actually slower than doing it manually.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                Record actual time for every run. After 4-5 runs, compare against your estimate. If
                you are not saving at least 20% of the time, the template needs rework.
              </div>
            </div>
          </div>

          <div className="learn-next-step">
            <h3>Ready to Design Your First Workflow?</h3>
            <p>Think of a report or update you write on a regular schedule. Start with one template
            and run it twice before building more — you will learn what works best for your style.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('design')}>
              Go to Design
            </button>
          </div>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="design-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ExamplesDropdown
                endpoint="/lesson10/examples"
                onSelect={(example) => {
                  setTemplateForm({
                    ...templateForm,
                    name: example.name || '',
                    description: example.description || '',
                    frequency: example.frequency || 'weekly',
                    estimated_time_minutes: example.estimated_time_minutes || 30,
                    inputs: example.inputs || [],
                    steps: example.steps || [],
                    prompt_template: example.prompt_template || '',
                    quality_checks: example.quality_checks || [],
                  });
                }}
              />
              {templates.length === 0 && (
                <button className="btn btn-secondary" onClick={handleSeedExamples}>
                  Load Examples
                </button>
              )}
              {editingTemplate && (
                <button className="btn btn-secondary" onClick={resetTemplateForm}>
                  New Template
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            {/* Template Form */}
            <div className="card" style={{ padding: '24px' }}>
              {/* Basic Info */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Template Name *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Weekly Status Report"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="What does this workflow produce?"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Frequency</label>
                  <select
                    value={templateForm.frequency}
                    onChange={(e) => setTemplateForm({ ...templateForm, frequency: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    {Object.entries(frequencies).map(([key, value]) => (
                      <option key={key} value={key}>{value.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Estimated Time (minutes)</label>
                  <input
                    type="number"
                    value={templateForm.estimated_time_minutes}
                    onChange={(e) => setTemplateForm({ ...templateForm, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                    className="input"
                    style={{ width: '100%' }}
                    min="1"
                  />
                </div>
              </div>

              {/* Inputs */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label>Inputs</label>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                    onClick={handleAddInput}
                  >
                    + Add Input
                  </button>
                </div>
                {templateForm.inputs.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No inputs defined. Add inputs that will be collected before running the workflow.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {templateForm.inputs.map((input, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                        <input
                          type="text"
                          value={input.name}
                          onChange={(e) => handleUpdateInput(idx, 'name', e.target.value)}
                          placeholder="Variable name"
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          value={input.description}
                          onChange={(e) => handleUpdateInput(idx, 'description', e.target.value)}
                          placeholder="Description"
                          className="input"
                          style={{ flex: 2 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={input.required}
                            onChange={(e) => handleUpdateInput(idx, 'required', e.target.checked)}
                          />
                          Req
                        </label>
                        <button
                          onClick={() => handleRemoveInput(idx)}
                          style={{ background: 'var(--accent-red)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Steps */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label>Workflow Steps</label>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                    onClick={handleAddStep}
                  >
                    + Add Step
                  </button>
                </div>
                {templateForm.steps.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No steps defined. Add the steps to complete this workflow.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {templateForm.steps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ background: step.is_ai_step ? 'var(--accent-blue)' : 'var(--bg-hover)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                          {step.order}
                        </span>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                          placeholder="Step description"
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={step.is_ai_step}
                            onChange={(e) => handleUpdateStep(idx, 'is_ai_step', e.target.checked)}
                          />
                          AI Step
                        </label>
                        <button
                          onClick={() => handleRemoveStep(idx)}
                          style={{ background: 'var(--accent-red)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt Template */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Prompt Template
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '8px' }}>
                    Use {'{{variable_name}}'} for placeholders
                  </span>
                </label>
                <textarea
                  value={templateForm.prompt_template}
                  onChange={(e) => setTemplateForm({ ...templateForm, prompt_template: e.target.value })}
                  placeholder="Write your prompt template here. Use {{variable}} syntax for inputs."
                  className="input"
                  rows={8}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>

              {/* Quality Checks */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Quality Checks</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {qualityChecks.map((check) => (
                    <button
                      key={check.id}
                      onClick={() => handleToggleQualityCheck(check.id)}
                      style={{
                        padding: '8px 16px',
                        background: templateForm.quality_checks.includes(check.id) ? 'var(--accent-green)' : 'var(--bg-secondary)',
                        border: 'none',
                        borderRadius: '20px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title={check.description}
                    >
                      {check.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                className="btn btn-primary"
                onClick={handleSaveTemplate}
                disabled={saving || !templateForm.name.trim()}
                style={{ width: '100%' }}
              >
                {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>

            {/* Template List */}
            <div>
              <h3 style={{ marginTop: 0 }}>Your Templates</h3>
              {templates.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No templates yet.</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create one or load examples to get started.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        border: editingTemplate?.id === template.id ? '2px solid var(--accent-blue)' : 'none'
                      }}
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                        {renderFrequencyBadge(template.frequency)}
                      </div>
                      {template.description && (
                        <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {template.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {template.estimated_time_minutes ? `${template.estimated_time_minutes} min` : 'No estimate'}
                          {' | '}
                          {template.report_count} runs
                        </span>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--accent-red)', color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
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

      {/* Run Tab */}
      {activeTab === 'run' && (
        <div className="run-section">
          {viewingReport ? (
            // View Report
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Report Details</h2>
                <button className="btn btn-secondary" onClick={() => setViewingReport(null)}>
                  Back
                </button>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0 }}>{viewingReport.title}</h3>
                {viewingReport.template_name && (
                  <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Template: {viewingReport.template_name}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                      {viewingReport.actual_time_minutes || '-'} min
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Actual Time</div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                      {viewingReport.time_saved_minutes != null
                        ? `${viewingReport.time_saved_minutes > 0 ? '+' : ''}${viewingReport.time_saved_minutes} min`
                        : '-'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Time Saved</div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                      {viewingReport.quality_score || '-'}/10
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quality</div>
                  </div>
                </div>

                {Object.keys(viewingReport.inputs_used || {}).length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Inputs Used</h4>
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                      {Object.entries(viewingReport.inputs_used).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{key}</div>
                          <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{value || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewingReport.generated_content && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Generated Content</h4>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {viewingReport.generated_content}
                    </div>
                  </div>
                )}

                {viewingReport.notes && (
                  <div>
                    <h4>Notes</h4>
                    <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{viewingReport.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ) : selectedTemplate ? (
            // Run Workflow
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Run: {selectedTemplate.name}</h2>
                <button className="btn btn-secondary" onClick={() => setSelectedTemplate(null)}>
                  Back to Templates
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Inputs & Steps */}
                <div>
                  {/* Steps Reference */}
                  <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <h3 style={{ marginTop: 0 }}>Workflow Steps</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectedTemplate.steps || []).map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                          <span style={{
                            background: step.is_ai_step ? 'var(--accent-blue)' : 'var(--bg-hover)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                          }}>
                            {step.order}
                          </span>
                          <span style={{ flex: 1 }}>{step.description}</span>
                          {step.is_ai_step && (
                            <span style={{ color: 'var(--accent-blue)', fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '4px' }}>
                              AI
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Provide Inputs</h3>

                    {/* Import from Context Docs */}
                    {(selectedTemplate.inputs || []).length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={handleOpenDocImport}
                          disabled={loadingDocs}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {loadingDocs ? 'Loading...' : showDocImport ? 'Hide Import' : 'Import from Context Docs'}
                        </button>

                        {showDocImport && (
                          <div className="card" style={{ padding: '16px', marginTop: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                            <h4 style={{ margin: '0 0 12px' }}>Select a Context Doc</h4>
                            {contextDocs.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                <p>No context docs saved yet.</p>
                                <p style={{ fontSize: '0.85rem' }}>
                                  Go to <a href="/lesson/4" style={{ color: 'var(--accent-blue)' }}>Lesson 4 — Context Docs</a> to create a project document first.
                                </p>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {contextDocs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    onClick={() => handleImportContextDoc(doc.id)}
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
                                      <strong style={{ color: 'var(--text-primary)' }}>{doc.project_name || 'Untitled'}</strong>
                                      {doc.is_active && (
                                        <span style={{
                                          fontSize: '0.75rem',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          background: 'var(--success-bg)',
                                          color: 'var(--accent-green)',
                                        }}>
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    {doc.description && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {doc.description}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedTemplate.inputs || []).length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)' }}>This template has no defined inputs.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedTemplate.inputs.map((input, idx) => (
                          <div key={idx}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>
                              {input.name}
                              {input.required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
                              {input.description && (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '8px' }}>
                                  ({input.description})
                                </span>
                              )}
                            </label>
                            <textarea
                              value={inputValues[input.name] || ''}
                              onChange={(e) => setInputValues({ ...inputValues, [input.name]: e.target.value })}
                              className="input"
                              rows={3}
                              style={{ width: '100%' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={handleGeneratePrompt}
                      style={{ marginTop: '16px', width: '100%' }}
                    >
                      Generate Prompt
                    </button>
                  </div>
                </div>

                {/* Right: Generated Content & Save */}
                <div>
                  <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <h3 style={{ marginTop: 0 }}>Generated Prompt</h3>
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      placeholder="Click 'Generate Prompt' to fill inputs into the template, then copy this to your AI assistant."
                      className="input"
                      rows={12}
                      style={{ width: '100%', fontFamily: 'monospace' }}
                    />
                    {generatedContent && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => { navigator.clipboard.writeText(generatedContent); }}
                        style={{ marginTop: '8px' }}
                      >
                        Copy to Clipboard
                      </button>
                    )}
                  </div>

                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Record Results</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Actual Time (minutes)</label>
                        <input
                          type="number"
                          value={actualTime}
                          onChange={(e) => setActualTime(e.target.value)}
                          placeholder={selectedTemplate.estimated_time_minutes ? `Estimated: ${selectedTemplate.estimated_time_minutes}` : ''}
                          className="input"
                          style={{ width: '100%' }}
                          min="1"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Quality Score (1-10)</label>
                        <input
                          type="range"
                          value={qualityScore}
                          onChange={(e) => setQualityScore(parseInt(e.target.value))}
                          min="1"
                          max="10"
                          style={{ width: '100%' }}
                        />
                        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{qualityScore}/10</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>Notes (optional)</label>
                      <textarea
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        placeholder="Any observations, improvements, or issues..."
                        className="input"
                        rows={3}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveReport}
                      disabled={saving}
                      style={{ width: '100%', background: 'var(--accent-green)' }}
                    >
                      {saving ? 'Saving...' : 'Save Report'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Select Template
            <div>
              <h2>Select a Workflow to Run</h2>
              {templates.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <h3>No templates yet</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Create a workflow template in the Design tab first.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('design')}>
                    Go to Design
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {templates.filter(t => t.is_active).map((template) => (
                    <div
                      key={template.id}
                      className="card"
                      style={{ padding: '20px', cursor: 'pointer' }}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0 }}>{template.name}</h3>
                        {renderFrequencyBadge(template.frequency)}
                      </div>
                      {template.description && (
                        <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>{template.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>{template.estimated_time_minutes ? `${template.estimated_time_minutes} min est.` : 'No estimate'}</span>
                        <span>{template.report_count} previous runs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Reports */}
              {reports.length > 0 && (
                <div>
                  <h3>Recent Reports</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.slice(0, 10).map((report) => (
                      <div
                        key={report.id}
                        className="card"
                        style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => handleViewReport(report.id)}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{report.title}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {report.template_name || 'No template'}
                            {' | '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {report.time_saved_minutes != null && (
                            <span style={{ color: report.time_saved_minutes > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                              {report.time_saved_minutes > 0 ? '+' : ''}{report.time_saved_minutes} min
                            </span>
                          )}
                          {report.quality_score && (
                            <span style={{ color: 'var(--accent-purple)' }}>{report.quality_score}/10</span>
                          )}
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--accent-red)', color: '#fff' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <LessonNav currentLesson={10} />
    </div>
  );
}
