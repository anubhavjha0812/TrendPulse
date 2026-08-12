import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../utils/api';

const Config = () => {
  const [config, setConfig] = useState(null);
  const [configForm, setConfigForm] = useState(null);
  const [status, setStatus] = useState({ is_running: false });
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const configRes = await apiFetch('/config');
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
        setConfigForm(data);
      }
      const statusRes = await apiFetch('/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (e) {
      console.error('Failed to fetch config data: ', e);
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMartingaleChange = (e) => {
    const val = e.target.value;
    setConfigForm(prev => ({
      ...prev,
      martingale_lots: val.split(',').map(x => x.trim())
    }));
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setIsConfigSaving(true);
    try {
      // Clean martingale_lots formatting
      const cleanedLots = configForm.martingale_lots
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));

      const payload = {
        ...configForm,
        martingale_lots: cleanedLots,
        lot_size: parseInt(configForm.lot_size),
        max_trades: parseInt(configForm.max_trades),
        check_interval: parseInt(configForm.check_interval)
      };

      const res = await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated.config);
        showToast('Configuration saved and applied.', 'success');
      } else {
        const err = await res.json();
        showToast(`Failed to save config: ${err.detail}`, 'error');
      }
    } catch (e) {
      showToast('Error connecting to backend to update configurations.', 'error');
    } finally {
      setIsConfigSaving(false);
    }
  };

  if (!configForm) {
    return (
      <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <Loading label="Loading configuration..." />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        icon={Settings}
        title="Connect Your Broker"
        subtitle="Your own broker credentials and strategy parameters — used only to run the strategy on your account."
        action={status.is_running && (
          <span className="badge badge-warning">LOCKED (ENGINE RUNNING)</span>
        )}
      />
      <div className="panel-card">
        <form onSubmit={handleConfigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="config-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            
            <div className="form-group">
              <label htmlFor="config-username">Username</label>
              <input 
                id="config-username"
                type="text" 
                name="username"
                value={configForm.username} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-password">Password</label>
              <input 
                id="config-password"
                type="password" 
                name="password"
                value={configForm.password} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="config-apikey">API Key</label>
              <input 
                id="config-apikey"
                type="text" 
                name="api_key"
                value={configForm.api_key} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="config-totpsecret">TOTP Secret</label>
              <input 
                id="config-totpsecret"
                type="password" 
                name="totp_secret"
                value={configForm.totp_secret} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-lotsize">Lot Size (Nifty)</label>
              <input 
                id="config-lotsize"
                type="number" 
                name="lot_size"
                value={configForm.lot_size} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-maxtrades">Max Trades/Day (max 3)</label>
              <input
                id="config-maxtrades"
                type="number"
                name="max_trades"
                min={1}
                max={3}
                value={configForm.max_trades}
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-martingale">Martingale Mults (csv, one per trade)</label>
              <input
                id="config-martingale"
                type="text"
                name="martingale_lots"
                value={Array.isArray(configForm.martingale_lots) ? configForm.martingale_lots.join(',') : configForm.martingale_lots}
                disabled={status.is_running}
                onChange={handleMartingaleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-expiry">Option Expiry</label>
              <input 
                id="config-expiry"
                type="text" 
                name="option_expiry"
                placeholder="27FEB2025"
                value={configForm.option_expiry} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-interval">Interval Time (seconds)</label>
              <select 
                id="config-interval"
                name="check_interval"
                value={configForm.check_interval}
                disabled={status.is_running}
                onChange={handleConfigChange}
              >
                <option value={60}>1 Min (Testing)</option>
                <option value={300}>5 Min (Standard)</option>
                <option value={900}>15 Min</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="config-timeframe">Tick Timeframe</label>
              <select 
                id="config-timeframe"
                name="tick_timeframe"
                value={configForm.tick_timeframe}
                disabled={status.is_running}
                onChange={handleConfigChange}
              >
                <option value="ONE_MINUTE">ONE_MINUTE</option>
                <option value="FIVE_MINUTE">FIVE_MINUTE</option>
                <option value="FIFTEEN_MINUTE">FIFTEEN_MINUTE</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="config-starttime">Trade Start Time</label>
              <input 
                id="config-starttime"
                type="text" 
                name="trade_start_time"
                placeholder="09:15"
                value={configForm.trade_start_time} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="config-endtime">Trade End Time</label>
              <input 
                id="config-endtime"
                type="text" 
                name="trade_end_time"
                placeholder="15:20"
                value={configForm.trade_end_time} 
                disabled={status.is_running}
                onChange={handleConfigChange}
                required
              />
            </div>

          </div>

          <button 
            type="submit" 
            className="btn btn-secondary" 
            disabled={status.is_running || isConfigSaving}
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}
          >
            {isConfigSaving ? <RefreshCw size={20} className="animate-spin" /> : 'Save Config Parameters'}
          </button>
        </form>

        {status.is_running && (
          <div style={{ 
            display: 'flex', 
            gap: '0.8rem', 
            padding: '1rem', 
            background: 'rgba(245, 158, 11, 0.05)', 
            border: '1px solid rgba(245, 158, 11, 0.15)', 
            borderRadius: '8px',
            color: 'var(--color-warning)',
            marginTop: '1.5rem'
          }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <span>Configurations are locked while the strategy engine is running. Stop the engine from the top navigation bar to edit credentials and trade parameters.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;
