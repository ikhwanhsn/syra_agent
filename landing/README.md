<div align="center">

<img src="public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra Landing**

### Marketing and landing website for Syra

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Website](https://img.shields.io/badge/Website-syraa.fun-26a5e4)](https://syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[Agent](https://syraa.fun)** · **[X (Twitter)](https://x.com/syra_agent)**

</div>

---

## Purpose

The **landing** package is Syra's **marketing and landing website**. It is a static site built with Vite + React that:

- **Introduces Syra** — hero, “What is Syra”, five pillars (Earn, Treasury, Invest, Spend, Grow), dashboard preview.
- **Showcases features** — FAQ, testimonials, roadmap, token section, live dashboard teaser.
- **Public leaderboard** — leaderboard page for discovery and social proof.
- **Drives signups** — CTA to Telegram bot, docs, agent app, and API playground.
- **Routes to ecosystem brands** — legacy `/uponly` and `/rise` paths redirect to [Up Only Fund](https://uponlyfund.com) when `LINK_UPONLY_APP` is set.

The Syra agent and landing experience live at [syraa.fun](https://syraa.fun). This package also powers marketing pages and the in-app agent UI.

---

## Syra ecosystem

| Brand | URL | Relationship |
|-------|-----|--------------|
| **Syra** | [syraa.fun](https://syraa.fun) | Parent — machine money for agents |
| **S3 Labs** | [s3labs.id](https://s3labs.id) | Syra-backed — growth partner for Solana developers |
| **Up Only Fund** | [uponlyfund.com](https://uponlyfund.com) | Syra-backed — onchain allocator (80/20 mandate) |

Configure cross-app redirects in [`config/global.ts`](./config/global.ts) (`LINK_UPONLY_APP`, API base, agent links).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React, shadcn-ui, Tailwind CSS |
| **Deploy** | Vercel (vercel.json) |

---

## Run locally

```bash
cd landing
npm install
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linting |

### Key files

| File | Purpose |
|------|---------|
| `config/global.ts` | API base, agent/docs/playground links, `LINK_UPONLY_APP` redirect target |
| `public/llms.txt` | Machine-readable Syra product summary for LLMs |
| `vercel.json` | Vercel deployment config |

---

## Production build

The dashboard preview and analytics page call `api.syraa.fun` (`/dashboard-summary`, `/preview/*`, `/binance-ticker`, `/x`, `/analytics/kpi`). **Do not embed API keys in the client.** The API injects authentication for requests from trusted origins (e.g. `https://syraa.fun`, `https://www.syraa.fun`). Integrators calling the API directly must use their own key or x402—not keys from frontend bundles. When building for production (e.g. on Vercel):

- **`VITE_SYRA_API_URL`** — leave unset or set to `https://api.syraa.fun/` so the app targets the production API. (Do not use `http://localhost:3000/` for production builds.)
- Ensure the API’s `CORS_EXTRA_ORIGINS` (or default allowlist) includes your deployment origin so the server can treat it as trusted.

### Local dev API

By default, `npm run dev` calls **`https://api.syraa.fun`** (no local API process required).

**Do not** set `VITE_SYRA_API_URL=http://localhost:3000` — that bypasses the Vite proxy and causes 502/503 errors when the local gateway is down or misconfigured. Remove that line from `.env` / `.env.local` if present.

To proxy through Vite to a local gateway (`cd api && npm run dev` on port 3000), use only:

```bash
VITE_USE_LOCAL_API=true
```

See [`.env.example`](./.env.example).

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
