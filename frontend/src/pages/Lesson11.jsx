import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import ConnectionCallout from '../components/ConnectionCallout';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';
import ExamplesDropdown from '../components/ExamplesDropdown';

// Icon mappings for categories and reliability
const CATEGORY_ICONS = {
  coding: '💻',
  writing: '✍️',
  analysis: '📊',
  research: '🔬',
  creative: '🎨',
  default: '📋'
};

const RELIABILITY_ICONS = {
  reliable: '✅',
  mixed: '⚠️',
  unreliable: '🚨',
  unknown: '❓'
};

const ENCOUNTER_ICONS = {
  success: '🎯',
  failure: '❌',
  partial: '🔄',
  surprising: '💡'
};

export default function Lesson11() {
    const api = useApi();
    const [activeTab, setActiveTab] = useState('learn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [zones, setZones] = useState([]);
    const [encounters, setEncounters] = useState([]);
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [reliabilityLevels, setReliabilityLevels] = useState({});
    const [encounterTypes, setEncounterTypes] = useState({});

    // Forms
    const [zoneForm, setZoneForm] = useState({
        name: '',
        category: 'coding',
        reliability: 'mixed',
        confidence: 50,
        strengths: [],
        weaknesses: [],
        verification_needs: '',
        notes: ''
    });
    const [encounterForm, setEncounterForm] = useState({
        zone_id: '',
        encounter_type: 'success',
        task_description: '',
        outcome: '',
        expected_result: '',
        lessons: '',
        tags: []
    });
    const [newStrength, setNewStrength] = useState('');
    const [newWeakness, setNewWeakness] = useState('');
    const [newTag, setNewTag] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterReliability, setFilterReliability] = useState('');

    // Import from Trust Matrix state
    const [trustTypes, setTrustTypes] = useState([]);
    const [showTrustImport, setShowTrustImport] = useState(false);
    const [loadingTrust, setLoadingTrust] = useState(false);

    // AI Pattern Analysis state
    const [patternAnalysis, setPatternAnalysis] = useState(null);
    const [analyzingPatterns, setAnalyzingPatterns] = useState(false);

    useEffect(() => {
        fetchReferenceData();
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'zones') fetchZones();
        if (activeTab === 'encounters') fetchEncounters();
    }, [activeTab]);

    const fetchReferenceData = async () => {
        try {
            const [cats, rels, encs] = await Promise.all([
                api.get('/lesson11/categories'),
                api.get('/lesson11/reliability-levels'),
                api.get('/lesson11/encounter-types')
            ]);
            setCategories(cats);
            setReliabilityLevels(rels);
            setEncounterTypes(encs);
        } catch (err) {
            console.error('Failed to fetch reference data:', err);
        }
    };

    const fetchZones = async () => {
        try {
            let url = '/lesson11/zones';
            const params = new URLSearchParams();
            if (filterCategory) params.append('category', filterCategory);
            if (filterReliability) params.append('reliability', filterReliability);
            if (params.toString()) url += `?${params.toString()}`;

            const data = await api.get(url);
            setZones(data);
        } catch (err) {
            setError('Failed to fetch zones');
        }
    };

    const fetchEncounters = async () => {
        try {
            const data = await api.get('/lesson11/encounters');
            setEncounters(data);
        } catch (err) {
            setError('Failed to fetch encounters');
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.get('/lesson11/stats');
            setStats(data);
        } catch (err) {
            setError('Failed to fetch stats');
        }
    };

    const handleAnalyzePatterns = async () => {
        setAnalyzingPatterns(true);
        setPatternAnalysis(null);
        try {
            const result = await api.post('/lesson11/encounters/analyze', {});
            setPatternAnalysis(result);
            setError('');
        } catch (err) {
            setError(err.message || 'Pattern analysis failed');
        } finally {
            setAnalyzingPatterns(false);
        }
    };

    const createZone = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/lesson11/zones', zoneForm);
            setZoneForm({
                name: '', category: 'coding', reliability: 'mixed',
                confidence: 50, strengths: [], weaknesses: [],
                verification_needs: '', notes: ''
            });
            fetchZones();
        } catch (err) {
            setError(err.message || 'Failed to create zone');
        } finally {
            setLoading(false);
        }
    };

    const createEncounter = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/lesson11/encounters', {
                ...encounterForm,
                zone_id: encounterForm.zone_id || null
            });
            setEncounterForm({
                zone_id: '', encounter_type: 'success',
                task_description: '', outcome: '', expected_result: '',
                lessons: '', tags: []
            });
            fetchEncounters();
            fetchStats();
        } catch (err) {
            setError(err.message || 'Failed to create encounter');
        } finally {
            setLoading(false);
        }
    };

    const deleteZone = async (id) => {
        if (!confirm('Delete this zone?')) return;
        try {
            await api.del(`/lesson11/zones/${id}`);
            fetchZones();
        } catch (err) {
            setError('Failed to delete zone');
        }
    };

    const seedExamples = async (type) => {
        setLoading(true);
        try {
            await api.post(`/lesson11/${type}/seed-examples`, {});
            if (type === 'zones') fetchZones();
            else fetchEncounters();
        } catch (err) {
            setError('Failed to seed examples');
        } finally {
            setLoading(false);
        }
    };

    const addStrength = () => {
        if (newStrength.trim()) {
            setZoneForm({ ...zoneForm, strengths: [...zoneForm.strengths, newStrength.trim()] });
            setNewStrength('');
        }
    };

    const addWeakness = () => {
        if (newWeakness.trim()) {
            setZoneForm({ ...zoneForm, weaknesses: [...zoneForm.weaknesses, newWeakness.trim()] });
            setNewWeakness('');
        }
    };

    const addTag = () => {
        if (newTag.trim() && !encounterForm.tags.includes(newTag.trim())) {
            setEncounterForm({ ...encounterForm, tags: [...encounterForm.tags, newTag.trim()] });
            setNewTag('');
        }
    };

    const handleOpenTrustImport = async () => {
        if (showTrustImport) { setShowTrustImport(false); return; }
        setLoadingTrust(true);
        try {
            const data = await api.get('/lesson5/output-types');
            setTrustTypes(data);
            setShowTrustImport(true);
        } catch (err) {
            setError('Could not load output types from Trust Matrix: ' + (err.message || err));
        } finally {
            setLoadingTrust(false);
        }
    };

    const handleImportTrustType = (outputType) => {
        const reliabilityMap = { high: 'reliable', medium: 'mixed', low: 'unreliable' };
        setZoneForm({
            ...zoneForm,
            name: outputType.name,
            category: outputType.category || 'coding',
            reliability: reliabilityMap[outputType.trust_level] || 'mixed',
            verification_needs: outputType.verification_approach || '',
            notes: outputType.reasoning || ''
        });
        setShowTrustImport(false);
    };

    const getReliabilityColor = (level) => {
        switch (level) {
            case 'reliable': return 'badge-green';
            case 'mixed': return 'badge-yellow';
            case 'unreliable': return 'badge-red';
            default: return 'badge-blue';
        }
    };

    const getEncounterColor = (type) => {
        switch (type) {
            case 'success': return 'badge-green';
            case 'failure': return 'badge-red';
            case 'surprise': return 'badge-yellow';
            default: return 'badge-blue';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Frontier Mapper</h1>
            </div>

            <div className="lesson-progress-row">
                <SelfAssessmentChecklist lessonNumber={11} criteria={LESSON_CRITERIA[11]} />
                <StatsPanel stats={stats ? [
                    { label: 'Zones', value: stats.total_zones, color: 'var(--accent-purple)' },
                    { label: 'Encounters', value: stats.total_encounters, color: 'var(--accent-green)' },
                    { label: 'This Week', value: stats.encounters_this_week, color: 'var(--accent-yellow)' },
                    { label: 'Avg Confidence', value: stats.avg_zone_confidence != null ? `${stats.avg_zone_confidence}%` : '-', color: 'var(--accent-purple)' },
                ] : []} />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="tabs">
                <button className={`tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>Learn</button>
                <button className={`tab ${activeTab === 'zones' ? 'active' : ''}`} onClick={() => setActiveTab('zones')}>Zones</button>
                <button className={`tab ${activeTab === 'encounters' ? 'active' : ''}`} onClick={() => setActiveTab('encounters')}>Encounters</button>
            </div>

            {activeTab === 'learn' && (
                <div className="learn-section">
                    <div className="learn-problem-skill">
                        <p>Map AI reliability zones and log frontier encounters to build your personal AI capability map.</p>
                    </div>

                    <ConnectionCallout
                        lessonNumber={5}
                        lessonTitle="Trust Matrix"
                        message="Lesson 5 helped you predict AI reliability for individual tasks. Frontier Mapper zooms out: instead of one-off predictions, you are building a map of broader patterns — entire categories where AI is safe, risky, or unreliable for your specific work."
                    />

                    <div className="learn-intro">
                        <h2>Why You Need a Personal AI Capability Map</h2>
                        <p>
                            Your colleague asks AI to summarize last quarter's sales data, and it does a
                            great job. So she asks it to interpret the legal implications of a new vendor
                            contract — and it confidently produces advice that is completely wrong. She had
                            no way to know the difference in advance, because she was treating AI as equally
                            good at everything.
                        </p>
                        <p>
                            AI does not come with a reliability label. It sounds equally confident whether it
                            is drafting a perfectly good email or fabricating a statistic. The only way to know
                            where the boundaries are is to map them yourself, based on your own experience in
                            your own work.
                        </p>
                    </div>

                    <div className="learn-key-insight">
                        <strong>Key Insight:</strong> AI reliability is not random — it follows patterns.
                        Certain categories of tasks are consistently safe, others are consistently risky.
                        By logging your encounters and sorting them into zones, you build a personal map
                        that tells you when to trust, when to verify, and when to skip AI entirely.
                    </div>

                    <h3>How This Lesson Works</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Two practice areas to build your personal AI capability map:
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-blue)' }}>Zones Tab — Map Your Reliability Zones</h4>
                            <p>Create zones for the types of work you do with AI. Rate each one as Safe,
                            Caution, or Frontier. Over time, your map becomes a quick-reference guide for
                            how much verification any task needs.</p>
                            <button className="learn-tab-link" onClick={() => setActiveTab('zones')}>Go to Zones →</button>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-green)' }}>Encounters Tab — Log What Actually Happened</h4>
                            <p>Each time you use AI for something notable — a success, a failure, or a
                            surprise — log it. These real-world data points are what make your zones accurate
                            instead of just guesswork.</p>
                            <button className="learn-tab-link" onClick={() => setActiveTab('encounters')}>Go to Encounters →</button>
                        </div>
                    </div>

                    <div className="learn-comparison">
                        <h3>Guessing vs. Mapping AI Reliability</h3>
                        <div className="learn-comparison-grid">
                            <div className="learn-comparison-col">
                                <h4 className="poor">Treating All AI Tasks the Same</h4>
                                <div className="learn-comparison-item poor">
                                    <div className="learn-comparison-scenario">Event Planning</div>
                                    <p>"AI wrote great catering options for our conference, so I also asked it
                                    to confirm the venue's fire code capacity. It gave me a number that sounded
                                    right, so I used it in the safety plan."</p>
                                </div>
                                <div className="learn-comparison-item poor">
                                    <p>The fire code number was fabricated. The fire marshal flagged it during
                                    inspection, delaying the event by a week. AI is great at creative suggestions
                                    but unreliable for regulatory specifics.</p>
                                </div>
                            </div>
                            <div className="learn-comparison-col">
                                <h4 className="good">Using Your Reliability Map</h4>
                                <div className="learn-comparison-item good">
                                    <div className="learn-comparison-scenario">Same Event — With Frontier Awareness</div>
                                    <p>You check your map: "creative brainstorming" is in the Safe zone, but
                                    "regulatory and compliance facts" is in the Frontier zone. You use AI for
                                    the catering menu and call the venue directly for fire code capacity.</p>
                                </div>
                                <div className="learn-comparison-item good">
                                    <p>You get the best of both worlds: AI handles what it is good at, and you
                                    verify the things it struggles with. No surprises at inspection time.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3>The Three Reliability Zones</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Every type of AI task falls into one of three zones. The boundaries are personal —
                        they depend on your field, your tools, and your experience.
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-green)' }}>Safe Zone — Trust with Quick Checks</h4>
                            <p>AI consistently delivers usable results. A quick skim is enough before using
                            the output. You have run enough tasks in this zone to feel confident.</p>
                            <div className="learn-pattern-label better">Examples</div>
                            <div className="learn-example-good">
                                <strong>Drafting routine emails</strong> — professional tone, correct structure<br/>
                                <strong>Summarizing meeting notes</strong> — captures key points accurately<br/>
                                <strong>Reformatting data</strong> — converting CSV to a table, reorganizing lists
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-yellow)' }}>Caution Zone — Verify Before Using</h4>
                            <p>AI sometimes gets it right, sometimes misses. You need to check specific
                            details, not just skim. Performance depends on how well you set up the prompt.</p>
                            <div className="learn-pattern-label better">Examples</div>
                            <div className="learn-example-good">
                                <strong>Market research summaries</strong> — good structure, but statistics may be outdated<br/>
                                <strong>Client proposal drafts</strong> — solid framework, but needs fact-checking<br/>
                                <strong>Budget calculations</strong> — logic is usually right, numbers need verification
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Frontier Zone — High Risk, Verify Everything</h4>
                            <p>AI frequently produces confident-sounding but wrong output. Using it here
                            without heavy verification is dangerous. Sometimes it is faster to skip AI
                            entirely.</p>
                            <div className="learn-pattern-label better">Examples</div>
                            <div className="learn-example-good">
                                <strong>Legal contract interpretation</strong> — confidently wrong about clause meanings<br/>
                                <strong>Industry-specific regulations</strong> — fabricates compliance requirements<br/>
                                <strong>Local or niche knowledge</strong> — makes up names, dates, or policies for your area
                            </div>
                        </div>
                    </div>

                    <h3>What to Log as an Encounter</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        You do not need to log every single AI interaction. Focus on encounters that teach
                        you something about where a boundary is:
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-green)' }}>Successes Worth Logging</h4>
                            <p>When AI handles something you were not sure it could do, that is worth
                            recording. It expands your map of safe territory.</p>
                            <div className="learn-example-good">
                                "Asked AI to draft a complex project timeline with dependencies — expected
                                to need heavy editing, but it was 90% usable. Moving 'project planning' closer
                                to Safe zone."
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Failures Worth Logging</h4>
                            <p>When AI confidently gets something wrong, that is the most valuable data
                            point. It marks the boundary where you need to stop trusting.</p>
                            <div className="learn-example-good">
                                "Asked AI for the correct filing deadline for Q4 sales tax in our state.
                                It gave January 31 with full confidence — actual deadline is January 20.
                                Tax deadlines are firmly in the Frontier zone."
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-yellow)' }}>Surprises Worth Logging</h4>
                            <p>When the result is not what you expected — good or bad — that tells you
                            your mental map needs updating.</p>
                            <div className="learn-example-good">
                                "Asked AI to analyze customer feedback themes from 200 survey responses.
                                Expected generic categories, but it identified a specific product complaint
                                pattern I had missed. 'Qualitative analysis' may be safer than I thought."
                            </div>
                        </div>
                    </div>

                    <h3>Common Mistakes</h3>
                    <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Mapping zones based on what you have heard about AI rather than your own
                            experience. "Someone said AI is bad at math" is not the same as testing it
                            on your specific types of calculations.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Start every zone at "Unknown" and move it based on actual encounters. Your
                                experience with your prompts, your data, and your tools is what matters.
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Never updating your map. AI tools change, your skills improve, and what was
                            Frontier six months ago might be Caution now. A stale map gives false confidence
                            or unnecessary caution.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Review your zones monthly. If you have not logged any encounters for a zone
                                in the past month, lower your confidence level — you do not have recent data
                                to back it up.
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Making zones too broad. "Writing" as a single zone hides the fact that AI is
                            great at routine emails but terrible at technical white papers for your industry.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Split broad categories into specific ones: "Internal emails," "Client-facing
                                proposals," "Technical documentation," "Marketing copy." Each may have a
                                different reliability level.
                            </div>
                        </div>
                    </div>

                    <div className="learn-next-step">
                        <h3>Ready to Start Mapping?</h3>
                        <p>Begin with three zones for your most common AI tasks — one you trust, one you are
                        unsure about, and one where AI has let you down. Then log your next few encounters
                        to see if your ratings hold up.</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('zones')}>
                            Go to Zones
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'zones' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Create Zone</h2>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <ExamplesDropdown
                                    endpoint="/lesson11/examples"
                                    onSelect={(example) => {
                                        setZoneForm({
                                            ...zoneForm,
                                            name: example.name || '',
                                            category: example.category || categories[0]?.id || '',
                                            reliability: example.reliability || 'moderate',
                                            confidence: example.confidence || 50,
                                            strengths: example.strengths || [],
                                            weaknesses: example.weaknesses || [],
                                            verification_needs: example.verification_needs || [],
                                            notes: example.notes || '',
                                        });
                                    }}
                                />
                                <button className="btn btn-secondary" onClick={() => seedExamples('zones')} disabled={loading}>
                                    {loading ? 'Seeding...' : 'Seed Examples'}
                                </button>
                            </div>
                        </div>

                        {/* Import from Trust Matrix */}
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={handleOpenTrustImport}
                                disabled={loadingTrust}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {loadingTrust ? 'Loading...' : showTrustImport ? 'Hide Import' : 'Import from Trust Matrix'}
                            </button>

                            {showTrustImport && (
                                <div style={{ padding: '16px', marginTop: '12px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 12px' }}>Select an Output Type</h4>
                                    {trustTypes.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            <p>No output types defined yet.</p>
                                            <p style={{ fontSize: '0.85rem' }}>
                                                Go to <a href="/lesson/5" style={{ color: 'var(--accent-blue)' }}>Lesson 5 — Trust Matrix</a> to define output types first.
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {trustTypes.map((ot) => (
                                                <div
                                                    key={ot.id}
                                                    onClick={() => handleImportTrustType(ot)}
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
                                                        <strong>{ot.name}</strong>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: ot.trust_level === 'high' ? 'var(--success-bg)' : ot.trust_level === 'low' ? 'var(--error-bg)' : 'var(--warning-bg)',
                                                            color: ot.trust_level === 'high' ? 'var(--accent-green)' : ot.trust_level === 'low' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                                                        }}>
                                                            {ot.trust_level} trust
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

                        <form onSubmit={createZone}>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Zone Name</label>
                                    <input
                                        type="text"
                                        value={zoneForm.name}
                                        onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                                        placeholder="e.g., Python Scripting"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Category</label>
                                    <select
                                        value={zoneForm.category}
                                        onChange={(e) => setZoneForm({ ...zoneForm, category: e.target.value })}
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Reliability</label>
                                    <select
                                        value={zoneForm.reliability}
                                        onChange={(e) => setZoneForm({ ...zoneForm, reliability: e.target.value })}
                                    >
                                        {Object.entries(reliabilityLevels).map(([key, val]) => (
                                            <option key={key} value={key}>{val.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Confidence: {zoneForm.confidence}%</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={zoneForm.confidence}
                                        onChange={(e) => setZoneForm({ ...zoneForm, confidence: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Strengths</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={newStrength}
                                            onChange={(e) => setNewStrength(e.target.value)}
                                            placeholder="Add strength"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
                                        />
                                        <button type="button" className="btn btn-secondary" onClick={addStrength}>+</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {zoneForm.strengths.map((s, i) => (
                                            <span key={i} className="badge badge-green" style={{ cursor: 'pointer' }}
                                                onClick={() => setZoneForm({ ...zoneForm, strengths: zoneForm.strengths.filter((_, idx) => idx !== i) })}>
                                                {s} x
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Weaknesses</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={newWeakness}
                                            onChange={(e) => setNewWeakness(e.target.value)}
                                            placeholder="Add weakness"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWeakness())}
                                        />
                                        <button type="button" className="btn btn-secondary" onClick={addWeakness}>+</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {zoneForm.weaknesses.map((w, i) => (
                                            <span key={i} className="badge badge-red" style={{ cursor: 'pointer' }}
                                                onClick={() => setZoneForm({ ...zoneForm, weaknesses: zoneForm.weaknesses.filter((_, idx) => idx !== i) })}>
                                                {w} x
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Verification Needs</label>
                                <input
                                    type="text"
                                    value={zoneForm.verification_needs}
                                    onChange={(e) => setZoneForm({ ...zoneForm, verification_needs: e.target.value })}
                                    placeholder="What to verify when working in this zone"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Zone'}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Your Zones ({zones.length})</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setTimeout(fetchZones, 0); }}>
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={filterReliability} onChange={(e) => { setFilterReliability(e.target.value); setTimeout(fetchZones, 0); }}>
                                    <option value="">All Reliability</option>
                                    <option value="reliable">Reliable</option>
                                    <option value="mixed">Mixed</option>
                                    <option value="unreliable">Unreliable</option>
                                </select>
                            </div>
                        </div>

                        {zones.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No zones yet. Create one above or seed examples to get started.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {zones.map(zone => (
                                    <div key={zone.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{zone.name}</h3>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <span className={`badge ${getReliabilityColor(zone.reliability)}`}>{zone.reliability}</span>
                                                    <span className="badge badge-blue">{zone.category}</span>
                                                    <span className="badge">{zone.confidence}% confidence</span>
                                                </div>
                                            </div>
                                            <button className="btn btn-secondary" onClick={() => deleteZone(zone.id)} style={{ padding: '0.25rem 0.5rem' }}>
                                                Delete
                                            </button>
                                        </div>
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <span>{zone.strength_count} strengths</span> | <span>{zone.weakness_count} weaknesses</span> | <span>{zone.encounter_count} encounters</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'encounters' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Log Encounter</h2>
                            <button className="btn btn-secondary" onClick={() => seedExamples('encounters')} disabled={loading}>
                                {loading ? 'Seeding...' : 'Seed Examples'}
                            </button>
                        </div>

                        <form onSubmit={createEncounter}>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Zone (optional)</label>
                                    <select
                                        value={encounterForm.zone_id}
                                        onChange={(e) => setEncounterForm({ ...encounterForm, zone_id: e.target.value })}
                                    >
                                        <option value="">-- No zone --</option>
                                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Encounter Type</label>
                                    <select
                                        value={encounterForm.encounter_type}
                                        onChange={(e) => setEncounterForm({ ...encounterForm, encounter_type: e.target.value })}
                                    >
                                        {Object.entries(encounterTypes).map(([key, val]) => (
                                            <option key={key} value={key}>{val.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Task Description</label>
                                <textarea
                                    value={encounterForm.task_description}
                                    onChange={(e) => setEncounterForm({ ...encounterForm, task_description: e.target.value })}
                                    placeholder="What did you ask the AI to do?"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Outcome</label>
                                <textarea
                                    value={encounterForm.outcome}
                                    onChange={(e) => setEncounterForm({ ...encounterForm, outcome: e.target.value })}
                                    placeholder="What happened?"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Expected Result (optional)</label>
                                    <input
                                        type="text"
                                        value={encounterForm.expected_result}
                                        onChange={(e) => setEncounterForm({ ...encounterForm, expected_result: e.target.value })}
                                        placeholder="What did you expect?"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Tags</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Add tag"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <button type="button" className="btn btn-secondary" onClick={addTag}>+</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                                        {encounterForm.tags.map((t, i) => (
                                            <span key={i} className="badge" style={{ cursor: 'pointer' }}
                                                onClick={() => setEncounterForm({ ...encounterForm, tags: encounterForm.tags.filter((_, idx) => idx !== i) })}>
                                                {t} x
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Lessons Learned (optional)</label>
                                <textarea
                                    value={encounterForm.lessons}
                                    onChange={(e) => setEncounterForm({ ...encounterForm, lessons: e.target.value })}
                                    placeholder="What did you learn from this encounter?"
                                    rows={2}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Logging...' : 'Log Encounter'}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h2>Recent Encounters ({encounters.length})</h2>
                        {encounters.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No encounters logged yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {encounters.map(enc => (
                                    <div key={enc.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <span className={`badge ${getEncounterColor(enc.encounter_type)}`}>{enc.encounter_type}</span>
                                                {enc.zone_name && <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{enc.zone_name}</span>}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {new Date(enc.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0.75rem 0 0 0' }}>{enc.task_description}</p>
                                        {enc.tags.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                                                {enc.tags.map((t, i) => <span key={i} className="badge">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <LessonNav currentLesson={11} />
        </div>
    );
}
