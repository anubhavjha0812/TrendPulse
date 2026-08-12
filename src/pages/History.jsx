import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../utils/api';

const HistoryPage = () => {
  const [trades, setTrades] = useState(null);
  const [paperTrading, setPaperTrading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesRes, statusRes] = await Promise.all([
          apiFetch('/trades'),
          apiFetch('/status'),
        ]);
        if (tradesRes.ok) setTrades(await tradesRes.json());
        if (statusRes.ok) {
          const status = await statusRes.json();
          setPaperTrading(status.paper_trading);
        }
      } catch (e) {
        console.error('Failed to fetch trade history:', e);
        setTrades([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (trades === null) {
    return (
      <div className="page-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <Loading label="Loading trade history..." />
      </div>
    );
  }

  const filtered = trades.filter((t) =>
    (t.trading_symbol || '').toLowerCase().includes(search.toLowerCase())
  );

  const closedTrades = trades.filter((t) => t.pnl !== null && t.pnl !== undefined);
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = closedTrades.filter((t) => t.pnl >= 0).length;

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        icon={HistoryIcon}
        title="Trade History"
        subtitle="Every trade the bot has taken — today's live buffer plus the archived record synced to Neon at market close."
      />

      <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span>TOTAL TRADES</span>
            <Layers size={16} className="text-muted" />
          </div>
          <div className="kpi-value">{trades.length}</div>
          <div className="kpi-sub">{closedTrades.length} closed, {trades.length - closedTrades.length} open</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>REALISED PNL</span>
            {totalPnl >= 0 ? (
              <TrendingUp size={16} className="text-success" />
            ) : (
              <TrendingDown size={16} className="text-danger" />
            )}
          </div>
          <div className={`kpi-value ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
          <div className="kpi-sub">Across {closedTrades.length} closed trade(s)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>WIN RATE</span>
          </div>
          <div className="kpi-value">
            {closedTrades.length ? `${((wins / closedTrades.length) * 100).toFixed(0)}%` : 'N/A'}
          </div>
          <div className="kpi-sub">{wins} winning / {closedTrades.length - wins} losing</div>
        </div>
      </section>

      <div className="panel-card">
        <h2 className="panel-title">
          <HistoryIcon size={18} className="text-secondary" />
          All Trades ({filtered.length})
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.6rem' }}>
            <Search size={14} className="text-muted" style={{ marginRight: '0.4rem' }} />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', fontSize: '0.8rem', outline: 'none', width: '160px' }}
            />
          </div>
        </h2>

        <div className="table-container">
          {!paperTrading ? (
            <div className="empty-state">
              <HistoryIcon size={36} className="empty-state-icon" />
              <p>Live mode doesn't archive trades locally.</p>
              <span>Trade history is populated by the paper trading simulator.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <HistoryIcon size={36} className="empty-state-icon" />
              <p>No trades match.</p>
              <span>{trades.length === 0 ? 'No trades taken yet.' : 'Try a different symbol filter.'}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Strike</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>PnL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isSell = t.transaction_type === 'SELL';
                  const hasPnl = t.pnl !== null && t.pnl !== undefined;
                  return (
                    <tr key={t.id}>
                      <td className="text-muted">
                        {t.timestamp ? new Date(t.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td>{t.trading_symbol}</td>
                      <td>
                        <span className={isSell ? 'text-danger' : 'text-success'}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.option_type === 'CE' ? 'badge-success' : 'badge-danger'}`}>
                          {t.strike_price?.toFixed(0)}{t.option_type}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{t.quantity}</td>
                      <td>{t.price?.toFixed(2)}</td>
                      <td className={hasPnl ? (t.pnl >= 0 ? 'text-success' : 'text-danger') : 'text-muted'}>
                        {hasPnl ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          t.status === 'COMPLETED' ? 'badge-success' :
                          t.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
