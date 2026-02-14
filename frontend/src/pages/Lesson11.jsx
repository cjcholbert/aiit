import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

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

    useEffect(() => {
        fetchReferenceData();
        if (activeTab === 'zones') fetchZones();
        if (activeTab === 'encounters') fetchEncounters();
        if (activeTab === 'stats') fetchStats();
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
                <p className="page-description">
                    Map AI reliability zones and log frontier encounters to build your personal AI capability map.
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="tabs">
                <button className={`tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>Learn</button>
                <button className={`tab ${activeTab === 'zones' ? 'active' : ''}`} onClick={() => setActiveTab('zones')}>Zones</button>
                <button className={`tab ${activeTab === 'encounters' ? 'active' : ''}`} onClick={() => setActiveTab('encounters')}>Encounters</button>
                <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Stats</button>
            </div>

            {activeTab === 'learn' && (
                <div className="card">
                    <h2>Understanding Frontier Mapping</h2>
                    <p>Frontier mapping helps you build a mental model of where AI excels and where it struggles in your specific work context.</p>

                    <h3 style={{ marginTop: '1.5rem' }}>Reliability Zones</h3>
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <strong>Reliable Zone</strong>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                AI consistently performs well. Quick verification is sufficient. Examples: boilerplate code, email drafting, documentation formatting.
                            </p>
                        </div>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <strong>Mixed Zone</strong>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                AI performance varies. Careful verification needed. Examples: code logic, data analysis, technical explanations.
                            </p>
                        </div>
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <strong>Unreliable Zone</strong>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                AI often struggles. High verification or human expertise required. Examples: legal interpretation, financial advice, current events.
                            </p>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '1.5rem' }}>Logging Encounters</h3>
                    <p>Track your interactions to refine your map over time:</p>
                    <ul>
                        <li><strong>Successes:</strong> AI delivered as expected or better</li>
                        <li><strong>Failures:</strong> AI produced unusable output</li>
                        <li><strong>Surprises:</strong> Unexpected results (positive or negative)</li>
                    </ul>

                    <h3 style={{ marginTop: '1.5rem' }}>Building Your Map</h3>
                    <ol>
                        <li>Start with domains you work in frequently</li>
                        <li>Categorize based on actual experience, not assumptions</li>
                        <li>Log encounters to validate and refine zones</li>
                        <li>Adjust confidence levels as you gather more data</li>
                        <li>Note specific strengths and weaknesses within each zone</li>
                    </ol>
                </div>
            )}

            {activeTab === 'zones' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Create Zone</h2>
                            <button className="btn btn-secondary" onClick={() => seedExamples('zones')} disabled={loading}>
                                {loading ? 'Seeding...' : 'Seed Examples'}
                            </button>
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

            {activeTab === 'stats' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {stats ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.total_zones}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Total Zones</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.total_encounters}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Total Encounters</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.encounters_this_week}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>This Week</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stats.avg_zone_confidence}%</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Avg Confidence</div>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Zones by Reliability</h2>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.zones_by_reliability.reliable || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Reliable</div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.zones_by_reliability.mixed || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Mixed</div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.zones_by_reliability.unreliable || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Unreliable</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Encounters by Type</h2>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.encounters_by_type.success || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Successes</div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.encounters_by_type.failure || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Failures</div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.encounters_by_type.surprise || 0}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>Surprises</div>
                                    </div>
                                </div>
                            </div>

                            {stats.recent_lessons.length > 0 && (
                                <div className="card">
                                    <h2>Recent Lessons Learned</h2>
                                    <ul style={{ marginTop: '1rem' }}>
                                        {stats.recent_lessons.map((lesson, i) => (
                                            <li key={i} style={{ marginBottom: '0.5rem' }}>{lesson}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {stats.common_tags.length > 0 && (
                                <div className="card">
                                    <h2>Common Tags</h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        {stats.common_tags.map((t, i) => (
                                            <span key={i} className="badge">{t.tag} ({t.count})</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card">
                            <p style={{ color: 'var(--text-muted)' }}>Loading statistics...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
