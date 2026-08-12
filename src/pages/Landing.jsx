import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Zap, Terminal, History, Users, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Zap,
    badge: 'icon-badge-warning',
    title: 'Dynamic Execution',
    desc: 'Automatically selects ATM strikes and punches orders based on real-time NIFTY spot indicators.',
  },
  {
    icon: Shield,
    badge: 'icon-badge-success',
    title: 'Risk Managed',
    desc: 'Built-in DTE-aware target and stop-loss mechanisms with martingale position sizing support.',
  },
  {
    icon: Terminal,
    badge: 'icon-badge-primary',
    title: 'Live Paper Sandbox',
    desc: 'Paper trading runs off the real market feed, not fake data — test safely before going live.',
  },
  {
    icon: History,
    badge: 'icon-badge-secondary',
    title: 'Full Trade History',
    desc: 'Every trade archived and searchable, with running realised PnL and a win-rate breakdown.',
  },
  {
    icon: Users,
    badge: 'icon-badge-warning',
    title: 'Role-Based Access',
    desc: "Admins control the engine and credentials; other accounts get read-only visibility into performance.",
  },
  {
    icon: Activity,
    badge: 'icon-badge-danger',
    title: 'Real-Time Terminal',
    desc: "Stream the strategy's decision-making live over WebSocket, filterable by log level.",
  },
];

// Decorative equity-curve path for the hero mockup — purely illustrative, not
// wired to real data (real data lives in the actual dashboard post-login).
const HERO_CHART_POINTS = [
  [0, 118], [40, 112], [80, 122], [120, 98], [160, 104], [200, 78],
  [240, 86], [280, 60], [320, 68], [360, 44], [400, 52], [440, 30],
  [480, 38], [520, 16], [560, 22],
];
const HERO_CHART_LINE = HERO_CHART_POINTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
const HERO_CHART_FILL = `${HERO_CHART_LINE} L560,160 L0,160 Z`;
const HERO_CHART_LAST = HERO_CHART_POINTS[HERO_CHART_POINTS.length - 1];

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <section className="landing-hero">
        <span className="landing-eyebrow fade-up-in">
          <Activity size={13} /> NIFTY Options Trading Engine
        </span>
        <h1 className="landing-title fade-up-in" style={{ animationDelay: '0.08s' }}>
          Trade the SuperTrend<br />on autopilot.
        </h1>
        <p className="landing-subtitle fade-up-in" style={{ animationDelay: '0.16s' }}>
          An automated NIFTY options-selling strategy with live signal generation,
          DTE-aware risk management, and a full paper trading sandbox — so you can
          test against real market data before a single rupee is on the line.
        </p>

        <div className="landing-cta-row fade-up-in" style={{ animationDelay: '0.24s' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary landing-cta">
              Enter Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary landing-cta">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary landing-cta">
                Log In
              </Link>
            </>
          )}
        </div>

        <div className="landing-badges fade-up-in" style={{ animationDelay: '0.32s' }}>
          <span><TrendingUp size={14} /> SuperTrend signals</span>
          <span><Shield size={14} /> DTE-aware risk controls</span>
          <span><Terminal size={14} /> Paper + live modes</span>
        </div>
      </section>

      <div className="landing-hero-visual fade-up-in" style={{ animationDelay: '0.4s' }}>
        <div className="landing-hero-visual-glow" />
        <div className="panel-card">
          <div className="hero-chart-header">
            <div className="hero-chart-header-left">
              <Activity size={14} className="text-primary" />
              NIFTY 50 · SuperTrend Signal
            </div>
            <div className="hero-chart-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className="hero-chart-body">
            <svg className="hero-chart-svg" viewBox="0 0 560 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="hero-chart-fill" d={HERO_CHART_FILL} fill="url(#heroChartGradient)" />
              <path className="hero-chart-line" d={HERO_CHART_LINE} />
              <circle
                className="hero-chart-dot"
                cx={HERO_CHART_LAST[0]}
                cy={HERO_CHART_LAST[1]}
                r="4.5"
                fill="var(--color-primary)"
              />
            </svg>
          </div>
          <div className="hero-chart-footer">
            <span>09:15</span>
            <span>11:30</span>
            <span>13:45</span>
            <span>15:20</span>
          </div>
        </div>
      </div>

      <section className="landing-features stagger-in">
        {FEATURES.map(({ icon: Icon, badge, title, desc }) => (
          <div className="panel-card landing-feature-card" key={title}>
            <span className={`icon-badge icon-badge-lg ${badge}`}>
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p className="text-muted">{desc}</p>
          </div>
        ))}
      </section>

      {!isAuthenticated && (
        <section className="panel-card landing-final-cta fade-up-in">
          <div>
            <h2>Ready to see it in action?</h2>
            <p className="text-muted">Create an account to explore the dashboard, run the paper trading sandbox, and see the strategy live.</p>
          </div>
          <Link to="/signup" className="btn btn-primary landing-cta">
            Create Account <ArrowRight size={18} />
          </Link>
        </section>
      )}
    </div>
  );
};

export default Landing;
