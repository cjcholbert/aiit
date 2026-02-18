import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, autoGuestLogin } = useAuth();
    const navigate = useNavigate();
    const [guestLoading, setGuestLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setError('');
        setGuestLoading(true);
        try {
            await autoGuestLogin();
            navigate('/welcome');
        } catch (err) {
            setError('Guest login failed. Please try again.');
        } finally {
            setGuestLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="brand" style={{ justifyContent: 'center', borderBottom: 'none', marginBottom: 0 }}>
                        <div className="brand-logo">AI</div>
                        <div className="brand-name">Your AI Iteration</div>
                    </div>
                    <p className="auth-subtitle">Sign in to continue your learning journey</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or</div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleGuestLogin}
                    disabled={guestLoading || loading}
                    style={{ width: '100%' }}
                >
                    {guestLoading ? 'Starting guest session...' : 'Continue as Guest'}
                </button>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register" className="btn-link">Create one</Link>
                </div>
            </div>
        </div>
    );
}
