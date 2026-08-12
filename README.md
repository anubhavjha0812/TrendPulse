# TrendPulse

A web dashboard for an automated Nifty options trading strategy (SuperTrend-based), built as a multi-tenant platform — every user connects their own broker account, runs their own bot instance, and trades in either **Paper (simulated)** or **Live** mode.

**Live demo:** [https://your-live-link-here.com](https://your-live-link-here.com)

> This repository contains the **frontend only**. The backend (FastAPI, trading engine, broker integration) is kept in a private repository — this is not an incomplete project, the full product is live at the link above.

## Features

- **Authentication & authorization** — JWT-based login/signup, role-based access control (user / admin), with a server-controlled admin bootstrap and step-up password confirmation on sensitive admin actions.
- **Live dashboard** — real-time bot status, PnL, active positions, order book, and a live activity feed over WebSocket.
- **Per-user configuration** — each user manages their own broker credentials (encrypted at rest server-side) and strategy parameters (lot size, martingale sizing, trade windows, etc.).
- **Trade history** — combined view of today's activity and archived past trades.
- **Admin panel** — platform-wide oversight of every user's bot status and performance, with promote/demote and account-deletion controls (each gated behind the acting admin's own password).

## Tech Stack

- **React 19** + **Vite**
- **React Router** for client-side routing
- Plain CSS (custom design system, dark theme, responsive)
- `lucide-react` for icons

## Local Development

```bash
npm install
npm run dev
```

By default this points at a backend running on `http://localhost:8000`. To point at a deployed backend instead, set `VITE_API_BASE_URL` (see `.env.example`).

```bash
npm run build   # production build
npm run lint    # oxlint
```

## License

All Rights Reserved — see [`LICENSE`](./LICENSE). This code is public for portfolio/demonstration purposes only; it is not licensed for reuse, redistribution, or self-hosting.
