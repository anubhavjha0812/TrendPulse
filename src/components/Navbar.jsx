import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Play, Square, RefreshCw, Menu, X, User, LogOut, ShieldCheck } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const Navbar = () => {
  const [status, setStatus] = useState({ is_running: false, paper_trading: true });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const togglePaperTradingMode = async (checked) => {
    try {
      const res = await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify({ paper_trading: checked })
      });
      if (res.ok) {
        await fetchStatus();
        showToast(`Switched to ${checked ? 'paper (simulated)' : 'live'} trading mode.`, 'success');
      } else {
        showToast('Could not toggle execution mode.', 'error');
      }
    } catch (e) {
      showToast('Network error updating trading mode settings.', 'error');
    }
  };

  const toggleBot = async () => {
    setIsActionLoading(true);
    try {
      const endpoint = status.is_running ? 'stop' : 'start';
      const res = await apiFetch(`/bot/${endpoint}`, { method: 'POST' });
      if (res.ok) {
        showToast(status.is_running ? 'Trading engine stopped.' : 'Trading engine started.', 'success');
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

  const handleLogout = () => {
    logout();
    showToast('Logged out.', 'info');
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="logo-section">
        <Activity className="logo-icon" size={26} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>AlgoDxA Term</h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
            NIFTY SPOT SUPERTREND
          </span>
        </div>

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
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
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
                    onChange={(e) => togglePaperTradingMode(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label" style={{ color: status.paper_trading ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {status.paper_trading ? 'Simulated' : 'Live'}
                </span>
              </div>

              <button
                onClick={toggleBot}
                disabled={isActionLoading}
                className={`btn ${status.is_running ? 'btn-danger' : 'btn-primary'}`}
              >
                {isActionLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
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
    </header>
  );
};

export default Navbar;
