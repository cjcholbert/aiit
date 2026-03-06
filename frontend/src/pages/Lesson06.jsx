import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ConnectionCallout from '../components/ConnectionCallout';
import { useLessonStats } from '../contexts/LessonStatsContext';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';
import LessonNav from '../components/LessonNav';

// Category badge colors
const CATEGORY_COLORS = {
  critical: { bg: 'var(--error-bg)', border: 'var(--border-color)', text: 'var(--accent-red)', icon: '🚨', label: 'Critical' },
  common_failure: { bg: 'var(--warning-bg)', border: 'var(--border-color)', text: 'var(--accent-yellow)', icon: '⚠️', label: 'Common Failure' },
  edge_case: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--accent-blue)', icon: '🔍', label: 'Edge Case' },
  domain_specific: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--accent-purple)', icon: '🎯', label: 'Domain Specific' },
  general: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--text-muted)', icon: '📋', label: 'General' },
};

// Trust level colors (from Lesson 5)
const TRUST_COLORS = {
  high: { color: 'var(--accent-green)', icon: '✅', label: 'High Trust' },
  medium: { color: 'var(--accent-yellow)', icon: '⚠️', label: 'Medium Trust' },
  low: { color: 'var(--accent-red)', icon: '🚨', label: 'Low Trust' },
};

