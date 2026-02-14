import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

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
      setActiveTab('stats');
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
        <p className="page-description">
          <strong>The Problem:</strong> Recurring tasks like status reports, meeting summaries, and client updates
          eat up valuable time when done manually each time. Without a systematic approach, you're reinventing
          the wheel with every iteration.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Design AI-integrated workflows for recurring tasks. Create templates,
          track inputs, and measure time savings to build sustainable AI collaboration habits.
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
        {['learn', 'design', 'run', 'stats'].map((tab) => (
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
          <h2>Workflow Integration</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Embed AI into your recurring workflows to save time while maintaining quality.
          </p>

          {/* Good Integration Candidate */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>What Makes a Good Integration Candidate?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Not every task benefits from AI integration. Look for tasks that meet these criteria:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {Object.entries(criteria).map(([key, value]) => (
                <div key={key} style={{ padding: '16px', background: 'var(--success-bg)', borderRadius: '8px', borderLeft: '4px solid var(--accent-green)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: '8px' }}>{value.label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{value.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Design */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>Designing Your Workflow</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              A good AI-integrated workflow has these components:
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>1</span>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Define Inputs</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>What information do you need to gather before running the workflow?</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>2</span>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Map Steps</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Break down the process into discrete steps. Mark which steps involve AI.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>3</span>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Create Prompt Template</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Build a reusable prompt with {'{{variable}}'} placeholders for inputs.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ background: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>4</span>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Add Quality Checks</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Define what to verify before using the output.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0 }}>Measuring Success</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Track these metrics to understand the value of your AI integrations:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'var(--accent-blue)' }}>Time</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimated vs. actual time per run</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'var(--accent-purple)' }}>Quality</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Self-assessed output quality (1-10)</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'var(--accent-green)' }}>Frequency</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Adherence to intended schedule</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="design-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                          style={{ background: 'var(--accent-red)', border: 'none', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
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
                          style={{ background: 'var(--accent-red)', border: 'none', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
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
                          style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--accent-red)' }}
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
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--accent-red)' }}
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

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2>Workflow Statistics</h2>

          {stats && stats.total_reports > 0 ? (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total_templates}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Templates</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total_reports}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Reports</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.total_time_saved_minutes}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Minutes Saved</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.avg_quality_score}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Avg Quality</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.reports_this_week}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>This Week</div>
                </div>
              </div>

              {/* Most used template */}
              {stats.most_used_template && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginTop: 0 }}>Most Used Template</h3>
                  <div style={{ fontSize: '1.5rem', color: 'var(--accent-blue)' }}>{stats.most_used_template}</div>
                </div>
              )}

              {/* Reports by template */}
              {stats.reports_by_template && stats.reports_by_template.length > 0 && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginTop: 0 }}>Reports by Template</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.reports_by_template.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1 }}>{item.template_name}</div>
                        <div style={{ width: '200px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(item.count / stats.total_reports) * 100}%`,
                            background: 'var(--accent-blue)',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <div style={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time saved by frequency */}
              {stats.time_saved_by_frequency && (
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ marginTop: 0 }}>Time Saved by Frequency</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {Object.entries(stats.time_saved_by_frequency).map(([freq, minutes]) => {
                      const style = FREQUENCY_COLORS[freq] || FREQUENCY_COLORS.weekly;
                      return (
                        <div key={freq} style={{ padding: '16px', background: style.bg, borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: style.color }}>{minutes}</div>
                          <div style={{ color: style.color, textTransform: 'capitalize' }}>{freq} mins</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <h3>No statistics yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Run some workflows to start tracking your time savings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
