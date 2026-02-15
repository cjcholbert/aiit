import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

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

    // Challenge
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [challengeResponses, setChallengeResponses] = useState({
        context_assembly: '',
        quality_judgment: '',
        task_decomposition: '',
        iterative_refinement: '',
        workflow_integration: '',
        frontier_recognition: ''
    });
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);

    useEffect(() => {
        fetchSections();
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'card') fetchPrimaryCard();
        if (activeTab === 'challenge') fetchScenarios();
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

    const fetchScenarios = async () => {
        try {
            const data = await api.get('/lesson12/challenges/scenarios');
            setScenarios(data);
        } catch (err) {
            console.error('Failed to fetch scenarios:', err);
        }
    };

    const selectScenario = (scenario) => {
        setSelectedScenario(scenario);
        setChallengeResponses({
            context_assembly: '',
            quality_judgment: '',
            task_decomposition: '',
            iterative_refinement: '',
            workflow_integration: '',
            frontier_recognition: ''
        });
        setEvaluation(null);
    };

    const handleEvaluate = async () => {
        if (!selectedScenario) return;
        setEvaluating(true);
        setError('');

        try {
            const data = await api.post('/lesson12/challenges/evaluate', {
                scenario_id: selectedScenario.id,
                responses: challengeResponses
            });
            setEvaluation(data);
        } catch (err) {
            setError(err.message || 'Failed to evaluate responses');
        } finally {
            setEvaluating(false);
        }
    };

    const allResponsesFilled = Object.values(challengeResponses).every(v => v.trim().length > 0);

    const CONCEPT_LABELS = {
        context_assembly: 'Context Assembly',
        quality_judgment: 'Quality Judgment',
        task_decomposition: 'Task Decomposition',
        iterative_refinement: 'Iterative Refinement',
        workflow_integration: 'Workflow Integration',
        frontier_recognition: 'Frontier Recognition'
    };

    const getScoreClass = (score) => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
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
                    Generate your personal AI collaboration quick reference card from your learnings across all lessons.
                </p>
                <SelfAssessmentChecklist lessonNumber={12} criteria={LESSON_CRITERIA[12]} />
            </div>

            {error && <div className="error-message">{error}</div>}

            <StatsPanel lessonId={12} stats={stats ? [
                { label: 'Complete', value: `${stats.completion_percentage}%`, color: 'var(--accent-purple)' },
                { label: 'Active Lessons', value: `${stats.weeks_with_data}/12`, color: 'var(--accent-green)' },
                { label: 'Items Created', value: stats.total_items_created, color: 'var(--accent-yellow)' },
                { label: 'Most Active', value: stats.most_active_week || 'N/A', color: 'var(--accent-purple)' },
            ] : []} />

            <div className="tabs">
                <button className={`tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>Learn</button>
                <button className={`tab ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>My Card</button>
                <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>Challenge</button>
            </div>

            {activeTab === 'learn' && (
                <div className="card">
                    <h2>Your Personal AI Reference Card</h2>
                    <p>The reference card is the culmination of your 12-lesson curriculum, capturing your personalized AI collaboration practices.</p>

                    <h3 style={{ marginTop: '1.5rem' }}>What's Included</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        {Object.entries(sections).map(([key, section]) => (
                            <div key={key} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <strong>{section.name}</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{section.description}</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source: {section.source}</p>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ marginTop: '1.5rem' }}>How to Use Your Card</h3>
                    <ol>
                        <li><strong>Generate from data:</strong> Click "Generate from My Data" to pull insights from all your previous lessons</li>
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
                                    <div key={i} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
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

            {activeTab === 'challenge' && (
                <div className="l12-challenge">
                    {!selectedScenario ? (
                        <div>
                            <div className="card">
                                <h2>Integration Challenge</h2>
                                <p>Put all six AI collaboration concepts to the test. Choose a realistic workplace scenario and describe how you'd apply each concept. AI will evaluate your responses for completeness and quality.</p>
                            </div>
                            <div className="l12-scenario-grid">
                                {scenarios.map(scenario => (
                                    <div key={scenario.id} className="card l12-scenario-card" onClick={() => selectScenario(scenario)}>
                                        <h3>{scenario.title}</h3>
                                        <p className="l12-scenario-desc">{scenario.description}</p>
                                        <button className="btn btn-primary" style={{ marginTop: 'auto' }}>Start Challenge</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="card">
                                <div className="l12-challenge-header">
                                    <div>
                                        <h2>{selectedScenario.title}</h2>
                                        <p className="l12-scenario-desc">{selectedScenario.description}</p>
                                    </div>
                                    <button className="btn btn-secondary" onClick={() => { setSelectedScenario(null); setEvaluation(null); }}>
                                        Back to Scenarios
                                    </button>
                                </div>
                            </div>

                            <div className="l12-concept-responses">
                                {Object.entries(CONCEPT_LABELS).map(([key, label]) => (
                                    <div key={key} className="card l12-concept-card">
                                        <h3>{label}</h3>
                                        {selectedScenario.hints && selectedScenario.hints[key] && (
                                            <p className="l12-concept-hint">{selectedScenario.hints[key]}</p>
                                        )}
                                        <textarea
                                            className="l12-concept-textarea"
                                            value={challengeResponses[key]}
                                            onChange={(e) => setChallengeResponses({ ...challengeResponses, [key]: e.target.value })}
                                            placeholder={`Describe how you'd apply ${label} to this scenario...`}
                                            rows={4}
                                        />
                                        {evaluation && evaluation.concept_scores && (() => {
                                            const cs = evaluation.concept_scores.find(c => c.concept === key);
                                            if (!cs) return null;
                                            return (
                                                <div className="l12-concept-eval">
                                                    <div className="l12-concept-eval-header">
                                                        <span className={`l12-score-badge l12-score-${getScoreClass(cs.score)}`}>{cs.score}/100</span>
                                                    </div>
                                                    {cs.strengths && cs.strengths.length > 0 && (
                                                        <div className="l12-eval-section l12-eval-strengths">
                                                            <strong>Strengths:</strong>
                                                            <ul>{cs.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                                        </div>
                                                    )}
                                                    {cs.gaps && cs.gaps.length > 0 && (
                                                        <div className="l12-eval-section l12-eval-gaps">
                                                            <strong>Gaps:</strong>
                                                            <ul>{cs.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                                                        </div>
                                                    )}
                                                    {cs.suggestion && (
                                                        <div className="l12-eval-section l12-eval-suggestion">
                                                            <strong>Suggestion:</strong> {cs.suggestion}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>

                            <div className="card l12-evaluate-bar">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleEvaluate}
                                    disabled={!allResponsesFilled || evaluating}
                                >
                                    {evaluating ? 'Evaluating...' : 'Evaluate My Responses'}
                                </button>
                                {!allResponsesFilled && (
                                    <span className="l12-eval-hint">Complete all six concept responses to enable evaluation</span>
                                )}
                            </div>

                            {evaluation && (
                                <div className="l12-evaluation-results">
                                    <div className="card l12-overall-result">
                                        <div className="l12-overall-header">
                                            <h2>Evaluation Results</h2>
                                            <span className={`l12-overall-score l12-score-${getScoreClass(evaluation.overall_score)}`}>
                                                {evaluation.overall_score}/100
                                            </span>
                                        </div>
                                        <p className="l12-overall-feedback">{evaluation.overall_feedback}</p>
                                        <div className="l12-overall-meta">
                                            {evaluation.strongest_concept && (
                                                <div className="l12-meta-item l12-meta-strength">
                                                    <strong>Strongest:</strong> {evaluation.strongest_concept}
                                                </div>
                                            )}
                                            {evaluation.growth_area && (
                                                <div className="l12-meta-item l12-meta-growth">
                                                    <strong>Growth Area:</strong> {evaluation.growth_area}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {evaluation.connections_found && evaluation.connections_found.length > 0 && (
                                        <div className="card">
                                            <h3>Cross-Concept Connections</h3>
                                            <ul className="l12-connections-list">
                                                {evaluation.connections_found.map((c, i) => (
                                                    <li key={i}>{c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {evaluation.next_steps && evaluation.next_steps.length > 0 && (
                                        <div className="card">
                                            <h3>Next Steps</h3>
                                            <ul className="l12-next-steps">
                                                {evaluation.next_steps.map((step, i) => (
                                                    <li key={i}>{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <LessonNav currentLesson={12} />
        </div>
    );
}
