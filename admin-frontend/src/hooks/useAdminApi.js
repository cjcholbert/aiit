import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8001';

export function useAdminApi() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const api = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail);
    }
    return res.json();
  }, [adminKey]);

  const apiRaw = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'X-Admin-Key': adminKey,
        ...options.headers,
      },
    });
    if (!res.ok) {
      throw new Error('Export failed');
    }
    return res;
  }, [adminKey]);

  const authenticate = useCallback(async () => {
    setError('');
    try {
      await api('/admin/stats');
      localStorage.setItem('adminKey', adminKey);
      setAuthenticated(true);
      return true;
    } catch (err) {
      setError('Invalid admin key');
      return false;
    }
  }, [api, adminKey]);

  const logout = useCallback(() => {
    localStorage.removeItem('adminKey');
    setAdminKey('');
    setAuthenticated(false);
  }, []);

  const showSuccess = useCallback((msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 5000);
  }, []);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  const clearAlerts = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    adminKey,
    setAdminKey,
    authenticated,
    setAuthenticated,
    error,
    success,
    api,
    apiRaw,
    authenticate,
    logout,
    showSuccess,
    showError,
    clearAlerts,
  };
}
