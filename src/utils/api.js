// Backend URL is injected at build time via VITE_API_BASE_URL (set this in
// Vercel's project env vars to the deployed Render backend, e.g.
// https://algodxa-backend.onrender.com/api). Falls back to localhost for
// local dev when the var isn't set. WS_BASE is derived from it automatically
// (http -> ws, https -> wss) so only one URL needs to be configured.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const WS_BASE = API_BASE.replace(/^http/, 'ws');

export const getToken = () => localStorage.getItem('token');

/**
 * fetch() wrapper that attaches the JWT (if present) and auto-logs-out on 401
 * (expired/invalid token) by clearing storage and bouncing to /login.
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return res;
};

/** Builds an authenticated WebSocket URL (token passed as a query param — browsers
 * can't set Authorization headers on the WS handshake). */
export const wsUrl = (path) => {
  const token = getToken();
  return `${WS_BASE}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};
