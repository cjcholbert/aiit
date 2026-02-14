import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const autoGuestLogin = useCallback(async () => {
        try {
            const guestId = Math.random().toString(36).slice(2, 10);
            const guestEmail = `guest-${guestId}@guest.ams.app`;
            const guestPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: guestEmail, password: guestPassword })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                const userRes = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                }
            }
        } catch (err) {
            console.error('Auto guest login failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                await autoGuestLogin();
                return;
            }

            // Try existing token
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                // fall through to refresh
            }

            // Try refresh
            const refreshTokenValue = localStorage.getItem('refresh_token');
            if (refreshTokenValue) {
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
                        const userRes = await fetch(`${API_BASE}/auth/me`, {
                            headers: { 'Authorization': `Bearer ${data.access_token}` }
                        });
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            setUser(userData);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (err) {
                    // fall through to guest
                }
            }

            // All failed — clear and auto-guest
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            await autoGuestLogin();
        };

        init();
    }, [autoGuestLogin]);

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
        const userRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        if (userRes.ok) {
            setUser(await userRes.json());
        }
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
        const userRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        if (userRes.ok) {
            setUser(await userRes.json());
        }
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
            autoGuestLogin,
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
