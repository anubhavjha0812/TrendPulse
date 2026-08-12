// Backend URL is injected at build time via VITE_API_BASE_URL (set this in
// Vercel's project env vars to the deployed Render backend, e.g.
// https://algodxa-backend.onrender.com/api). Falls back to localhost for
// local dev when the var isn't set. WS_BASE is derived from it automatically
// (http -> ws, https -> wss) so only one URL needs to be configured.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const WS_BASE = API_BASE.replace(/^http/, 'ws');

export const getToken = () => localStorage.getItem('token');

// Free-tier hosting (Render backend, Neon database) both suspend when idle —
// the first request after a quiet period can take 30-60s+ to wake everything
// up. Without a timeout, a truly stuck request just hangs the UI forever with
// no feedback, indistinguishable from "broken". This gives cold starts room
// to succeed while still failing cleanly, with a clear message, if something
// really is stuck.
const REQUEST_TIMEOUT_MS = 60000;

/**
 * fetch() wrapper that attaches the JWT (if present), times out with a clear
 * error instead of hanging indefinitely, and auto-logs-out on 401
 * (expired/invalid token) by clearing storage and bouncing to /login.
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error("The server is taking longer than usual to respond (it may be waking up from idle). Please try again in a moment.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

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
