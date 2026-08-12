import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  DollarSign,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  Terminal as TerminalIcon,
  Search
} from 'lucide-react';
import { apiFetch, wsUrl } from '../utils/api';
import Loading from '../components/Loading';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState({
    is_running: false,
    paper_trading: true,
    trades_taken_today: 0,
    total_trades_count: 0,
    previous_signal: null,
    total_pnl: 0.0,
    realised_pnl: 0.0,
    unrealised_pnl: 0.0,
    active_positions_count: 0,
    username: '',
    expiry: ''
  });

  const [config, setConfig] = useState({ max_trades: 3 });
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [marketStatus, setMarketStatus] = useState({
    spot_price: null,
    strike_price: null,
    signal: 'NEUTRAL',
    direction: 0,
    market_state: 'CLOSED'
  });

  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');

  const terminalEndRef = useRef(null);
  const wsRef = useRef(null);

  // Load initial data
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchUpdates, 4000);
    return () => clearInterval(interval);
  }, []);

  // Set up WebSocket for Logs
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Scroll to bottom of terminal whenever logs or filters change
  useEffect(() => {
    scrollToBottom();
  }, [logs, logSearch]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(wsUrl('/logs/ws'));
      wsRef.current = ws;

      ws.onopen = () => console.log('Logs WebSocket connected.');

      ws.onmessage = (event) => {
        setLogs((prevLogs) => {
          if (prevLogs.includes(event.data)) return prevLogs;
          return [...prevLogs, event.data];
        });
      };

      ws.onclose = () => {
        console.log('Logs WebSocket closed.');
      };

      ws.onerror = () => {};
    } catch (e) {
      console.error('WebSocket connection failed');
    }
  };

  const fetchInitialData = async () => {
    try {
      const configRes = await apiFetch('/config');
      if (configRes.ok) {
        setConfig(await configRes.json());
      }

      const logRes = await apiFetch('/logs');
      if (logRes.ok) {
        setLogs(await logRes.json());
      }

      await fetchUpdates();
    } catch (e) {
      console.error('Failed to fetch initial backend configurations: ', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpdates = async () => {
    try {
      const statusRes = await apiFetch('/status');
      if (statusRes.ok) setStatus(await statusRes.json());

      const positionsRes = await apiFetch('/positions');
      if (positionsRes.ok) setPositions(await positionsRes.json());

      const ordersRes = await apiFetch('/orders');
      if (ordersRes.ok) setOrders(await ordersRes.json());

      const marketRes = await apiFetch('/market-status');
      if (marketRes.ok) setMarketStatus(await marketRes.json());
    } catch (e) {
      console.error('Error fetching updates from backend API: ', e);
    }
  };

  const scrollToBottom = () => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getLogClass = (line) => {
    if (line.includes('failed') || line.includes('Failed')) return 'log-line error';
    if (line.includes('closed') || line.includes('stopped')) return 'log-line warning';
    return 'log-line info';
  };

  const filteredLogs = logs.filter(log => log.toLowerCase().includes(logSearch.toLowerCase()));

  if (isLoading) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <Loading label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '0 2rem 2rem 2rem' }}>

      {/* KPI METRIC CARDS */}
      <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Status Card */}
        <div className={`kpi-card ${status.is_running ? 'active' : ''}`}>
          <div className="kpi-header">
            <span>SYSTEM STATE</span>
            <Sliders size={16} className={status.is_running ? 'text-success' : 'text-muted'} />
          </div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`status-dot ${status.is_running ? 'running' : ''}`}></span>
            {status.is_running ? 'RUNNING' : 'STOPPED'}
          </div>
          <div className="kpi-sub">
            Mode: {status.paper_trading ? 'Paper Broker Sandbox' : 'SmartConnect Live Segment'}
          </div>
        </div>

        {/* Live PnL Card */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>TOTAL PNL (TODAY)</span>
            <DollarSign size={16} className={status.total_pnl >= 0 ? 'text-success' : 'text-danger'} />
          </div>
          <div className={`kpi-value ${status.total_pnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {status.total_pnl >= 0 ? '+' : ''}{status.total_pnl.toFixed(2)}
          </div>
          <div className="kpi-sub" style={{ display: 'flex', gap: '0.8rem' }}>
            <span>
              Realised: <span className={status.realised_pnl >= 0 ? 'text-success' : 'text-danger'}>
                {status.realised_pnl >= 0 ? '+' : ''}{status.realised_pnl.toFixed(2)}
              </span>
            </span>
            <span>
              Unrealised: <span className={status.unrealised_pnl >= 0 ? 'text-success' : 'text-danger'}>
                {status.unrealised_pnl >= 0 ? '+' : ''}{status.unrealised_pnl.toFixed(2)}
              </span>
            </span>
          </div>
        </div>

        {/* Trades Executed */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>TRADES EXECUTED</span>
            <Layers size={16} />
          </div>
          <div className="kpi-value">
            {status.trades_taken_today} <span style={{ fontSize: '1rem', color: 'var(--color-text-dark)' }}>/ {config.max_trades}</span>
          </div>
          <div className="kpi-sub">
            Cumulative trades taken: {status.total_trades_count}
          </div>
        </div>

        {/* NIFTY SPOT Signal */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>NIFTY SPOT STATUS</span>
            {marketStatus.signal === 'BUY' ? (
              <TrendingUp size={16} className="text-success" />
            ) : marketStatus.signal === 'SELL' ? (
              <TrendingDown size={16} className="text-danger" />
            ) : (
              <Activity size={16} className="text-muted" />
            )}
          </div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {marketStatus.spot_price ? `${marketStatus.spot_price.toFixed(1)}` : 'N/A'}
            <span className={`badge ${
              marketStatus.signal === 'BUY' ? 'badge-success' : 
              marketStatus.signal === 'SELL' ? 'badge-danger' : 'badge-warning'
            }`} style={{ fontSize: '0.65rem' }}>
              {marketStatus.signal}
            </span>
          </div>
          <div className="kpi-sub" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ATM Strike: {marketStatus.strike_price || 'Calculating...'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem' }}>
              <span className={`status-dot ${marketStatus.market_state === 'OPEN' ? 'running' : ''}`} style={{ width: '6px', height: '6px', background: marketStatus.market_state === 'OPEN' ? 'var(--color-success)' : 'var(--color-text-muted)' }}></span>
              {marketStatus.market_state}
            </span>
          </div>
        </div>
      </section>

      {/* DASHBOARD DETAILS GRID */}
      <section className="main-dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {/* Active Positions */}
        <div className="panel-card">
          <h2 className="panel-title">
            <Layers size={18} className="text-success" />
            Active Positions ({positions.length})
          </h2>
          
          <div className="table-container">
            {positions.length === 0 ? (
              <div className="empty-state">
                <Layers size={36} className="empty-state-icon" />
                <p>No active positions.</p>
                <span>Orders triggered by SuperTrend changes will show here.</span>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Symbol</th>
                    <th>Strike</th>
                    <th>Type</th>
                    <th>Net Qty</th>
                    <th>Entry Price</th>
                    <th>LTP</th>
                    <th>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => {
                    const isProfit = parseFloat(pos.pnl) >= 0;
                    return (
                      <tr key={pos.symboltoken}>
                        <td>{pos.symboltoken}</td>
                        <td>{pos.tradingsymbol}</td>
                        <td>{pos.strikeprice}</td>
                        <td>
                          <span className={`badge ${pos.optiontype === 'CE' ? 'badge-success' : 'badge-danger'}`}>
                            {pos.optiontype}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{pos.netqty}</td>
                        <td>{pos.entry_price || 'Live'}</td>
                        <td>{pos.ltp}</td>
                        <td className={isProfit ? 'text-success' : 'text-danger'}>
                          {isProfit ? '+' : ''}{parseFloat(pos.pnl).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="panel-card">
          <h2 className="panel-title">
            <BookOpen size={18} className="text-secondary" />
            Order Book ({orders.length})
          </h2>
          
          <div className="table-container">
            {orders.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={36} className="empty-state-icon" />
                <p>No orders registered today.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>ID</th>
                    <th>Symbol</th>
                    <th>Action</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => {
                    const isBuy = ord.transactiontype === 'BUY';
                    return (
                      <tr key={ord.orderid || idx}>
                        <td className="text-muted">{ord.updatetime ? ord.updatetime.split(' ')[1] : 'N/A'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{ord.orderid}</td>
                        <td>{ord.tradingsymbol}</td>
                        <td>
                          <span className={isBuy ? 'text-success' : 'text-danger'}>
                            {ord.transactiontype}
                          </span>
                        </td>
                        <td>{ord.quantity}</td>
                        <td>{parseFloat(ord.price).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${
                            ord.orderstatus === 'complete' || ord.orderstatus === 'completed' ? 'badge-success' : 
                            ord.orderstatus === 'rejected' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {ord.orderstatus.toUpperCase()}
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

      </section>

      {/* ACTIVITY FEED */}
      <section className="terminal-card" style={{ marginTop: '1.5rem' }}>
        <div className="terminal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TerminalIcon size={18} className="text-primary" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Activity Feed</h2>
          </div>

          <div className="terminal-controls">
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
              <Search size={14} className="text-muted" style={{ marginRight: '0.3rem' }} />
              <input
                type="text"
                placeholder="Search activity..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', outline: 'none', width: '160px' }}
              />
            </div>
          </div>
        </div>
        <div className="terminal-body">
          {filteredLogs.length === 0 ? (
            <div className="text-muted" style={{ fontStyle: 'italic', padding: '1rem' }}>No activity yet.</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className={getLogClass(log)}>
                {log}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
