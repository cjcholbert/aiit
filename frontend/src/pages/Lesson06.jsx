import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// Category badge colors
const CATEGORY_COLORS = {
  critical: { bg: 'var(--error-bg)', border: 'var(--border-color)', text: 'var(--accent-red)', icon: '🚨', label: 'Critical' },
  common_failure: { bg: 'var(--warning-bg)', border: 'var(--border-color)', text: 'var(--accent-yellow)', icon: '⚠️', label: 'Common Failure' },
  edge_case: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--accent-blue)', icon: '🔍', label: 'Edge Case' },
  domain_specific: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--accent-purple)', icon: '🎯', label: 'Domain Specific' },
  general: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--text-muted)', icon: '📋', label: 'General' },
};

// Trust level colors (from Module 3)
const TRUST_COLORS = {
  high: { color: 'var(--accent-green)', icon: '✅', label: 'High Trust' },
  medium: { color: 'var(--accent-yellow)', icon: '⚠️', label: 'Medium Trust' },
  low: { color: 'var(--accent-red)', icon: '🚨', label: 'Low Trust' },
};

export default function Lesson06() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('checklists');
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
      const data = await api.get('/week3/output-types');
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
      setActiveTab('practice');  // Switch to practice tab
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
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          border: '1px solid',
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
      <header className="page-header">
        <h1>Verification Tools</h1>
        <p className="page-description">
          <strong>The Problem:</strong> Without systematic verification, you either waste time over-checking
          outputs you could trust, or miss critical errors by under-checking outputs that needed scrutiny.
          Module 3 helped you calibrate <em>when</em> to verify—this week you build <em>how</em> to verify efficiently.
        </p>
        <p className="page-description" style={{ marginTop: '8px' }}>
          <strong>The Skill:</strong> Create reusable verification checklists tied to output types, so checking
          becomes quick and consistent rather than ad-hoc. Track which checks actually catch issues to refine
          your process over time. Define clear "skip criteria" so you can confidently trust appropriate outputs
          without guilt or risk.
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
        {['checklists', 'practice', 'stats'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <div className="checklists-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Your Verification Checklists</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {checklists.length === 0 && (
                <button className="btn btn-secondary" onClick={handleSeedDefaults}>
                  Start with Defaults
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                + New Checklist
              </button>
              {checklists.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAll} style={{ background: 'var(--accent-red)' }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
              <h3>Create New Checklist</h3>

              {/* Import from Trust Matrix */}
              <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenTrustImport}
                  disabled={loadingTrustTypes}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loadingTrustTypes ? 'Loading...' : showTrustImport ? 'Hide Import' : 'Import from Trust Matrix'}
                </button>

                {showTrustImport && (
                  <div className="card" style={{ padding: '16px', marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 12px' }}>Select an Output Type</h4>
                    {outputTypes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        <p>No output types defined yet.</p>
                        <p style={{ fontSize: '0.85rem' }}>
                          Go to <a href="/lesson/5" style={{ color: 'var(--accent-blue)' }}>Lesson 5 — Trust Matrix</a> to define output types first.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {outputTypes.map((ot) => (
                          <div
                            key={ot.id}
                            onClick={() => handleImportOutputType(ot)}
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
                              <strong style={{ color: 'var(--text-primary)' }}>{ot.name}</strong>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: ot.trust_level === 'high' ? 'var(--success-bg)' : ot.trust_level === 'low' ? 'var(--error-bg)' : 'var(--warning-bg)',
                                color: ot.trust_level === 'high' ? 'var(--accent-green)' : ot.trust_level === 'low' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                              }}>
                                {TRUST_COLORS[ot.trust_level]?.icon} {TRUST_COLORS[ot.trust_level]?.label || ot.trust_level}
                              </span>
                            </div>
                            {ot.category && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
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
                <div style={{ marginTop: '12px' }}>
                  <strong>Checklist Items:</strong>
                  {newChecklist.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {item.is_critical && <span style={{ color: 'var(--accent-red)' }}>*</span>}
                      <span style={{ flex: 1 }}>{item.text}</span>
                      {renderCategoryBadge(item.category)}
                      <button onClick={() => handleRemoveItem(idx)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
                    </div>
                  ))}
                </div>

                {/* Add item form */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="input" style={{ width: '150px' }}>
                    <option value="critical">Critical</option>
                    <option value="common_failure">Common Failure</option>
                    <option value="edge_case">Edge Case</option>
                    <option value="domain_specific">Domain-Specific</option>
                    <option value="general">General</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={newItemCritical} onChange={(e) => setNewItemCritical(e.target.checked)} />
                    Critical
                  </label>
                  <button className="btn btn-secondary" onClick={handleAddItem}>Add</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn btn-primary" onClick={handleCreateChecklist}>Create Checklist</button>
                  <button className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewChecklist({ name: '', output_type: '', items: [] }); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Checklist cards */}
          {checklists.length === 0 && !showCreateForm ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No checklists yet</h3>
              <p>Create verification checklists to efficiently validate AI outputs.</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Based on your Module 3 Trust Matrix, build checklists with critical checks,
                common failure points, and edge cases to consider.
              </p>
            </div>
          ) : (
            <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="card"
                  style={{ padding: '16px', cursor: 'pointer' }}
                  onClick={() => setExpandedChecklist(expandedChecklist?.id === checklist.id ? null : checklist)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{checklist.name}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                        {checklist.output_type}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{checklist.item_count}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>items</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--accent-red)' }}>{checklist.critical_count} critical</span>
                    {checklist.has_skip_criteria && <span style={{ color: 'var(--accent-green)' }}>skip criteria set</span>}
                  </div>

                  {expandedChecklist?.id === checklist.id && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: '8px' }}
                        onClick={() => startSession(checklist)}
                      >
                        Start Practice
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '8px' }}
                        onClick={async () => {
                          const full = await api.get(`/lesson6/checklists/${checklist.id}`);
                          setEditingChecklist(full);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ background: 'var(--accent-red)' }}
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
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card" style={{ width: '600px', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
                <h3>Edit Checklist</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
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

                  <div style={{ marginTop: '12px' }}>
                    <strong>Items:</strong>
                    {editingChecklist.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                        {item.is_critical && <span style={{ color: 'var(--accent-red)' }}>*</span>}
                        <span style={{ flex: 1 }}>{item.text}</span>
                        {renderCategoryBadge(item.category)}
                        <button onClick={() => handleEditRemoveItem(idx)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Add item..."
                      value={editItemText}
                      onChange={(e) => setEditItemText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditAddItem()}
                      className="input"
                      style={{ flex: 1 }}
                    />
                    <select value={editItemCategory} onChange={(e) => setEditItemCategory(e.target.value)} className="input" style={{ width: '130px' }}>
                      <option value="critical">Critical</option>
                      <option value="common_failure">Common Failure</option>
                      <option value="edge_case">Edge Case</option>
                      <option value="domain_specific">Domain-Specific</option>
                      <option value="general">General</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={editItemCritical} onChange={(e) => setEditItemCritical(e.target.checked)} />
                      Crit
                    </label>
                    <button className="btn btn-secondary" onClick={handleEditAddItem}>Add</button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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
      {activeTab === 'practice' && (
        <div className="practice-section">
          {activeSession ? (
            <div className="active-session">
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{activeSession.checklist.name}</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>{activeSession.checklist.output_type}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: timerRunning ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {formatTime(sessionTimer)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Elapsed Time</div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3>Verification Checklist</h3>
                  {(activeSession.checklist.items || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        marginTop: '8px',
                        background: checkedItems[item.id] ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: item.is_critical ? '1px solid var(--accent-red)' : '1px solid transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.id] || false}
                        onChange={(e) => setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.is_critical && <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>*</span>}
                          <span>{item.text}</span>
                        </div>
                      </div>
                      {renderCategoryBadge(item.category)}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: issuesFound[item.id] ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
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

                <div style={{ marginBottom: '24px' }}>
                  <label>Notes (issues found, observations):</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="input"
                    rows={3}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" style={{ background: 'var(--accent-green)' }} onClick={() => completeSession(true)}>
                    Complete - Passed
                  </button>
                  <button className="btn btn-primary" style={{ background: 'var(--accent-red)' }} onClick={() => completeSession(false)}>
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
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Select a checklist to start a timed verification practice session.
                Track which items catch issues to refine your checklists over time.
              </p>

              {checklists.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h3>No checklists available</h3>
                  <p>Create checklists in the Checklists tab first.</p>
                </div>
              ) : (
                <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {checklists.map((checklist) => (
                    <div key={checklist.id} className="card" style={{ padding: '16px' }}>
                      <h3 style={{ margin: 0 }}>{checklist.name}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>{checklist.output_type}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2>Verification Statistics</h2>

          {stats ? (
            <div>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.total_checklists}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Total Checklists</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.total_sessions}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Practice Sessions</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{formatTime(Math.round(stats.avg_verification_time))}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Avg Verification Time</div>
                </div>
              </div>

              {stats.most_effective_items.length > 0 && (
                <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                  <h3>Most Effective Checks</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>Items that catch issues most often</p>
                  {stats.most_effective_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span>{item.text}</span>
                      <span style={{ color: 'var(--accent-green)' }}>{item.effectiveness}% effective</span>
                    </div>
                  ))}
                </div>
              )}

              {stats.least_effective_items.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h3>Consider Removing</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>Items checked 3+ times but never caught an issue</p>
                  {stats.least_effective_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span>{item.text}</span>
                      <span style={{ color: 'var(--accent-red)' }}>0% effective ({item.times_checked} checks)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h3>No statistics yet</h3>
              <p>Complete some practice sessions to see verification statistics.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
