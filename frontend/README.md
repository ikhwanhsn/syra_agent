# frontend

## Purpose of this folder

The **frontend** folder is the **Syra web app (dashboard)**. It is a Next.js application that gives users:

- **Signals** — view and explore AI trading signals (including verified on-chain).
- **Dashboard** — statistics and overview of Syra activity.
- **Leaderboard** — rankings and performance.
- **Insight** — research and market insight views.
- **Profile** — user profile and stats.
- **PayAI / test / waitlist** — payment and onboarding flows.

It talks to the **api** backend (and ATXP/corbits/cryptonews where configured) and supports **Solana wallet** (e.g. for x402/PayAI). This is the main **web UI** for Syra, separate from the **landing** (marketing) site.

---

## Tech stack

- **Framework:** Next.js 16
- **UI:** React 19, Tailwind CSS, DaisyUI, Radix UI
- **Wallet:** Solana wallet adapters, PayAI x402 Solana React
- **Data:** TanStack Query, MongoDB (where configured)
- **Deploy:** Vercel (vercel.json, analytics)

---

## Run locally

```bash
cd frontend
npm install
# Set env (see .env.example or root docs)
npm run dev
```

- **Build:** `npm run build`
- **Start (prod):** `npm run start`
- **Lint:** `npm run lint`

---

## Official links

| Platform         | Link                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| Website          | [syraa.fun](https://www.syraa.fun/)                                        |
| Telegram Bot     | [@syra_trading_bot](https://t.me/syra_trading_bot)                         |
| Docs             | [syra.gitbook.io/syra-docs](https://syra.gitbook.io/syra-docs)             |
| X Community      | [Join here](https://x.com/i/communities/1984803953360716275)               |
| PumpFun Token    | [View](https://pump.fun/coin/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump) |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
