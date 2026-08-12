import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Play, Square, Menu, X, User, LogOut, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { useToast } from './Toast';
import { InlineLoader } from './Loading';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const SLOW_REQUEST_HINT_MS = 4000;

const MODAL_COPY = {
  live: {
    title: 'Switch to live trading',
    subtitle: <>This turns off the paper sandbox — the bot will place <strong>real orders with real money</strong>. Confirm your account password to continue.</>,
    confirmLabel: 'Go live',
    confirmClass: 'btn-danger',
  },
  start: {
    title: 'Start the trading engine',
    subtitle: (isLive) => isLive
      ? <>The bot will start placing <strong>real orders with real money</strong>. Confirm your account password to continue.</>
      : <>The bot will start running in the <strong>paper trading sandbox</strong>. Confirm your account password to continue.</>,
    confirmLabel: 'Start Engine',
    confirmClass: 'btn-primary',
  },
};

// Step-up auth modal, reused for both "flip to live" and "start the engine" —
// both actions place orders (paper or real), so both re-confirm it's really you.
const PasswordConfirmModal = ({ action, isLive, onCancel, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const slowTimerRef = useRef(null);
  const copy = MODAL_COPY[action];
  const subtitle = typeof copy.subtitle === 'function' ? copy.subtitle(isLive) : copy.subtitle;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setIsSlow(false);
    slowTimerRef.current = setTimeout(() => setIsSlow(true), SLOW_REQUEST_HINT_MS);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      clearTimeout(slowTimerRef.current);
      setIsSlow(false);
      setIsSubmitting(false);
    }
  };

  // Portal straight to <body>: this modal is mounted inside <header
  // className="app-header">, and that header has `backdrop-filter` for its
  // frosted-glass look — which (like `transform`/`filter`) creates a new
  // containing block for descendant `position: fixed` elements. Without the
  // portal, the "fixed" overlay ends up centered within the thin header bar
  // instead of the actual viewport, so it renders squashed near the top.
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="panel-card modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          <Lock size={18} className="text-warning" />
          {copy.title}
        </h3>
        <p className="modal-subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isSlow && !error && (
            <div className="auth-error" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)', color: 'var(--color-warning)' }}>
              <InlineLoader size={16} />
              <span>Still working — the server may be waking up from idle (free-tier hosting). This can take up to a minute.</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="stepup-password">Account password</label>
            <input
              id="stepup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={`btn ${copy.confirmClass}`} disabled={isSubmitting || !password}>
              {isSubmitting ? <InlineLoader size={16} /> : <Lock size={16} />}
              {copy.confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const Navbar = () => {
  const [status, setStatus] = useState({ is_running: false, paper_trading: true });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // 'live' (paper -> live toggle) or 'start' (starting the engine) — both
  // route through the same step-up password modal.
  const [pendingAction, setPendingAction] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch status for Navbar:', e);
    }
  };

  useEffect(() => {
    // Admins don't trade — no personal bot status to poll for.
    if (!isAuthenticated || isAdmin) return;
    fetchStatus();
    // The engine's own running/paper-trading state doesn't need to be fresher
    // than this — and the button here always re-fetches immediately after the
    // user's own start/stop/toggle action anyway, so this interval only
    // affects how fast it notices a change made elsewhere (e.g. another tab).
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const togglePaperTradingMode = async (checked, confirmPassword) => {
    // confirm_password is a separate key from the broker "password" field
    // that this same /config endpoint also accepts — never conflate the two.
    const body = confirmPassword ? { paper_trading: checked, confirm_password: confirmPassword } : { paper_trading: checked };
    const res = await apiFetch('/config', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || 'Could not toggle execution mode.');
    }
    await fetchStatus();
    showToast(`Switched to ${checked ? 'paper (simulated)' : 'live'} trading mode.`, 'success');
  };

  const handlePaperTradeToggle = (checked) => {
    // Going live requires re-entering the account password (step-up
    // confirmation) — going back to paper is always free and immediate.
    if (!checked) {
      setPendingAction('live');
      return;
    }
    togglePaperTradingMode(true).catch(() => showToast('Network error updating trading mode settings.', 'error'));
  };

  const stopBot = async () => {
    setIsActionLoading(true);
    try {
      const res = await apiFetch('/bot/stop', { method: 'POST' });
      if (res.ok) {
        showToast('Trading engine stopped.', 'success');
      } else {
        const err = await res.json();
        showToast(`Action failed: ${err.detail || 'Unknown error'}`, 'error');
      }
      await fetchStatus();
    } catch (e) {
      showToast('Network error trying to control the bot runner.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const startBot = async (confirmPassword) => {
    const res = await apiFetch('/bot/start', {
      method: 'POST',
      body: JSON.stringify({ confirm_password: confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to start trading bot.');
    }
    showToast('Trading engine started.', 'success');
    await fetchStatus();
  };

  const handleEngineButtonClick = () => {
    // Starting requires the account password (real or paper — placing any
    // order needs step-up confirmation); stopping never needs it.
    if (status.is_running) {
      stopBot();
    } else {
      setPendingAction('start');
    }
  };

  const handleModalConfirm = async (password) => {
    if (pendingAction === 'live') {
      await togglePaperTradingMode(false, password);
    } else if (pendingAction === 'start') {
      await startBot(password);
    }
    setPendingAction(null);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out.', 'info');
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="logo-section">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <Activity className="logo-icon" size={26} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>AlgoDxA Term</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
              NIFTY SPOT SUPERTREND
            </span>
          </div>
        </Link>

        <button
          className="nav-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-collapsible ${menuOpen ? 'open' : ''}`}>
        <nav className="main-nav">
          {/* No explicit "Home" link — the logo itself links to "/" (see
              logo-section above). Admins still never see the marketing page:
              Landing.jsx redirects an authenticated admin straight to /admin. */}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Admin</NavLink>
          )}
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
              <NavLink to="/config" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Config</NavLink>
              <NavLink to="/history" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>History</NavLink>
            </>
          )}
          {isAuthenticated && (
            <NavLink to="/profile" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Profile</NavLink>
          )}
        </nav>

        <div className="header-controls">
          {isAuthenticated && !isAdmin && (
            <>
              <div className="toggle-container">
                <span className="toggle-label">Paper Trade</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={status.paper_trading}
                    disabled={status.is_running}
                    onChange={(e) => handlePaperTradeToggle(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label" style={{ color: status.paper_trading ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {status.paper_trading ? 'Simulated' : 'Live'}
                </span>
              </div>

              <button
                onClick={handleEngineButtonClick}
                disabled={isActionLoading}
                className={`btn ${status.is_running ? 'btn-danger' : 'btn-primary'}`}
              >
                {isActionLoading ? (
                  <InlineLoader size={16} />
                ) : status.is_running ? (
                  <>
                    <Square size={16} fill="currentColor" /> Stop Engine
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> Start Engine
                  </>
                )}
              </button>
            </>
          )}

          {isAuthenticated ? (
            <div className="user-chip">
              {isAdmin ? <ShieldCheck size={15} className="text-primary" /> : <User size={15} className="text-muted" />}
              <span>{user?.username}</span>
              <button className="btn btn-secondary user-logout-btn" onClick={handleLogout} title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="auth-nav-links">
              <NavLink to="/login" className="btn btn-secondary">Log In</NavLink>
              <NavLink to="/signup" className="btn btn-primary">Sign Up</NavLink>
            </div>
          )}
        </div>
      </div>

      {pendingAction && (
        <PasswordConfirmModal
          action={pendingAction}
          isLive={!status.paper_trading}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </header>
  );
};

export default Navbar;
