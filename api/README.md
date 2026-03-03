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

## Register Syra on 8004 (Solana Agent Registry)

The [8004 Trustless Agent Registry](https://8004.qnt.sh/skill.md) lets you register Syra as a discoverable agent on Solana.

### Prerequisites

1. **Solana signer** — In `.env`, set one of:
   - `SOLANA_PRIVATE_KEY` — JSON array of 64 bytes, e.g. `"[1,2,...,64]"` (quote the value)
   - `PAYER_KEYPAIR` — same format (if you already use it for Solana)
   - `AGENT_PRIVATE_KEY` or `ZAUTH_SOLANA_PRIVATE_KEY` — base58-encoded secret key
2. **Pinata** — [Create an API key](https://app.pinata.cloud) and set `PINATA_JWT` in `.env` (used to pin registration metadata to IPFS).
3. **Optional:** `SYRA_AGENT_IMAGE_URI` — IPFS or HTTPS URL for the agent image; defaults to Syra logo.
4. **Optional:** `SOLANA_CLUSTER=devnet` to register on devnet first; default is `mainnet-beta`.
5. **Optional:** `8004_ATOM_ENABLED=true` to enable the ATOM reputation engine at registration (irreversible).

### Run registration

```bash
cd api
npm run register-8004
```

The script uploads agent metadata to IPFS and registers the agent on-chain. It prints the **agent asset (NFT) address** and **transaction signature**. Keep these for future updates (e.g. `setAgentUri`, `giveFeedback`).

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
