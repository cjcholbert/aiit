import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../auth/AuthContext';
import ConnectionCallout from '../components/ConnectionCallout';
import { useLessonStats } from '../contexts/LessonStatsContext';
import { AccordionSection } from '../components/Accordion';
import LessonNav from '../components/LessonNav';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
    const { setStats: setSidebarStats } = useLessonStats();
    const [activeTab, setActiveTab] = useState('concepts');
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

    useEffect(() => {
        setSidebarStats(stats ? [
            { label: 'Complete', value: `${stats.completion_percentage}%`, color: 'var(--accent-purple)' },
            { label: 'Active Lessons', value: `${stats.weeks_with_data}/12`, color: 'var(--accent-green)' },
            { label: 'Items Created', value: stats.total_items_created, color: 'var(--accent-yellow)' },
            { label: 'Most Active', value: stats.most_active_week || 'N/A', color: 'var(--accent-purple)' },
        ] : null);
        return () => setSidebarStats(null);
    }, [stats, setSidebarStats]);

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
            <div className="lesson-header">
                <div className="lesson-header-left">
                    <h1>Reference Card</h1>
                    <ConnectionCallout lessonNumber={1} lessonTitle="Context Tracker" message="Pull together everything you've learned across all six skill areas into one personal reference." />
                    <div className="lesson-header-problem-skill">
                        <p>Generate your personal AI collaboration quick reference card from your learnings across all lessons.</p>
                    </div>

                </div>
                <div className="lesson-header-right">
                    <LessonNav lessonNumber={12} />
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="tabs">
                <button className={`tab ${activeTab === 'concepts' ? 'active' : ''}`} onClick={() => setActiveTab('concepts')}>Concepts</button>
                <button className={`tab ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>My Card</button>
                <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>Challenge</button>
            </div>

            {activeTab === 'concepts' && (
                <div className="learn-section">
                    <AccordionSection title="🧭 How This Lesson Works">
                        <p className="learn-subtitle">
                            Two practice areas to consolidate your AI collaboration skills:
                        </p>

                        <div className="learn-patterns-grid">
                            <div className="learn-pattern-card">
                                <h4 className="accent-blue">My Card Tab — Build Your Quick Reference</h4>
                                <p>Generate your reference card from the data you have created across all
                                lessons. It pulls in your top templates, trust zones, frontier map, feedback
                                principles, and workflow highlights. Then add your own personal rules and
                                quick prompts, and export the finished card to keep at your desk.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-green">Challenge Tab — Test All Six Skills at Once</h4>
                                <p>Pick a realistic workplace scenario and describe how you would apply each
                                of the six AI collaboration concepts. This is the integration test: can you
                                use context assembly, quality judgment, task decomposition, iterative
                                refinement, workflow integration, and frontier recognition together?</p>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="⚖️ Without a Reference vs. With One">
                        <div className="learn-comparison">
                            <div className="learn-comparison-grid">
                                <div className="learn-comparison-col">
                                    <h4 className="poor">Relying on Memory Alone</h4>
                                    <div className="learn-comparison-item poor">
                                        <div className="learn-comparison-scenario">New Project Kickoff</div>
                                        <p>"I know I learned something about setting up context for AI, but I
                                        can't remember the details. Let me just paste in the project brief and
                                        see what happens. I'll figure out the rest as I go."</p>
                                    </div>
                                    <div className="learn-comparison-item poor">
                                        <p>Spends 20 minutes going back and forth with AI because the initial
                                        prompt was missing key context. Forgets to check the output against
                                        her trust zones. Ends up redoing work she could have gotten right
                                        the first time.</p>
                                    </div>
                                </div>
                                <div className="learn-comparison-col">
                                    <h4 className="good">Glancing at Your Reference Card</h4>
                                    <div className="learn-comparison-item good">
                                        <div className="learn-comparison-scenario">Same Kickoff — With a Reference Card</div>
                                        <p>Quick glance at the card: context checklist says include audience,
                                        constraints, and examples. Trust zones say "project planning" is Caution
                                        — verify timelines. Quick prompt template for project briefs is already
                                        saved.</p>
                                    </div>
                                    <div className="learn-comparison-item good">
                                        <p>Gets a solid first draft in one pass because the prompt was set up
                                        right. Knows exactly which parts to double-check. Total time: 10
                                        minutes instead of 30.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="🗂️ What Your Reference Card Covers">
                        <p className="learn-subtitle">
                            Your card draws from all six skill areas you have practiced throughout this course:
                        </p>

                        <div className="learn-patterns-grid">
                            <div className="learn-pattern-card">
                                <h4 className="accent-blue">Context Assembly (Lessons 1, 3, 4)</h4>
                                <p>Your best context patterns, top templates, and checklist of what to include
                                before sending any prompt. The habits that make your first attempt count.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-purple">Quality Judgment (Lessons 5, 6)</h4>
                                <p>Your trust zones showing where AI is reliable versus risky for your work,
                                plus the verification steps you have found most useful.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-green">Task Decomposition (Lessons 7, 8)</h4>
                                <p>How you break complex work into AI-friendly chunks, and your delegation
                                patterns for deciding what goes to AI versus what stays with you.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-yellow">Iterative Refinement (Lessons 2, 9)</h4>
                                <p>Your feedback principles for moving AI drafts from "rough" to "ready," and
                                how many passes different task types usually need.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-blue">Workflow Integration (Lessons 10, 12)</h4>
                                <p>Your repeatable workflow templates, time-saving highlights, and the
                                quick prompts you reach for most often.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 className="accent-red">Frontier Recognition (Lesson 11)</h4>
                                <p>Your personal map of where AI works well, where it needs heavy checking,
                                and where you have learned to skip it entirely.</p>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="🚫 Common Mistakes">
                        <div className="learn-patterns-grid mb-lg">
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Treating the reference card as a trophy instead of a tool. Generating it once,
                                exporting a nice PDF, and never looking at it again. The card only helps if
                                you actually use it during your workday.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Keep your card open (printed or on a second monitor) for the first two weeks.
                                    Before any AI task, glance at the relevant section. After two weeks, the habits
                                    stick and you will need it less.
                                </div>
                            </div>
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Trying to include everything. A reference card that runs to three pages is just
                                another document you will not read. The point is quick lookups, not comprehensive
                                documentation.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Stick to your top rules, your most-used templates, and your biggest trust
                                    boundaries. If a section has more than five items, trim it to the ones you
                                    reach for most.
                                </div>
                            </div>
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Never regenerating the card. Your skills evolve, your tools change, and your
                                trust zones shift as you gain experience. A card from three months ago does not
                                reflect what you know today.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Regenerate your card once a month. It takes 30 seconds and pulls in everything
                                    new you have logged across other lessons. Your card should grow with you.
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                </div>
            )}

            {activeTab === 'card' && (
                <div className="grid-gap-lg">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">{card?.name || 'My AI Reference Card'}</h2>
                            <div className="inline-add-row">
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
                            <p className="l12-card-meta">
                                Last generated: {new Date(card.last_generated).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Trust Zones */}
                    {card?.trust_zones?.length > 0 && (
                        <div className="card">
                            <h3>Trust Zones</h3>
                            <div className="grid-gap-sm mt-md">
                                {card.trust_zones.map((zone, i) => (
                                    <div key={i} className="l12-trust-zone-row">
                                        <strong className="l12-trust-zone-type">{zone.type}</strong>
                                        <span className={`badge ${zone.level === 'high' ? 'badge-green' : zone.level === 'low' ? 'badge-red' : 'badge-yellow'}`}>
                                            {zone.level}
                                        </span>
                                        <span className="l12-trust-zone-verify">{zone.verify}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Templates */}
                    {card?.top_templates?.length > 0 && (
                        <div className="card">
                            <h3>Top Templates</h3>
                            <div className="grid-gap-md mt-md">
                                {card.top_templates.map((t, i) => (
                                    <div key={i} className="l12-template-card">
                                        <div className="l12-template-header">
                                            <strong>{t.name}</strong>
                                            <span className="l12-template-usage">Used {t.usage_count}x</span>
                                        </div>
                                        <code className="l12-template-snippet">
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
                            <div className="l12-frontier-grid">
                                {['reliable', 'mixed', 'unreliable'].map(level => (
                                    <div key={level} className={`l12-frontier-col ${level}`}>
                                        <strong>{level}</strong>
                                        <ul>
                                            {(card.frontier_map[level] || []).map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                            {(!card.frontier_map[level] || card.frontier_map[level].length === 0) && (
                                                <li className="empty-item">No items yet</li>
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
                        <div className="inline-add-row mt-md">
                            <input
                                className="input-flex-1"
                                type="text"
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="Add a personal AI collaboration rule"
                                onKeyPress={(e) => e.key === 'Enter' && addPersonalRule()}
                            />
                            <button className="btn btn-primary" onClick={addPersonalRule}>Add Rule</button>
                        </div>
                        {card?.personal_rules?.length > 0 ? (
                            <ul className="l12-rules-list">
                                {card.personal_rules.map((rule, i) => (
                                    <li key={i} className="l12-rules-item">
                                        <span>{rule}</span>
                                        <button className="btn btn-secondary btn-xs" onClick={() => removePersonalRule(i)}>
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state mt-md">
                                <p>No personal rules yet. Add rules that work for you.</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    <div className="card">
                        <h3>Quick Prompts</h3>
                        <div className="l12-prompt-form">
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
                            <div className="mt-md">
                                {card.quick_prompts.map((p, i) => (
                                    <div key={i} className="l12-prompt-entry">
                                        <div className="l12-prompt-entry-header">
                                            <strong>/{p.trigger}</strong>
                                            <button className="btn btn-secondary btn-xs" onClick={() => removeQuickPrompt(i)}>
                                                Remove
                                            </button>
                                        </div>
                                        <code className="l12-prompt-snippet">
                                            {p.prompt}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state mt-md">
                                <p>No quick prompts saved yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Feedback Principles */}
                    {card?.feedback_principles?.length > 0 && (
                        <div className="card">
                            <h3>Feedback Principles</h3>
                            <ul className="l12-principles-list">
                                {card.feedback_principles.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Workflow Highlights */}
                    {card?.workflow_highlights?.length > 0 && (
                        <div className="card">
                            <h3>Workflow Highlights</h3>
                            <div className="grid-gap-sm mt-md">
                                {card.workflow_highlights.map((w, i) => (
                                    <div key={i} className="l12-workflow-row">
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

                                <p className="dashboard-section-description" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                  After completing a scenario, you'll receive:
                                </p>
                                <div className="analysis-grid">
                                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                                    <h3>Concept Scores</h3>
                                    <div className="field">
                                      <div className="field-label">Per-Concept Evaluation</div>
                                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>Each of your six responses scored for completeness and quality — showing which concepts you've internalized and which need more practice.</div>
                                    </div>
                                  </div>
                                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                                    <h3>Strengths &amp; Gaps</h3>
                                    <div className="field">
                                      <div className="field-label">What Stood Out</div>
                                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>Your strongest concept, your biggest growth area, and cross-concept connections the evaluator noticed in your responses.</div>
                                    </div>
                                  </div>
                                  <div className="analysis-card" style={{ opacity: 0.7 }}>
                                    <h3>Next Steps</h3>
                                    <div className="field">
                                      <div className="field-label">Actionable Guidance</div>
                                      <div className="field-value" style={{ color: 'var(--text-primary)' }}>Specific suggestions for where to focus next — pointing you back to the lessons that will have the most impact on your weakest areas.</div>
                                    </div>
                                  </div>
                                </div>
                            </div>
                            <div className="l12-scenario-grid">
                                {scenarios.map(scenario => (
                                    <div key={scenario.id} className="card l12-scenario-card" onClick={() => selectScenario(scenario)}>
                                        <h3>{scenario.title}</h3>
                                        <p className="l12-scenario-desc">{scenario.description}</p>
                                        <button className="btn btn-primary">Start Challenge</button>
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

        </div>
    );
}
