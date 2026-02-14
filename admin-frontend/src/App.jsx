import { useState, useEffect } from 'react';
import { useAdminApi } from './hooks/useAdminApi';
import LoginForm from './components/LoginForm';
import StatsGrid from './components/StatsGrid';
import UserTable from './components/UserTable';
import AnalyticsView from './components/AnalyticsView';
import AuditLog from './components/AuditLog';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'audit', label: 'Audit Log' },
];

function App() {
  const {
    adminKey, setAdminKey, authenticated, api, apiRaw,
    authenticate, logout, error, success, showSuccess, showError,
  } = useAdminApi();

  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const ok = await authenticate();
    if (ok) loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await api('/admin/stats');
      setStats(data);
    } catch (err) {
      showError(err.message);
    }
  };

  useEffect(() => {
    if (adminKey) {
      handleLogin();
    }
  }, []);

  if (!authenticated) {
    return (
      <LoginForm
        adminKey={adminKey}
        setAdminKey={setAdminKey}
        onLogin={handleLogin}
        error={error}
        loading={loading}
      />
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="header-title">Admin Panel</h1>
        <p className="header-subtitle">AI Manager Skills Platform</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <StatsGrid stats={stats} />

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'users' && (
        <UserTable
          api={api}
          apiRaw={apiRaw}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsView api={api} showError={showError} />
      )}

      {activeTab === 'audit' && (
        <AuditLog api={api} showError={showError} />
      )}
    </div>
  );
}

export default App;
