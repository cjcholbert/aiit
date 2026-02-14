import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8001';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#8b949e',
    fontSize: '15px'
  },
  card: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    marginBottom: '12px'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonPrimary: {
    background: '#238636',
    color: 'white'
  },
  buttonDanger: {
    background: 'transparent',
    border: '1px solid #30363d',
    color: '#f85149'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #30363d',
    color: '#8b949e',
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #30363d'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#58a6ff'
  },
  statLabel: {
    fontSize: '13px',
    color: '#8b949e',
    marginTop: '4px'
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  alertError: {
    background: 'rgba(248, 81, 73, 0.15)',
    color: '#f85149',
    border: '1px solid #f85149'
  },
  alertSuccess: {
    background: 'rgba(35, 134, 54, 0.15)',
    color: '#238636',
    border: '1px solid #238636'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  badgeGreen: {
    background: 'rgba(35, 134, 54, 0.15)',
    color: '#238636'
  },
  badgeRed: {
    background: 'rgba(248, 81, 73, 0.15)',
    color: '#f85149'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%'
  }
};

function App() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const api = async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
        ...options.headers
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail);
    }
    return res.json();
  };

  const authenticate = async () => {
    setError('');
    setLoading(true);
    try {
      await api('/admin/stats');
      localStorage.setItem('adminKey', adminKey);
      setAuthenticated(true);
      loadData();
    } catch (err) {
      setError('Invalid admin key');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        api('/admin/users'),
        api('/admin/stats')
      ]);
      setUsers(usersData.users);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await api(`/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      });
      setSuccess('Password reset successfully');
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (userId) => {
    try {
      await api(`/admin/users/${userId}/toggle-active`, { method: 'POST' });
      loadData();
      setSuccess('User status updated');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and all their data?')) return;
    try {
      await api(`/admin/users/${userId}`, { method: 'DELETE' });
      loadData();
      setSuccess('User deleted');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (adminKey) {
      authenticate();
    }
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (!authenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Panel</h1>
          <p style={styles.subtitle}>AI Manager Skills Platform</p>
        </div>

        <div style={styles.card}>
          <h2 style={{ marginBottom: '16px' }}>Enter Admin Key</h2>
          {error && <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>}
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin API Key"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && authenticate()}
          />
          <button
            onClick={authenticate}
            disabled={loading}
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
        <p style={styles.subtitle}>AI Manager Skills Platform</p>
      </div>

      {error && <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>}
      {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}

      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total_users}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.active_users}</div>
            <div style={styles.statLabel}>Active Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total_conversations}</div>
            <div style={styles.statLabel}>Conversations</div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={{ marginBottom: '16px' }}>Users</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...(user.is_active ? styles.badgeGreen : styles.badgeRed) }}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    style={{ ...styles.button, marginRight: '8px', background: '#21262d', color: '#c9d1d9' }}
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => toggleActive(user.id)}
                    style={{ ...styles.button, marginRight: '8px', background: '#21262d', color: '#c9d1d9' }}
                  >
                    {user.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{ ...styles.button, ...styles.buttonDanger }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div style={styles.modal} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Reset Password</h3>
            <p style={{ color: '#8b949e', marginBottom: '16px' }}>
              Reset password for: {selectedUser.email}
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              style={styles.input}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={resetPassword}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                Reset
              </button>
              <button
                onClick={() => { setSelectedUser(null); setNewPassword(''); }}
                style={{ ...styles.button, background: '#21262d', color: '#c9d1d9' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
