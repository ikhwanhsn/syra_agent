# Syra main website (Vite)

**Machine money for AI trading agents** — the unified Syra web app: API playground (Build), agent wallet, operator dashboard, and proof demos.

## Setup

```bash
cd web
cp .env.example .env.local
# Set VITE_PRIVY_APP_ID (and optionally VITE_USE_LOCAL_API=true if running api locally)
npm install
npm run dev
```

Dev server: http://localhost:8080

On localhost, API calls go through **`/api`** (Vite proxies to `https://api.syraa.fun`) so you avoid CORS errors. To use a local gateway instead, run `cd api && npm run dev` and set `VITE_USE_LOCAL_API=true` in `.env.local`.

## Product surfaces

| Surface | Route | Role |
|---------|-------|------|
| **Build** | `/playground` | Primary front door — x402 API catalog, SDK/MCP quickstart |
| **Agent Wallet** | `/wallet` | Treasury, deposits, policy caps |
| **Dashboard** | `/overview` | Usage, spend, agent monitoring |
| **Proof** | experiments, `/`, `/alpha` | Live demos powered by the Syra rail |

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

- **Root directory:** `web`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Set environment variables with `VITE_*` prefix (`VITE_PRIVY_APP_ID` required for wallet connect).
- If wallet connect works locally but fails in production, see [PRIVY_SETUP.md](./PRIVY_SETUP.md).

## Migration notes

This package replaces the former Next.js app in `main/`. Routes are client-side via React Router; `/api/proxy` is handled by Vite dev middleware and production API CORS where applicable.
