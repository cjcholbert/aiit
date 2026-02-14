import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Admin() {
    const api = useApi();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('cohorts');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cohorts state
    const [cohorts, setCohorts] = useState([]);
    const [users, setUsers] = useState([]);
    const [showCohortForm, setShowCohortForm] = useState(false);
    const [cohortForm, setCohortForm] = useState({ name: '', description: '', organization: '' });

    // Experiments state
    const [experiments, setExperiments] = useState([]);
    const [showExperimentForm, setShowExperimentForm] = useState(false);
    const [experimentForm, setExperimentForm] = useState({
        name: '',
        description: '',
        feature_key: '',
        variants: 'control,variant_a',
        traffic_percentage: 100
    });

    // Dialog state
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [cohortsData, usersData, experimentsData] = await Promise.all([
                api.get('/admin/cohorts'),
                api.get('/admin/users?limit=100'),
                api.get('/admin/experiments')
            ]);
            setCohorts(cohortsData);
            setUsers(usersData);
            setExperiments(experimentsData);
        } catch (err) {
            setError(err.message);
            if (err.statusCode === 403) {
                setError('Admin access required. You do not have permission to view this page.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Cohort handlers
    const handleCreateCohort = async (e) => {
        e.preventDefault();
        try {
            const newCohort = await api.post('/admin/cohorts', cohortForm);
            setCohorts([newCohort, ...cohorts]);
            setShowCohortForm(false);
            setCohortForm({ name: '', description: '', organization: '' });
            toast.success('Cohort created successfully');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAddUserToCohort = async (cohortId, userId) => {
        try {
            await api.post(`/admin/cohorts/${cohortId}/members`, { user_id: userId });
            toast.success('User added to cohort');
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleRemoveUserFromCohort = async (cohortId, userId) => {
        try {
            await api.del(`/admin/cohorts/${cohortId}/members/${userId}`);
            toast.success('User removed from cohort');
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Experiment handlers
    const handleCreateExperiment = async (e) => {
        e.preventDefault();
        try {
            const variants = experimentForm.variants.split(',').map(v => v.trim()).filter(Boolean);
            if (variants.length < 2) {
                toast.error('At least 2 variants required');
                return;
            }
            const newExperiment = await api.post('/admin/experiments', {
                ...experimentForm,
                variants,
                traffic_percentage: parseInt(experimentForm.traffic_percentage)
            });
            setExperiments([newExperiment, ...experiments]);
            setShowExperimentForm(false);
            setExperimentForm({
                name: '',
                description: '',
                feature_key: '',
                variants: 'control,variant_a',
                traffic_percentage: 100
            });
            toast.success('Experiment created successfully');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleConcludeExperiment = async (experimentId, winner) => {
        try {
            await api.put(`/admin/experiments/${experimentId}`, { winner });
            toast.success(`Experiment concluded with winner: ${winner}`);
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleToggleExperiment = async (experimentId, isActive) => {
        try {
            await api.put(`/admin/experiments/${experimentId}`, { is_active: !isActive });
            toast.success(`Experiment ${isActive ? 'paused' : 'activated'}`);
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return (
            <div className="loading" style={{ padding: '2rem' }}>
                <div className="spinner"></div>
                Loading admin data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-with-retry">
                <div className="error-icon">(!)</div>
                <div className="error-text">{error}</div>
                <button className="btn btn-primary retry-btn" onClick={loadData}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-description">Manage cohorts, experiments, and users</p>
            </div>

            <div className="tabs" role="tablist">
                <button
                    className={`tab ${activeTab === 'cohorts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cohorts')}
                    role="tab"
                    aria-selected={activeTab === 'cohorts'}
                >
                    Cohorts ({cohorts.length})
                </button>
                <button
                    className={`tab ${activeTab === 'experiments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('experiments')}
                    role="tab"
                    aria-selected={activeTab === 'experiments'}
                >
                    A/B Tests ({experiments.length})
                </button>
                <button
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                    role="tab"
                    aria-selected={activeTab === 'users'}
                >
                    Users ({users.length})
                </button>
            </div>

            <div className="tab-content">
                {/* Cohorts Tab */}
                {activeTab === 'cohorts' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2>Cohorts</h2>
                            <button className="btn btn-primary" onClick={() => setShowCohortForm(!showCohortForm)}>
                                {showCohortForm ? 'Cancel' : '+ New Cohort'}
                            </button>
                        </div>

                        {showCohortForm && (
                            <div className="card" style={{ marginBottom: '1rem' }}>
                                <form onSubmit={handleCreateCohort}>
                                    <div className="form-group">
                                        <label htmlFor="cohort-name">Cohort Name *</label>
                                        <input
                                            id="cohort-name"
                                            type="text"
                                            value={cohortForm.name}
                                            onChange={e => setCohortForm({ ...cohortForm, name: e.target.value })}
                                            required
                                            placeholder="e.g., Q1 2026 Onboarding"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="cohort-org">Organization</label>
                                        <input
                                            id="cohort-org"
                                            type="text"
                                            value={cohortForm.organization}
                                            onChange={e => setCohortForm({ ...cohortForm, organization: e.target.value })}
                                            placeholder="e.g., Acme Corp"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="cohort-desc">Description</label>
                                        <textarea
                                            id="cohort-desc"
                                            value={cohortForm.description}
                                            onChange={e => setCohortForm({ ...cohortForm, description: e.target.value })}
                                            placeholder="Optional description..."
                                            rows={2}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary">Create Cohort</button>
                                </form>
                            </div>
                        )}

                        {cohorts.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>No cohorts yet. Create one to start tracking groups of users.</p>
                            </div>
                        ) : (
                            <div className="module-grid">
                                {cohorts.map(cohort => (
                                    <div key={cohort.id} className="card">
                                        <h3 style={{ marginBottom: '0.5rem' }}>{cohort.name}</h3>
                                        {cohort.organization && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                {cohort.organization}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                            {cohort.description || 'No description'}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className={`badge ${cohort.is_active ? 'badge-green' : 'badge'}`}>
                                                {cohort.member_count} members
                                            </span>
                                            <span className={`status-indicator ${cohort.is_active ? 'success' : 'warning'}`}>
                                                {cohort.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Experiments Tab */}
                {activeTab === 'experiments' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2>A/B Test Experiments</h2>
                            <button className="btn btn-primary" onClick={() => setShowExperimentForm(!showExperimentForm)}>
                                {showExperimentForm ? 'Cancel' : '+ New Experiment'}
                            </button>
                        </div>

                        {showExperimentForm && (
                            <div className="card" style={{ marginBottom: '1rem' }}>
                                <form onSubmit={handleCreateExperiment}>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label htmlFor="exp-name">Experiment Name *</label>
                                            <input
                                                id="exp-name"
                                                type="text"
                                                value={experimentForm.name}
                                                onChange={e => setExperimentForm({ ...experimentForm, name: e.target.value })}
                                                required
                                                placeholder="e.g., Lesson 3 New Layout"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label htmlFor="exp-key">Feature Key *</label>
                                            <input
                                                id="exp-key"
                                                type="text"
                                                value={experimentForm.feature_key}
                                                onChange={e => setExperimentForm({ ...experimentForm, feature_key: e.target.value })}
                                                required
                                                placeholder="e.g., lesson_3_layout"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <label htmlFor="exp-variants">Variants (comma-separated) *</label>
                                            <input
                                                id="exp-variants"
                                                type="text"
                                                value={experimentForm.variants}
                                                onChange={e => setExperimentForm({ ...experimentForm, variants: e.target.value })}
                                                required
                                                placeholder="control,variant_a,variant_b"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label htmlFor="exp-traffic">Traffic % *</label>
                                            <input
                                                id="exp-traffic"
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={experimentForm.traffic_percentage}
                                                onChange={e => setExperimentForm({ ...experimentForm, traffic_percentage: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="exp-desc">Description</label>
                                        <textarea
                                            id="exp-desc"
                                            value={experimentForm.description}
                                            onChange={e => setExperimentForm({ ...experimentForm, description: e.target.value })}
                                            placeholder="What are you testing?"
                                            rows={2}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary">Create Experiment</button>
                                </form>
                            </div>
                        )}

                        {experiments.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>No experiments yet. Create one to start A/B testing features.</p>
                            </div>
                        ) : (
                            <div className="module-grid">
                                {experiments.map(exp => (
                                    <div key={exp.id} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h3>{exp.name}</h3>
                                            <span className={`status-indicator ${exp.is_active ? 'success' : exp.winner ? 'info' : 'warning'}`}>
                                                {exp.is_active ? 'Running' : exp.winner ? 'Concluded' : 'Paused'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            {exp.feature_key}
                                        </p>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                            {exp.description || 'No description'}
                                        </p>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Variants: </span>
                                            {exp.variants.map(v => (
                                                <span key={v} className={`badge ${v === exp.winner ? 'badge-green' : ''}`} style={{ marginRight: '4px' }}>
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {exp.is_active && (
                                                <>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleToggleExperiment(exp.id, exp.is_active)}
                                                    >
                                                        Pause
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => setConfirmDialog({
                                                            isOpen: true,
                                                            title: 'Conclude Experiment',
                                                            message: `Select the winning variant for "${exp.name}"`,
                                                            onConfirm: () => {},
                                                            variants: exp.variants,
                                                            experimentId: exp.id
                                                        })}
                                                    >
                                                        Conclude
                                                    </button>
                                                </>
                                            )}
                                            {!exp.is_active && !exp.winner && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleToggleExperiment(exp.id, exp.is_active)}
                                                >
                                                    Resume
                                                </button>
                                            )}
                                            {exp.winner && (
                                                <span style={{ fontSize: '13px', color: 'var(--accent-green)' }}>
                                                    Winner: {exp.winner}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <h2 style={{ marginBottom: '1rem' }}>Users</h2>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Cohort</th>
                                        <th>Lessons</th>
                                        <th>Last Active</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                {user.email}
                                                {user.is_admin && <span className="badge badge-purple" style={{ marginLeft: '8px' }}>Admin</span>}
                                            </td>
                                            <td>
                                                <span className={`status-indicator ${user.is_active ? 'success' : 'error'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{user.cohort_name || '-'}</td>
                                            <td>{user.lessons_visited}</td>
                                            <td>
                                                {user.last_activity
                                                    ? new Date(user.last_activity).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
}
