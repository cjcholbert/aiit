import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Icon mappings for reference card sections
const SECTION_ICONS = {
  golden_rules: '📜',
  quick_prompts: '⚡',
  trust_calibration: '🎯',
  context_checklist: '✅',
  iteration_framework: '🔄',
  frontier_notes: '🗺️',
  default: '📋'
};

export default function Lesson12() {
    const api = useApi();
    const { getAuthHeaders } = useAuth();
    const [activeTab, setActiveTab] = useState('learn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [card, setCard] = useState(null);
    const [stats, setStats] = useState(null);
    const [sections, setSections] = useState({});

    // Forms
    const [newRule, setNewRule] = useState('');
    const [newPrompt, setNewPrompt] = useState({ trigger: '', prompt: '' });
    const [exportFormat, setExportFormat] = useState('markdown');

    useEffect(() => {
        fetchSections();
        if (activeTab === 'card') fetchPrimaryCard();
        if (activeTab === 'progress') fetchStats();
    }, [activeTab]);

    const fetchSections = async () => {
        try {
            const data = await api.get('/lesson12/sections');
            setSections(data);
        } catch (err) {
            console.error('Failed to fetch sections:', err);
        }
    };

    const fetchPrimaryCard = async () => {
        setLoading(true);
        try {
            const data = await api.get('/lesson12/cards/primary');
            setCard(data);
        } catch (err) {
            setError('Failed to fetch reference card');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.get('/lesson12/stats');
            setStats(data);
        } catch (err) {
            setError('Failed to fetch stats');
        }
    };

    const generateCard = async () => {
        if (!card) return;
        setLoading(true);
        setError('');

        try {
            const data = await api.post(`/lesson12/cards/${card.id}/generate`, {
                include_templates: true,
                include_trust: true,
                include_verification: true,
                include_delegation: true,
                include_iteration: true,
                include_feedback: true,
                include_workflows: true,
                include_context: true,
                include_frontier: true
            });
            setCard(data);
        } catch (err) {
            setError(err.message || 'Failed to generate card content');
        } finally {
            setLoading(false);
        }
    };

    const updateCard = async (updates) => {
        if (!card) return;

        try {
            const data = await api.put(`/lesson12/cards/${card.id}`, updates);
            setCard(data);
        } catch (err) {
            setError('Failed to update card');
        }
    };

    const addPersonalRule = () => {
        if (newRule.trim() && card) {
            const rules = [...(card.personal_rules || []), newRule.trim()];
            updateCard({ personal_rules: rules });
            setNewRule('');
        }
    };

    const removePersonalRule = (index) => {
        if (card) {
            const rules = card.personal_rules.filter((_, i) => i !== index);
            updateCard({ personal_rules: rules });
        }
    };

    const addQuickPrompt = () => {
        if (newPrompt.trigger.trim() && newPrompt.prompt.trim() && card) {
            const prompts = [...(card.quick_prompts || []), { ...newPrompt }];
            updateCard({ quick_prompts: prompts });
            setNewPrompt({ trigger: '', prompt: '' });
        }
    };

    const removeQuickPrompt = (index) => {
        if (card) {
            const prompts = card.quick_prompts.filter((_, i) => i !== index);
            updateCard({ quick_prompts: prompts });
        }
    };

    const exportCard = async () => {
        if (!card) return;

        try {
            // Export returns text content, not JSON, so we use fetch directly
            const res = await fetch(`${API_BASE}/lesson12/cards/${card.id}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ format: exportFormat })
            });

            if (res.ok) {
                const content = await res.text();
                const blob = new Blob([content], { type: exportFormat === 'html' ? 'text/html' : 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reference-card.${exportFormat === 'html' ? 'html' : 'md'}`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                setError('Failed to export card');
            }
        } catch (err) {
            setError('Failed to export card');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'badge-green';
            case 'in_progress': return 'badge-yellow';
            case 'not_started': return '';
            default: return '';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Reference Card</h1>
                <p className="page-description">
                    Generate your personal AI collaboration quick reference card from your learnings across all weeks.
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="tabs">
                <button className={`tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>Learn</button>
                <button className={`tab ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>My Card</button>
                <button className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>Progress</button>
            </div>

            {activeTab === 'learn' && (
                <div className="card">
                    <h2>Your Personal AI Reference Card</h2>
                    <p>The reference card is the culmination of your 12-week journey, capturing your personalized AI collaboration practices.</p>

                    <h3 style={{ marginTop: '1.5rem' }}>What's Included</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        {Object.entries(sections).map(([key, section]) => (
                            <div key={key} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                <strong>{section.name}</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{section.description}</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source: {section.source}</p>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ marginTop: '1.5rem' }}>How to Use Your Card</h3>
                    <ol>
                        <li><strong>Generate from data:</strong> Click "Generate from My Data" to pull insights from all your previous weeks</li>
                        <li><strong>Add personal rules:</strong> Document your own AI collaboration principles</li>
                        <li><strong>Save quick prompts:</strong> Store frequently-used prompt patterns</li>
                        <li><strong>Export and print:</strong> Download as Markdown or HTML for easy reference</li>
                    </ol>

                    <h3 style={{ marginTop: '1.5rem' }}>Keep It Updated</h3>
                    <p>Your reference card should evolve as you gain more experience. Regenerate periodically to capture new insights from your ongoing work.</p>
                </div>
            )}

            {activeTab === 'card' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>{card?.name || 'My AI Reference Card'}</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={generateCard} disabled={loading}>
                                    {loading ? 'Generating...' : 'Generate from My Data'}
                                </button>
                                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                    <option value="markdown">Markdown</option>
                                    <option value="html">HTML</option>
                                </select>
                                <button className="btn btn-secondary" onClick={exportCard}>
                                    Export
                                </button>
                            </div>
                        </div>
                        {card?.last_generated && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Last generated: {new Date(card.last_generated).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Trust Zones */}
                    {card?.trust_zones?.length > 0 && (
                        <div className="card">
                            <h3>Trust Zones</h3>
                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                                {card.trust_zones.map((zone, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                        <strong style={{ minWidth: '150px' }}>{zone.type}</strong>
                                        <span className={`badge ${zone.level === 'high' ? 'badge-green' : zone.level === 'low' ? 'badge-red' : 'badge-yellow'}`}>
                                            {zone.level}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{zone.verify}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Templates */}
                    {card?.top_templates?.length > 0 && (
                        <div className="card">
                            <h3>Top Templates</h3>
                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {card.top_templates.map((t, i) => (
                                    <div key={i} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{t.name}</strong>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Used {t.usage_count}x</span>
                                        </div>
                                        <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            {t.snippet}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Frontier Map */}
                    {card?.frontier_map && Object.keys(card.frontier_map).length > 0 && (
                        <div className="card">
                            <h3>Frontier Map</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                {['reliable', 'mixed', 'unreliable'].map(level => (
                                    <div key={level} style={{
                                        padding: '1rem',
                                        background: level === 'reliable' ? 'var(--success-bg)' : level === 'unreliable' ? 'var(--error-bg)' : 'var(--warning-bg)',
                                        borderRadius: '8px'
                                    }}>
                                        <strong style={{ textTransform: 'capitalize' }}>{level}</strong>
                                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                                            {(card.frontier_map[level] || []).map((item, i) => (
                                                <li key={i} style={{ fontSize: '0.9rem' }}>{item}</li>
                                            ))}
                                            {(!card.frontier_map[level] || card.frontier_map[level].length === 0) && (
                                                <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No items yet</li>
                                            )}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Personal Rules */}
                    <div className="card">
                        <h3>Personal Rules</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <input
                                type="text"
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="Add a personal AI collaboration rule"
                                onKeyPress={(e) => e.key === 'Enter' && addPersonalRule()}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={addPersonalRule}>Add Rule</button>
                        </div>
                        {card?.personal_rules?.length > 0 ? (
                            <ul style={{ marginTop: '1rem' }}>
                                {card.personal_rules.map((rule, i) => (
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                        <span>{rule}</span>
                                        <button className="btn btn-secondary" onClick={() => removePersonalRule(i)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No personal rules yet. Add rules that work for you.</p>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    <div className="card">
                        <h3>Quick Prompts</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto', gap: '0.5rem', marginTop: '1rem' }}>
                            <input
                                type="text"
                                value={newPrompt.trigger}
                                onChange={(e) => setNewPrompt({ ...newPrompt, trigger: e.target.value })}
                                placeholder="Trigger (e.g., review)"
                            />
                            <input
                                type="text"
                                value={newPrompt.prompt}
                                onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                                placeholder="Prompt template"
                            />
                            <button className="btn btn-primary" onClick={addQuickPrompt}>Add</button>
                        </div>
                        {card?.quick_prompts?.length > 0 ? (
                            <div style={{ marginTop: '1rem' }}>
                                {card.quick_prompts.map((p, i) => (
                                    <div key={i} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>/{p.trigger}</strong>
                                            <button className="btn btn-secondary" onClick={() => removeQuickPrompt(i)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                                Remove
                                            </button>
                                        </div>
                                        <code style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {p.prompt}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No quick prompts saved yet.</p>
                        )}
                    </div>

                    {/* Feedback Principles */}
                    {card?.feedback_principles?.length > 0 && (
                        <div className="card">
                            <h3>Feedback Principles</h3>
                            <ul style={{ marginTop: '1rem' }}>
                                {card.feedback_principles.map((p, i) => (
                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Workflow Highlights */}
                    {card?.workflow_highlights?.length > 0 && (
                        <div className="card">
                            <h3>Workflow Highlights</h3>
                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                                {card.workflow_highlights.map((w, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                        <span>{w.name}</span>
                                        <span className="badge badge-green">{w.time_saved}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'progress' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {stats ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.completion_percentage}%</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Curriculum Complete</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.weeks_with_data}/12</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Weeks with Activity</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.total_items_created}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Items Created</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.most_active_week || 'N/A'}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Most Active Week</div>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Week-by-Week Progress</h2>
                                <div style={{ marginTop: '1rem' }}>
                                    {stats.curriculum_progress.map((week) => (
                                        <div key={week.week} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '80px 1fr 100px 80px',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            borderBottom: '1px solid #e5e7eb'
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>Week {week.week}</span>
                                            <span>{week.name}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{week.items_created} items</span>
                                            <span className={`badge ${getStatusBadge(week.status)}`}>
                                                {week.status === 'not_started' ? 'Not started' : week.status === 'in_progress' ? 'In progress' : 'Completed'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card">
                                <h2>Completion Progress</h2>
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ height: '24px', background: 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${stats.completion_percentage}%`,
                                            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                            borderRadius: '12px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <span>0%</span>
                                        <span>{stats.completion_percentage}% Complete</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {stats.completion_percentage < 100 && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <strong>Next Steps</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--accent-blue)' }}>
                                            Complete more weeks to unlock a richer reference card. Each week adds new insights!
                                        </p>
                                    </div>
                                )}

                                {stats.completion_percentage === 100 && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--success-bg)', borderRadius: '8px' }}>
                                        <strong>Congratulations!</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--accent-green)' }}>
                                            You've completed the entire 12-week curriculum. Your reference card now reflects your full AI collaboration journey!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <p style={{ color: 'var(--text-muted)' }}>Loading progress...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
