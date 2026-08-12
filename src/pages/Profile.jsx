import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Shield, ShieldCheck, Activity, DollarSign, Key, ArrowRight } from 'lucide-react';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState(null);
  const [brokerConfig, setBrokerConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Admins don't trade — no personal status/broker config to show.
        if (isAdmin) return;

        const statusRes = await apiFetch('/status');
        if (statusRes.ok) setStatus(await statusRes.json());

        const configRes = await apiFetch('/config');
        if (configRes.ok) setBrokerConfig(await configRes.json());
      } catch (e) {
        console.error('Failed to fetch profile data');
      }
    };
    fetchData();
  }, [isAdmin]);

  if (!user || (!isAdmin && !status)) {
    return (
      <div className="page-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <Loading label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

      <div className="panel-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', padding: '3rem 2rem' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={48} color="white" />
        </div>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{user.username}</h1>
          <p className="text-muted" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAdmin ? <ShieldCheck size={16} className="text-primary" /> : <Shield size={16} className="text-muted" />}
            <span className={`badge ${isAdmin ? 'badge-success' : 'badge-warning'}`}>{user.role?.toUpperCase()}</span>
            {user.created_at && (
              <span>Member since {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 0.4rem' }}>Platform oversight</h2>
            <p className="text-muted" style={{ margin: 0 }}>Admin accounts don't connect a broker or trade — see what every user is doing from the Admin overview.</p>
          </div>
          <Link to="/admin" className="btn btn-primary">
            Go to Admin Overview <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {brokerConfig && (
            <div className="panel-card">
              <h2 className="panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <Key size={18} className="text-warning" /> Broker Account
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">SmartAPI Username</span>
                  <span style={{ fontWeight: '500' }}>{brokerConfig.username || 'Not connected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">API Key</span>
                  <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>
                    {brokerConfig.api_key || 'Not connected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Trading Segment</span>
                  <span style={{ fontWeight: '500' }}>NFO (Options)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Current Option Expiry</span>
                  <span style={{ fontWeight: '500' }}>{brokerConfig.option_expiry}</span>
                </div>
              </div>
            </div>
          )}

          <div className="panel-card">
            <h2 className="panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              System Statistics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} /> Total Trades Executed
                </span>
                <span style={{ fontWeight: '500' }}>{status.total_trades_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={16} /> Total PnL (All Time)
                </span>
                <span className={status.realised_pnl >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>
                  {status.realised_pnl >= 0 ? '+' : ''}{status.realised_pnl.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} /> Trading Mode
                </span>
                <span style={{ fontWeight: '500' }}>{status.paper_trading ? 'Paper (Simulated)' : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
