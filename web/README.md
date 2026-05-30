# Syra main website (Vite)

Unified Syra web app: AI agent, dashboard, staking, API playground.

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

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

- **Root directory:** `web`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- Set environment variables with `VITE_*` prefix (see `.env.example`).

## Migration notes

This package replaces the former Next.js app in `main/`. Routes are client-side via React Router; `/api/proxy` is handled by Vite dev middleware and production API CORS where applicable.
