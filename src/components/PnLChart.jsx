import React, { useId, useMemo, useRef, useState } from 'react';
import { LineChart } from 'lucide-react';

const WIDTH = 600;
const HEIGHT = 170;

/**
 * Cumulative realised-PnL equity curve, built from closed trades. Single
 * series, status-colored (green if net positive, red if net negative) —
 * consistent with how PnL is colored everywhere else in the app, so no
 * separate legend/palette is introduced. Ships with a hover crosshair +
 * tooltip; the underlying trade-by-trade data has its own table view on the
 * History page, so this chart doesn't duplicate one.
 */
const PnLChart = ({ trades }) => {
  const gradientId = useId();
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = useMemo(() => {
    const closed = trades
      .filter((t) => t.pnl !== null && t.pnl !== undefined && t.timestamp)
      .slice()
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let running = 0;
    return closed.map((t) => {
      running += t.pnl;
      return { time: t.timestamp, cum: running, symbol: t.trading_symbol, tradePnl: t.pnl };
    });
  }, [trades]);

  if (points.length < 2) {
    return (
      <div className="empty-state">
        <LineChart size={36} className="empty-state-icon" />
        <p>Not enough closed trades yet.</p>
        <span>The equity curve appears once at least two trades have closed.</span>
      </div>
    );
  }

  const cums = points.map((p) => p.cum);
  const minVal = Math.min(0, ...cums);
  const maxVal = Math.max(0, ...cums);
  const range = maxVal - minVal || 1;

  const xScale = (i) => (i / (points.length - 1)) * WIDTH;
  const yScale = (val) => HEIGHT - ((val - minVal) / range) * HEIGHT;
  const baselineY = yScale(0);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.cum)}`).join(' ');
  const areaPath = `${linePath} L${xScale(points.length - 1)},${baselineY} L${xScale(0)},${baselineY} Z`;

  const finalPnl = points[points.length - 1].cum;
  const isPositive = finalPnl >= 0;
  const seriesColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="pnl-chart-card">
      <svg
        ref={svgRef}
        className="pnl-chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={seriesColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={seriesColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="0" y1={baselineY} x2={WIDTH} y2={baselineY} className="pnl-chart-baseline" />

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} className="pnl-chart-line" stroke={seriesColor} />

        {hovered && (
          <>
            <line
              x1={xScale(hoverIndex)} y1="0" x2={xScale(hoverIndex)} y2={HEIGHT}
              className="pnl-chart-crosshair"
            />
            <circle
              cx={xScale(hoverIndex)} cy={yScale(hovered.cum)} r="5"
              fill={seriesColor} className="pnl-chart-dot"
            />
          </>
        )}

        <rect width={WIDTH} height={HEIGHT} className="pnl-chart-hit-area" />
      </svg>

      {hovered && (
        <div
          className="pnl-chart-tooltip"
          style={{
            left: `${(xScale(hoverIndex) / WIDTH) * 100}%`,
            top: `${(yScale(hovered.cum) / HEIGHT) * 100}%`,
          }}
        >
          <div className="tooltip-time">
            {new Date(hovered.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className={`tooltip-value ${hovered.cum >= 0 ? 'text-success' : 'text-danger'}`}>
            {hovered.cum >= 0 ? '+' : ''}{hovered.cum.toFixed(2)} cumulative
          </div>
        </div>
      )}
    </div>
  );
};

export default PnLChart;
