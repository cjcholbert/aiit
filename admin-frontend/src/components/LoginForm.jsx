export default function LoginForm({ adminKey, setAdminKey, onLogin, error, loading }) {
  return (
    <div className="container">
      <div className="header">
        <h1 className="header-title">Admin Panel</h1>
        <p className="header-subtitle">AI Manager Skills Platform</p>
      </div>

      <div className="card">
        <h2 className="card-title">Enter Admin Key</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Admin API Key"
          className="input"
          onKeyDown={(e) => e.key === 'Enter' && onLogin()}
        />
        <button
          onClick={onLogin}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
