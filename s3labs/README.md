<div align="center">

# **S3 Labs**

### Growth partner for Solana developers — backed by Syra

[![Website](https://img.shields.io/badge/Website-s3labs.id-26a5e4)](https://s3labs.id)
[![Syra](https://img.shields.io/badge/Backed_by-Syra-0ea5e9)](https://syraa.fun)
[![Telegram](https://img.shields.io/badge/Telegram-@s3labs-blue)](https://t.me/s3labs)

**[Website](https://s3labs.id)** · **[Apply](https://s3labs.id/apply)** · **[Programs](https://s3labs.id/programs)** · **[Syra](https://syraa.fun)** · **[X](https://x.com/s3labs_)**

</div>

---

## What is S3 Labs?

**S3 Labs** is a **growth partner for Solana developers** — operator-led programs for hackathon winners and teams with live MVPs who need revenue, distribution, and scale. S3 Labs is a **Syra-backed** initiative: Syra provides the machine-money infrastructure (APIs, agents, treasury rails); S3 Labs is the **builder growth and community brand** in front.

| Focus | Description |
|-------|-------------|
| **Who we help** | Hackathon winners and MVP-stage Solana teams |
| **What we deliver** | Revenue programs, KOL marketplace, jobs/events aggregation, founder network |
| **How we operate** | Execution over narratives — published playbooks, portfolio results, operator network |
| **Parent brand** | [Syra](https://syraa.fun) — machine money for agents on Solana |

---

## Programs & surfaces

| Route | Description |
|-------|-------------|
| `/` | Home — growth partner positioning, stats, portfolio highlight |
| `/programs` | Program pillars, who we help, benefits, how it works |
| `/portfolio` | Portfolio results and case studies |
| `/apply` | Project application intake |
| `/about` | Mission, team, why S3 Labs |
| `/community` | 500+ founder network — Telegram community |
| `/kol` | KOL marketplace — campaigns, earnings, creator attribution |
| `/jobs` | Curated remote tech / web3 job board |
| `/hackathon` | Hackathon discovery and builder resources |
| `/events` | Tech and crypto events (admin) |
| `/profile` | Connected wallet profile, daily claim, points |
| `/post` | Brief studio — numbered fund/community updates (video + photo export) |

**Community:** [@s3labs on Telegram](https://t.me/s3labs) — News, Developer, Event, and Jobs forum topics.

---

## Relationship to Syra

| Brand | Role |
|-------|------|
| **Syra** | Parent infrastructure — x402 APIs, agent wallets, treasury policy, invest/spend rails |
| **S3 Labs** | Syra-backed growth studio — developer programs, community, KOL, jobs, events |
| **Up Only Fund** | Syra-backed onchain allocator — separate public program brand ([uponlyfund.com](https://uponlyfund.com)) |

S3 Labs uses the Syra API gateway (`api.syraa.fun`) for KOL marketplace, jobs pipeline, news/event aggregators, Telegram QA bot, and points ledger. The S3 Labs Assistant (`@s3labs` bot) answers tech/crypto/web3 questions in the community; it is distinct from the Syra trading agent.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React 18, React Router, shadcn-ui, Tailwind CSS |
| **Wallet** | Solana wallet adapter (KOL, profile, points) |
| **API** | Syra gateway — `/api` proxy in dev, `https://api.syraa.fun` in production |

---

## Run locally

```bash
cd s3labs
npm install
npm run dev
```

Dev server: **http://localhost:8080**

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### API in development

By default, `npm run dev` proxies `/api` to **`https://api.syraa.fun`**.

To use a local Syra gateway (`cd api && npm run dev` on port 3000):

```bash
# .env
VITE_USE_LOCAL_API=true
```

Trusted-origin auth is injected server-side for Syra-owned frontends — **do not embed API keys** in client bundles.

---

## Deploy

- **Public site:** [s3labs.id](https://s3labs.id) (also `s3labs.io`)
- Ensure the Syra API `CORS_EXTRA_ORIGINS` (or default allowlist) includes your deployment origin.
- KOL, jobs, and Telegram webhook routes are served by the **`api`** package — deploy API changes alongside frontend updates when adding new integrations.

---

## Brand

- **Wordmark:** S3 Labs
- **Positioning:** Growth partner for Solana developers
- **Accent:** Primary gradient mesh + panel-glass UI (`index.css`, Tailwind theme)
- **Social:** [@s3labs_](https://x.com/s3labs_), [LinkedIn](https://www.linkedin.com/company/s3labs/), [Telegram](https://t.me/s3labs)

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
