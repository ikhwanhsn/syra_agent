# api

## Purpose of this folder

The **api** folder is the **backend service** for Syra. It is a Node.js (Express) server that:

- **Exposes Syra’s data and intelligence** — signals, research, news, sentiment, gems, KOL/crypto-KOL, browse, events, leaderboard, and sundown digest.
- **Integrates with x402 & FareMeter** — pay-per-use and Solana payment flows for API access.
- **Connects to external data** — Binance (OHLC, correlation), DexScreener, Nansen (smart money, token god mode), RugCheck, Bubblemaps, Jupiter (trending), WorkFun (pump), and others.
- **Runs Syra agents** — Solana agent, check-status, and create-signal for on-chain verified signals.
- **Serves the prediction-game** — creators, events, staking (shared models and routes).
- **Uses MongoDB** (Mongoose) for persistence where needed.

This API backs the **Telegram bot**, **frontend dashboard**, **api-playground**, **x402 agent**, and **prediction-game** app. It is the single backend for the Syra monorepo.

---

## Tech stack

- **Runtime:** Node.js (ES modules)
- **Framework:** Express
- **Payments / gating:** x402, FareMeter (Solana)
- **Database:** MongoDB (Mongoose)
- **Blockchain:** Solana (SPL, web3.js, PayAI/facilitator)

---

## Run locally

```bash
npm install
# Set env vars (RPC, keys, facilitator, treasury, etc.)
npm run dev
```

See repo root [README.md](../README.md) and [docs](https://syra.gitbook.io/syra-docs) for full setup and env details.
