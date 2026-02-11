<div align="center">

<img src="public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra Frontend**

### Dashboard and main web app for the Syra ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-syraa.fun-0ea5e9)](https://syraa.fun)
[![Website](https://img.shields.io/badge/Website-syraa.fun-26a5e4)](https://syraa.fun)

**[Documentation](https://syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[API Playground](https://playground.syraa.fun)** · **[X (Twitter)](https://x.com/syraa_fun)**

</div>

---

## Purpose

The **frontend** package is the **Syra web app (dashboard)**. It is a Next.js application that provides:

- **Signals** — view and explore AI trading signals (including verified on-chain).
- **Dashboard** — statistics and overview of Syra activity.
- **Leaderboard** — rankings and performance.
- **Insight** — research and market insight views.
- **Profile** — user profile and stats.
- **PayAI / test / waitlist** — payment and onboarding flows.

It talks to the **api** backend (and ATXP/corbits/cryptonews where configured) and supports **Solana wallet** (e.g. for x402/PayAI). This is the main **web UI** for Syra, separate from the **landing** (marketing) site.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 |
| **UI** | React 19, Tailwind CSS, DaisyUI, Radix UI |
| **Wallet** | Solana wallet adapters, PayAI x402 Solana React |
| **Data** | TanStack Query, MongoDB (where configured) |
| **Deploy** | Vercel (vercel.json, analytics) |

---

## Run locally

```bash
cd frontend
npm install
# Set env (see .env.example or root docs)
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run linting |

---

## Official links

| Platform | Link |
|----------|------|
| **Website** | [syraa.fun](https://www.syraa.fun/) |
| **Telegram Bot** | [@syra_trading_bot](https://t.me/syra_trading_bot) |
| **Docs** | [syraa.fun/docs](https://syraa.fun/docs) |
| **X Community** | [Join here](https://x.com/i/communities/1984803953360716275) |
| **PumpFun Token** | [View](https://pump.fun/coin/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump) |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
