import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Zap, Terminal, History, Users, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Zap,
    color: 'text-warning',
    title: 'Dynamic Execution',
    desc: 'Automatically selects ATM strikes and punches orders based on real-time NIFTY spot indicators.',
  },
  {
    icon: Shield,
    color: 'text-success',
    title: 'Risk Managed',
    desc: 'Built-in DTE-aware target and stop-loss mechanisms with martingale position sizing support.',
  },
  {
    icon: Terminal,
    color: 'text-primary',
    title: 'Live Paper Sandbox',
    desc: 'Paper trading runs off the real market feed, not fake data — test safely before going live.',
  },
  {
    icon: History,
    color: 'text-secondary',
    title: 'Full Trade History',
    desc: 'Every trade archived and searchable, with running realised PnL and a win-rate breakdown.',
  },
  {
    icon: Users,
    color: 'text-warning',
    title: 'Role-Based Access',
    desc: "Admins control the engine and credentials; other accounts get read-only visibility into performance.",
  },
  {
    icon: Activity,
    color: 'text-danger',
    title: 'Real-Time Terminal',
    desc: "Stream the strategy's decision-making live over WebSocket, filterable by log level.",
  },
];

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <section className="landing-hero">
        <span className="landing-eyebrow">
          <Activity size={13} /> NIFTY Options Trading Engine
        </span>
        <h1 className="landing-title">Trade the SuperTrend<br />on autopilot.</h1>
        <p className="landing-subtitle">
          An automated NIFTY options-selling strategy with live signal generation,
          DTE-aware risk management, and a full paper trading sandbox — so you can
          test against real market data before a single rupee is on the line.
        </p>

        <div className="landing-cta-row">
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

        <div className="landing-badges">
          <span><TrendingUp size={14} /> SuperTrend signals</span>
          <span><Shield size={14} /> DTE-aware risk controls</span>
          <span><Terminal size={14} /> Paper + live modes</span>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <div className="panel-card landing-feature-card" key={title}>
            <Icon size={28} className={color} />
            <h3>{title}</h3>
            <p className="text-muted">{desc}</p>
          </div>
        ))}
      </section>

      {!isAuthenticated && (
        <section className="panel-card landing-final-cta">
          <div>
            <h2>Ready to see it in action?</h2>
            <p className="text-muted">Create an account — the first one to sign up becomes an admin automatically.</p>
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
