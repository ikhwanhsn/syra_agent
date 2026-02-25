# Syra Internal Dashboard

Internal dashboard for Syra usage and growth statistics. Displays paid API calls, agent tool usage, and KPI progress against grant targets.

## Setup

1. Copy `.env.example` to `.env` and set:

   - **VITE_API_BASE_URL** – Syra API base URL (e.g. `https://api.syraa.fun` or `http://localhost:3000`).
   - **VITE_API_KEY** – API key that matches the API server’s `API_KEY` or `API_KEYS` (required for `GET /analytics/kpi`).

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   The app runs at `http://localhost:5174` by default.

## Build

```bash
npm run build
npm run preview
```

## Data source

The dashboard calls `GET /analytics/kpi` on the Syra API. That endpoint returns:

- Total / 7d / 30d paid API calls
- Daily paid-calls series (last 30 days)
- Top endpoints by paid calls
- Agent: completed paid tool calls and chats with paid tool use
- KPI targets (paid API calls, agent sessions)

Access control is via the API key; there is no login UI. Deploy behind VPN or an internal URL if you need to restrict who can open the dashboard.
