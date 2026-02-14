import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing tokens on mount
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            fetchUser(accessToken);
        } else {
            // Auto-login as guest
            autoGuestLogin();
        }
    }, []);

    const autoGuestLogin = async () => {
        try {
            const guestId = crypto.randomUUID().slice(0, 8);
            const guestEmail = `guest-${guestId}@guest.local`;
            const guestPassword = crypto.randomUUID();

            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: guestEmail, password: guestPassword })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                await fetchUser(data.access_token);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Auto guest login failed:', err);
            setLoading(false);
        }
    };

    const fetchUser = async (token) => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                // Token invalid, try refresh
                await refreshToken();
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        const refreshTokenValue = localStorage.getItem('refresh_token');
        if (!refreshTokenValue) {
            logout();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshTokenValue })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                await fetchUser(data.access_token);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Token refresh failed:', err);
            logout();
        }
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        await fetchUser(data.access_token);
    };

    const register = async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        await fetchUser(data.access_token);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const token = localStorage.getItem('access_token');

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            getAuthHeaders,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
