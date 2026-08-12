import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ShieldOff, Trash2, Users, Activity, TrendingUp, TrendingDown, Layers, Lock, AlertCircle } from 'lucide-react';
import Loading, { InlineLoader } from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const MODAL_COPY = {
  promote: {
    icon: <ShieldCheck size={18} className="text-success" />,
    title: 'Promote to admin',
    subtitle: (username) => <>Grant <strong>{username}</strong> full admin access, including the ability to view every user's activity and change roles.</>,
    confirmLabel: 'Promote',
    confirmClass: 'btn-primary',
  },
  demote: {
    icon: <ShieldOff size={18} className="text-warning" />,
    title: 'Demote to user',
    subtitle: (username) => <>Remove admin access from <strong>{username}</strong>.</>,
    confirmLabel: 'Demote',
    confirmClass: 'btn-danger',
  },
  delete: {
    icon: <Trash2 size={18} className="text-danger" />,
    title: 'Delete user',
    subtitle: (username) => <>Permanently delete <strong>{username}</strong>'s account, broker credentials, trade history, and positions. This cannot be undone.</>,
    confirmLabel: 'Delete permanently',
    confirmClass: 'btn-danger',
  },
};

const SLOW_REQUEST_HINT_MS = 4000;

const AdminActionModal = ({ target, onCancel, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const slowTimerRef = useRef(null);
  const copy = MODAL_COPY[target.action];
  const isDelete = target.action === 'delete';
  const canSubmit = password && (!isDelete || confirmUsername === target.username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setIsSlow(false);
    slowTimerRef.current = setTimeout(() => setIsSlow(true), SLOW_REQUEST_HINT_MS);
    try {
      await onConfirm(target, password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      clearTimeout(slowTimerRef.current);
      setIsSlow(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="panel-card modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          {copy.icon}
          {copy.title}
        </h3>
        <p className="modal-subtitle">{copy.subtitle(target.username)}</p>

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

          {isDelete && (
            <div className="form-group">
              <label htmlFor="confirm-username">Type <strong>{target.username}</strong> to confirm</label>
              <input
                id="confirm-username"
                type="text"
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                autoFocus={isDelete}
                autoComplete="off"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm your admin password</label>
            <input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={!isDelete}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={`btn ${copy.confirmClass}`} disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? <InlineLoader size={16} /> : isDelete ? <Trash2 size={16} /> : <Lock size={16} />}
              {copy.confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Admin = () => {
  const [users, setUsers] = useState(null);
  const [pendingTarget, setPendingTarget] = useState(null);
  const { user: currentUser } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/admin/users');
        if (res.ok) setUsers(await res.json());
        else setUsers([]);
      } catch (e) {
        console.error('Failed to fetch admin overview:', e);
        setUsers([]);
      }
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (target, password) => {
    if (target.action === 'delete') {
      const res = await apiFetch(`/admin/users/${target.id}/delete`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete user.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      showToast(data.message, 'success');
    } else {
      const res = await apiFetch(`/admin/users/${target.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: target.targetRole, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update role.');
      }
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role: data.user.role } : u)));
      showToast(data.message, 'success');
    }
    setPendingTarget(null);
  };

  if (users === null) {
    return (
      <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Loading label="Loading admin overview..." />
      </div>
    );
  }

  const activeBots = users.filter((u) => u.is_running).length;
  const totalTrades = users.reduce((sum, u) => sum + u.total_trades_count, 0);
  const totalPnl = users.reduce((sum, u) => sum + u.realised_pnl, 0);

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        icon={ShieldCheck}
        title="Admin Overview"
        subtitle="What every user on the platform is doing — bot status, mode, and performance. Broker credentials stay private and encrypted, admin included."
      />

      <section className="kpi-grid stagger-in" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span>TOTAL USERS</span>
            <span className="icon-badge icon-badge-secondary">
              <Users size={16} />
            </span>
          </div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-sub">{users.filter((u) => u.broker_connected).length} with a broker connected</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>ACTIVE BOTS</span>
            <span className={`icon-badge ${activeBots > 0 ? 'icon-badge-success' : 'icon-badge-muted'}`}>
              <Activity size={16} />
            </span>
          </div>
          <div className="kpi-value">{activeBots}</div>
          <div className="kpi-sub">Running right now</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>PLATFORM TRADES</span>
            <span className="icon-badge icon-badge-primary">
              <Layers size={16} />
            </span>
          </div>
          <div className="kpi-value">{totalTrades}</div>
          <div className="kpi-sub">Across all users</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>PLATFORM PNL</span>
            <span className={`icon-badge ${totalPnl >= 0 ? 'icon-badge-success' : 'icon-badge-danger'}`}>
              {totalPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          </div>
          <div className={`kpi-value ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
          <div className="kpi-sub">Realised, combined</div>
        </div>
      </section>

      <div className="panel-card fade-up-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="panel-title">
          <Users size={18} className="text-secondary" />
          Users ({users.length})
        </h2>

        <div className="table-container">
          {users.length === 0 ? (
            <div className="empty-state">
              <Users size={36} className="empty-state-icon" />
              <p>No users yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Broker</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Trades</th>
                  <th>PnL</th>
                  <th>Positions</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        {u.username}{isSelf && <span className="text-muted"> (you)</span>}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-warning'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className={u.broker_connected ? 'text-success' : 'text-muted'}>
                        {u.broker_connected ? 'Connected' : 'Not connected'}
                      </td>
                      <td>{u.paper_trading ? 'Paper' : 'Live'}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`status-dot ${u.is_running ? 'running' : ''}`}></span>
                          {u.is_running ? 'Running' : 'Stopped'}
                        </span>
                      </td>
                      <td>{u.total_trades_count}</td>
                      <td className={u.realised_pnl >= 0 ? 'text-success' : 'text-danger'}>
                        {u.realised_pnl >= 0 ? '+' : ''}{u.realised_pnl.toFixed(2)}
                      </td>
                      <td>{u.active_positions_count}</td>
                      <td className="text-muted">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className={`btn ${u.role === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setPendingTarget({ id: u.id, username: u.username, action: u.role === 'admin' ? 'demote' : 'promote', targetRole: u.role === 'admin' ? 'user' : 'admin' })}
                          >
                            {u.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account.' : undefined}
                            onClick={() => setPendingTarget({ id: u.id, username: u.username, action: 'delete' })}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pendingTarget && (
        <AdminActionModal
          target={pendingTarget}
          onCancel={() => setPendingTarget(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default Admin;
