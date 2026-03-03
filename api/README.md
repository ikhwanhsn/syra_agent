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

### Create Syra Agent collection (after registration)

After registering the agent, you can create a **Syra Agents** collection and attach it to your agent:

```bash
cd api
npm run create-8004-collection
```

- Uses the same `.env` (e.g. `SOLANA_PRIVATE_KEY`, `PINATA_JWT`).
- By default uses agent asset `8aJwH76QsQe5uEAxbFXha24toSUKjHxsdCk4BRuKERYx`. Override with `SYRA_AGENT_ASSET=<base58>` if you re-registered.
- Optional: set `SYRA_COLLECTION_IMAGE_URI`, `SYRA_COLLECTION_EXTERNAL_URL`, `SYRA_COLLECTION_X_URL` (and optionally `SYRA_COLLECTION_BANNER_URI`) in `.env` so the collection card shows your image, website link, and X/Twitter link.

### New agent + collection in one run

To register a **new** Syra agent and attach it to a collection in one run:

```bash
cd api
npm run register-8004-with-collection
```

- **Add to existing Syra collection:** set `SYRA_COLLECTION_POINTER` in `.env` to your existing pointer (e.g. `c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm`). The script will register the new agent and attach this pointer (no new collection created).
- **Create new collection:** leave `SYRA_COLLECTION_POINTER` unset; optionally set `SYRA_COLLECTION_IMAGE_URI`, `SYRA_COLLECTION_EXTERNAL_URL`, `SYRA_COLLECTION_X_URL` for the collection card. The script will create the collection and attach it to the new agent.

Prints the new agent asset at the end — save it as `SYRA_AGENT_ASSET` if needed.

### API: create many agents and add to collection

**POST /8004/register-agent** (x402 payment required)

Creates a new 8004 agent with dynamic input and optionally attaches it to an existing collection. Call repeatedly to create many agents in the same collection. Requires x402 payment (e.g. PAYMENT-SIGNATURE or X-Payment header); without payment the API returns **402 Payment Required** with payment details.

**Request body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent name |
| `description` | string | Yes | Agent description |
| `image` | string | No | Image URL (default: env `SYRA_AGENT_IMAGE_URI` or syraa.fun logo) |
| `services` | array | No | `[{ "type": "MCP", "value": "https://..." }]` (default: MCP api.syraa.fun) |
| `skills` | string[] | No | OASF skill slugs (default: Syra skills) |
| `domains` | string[] | No | OASF domain slugs (default: finance) |
| `x402Support` | boolean | No | Default true |
| `collectionPointer` | string | No | Existing collection pointer `c1:...` to attach agent to |

**Response (201):** `{ "asset": "<base58>", "registerSignature": "<tx>", "tokenUri": "ipfs://...", "setCollectionSignature": "<tx>" }` (last field only if `collectionPointer` was set).

**Example (add agent to existing Syra collection):** First request without payment returns **402** with payment details; then pay (e.g. with wallet via API Playground or x402 client) and retry with the payment header.

**Dev (no payment):** `POST /8004/dev/register-agent` when `NODE_ENV !== "production"`.

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