export default function Lesson06() {
  const api = useApi();
  const { setStats: setSidebarStats } = useLessonStats();
  const [activeTab, setActiveTab] = useState('concepts');
  const [checklists, setChecklists] = useState([]);
  const [outputTypes, setOutputTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create checklist form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChecklist, setNewChecklist] = useState({
    name: '',
    output_type: '',
    items: [],
  });
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('general');
  const [newItemCritical, setNewItemCritical] = useState(false);

  // Edit checklist state
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [editItemText, setEditItemText] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('general');
  const [editItemCritical, setEditItemCritical] = useState(false);

  // Practice session state
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [issuesFound, setIssuesFound] = useState({});
  const [sessionNotes, setSessionNotes] = useState('');

  // Expanded view
  const [expandedChecklist, setExpandedChecklist] = useState(null);

  // Import from Trust Matrix state
  const [showTrustImport, setShowTrustImport] = useState(false);
  const [loadingTrustTypes, setLoadingTrustTypes] = useState(false);

  // Fetch data
  const fetchChecklists = async () => {
    try {
      const data = await api.get('/lesson6/checklists');
      setChecklists(data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
    }
  };

  const fetchOutputTypes = async () => {
    try {
      const data = await api.get('/lesson5/output-types');
      setOutputTypes(data);
    } catch (err) {
      console.error('Failed to fetch output types:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson6/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChecklists(), fetchOutputTypes(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    setSidebarStats(stats ? [
      { label: 'Checklists', value: stats.total_checklists, color: 'var(--accent-blue)' },
      { label: 'Sessions', value: stats.total_sessions, color: 'var(--accent-green)' },
      { label: 'Avg Time', value: formatTime(Math.round(stats.avg_verification_time || 0)), color: 'var(--accent-yellow)' },
    ] : []);
    return () => setSidebarStats(null);
  }, [stats, setSidebarStats]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Handlers
  const handleSeedDefaults = async () => {
    try {
      const result = await api.post('/lesson6/checklists/seed-defaults', {});
      console.log('Seeded checklists:', result);
      await fetchChecklists();
      setError(null);
    } catch (err) {
      console.error('Seed error:', err);
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL checklists? This cannot be undone.')) return;
    try {
      for (const c of checklists) {
        await api.del(`/lesson6/checklists/${c.id}`);
      }
      await fetchChecklists();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem = {
      text: newItemText.trim(),
      category: newItemCategory,
      is_critical: newItemCritical,
      order: newChecklist.items.length,
    };
    setNewChecklist({
      ...newChecklist,
      items: [...newChecklist.items, newItem],
    });
    setNewItemText('');
    setNewItemCritical(false);
  };

  const handleRemoveItem = (index) => {
    setNewChecklist({
      ...newChecklist,
      items: newChecklist.items.filter((_, i) => i !== index),
    });
  };

  const handleCreateChecklist = async () => {
    if (!newChecklist.name.trim() || !newChecklist.output_type.trim()) {
      setError('Name and output type are required');
      return;
    }
    try {
      await api.post('/lesson6/checklists', newChecklist);
      await fetchChecklists();
      setShowCreateForm(false);
      setNewChecklist({ name: '', output_type: '', items: [] });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteChecklist = async (id) => {
    if (!confirm('Delete this checklist?')) return;
    try {
      await api.del(`/lesson6/checklists/${id}`);
      await fetchChecklists();
      if (expandedChecklist?.id === id) setExpandedChecklist(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditAddItem = () => {
    if (!editItemText.trim() || !editingChecklist) return;
    const newItem = {
      text: editItemText.trim(),
      category: editItemCategory,
      is_critical: editItemCritical,
      order: editingChecklist.items.length,
    };
    setEditingChecklist({
      ...editingChecklist,
      items: [...editingChecklist.items, newItem],
    });
    setEditItemText('');
    setEditItemCritical(false);
  };

  const handleEditRemoveItem = (index) => {
    setEditingChecklist({
      ...editingChecklist,
      items: editingChecklist.items.filter((_, i) => i !== index),
    });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/lesson6/checklists/${editingChecklist.id}`, {
        name: editingChecklist.name,
        output_type: editingChecklist.output_type,
        items: editingChecklist.items,
      });
      await fetchChecklists();
      setEditingChecklist(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenTrustImport = async () => {
    if (showTrustImport) { setShowTrustImport(false); return; }
    setLoadingTrustTypes(true);
    try {
      const data = await api.get('/lesson5/output-types');
      setOutputTypes(data);
      setShowTrustImport(true);
    } catch (err) {
      setError('Could not load output types from Trust Matrix: ' + err.message);
    } finally {
      setLoadingTrustTypes(false);
    }
  };

  const handleImportOutputType = (outputType) => {
    setNewChecklist({
      ...newChecklist,
      name: `Verify: ${outputType.name}`,
      output_type: outputType.name,
    });
    setShowTrustImport(false);
    if (!showCreateForm) setShowCreateForm(true);
  };

  // Practice session handlers
  const startSession = async (checklistSummary) => {
    try {
      // Fetch full checklist with items
      const fullChecklist = await api.get(`/lesson6/checklists/${checklistSummary.id}`);

      const session = await api.post('/lesson6/sessions', {
        checklist_id: checklistSummary.id,
        output_description: 'Practice verification session',
        is_low_stakes: false,
        is_prototyping: false,
      });

      setActiveSession({ ...session, checklist: fullChecklist });
      setSessionTimer(0);
      setTimerRunning(true);
      setCheckedItems({});
      setIssuesFound({});
      setSessionNotes('');
      setActiveTab('iterate');  // Switch to iterate tab
    } catch (err) {
      setError(err.message);
    }
  };

  const completeSession = async (passed) => {
    if (!activeSession) return;
    setTimerRunning(false);
    try {
      const itemResults = activeSession.checklist.items.map((item) => ({
        item_id: item.id,
        was_checked: checkedItems[item.id] || false,
        caught_issue: issuesFound[item.id] || false,
        notes: '',
      }));

      await api.put(`/lesson6/sessions/${activeSession.id}/complete`, {
        item_results: itemResults,
        time_seconds: sessionTimer,
        overall_passed: passed,
        issues_found: sessionNotes,
        notes: '',
      });

      await fetchChecklists();
      await fetchStats();
      setActiveSession(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelSession = () => {
    setTimerRunning(false);
    setActiveSession(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render helpers
  const renderCategoryBadge = (category) => {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
    return (
      <span
        className="category-badge"
        style={{
          background: colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        {colors.icon} {colors.label}
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
          <h1>Verification Tools</h1>
          <ConnectionCallout lessonNumber={5} lessonTitle="Trust Matrix" message="Systematically verify the outputs your trust matrix flags for review." />
          <div className="lesson-header-problem-skill">
            <p><strong>The Problem:</strong> Without systematic verification, you either waste time over-checking outputs you could trust, or miss critical errors by under-checking outputs that needed scrutiny. Lesson 5 helped you calibrate <em>when</em> to verify -- now you build <em>how</em> to verify efficiently.</p>
            <p><strong>The Skill:</strong> Create reusable verification checklists tied to output types, so checking becomes quick and consistent rather than ad-hoc. Track which checks actually catch issues to refine your process over time. Define clear "skip criteria" so you can confidently trust appropriate outputs without guilt or risk.</p>
          </div>

        </div>
        <div className="lesson-header-right">
          <LessonNav lessonNumber={6} />
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-md">
          {error}
          <button className="btn btn-link ml-sm" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['concepts', 'checklists', 'iterate'].map((tab) => (
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
              Two practice areas to build the systematic verification habit:
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">Checklists Tab — Build Your Verification Checklists</h4>
                <p>Create a reusable checklist for each output type that needs review. Each checklist
                has specific items to check, organized by priority — critical items first, cosmetic
                items last. You can import output types directly from your Lesson 5 Trust Matrix.</p>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">Practice Tab — Run Timed Verification Sessions</h4>
                <p>Use your checklists in timed practice sessions. Track which items actually catch
                issues and which never flag anything. Over time, your checklists get leaner and
                more effective.</p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="⚖️ Ad-Hoc Review vs. Checklist Verification">
            <div className="learn-comparison">
              <div className="learn-comparison-grid">
                <div className="learn-comparison-col">
                  <h4 className="poor">Reviewing by Feel</h4>
                  <div className="learn-comparison-item poor">
                    <div className="learn-comparison-scenario">Reviewing an AI-Drafted Job Description</div>
                    <p>You read through the job description. It sounds good. The qualifications seem
                    reasonable. You forward it to HR for posting.</p>
                  </div>
                  <div className="learn-comparison-item poor">
                    <p>HR flags it a week later: the description includes "must have 10+ years of
                    experience" for a mid-level role, uses language that could be considered age
                    discriminatory, and lists a salary range that doesn't match the approved band.
                    You checked the tone but missed the compliance issues.</p>
                  </div>
                </div>
                <div className="learn-comparison-col">
                  <h4 className="good">Running a Verification Checklist</h4>
                  <div className="learn-comparison-item good">
                    <div className="learn-comparison-scenario">Same Task — With a Checklist</div>
                    <p>You run your "Job Description" checklist: (1) Does experience requirement
                    match the role level? (2) Any language that could be discriminatory? (3) Does
                    salary range match approved band? (4) Are required vs. preferred qualifications
                    clearly separated? (5) Does the role title match HR's approved list?</p>
                  </div>
                  <div className="learn-comparison-item good">
                    <p>You catch all three issues in 4 minutes. The checklist didn't require expertise
                    in employment law — just a specific list of things to look for.</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="✅ What Makes a Good Verification Checklist">
            <p className="text-secondary mb-md">
              Not all checklists are equally useful. Here's what separates one that actually catches
              problems from one that just makes you feel like you checked.
            </p>

            <div className="learn-patterns-grid">
              <div className="learn-pattern-card">
                <h4 className="color-accent-red">1. Critical Items Come First</h4>
                <p>If you only have 60 seconds, you should still catch the most important issues.
                Put factual accuracy, compliance, and costly mistakes at the top. Formatting and
                style go at the bottom.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  For a client email: (1) Are all dollar amounts correct? (2) Are dates and
                  deadlines accurate? (3) Is the client's name and company spelled right?
                  ... then later: (5) Is the tone appropriately formal?
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-blue">2. Each Item Checks One Specific Thing</h4>
                <p>Vague items like "check for accuracy" don't work under time pressure. Specific
                items like "verify the quarterly revenue figure against the source spreadsheet"
                tell you exactly what to do.</p>
                <div className="learn-pattern-label avoid">Mistake</div>
                <div className="learn-example-bad">
                  "Make sure the numbers are right"
                </div>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  "Cross-check all financial figures against the approved budget spreadsheet"
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-green">3. Tailored to the Output Type</h4>
                <p>A checklist for a meeting summary needs different items than one for a project
                budget. Your Trust Matrix output types map directly to the checklists you need.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  <strong>Meeting Summary:</strong> Are action items attributed to the right people?
                  Are the dates of next steps correct?<br/>
                  <strong>Budget Estimate:</strong> Do line items add up to the total? Are hourly
                  rates current? Is tax calculated correctly?
                </div>
              </div>
              <div className="learn-pattern-card">
                <h4 className="color-accent-purple">4. Updated Based on What You Find</h4>
                <p>A good checklist evolves. If an item never catches anything after 20 uses, drop
                it. If you keep finding a new type of mistake, add an item for it.</p>
                <div className="learn-pattern-label better">Example</div>
                <div className="learn-example-good">
                  After three months, you notice AI consistently gets your company's founding year
                  wrong in "About Us" content. You add "Verify company history facts" to your
                  marketing content checklist.
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="🚫 Common Mistakes">
            <div className="learn-patterns-grid learn-patterns-grid-mb">
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Making one giant checklist for all AI output. A 30-item checklist is so
                overwhelming that you'll skip it when you're busy — which is exactly when you
                need it most.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Create separate 4-6 item checklists per output type. A focused checklist you
                  actually use beats a comprehensive one you skip.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Checking everything with equal effort. Spending the same time verifying an
                internal team update as you do a client-facing financial report wastes your most
                limited resource: attention.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Use your Lesson 5 trust levels to decide effort. High-trust outputs get a quick
                  scan. Low-trust outputs get the full checklist. Medium-trust outputs get the
                  critical items only.
                </div>
              </div>
              <div className="learn-pattern-card">
                <div className="learn-pattern-label avoid">Mistake</div>
                <p>Only checking whether the output "sounds right." AI is excellent at producing
                text that reads well — confident, well-structured, professional. That says nothing
                about whether the content is accurate.</p>
                <div className="learn-pattern-label better">Instead</div>
                <div className="learn-example-good">
                  Focus checklist items on verifiable facts: numbers, dates, names, policy references,
                  calculations. These are where AI makes mistakes that matter, regardless of how
                  polished the prose sounds.
                </div>
              </div>
            </div>
          </AccordionSection>

        </div>
      )}

      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <div className="checklists-section">
          <div className="section-header flex-between mb-md">
            <h2>Your Verification Checklists</h2>
            <div className="btn-group">
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                + New Checklist
              </button>
              {checklists.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="card mb-lg card-compact">
              <div className="flex-row items-center mb-sm">
                <h3 className="no-margin">Create New Checklist</h3>
                <ExamplesDropdown
                  endpoint="/lesson6/examples"
                  onSelect={(example) => {
                    setNewChecklist({
                      ...newChecklist,
                      name: example.name || '',
                      output_type: example.output_type || '',
                      items: example.items || [],
                    });
                  }}
                />
              </div>

              {/* Import from Trust Matrix */}
              <div className="mt-sm mb-sm">
                <button
                  className="btn btn-secondary flex-row items-center"
                  onClick={handleOpenTrustImport}
                  disabled={loadingTrustTypes}
                >
                  {loadingTrustTypes ? 'Loading...' : showTrustImport ? 'Hide Import' : 'Import from Trust Matrix'}
                </button>

                {showTrustImport && (
                  <div className="card trust-import-panel">
                    <h4>Select an Output Type</h4>
                    {outputTypes.length === 0 ? (
                      <div className="empty-state">
                        <p>No output types defined yet.</p>
                        <p className="empty-state-hint">
                          Go to <a href="/lesson/5" className="color-accent-blue">Lesson 5 — Trust Matrix</a> to define output types first.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-col gap-sm">
                        {outputTypes.map((ot) => (
                          <div
                            key={ot.id}
                            className="trust-import-item"
                            onClick={() => handleImportOutputType(ot)}
                          >
                            <div className="trust-import-item-header">
                              <strong>{ot.name}</strong>
                              <span className={`trust-level-badge trust-level-badge-${ot.trust_level}`}>
                                {TRUST_COLORS[ot.trust_level]?.icon} {TRUST_COLORS[ot.trust_level]?.label || ot.trust_level}
                              </span>
                            </div>
                            {ot.category && (
                              <div className="trust-import-item-category">
                                {ot.category}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-col gap-sm mt-sm">
                <input
                  type="text"
                  placeholder="Checklist name"
                  value={newChecklist.name}
                  onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                  className="input"
                />
                <select
                  value={newChecklist.output_type}
                  onChange={(e) => setNewChecklist({ ...newChecklist, output_type: e.target.value })}
                  className="input"
                >
                  <option value="">Select output type...</option>
                  {outputTypes.map((ot) => (
                    <option key={ot.id} value={ot.name}>{ot.name}</option>
                  ))}
                  <option value="Other">Other (custom)</option>
                </select>

                {/* Items list */}
                <div className="mt-sm">
                  <strong>Checklist Items:</strong>
                  {newChecklist.items.map((item, idx) => (
                    <div key={idx} className="checklist-form-item">
                      {item.is_critical && <span className="color-accent-red">*</span>}
                      <span className="flex-1">{item.text}</span>
                      {renderCategoryBadge(item.category)}
                      <button className="checklist-form-item-remove" onClick={() => handleRemoveItem(idx)}>x</button>
                    </div>
                  ))}
                </div>

                {/* Add item form */}
                <div className="checklist-add-item-row">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    className="input flex-1"
                  />
                  <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="input checklist-add-item-category">
                    <option value="critical">Critical</option>
                    <option value="common_failure">Common Failure</option>
                    <option value="edge_case">Edge Case</option>
                    <option value="domain_specific">Domain-Specific</option>
                    <option value="general">General</option>
                  </select>
                  <label className="checklist-add-item-critical">
                    <input type="checkbox" checked={newItemCritical} onChange={(e) => setNewItemCritical(e.target.checked)} />
                    Critical
                  </label>
                  <button className="btn btn-secondary" onClick={handleAddItem}>Add</button>
                </div>

                <div className="btn-group mt-sm">
                  <button className="btn btn-primary" onClick={handleCreateChecklist}>Create Checklist</button>
                  <button className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewChecklist({ name: '', output_type: '', items: [] }); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Checklist cards */}
          {checklists.length === 0 && !showCreateForm ? (
            <div className="empty-state">
              <h3>No checklists yet</h3>
              <p>Create verification checklists to efficiently validate AI outputs.</p>
              <p className="text-secondary mt-sm">
                Based on your Lesson 5 Trust Matrix, build checklists with critical checks,
                common failure points, and edge cases to consider.
              </p>
            </div>
          ) : (
            <div className="checklist-grid">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="card checklist-card"
                  onClick={() => setExpandedChecklist(expandedChecklist?.id === checklist.id ? null : checklist)}
                >
                  <div className="flex-between-start">
                    <div>
                      <h3 className="no-margin">{checklist.name}</h3>
                      <div className="checklist-card-output-type">
                        {checklist.output_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="checklist-card-count">{checklist.item_count}</div>
                      <div className="checklist-card-count-label">items</div>
                    </div>
                  </div>

                  <div className="checklist-card-footer">
                    <span className="color-accent-red">{checklist.critical_count} critical</span>
                    {checklist.has_skip_criteria && <span className="color-accent-green">skip criteria set</span>}
                  </div>

                  {expandedChecklist?.id === checklist.id && (
                    <div className="checklist-card-expanded" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-primary mr-sm"
                        onClick={() => startSession(checklist)}
                      >
                        Start Practice
                      </button>
                      <button
                        className="btn btn-secondary mr-sm"
                        onClick={async () => {
                          const full = await api.get(`/lesson6/checklists/${checklist.id}`);
                          setEditingChecklist(full);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteChecklist(checklist.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editingChecklist && (
            <div className="modal-overlay">
              <div className="modal-content modal-content-wide">
                <h3>Edit Checklist</h3>
                <div className="flex-col gap-sm mt-sm">
                  <input
                    type="text"
                    value={editingChecklist.name}
                    onChange={(e) => setEditingChecklist({ ...editingChecklist, name: e.target.value })}
                    className="input"
                  />
                  <select
                    value={editingChecklist.output_type}
                    onChange={(e) => setEditingChecklist({ ...editingChecklist, output_type: e.target.value })}
                    className="input"
                  >
                    {outputTypes.map((ot) => (
                      <option key={ot.id} value={ot.name}>{ot.name}</option>
                    ))}
                    <option value="Other">Other (custom)</option>
                  </select>

                  <div className="mt-sm">
                    <strong>Items:</strong>
                    {editingChecklist.items.map((item, idx) => (
                      <div key={idx} className="checklist-form-item">
                        {item.is_critical && <span className="color-accent-red">*</span>}
                        <span className="flex-1">{item.text}</span>
                        {renderCategoryBadge(item.category)}
                        <button className="checklist-form-item-remove" onClick={() => handleEditRemoveItem(idx)}>x</button>
                      </div>
                    ))}
                  </div>

                  <div className="checklist-add-item-row">
                    <input
                      type="text"
                      placeholder="Add item..."
                      value={editItemText}
                      onChange={(e) => setEditItemText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditAddItem()}
                      className="input flex-1"
                    />
                    <select value={editItemCategory} onChange={(e) => setEditItemCategory(e.target.value)} className="input checklist-add-item-category">
                      <option value="critical">Critical</option>
                      <option value="common_failure">Common Failure</option>
                      <option value="edge_case">Edge Case</option>
                      <option value="domain_specific">Domain-Specific</option>
                      <option value="general">General</option>
                    </select>
                    <label className="checklist-add-item-critical">
                      <input type="checkbox" checked={editItemCritical} onChange={(e) => setEditItemCritical(e.target.checked)} />
                      Crit
                    </label>
                    <button className="btn btn-secondary" onClick={handleEditAddItem}>Add</button>
                  </div>

                  <div className="btn-group mt-md">
                    <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
                    <button className="btn btn-secondary" onClick={() => setEditingChecklist(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'iterate' && (
        <div className="practice-section">
          {activeSession ? (
            <div className="active-session">
              <div className="card card-padded">
                <div className="session-header">
                  <div>
                    <h2 className="no-margin">{activeSession.checklist.name}</h2>
                    <div className="text-secondary">{activeSession.checklist.output_type}</div>
                  </div>
                  <div className="session-timer">
                    <div className={`session-timer-value ${timerRunning ? 'running' : 'stopped'}`}>
                      {formatTime(sessionTimer)}
                    </div>
                    <div className="session-timer-label">Elapsed Time</div>
                  </div>
                </div>

                <div className="mb-lg">
                  <h3>Verification Checklist</h3>
                  {(activeSession.checklist.items || []).map((item) => (
                    <div
                      key={item.id}
                      className={`session-checklist-item ${checkedItems[item.id] ? 'checked' : ''} ${item.is_critical ? 'critical' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.id] || false}
                        onChange={(e) => setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })}
                        className="session-checklist-item-checkbox"
                      />
                      <div className="flex-1">
                        <div className="flex-row items-center gap-sm">
                          {item.is_critical && <span className="color-accent-red text-bold">*</span>}
                          <span>{item.text}</span>
                        </div>
                      </div>
                      {renderCategoryBadge(item.category)}
                      <label className={`session-issue-label ${issuesFound[item.id] ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={issuesFound[item.id] || false}
                          onChange={(e) => setIssuesFound({ ...issuesFound, [item.id]: e.target.checked })}
                        />
                        Issue Found
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mb-lg">
                  <label>Notes (issues found, observations):</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="input w-full mt-sm"
                    rows={3}
                  />
                </div>

                <div className="btn-group">
                  <button className="btn btn-primary" onClick={() => completeSession(true)}>
                    Complete - Passed
                  </button>
                  <button className="btn btn-danger" onClick={() => completeSession(false)}>
                    Complete - Issues Found
                  </button>
                  <button className="btn btn-secondary" onClick={cancelSession}>
                    Cancel Session
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2>Verification Practice</h2>
              <p className="text-secondary mb-lg">
                Select a checklist to start a timed verification practice session.
                Track which items catch issues to refine your checklists over time.
              </p>

              {checklists.length === 0 ? (
                <div>
                  <p className="dashboard-section-description" style={{ marginBottom: '20px' }}>
                    Create checklists in the Checklists tab, then practice here. Each verification session tracks:
                  </p>
                  <div className="analysis-grid">
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Checklist Selection</h3>
                      <div className="field">
                        <div className="field-label">Output Type</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Each checklist is tied to an output type (e.g., code, marketing copy, data analysis) with items tailored to what matters for that specific kind of output.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Critical Items</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Items flagged as critical — must-check items that catch the highest-impact errors for that output type.</div>
                      </div>
                    </div>
                    <div className="analysis-card" style={{ opacity: 0.7 }}>
                      <h3>Timed Practice</h3>
                      <div className="field">
                        <div className="field-label">Session Timer</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>A running timer that tracks how long verification takes, helping you find the right balance between thoroughness and efficiency.</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Issue Tracking</div>
                        <div className="field-value" style={{ color: 'var(--text-primary)' }}>Mark which checklist items actually caught a real issue. Over time, this reveals which checks earn their keep and which can be streamlined.</div>
                      </div>
                    </div>
                  </div>
                  <div className="learn-next-step" style={{ marginTop: '24px' }}>
                    <h3>Create Your First Checklist</h3>
                    <p>Go to the Checklists tab to build a verification checklist for an output type you work with regularly.</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('checklists')}>Go to Checklists</button>
                  </div>
                </div>
              ) : (
                <div className="checklist-grid">
                  {checklists.map((checklist) => (
                    <div key={checklist.id} className="card card-compact">
                      <h3 className="no-margin">{checklist.name}</h3>
                      <div className="checklist-card-output-type mb-sm">{checklist.output_type}</div>
                      <div className="flex-between">
                        <span>{checklist.item_count} items ({checklist.critical_count} critical)</span>
                        <button className="btn btn-primary" onClick={() => startSession(checklist)}>
                          Start
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
