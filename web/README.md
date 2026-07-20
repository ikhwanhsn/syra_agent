# Syra Web App (`web`)

**Pay-per-call crypto APIs for agents** — the unified Syra web application: API marketplace (Spend), agent wallet, operator dashboard, and proof demos.

Part of the [Syra monorepo](../README.md). Syra-backed ecosystem brands ([S3 Labs](https://s3labs.xyz), [Up Only Fund](https://uponlyfund.com)) ship as separate apps in `s3labs/` and `uponly-fund/`.

---

## Setup

```bash
cd web
cp .env.example .env.local
# Set VITE_PRIVY_APP_ID (and optionally VITE_USE_LOCAL_API=true if running api locally)
npm install
npm run dev
```

Dev server: **http://localhost:8080**

On localhost, API calls go through **`/api`** (Vite proxies to `https://api.syraa.fun`) so you avoid CORS errors. To use a local gateway instead, run `cd api && npm run dev` and set `VITE_USE_LOCAL_API=true` in `.env.local`.

---

## Product surfaces

| Surface | Route | Role |
|---------|-------|------|
| **Marketplace** | `/marketplace` | Primary front door — x402 API catalog, per-API detail pages, SDK/MCP integrate tab (`/playground` redirects) |
| **Agent Wallet** | `/wallet` | Treasury, deposits, policy caps |
| **Dashboard** | `/overview` | Usage, spend, agent monitoring |
| **Agent chat** | `/` | Reference client — research, tools, onchain actions |
| **Proof / experiments** | `/alpha`, experiments routes | Live demos powered by the Syra rail |

Legacy marketing routes (`/uponly`, `/rise`, `/s3labs`) may redirect to standalone ecosystem apps — see `src/components/marketing/`.

---

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_PRIVY_APP_ID` | **Required** for wallet connect (Privy) |
| `VITE_USE_LOCAL_API` | Proxy `/api` to local gateway on port 3000 |
| `VITE_SYRA_API_URL` | Override API origin (avoid localhost unless local mode is on) |

See [`.env.example`](./.env.example) and [PRIVY_SETUP.md](./PRIVY_SETUP.md) for production wallet issues.

---

## Build & scripts

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

---

## Deploy (Vercel)

| Setting | Value |
|---------|-------|
| **Root directory** | `web` |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

Set environment variables with the `VITE_*` prefix. `VITE_PRIVY_APP_ID` is required for wallet connect in production.

**Production URLs:** [syraa.fun](https://syraa.fun) (agent + marketing), [syraa.fun/marketplace](https://syraa.fun/marketplace), [syraa.fun/articles](https://syraa.fun/articles) (legacy `playground.syraa.fun` aliases redirect).

---

## Architecture notes

- Replaces the former Next.js app in `main/`. Routes are client-side via React Router.
- `/api` proxy is handled by Vite dev middleware; production relies on API CORS + trusted-origin auth injection.
- Brand content and pillars: `src/content/syraAbout.ts`, `src/content/syraInfo.ts`.
- x402 marketplace catalog is generated from API agent tools and live `/.well-known/x402` discovery.

---

## Related packages

| Package | Role |
|---------|------|
| [`api`](../api) | Backend gateway — x402, agent sessions, partner tools |
| [`syra-sdk`](../syra-sdk) | Typed HTTP client for integrators |
| [`mcp-server`](../mcp-server) | MCP distribution for Cursor / Claude |
| [`s3labs`](../s3labs) | Syra-backed growth studio |
| [`uponly-fund`](../uponly-fund) | Syra-backed allocator app |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
