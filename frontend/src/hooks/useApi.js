import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Network error messages
const NETWORK_ERRORS = {
    offline: 'You appear to be offline. Please check your internet connection.',
    timeout: 'Request timed out. The server may be slow or unavailable.',
    serverError: 'Server error. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again.'
};

// Helper to extract error message from FastAPI error response
const extractErrorMessage = (error, fallback = 'Request failed') => {
    if (!error) return fallback;

    // If detail is a string, return it
    if (typeof error.detail === 'string') {
        return error.detail;
    }

    // If detail is an array (validation errors), format them
    if (Array.isArray(error.detail)) {
        return error.detail
            .map(e => {
                const field = e.loc ? e.loc.slice(1).join('.') : 'field';
                return `${field}: ${e.msg}`;
            })
            .join('; ');
    }

    // If detail is an object, try to stringify it
    if (typeof error.detail === 'object') {
        return JSON.stringify(error.detail);
    }

    return fallback;
};

// Check if error is a network error
const isNetworkError = (error) => {
    return error instanceof TypeError && error.message === 'Failed to fetch';
};

// Sleep utility for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useApi() {
    const { getAuthHeaders, logout } = useAuth();

    const fetchWithAuth = async (endpoint, options = {}, retryConfig = {}) => {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            retryOn = [408, 429, 500, 502, 503, 504],
            timeout = 30000
        } = retryConfig;

        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers
        };

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const res = await fetch(`${API_BASE}${endpoint}`, {
                    ...options,
                    headers,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Handle 401 by logging out (redirects to login page)
                if (res.status === 401) {
                    logout();
                    throw new ApiError('Session expired. Please sign in again.', 401, false);
                }

                // Check if we should retry
                if (retryOn.includes(res.status) && attempt < maxRetries) {
                    const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
                    await sleep(delay);
                    continue;
                }

                return res;
            } catch (error) {
                lastError = error;

                // Don't retry if it's an ApiError (already handled)
                if (error instanceof ApiError) {
                    throw error;
                }

                // Handle abort/timeout
                if (error.name === 'AbortError') {
                    throw new ApiError(NETWORK_ERRORS.timeout, 0, true);
                }

                // Handle network errors with retry
                if (isNetworkError(error)) {
                    if (attempt < maxRetries) {
                        const delay = retryDelay * Math.pow(2, attempt);
                        await sleep(delay);
                        continue;
                    }
                    throw new ApiError(
                        navigator.onLine ? NETWORK_ERRORS.unknown : NETWORK_ERRORS.offline,
                        0,
                        true
                    );
                }

                // Unknown error
                if (attempt >= maxRetries) {
                    throw new ApiError(NETWORK_ERRORS.unknown, 0, true);
                }
            }
        }

        throw lastError;
    };

    const get = async (endpoint, retryConfig) => {
        const res = await fetchWithAuth(endpoint, {}, retryConfig);
        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new ApiError(
                extractErrorMessage(error, 'Request failed'),
                res.status,
                res.status >= 500
            );
        }
        return res.json();
    };

    const post = async (endpoint, data, retryConfig) => {
        const res = await fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }, { ...retryConfig, maxRetries: 0 }); // Don't retry POST by default

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new ApiError(
                extractErrorMessage(error, 'Request failed'),
                res.status,
                res.status >= 500
            );
        }
        return res.json();
    };

    const put = async (endpoint, data, retryConfig) => {
        const res = await fetchWithAuth(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, { ...retryConfig, maxRetries: 0 }); // Don't retry PUT by default

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new ApiError(
                extractErrorMessage(error, 'Request failed'),
                res.status,
                res.status >= 500
            );
        }
        return res.json();
    };

    const del = async (endpoint, retryConfig) => {
        const res = await fetchWithAuth(endpoint, {
            method: 'DELETE'
        }, { ...retryConfig, maxRetries: 0 }); // Don't retry DELETE by default

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new ApiError(
                extractErrorMessage(error, 'Request failed'),
                res.status,
                res.status >= 500
            );
        }
        return res.json();
    };

    const uploadFile = async (endpoint, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });

        if (res.status === 401) {
            logout();
            throw new ApiError('Session expired. Please sign in again.', 401, false);
        }

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new ApiError(
                extractErrorMessage(error, 'Upload failed'),
                res.status,
                res.status >= 500
            );
        }

        return res.json();
    };

    return { get, post, put, del, uploadFile };
}

// Custom error class for API errors
export class ApiError extends Error {
    constructor(message, statusCode = 0, retryable = false) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.retryable = retryable;
    }
}
