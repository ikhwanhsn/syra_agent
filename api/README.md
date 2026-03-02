<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra API**

### Backend services and intelligence layer for the Syra ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API](https://img.shields.io/badge/API-Gateway-26a5e4)](https://api.syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[API Playground](https://playground.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[Agent](https://agent.syraa.fun)**

</div>

---

## Purpose

The **api** package is the **backend service** for Syra. It is a Node.js (Express) server that:

- **Exposes Syra's data and intelligence** — signals, research, news, sentiment, gems, KOL/crypto-KOL, browse, events, leaderboard, and sundown digest.
- **Integrates with x402 & FareMeter** — pay-per-use and Solana payment flows for API access.
- **Connects to external data** — Binance (OHLC, correlation), DexScreener, Nansen (smart money, token god mode), RugCheck, Bubblemaps, Jupiter (trending), and others.
- **Runs Syra agents** — Solana agent, check-status, and create-signal for on-chain verified signals.
- **Serves the prediction-game** — creators, events, staking (shared models and routes).
- **Uses MongoDB** (Mongoose) for persistence where needed.

This API backs the **Telegram bot**, **frontend dashboard**, **api-playground**, **x402 agent**, and **prediction-game** app. It is the single backend for the Syra monorepo.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js (ES modules) |
| **Framework** | Express |
| **Payments / gating** | x402, FareMeter (Solana) |
| **Database** | MongoDB (Mongoose) |
| **Blockchain** | Solana (SPL, web3.js, PayAI/facilitator) |

---

## Run locally

```bash
npm install
# Set env vars (RPC, keys, facilitator, treasury, etc.)
npm run dev
```

See the [root README](../README.md) and [Syra docs](https://docs.syraa.fun) for full setup and environment details.

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
