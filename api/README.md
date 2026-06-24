<div align="center">

<img src="../landing/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra API**

### Backend services for Syra — machine money for AI trading agents on Solana

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
- **Connects to external data** — Nansen (smart money, token god mode), Bubblemaps, Jupiter (trending), and others; **Binance correlation** is also included in **GET /analytics/summary**; deeper Binance spot / **Giza / Bankr / Neynar / SIWA** run only via **POST /agent/tools/call** (see `api/config/agentTools.js`).
- **Runs Syra agents** — Solana agent, API health (x402 `/health`), and create-signal for on-chain verified signals.
- **Serves the prediction-game** — creators, events, staking (shared models and routes).
- **Uses MongoDB** (Mongoose) for persistence where needed.

This API backs the **Telegram bot**, **internal KPI dashboard**, **api-playground**, **x402 agent**, and **prediction-game** app. It is the single backend for the Syra monorepo.

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

## Tokens.xyz (canonical assets API)

The AI agent can call [Tokens Assets API v1](https://docs.tokens.xyz/v1/quickstart) via **`tokens-*`** tools on **`POST /agent/tools/call`** (same flow as GMGN: server API key, user pays Syra USDC per call).

**Env:**

- `TOKENS_API_KEY` — required (`x-api-key` header; keep server-side only)
- `TOKENS_API_BASE_URL` — optional (default `https://api.tokens.xyz`)

**Examples:** `tokens-assets-search` (q=bitcoin), `tokens-assets-resolve` (ref or mint), `tokens-asset-detail` (assetId + optional include), `tokens-asset-ohlcv`, `tokens-asset-risk-summary`, `tokens-assets-curated`, `tokens-market-snapshots`.

**Dashboard Token check (free aggregate, no per-tool USDC):** `GET /agent/tokens/dossier?q=btc` or `?mint=<solana>` or `?assetId=bitcoin` — powers **`/dashboard/token-check`** in the agent app.

---

## Tempo wallet (EVM keypair)

Tempo uses **EVM-style** accounts (same as Ethereum): a **0x address** and a **hex private key**. Generate one locally:

```bash
cd api
npm run generate-tempo-wallet
```

This writes **`api/.tempo-wallet.local.json`** (gitignored) with `address` and `privateKey`. Copy `privateKey` into `TEMPO_PAYOUT_PRIVATE_KEY` in `.env`. The script does **not** print the private key to the terminal.

## Tempo payout rail

The API can send stablecoin (TIP-20) payouts on [Tempo](https://docs.tempo.xyz) with optional memos for reconciliation.

- **Endpoint:** `POST /payouts/tempo` (API key required)
- **Body:** `{ "to": "0x...", "amountUsd": 10.5, "memo": "INV-12345" }`
- **Env:** `TEMPO_RPC_URL`, `TEMPO_PAYOUT_PRIVATE_KEY`, `TEMPO_PAYOUT_TOKEN` (see `.env.example`)

**AI agent — Tempo**

- **Public (always on, $0):** `tempo-network-info` (RPC, explorers, token list URLs, docs) and `tempo-token-list` (JSON from [tokenlist.tempo.xyz](https://tokenlist.tempo.xyz/list/4217); param `chainId` `4217` or `42431`). No USDC balance required.
- **Payouts:** When `TEMPO_AGENT_PAYOUT_ENABLED=true`, tool `tempo-send-payout` appears. Params: `amountUsd`, optional `memo`. Recipient is **never** taken from the model—only the user’s connected EVM address or Base agent wallet. Cap: `TEMPO_AGENT_PAYOUT_MAX_USD` (default 50).

---

## MPP discovery (MPPscan / AgentCash)

**Settlement:** MPP discovery uses the **same URLs and x402 v2 payment flow** as the rest of Syra (`HTTP 402` → pay → retry with proof). `protocols: ["mpp"]` in OpenAPI is **discovery metadata** for [MPPscan](https://www.mppscan.com/discovery) / AgentCash, not a separate payment rail.

**Catalog:**

- **`GET /.well-known/x402`** — x402 resource list (unchanged).
- **`GET /openapi.json`** — **OpenAPI 3.1** gateway catalog (10+ operations: `/api/signal`, `/info`, `/preview/*`, `/dashboard-summary`, `/binance-ticker`, `/prediction-game/health`, x402 **`/news`**, **`/sentiment`**, **`/event`**, **`/health`**, **`/brain`**, etc.). Standard schema only (no `info.guidance`). Same as repo-root `openapi.json` (`npm run openapi` in `api/`).
- **`GET /mpp-openapi.json`** — full **OpenAPI 3.1** MPP discovery document: one entry per paid route (from **agent tools** + [`x402DiscoveryResourcePaths.js`](./config/x402DiscoveryResourcePaths.js)), with `info.guidance`, `x-payment-info` (`protocols: ["mpp"]`, `pricingMode: "fixed"`, `price`), **`402`**, optional **query parameters** (GET) and **JSON requestBody** (POST) to satisfy discovery validators.
- **`GET` / `POST` [`/mpp/v1/health`](https://api.syraa.fun/mpp/v1/health)** — MPP-branded health check (same tier as `/health`). Legacy `/mpp/v1/check-status` → 308 to `/mpp/v1/health`.

To **register**, deploy then validate:

```bash
npx -y @agentcash/discovery@latest discover "https://api.syraa.fun"
```

Optional: **`SYRA_PUBLIC_API_URL`** for staging `servers[0].url`. **`X402_OWNERSHIP_PROOF_EVM`** / **`X402_OWNERSHIP_PROOF_SVM`** populate `x-discovery.ownershipProofs` (see [generateOwnershipProof.js](./scripts/generateOwnershipProof.js)).

**MPP coverage CI:** `npm run validate:mpp` (from `api/`) verifies every agent tool appears in `/mpp-openapi.json`.

### MCP bridge (external MCP clients)

**`POST /mcp/tools/call`** — server-side agent tool execution for `@syra/mcp-server` (agent-direct routes without public HTTP). Requires:

| Env | Purpose |
|-----|---------|
| `SYRA_MCP_BRIDGE_ENABLED=true` | Enable bridge |
| `SYRA_MCP_API_KEY` | Client sends `X-MCP-API-Key` header |
| `SYRA_MCP_AGENT_ANONYMOUS_ID` | Agent wallet that pays for tool calls |
| `SYRA_MCP_RATE_LIMIT_PER_MIN` | Optional rate limit (default 120/min) |

Body: `{ "toolId": "exa-search", "params": { "query": "..." } }`. Reuses [`agentToolExecutor.js`](./libs/agentToolExecutor.js) (same as `POST /agent/tools/call`).

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

### Improving your 8004 agent score (reviews / reachable)

If your agent shows low scores (e.g. 50/100, 33/100) with tags like **reachable**, **degraded**, or **fail** on the [8004 website](https://8004.qnt.sh), do two things:

1. **Fix liveness first** — The monitor is scoring based on whether your MCP/A2A endpoints respond. Ensure all services in your agent’s registration metadata are reachable and return success (or 401/403 if you use auth). Use the API or script to check:
   - `GET /8004/agent/<ASSET>/liveness` — should show `status: "live"` and no `deadServices`.
   - Fix any timeouts, 5xx, or unreachable URLs; then the same monitor will tend to submit higher scores on the next run.

2. **Submit positive “reachable” feedback (score 100)** — The tag `reachable` does **not** auto-score; you must pass an explicit `score: 100`. Use the script (with a **client** wallet that will appear as the reviewer):
   ```bash
   cd api
   node scripts/give-8004-feedback-reachable.js <AGENT_ASSET_BASE58>
   ```
   Requires: `SOLANA_PRIVATE_KEY` (or `AGENT_PRIVATE_KEY`), and either `PINATA_JWT` (to upload feedback to IPFS) or `FEEDBACK_URI` (e.g. `https://yoursite.com/8004-reachable.json`). See [8004 skill §5 and §23](https://8004.qnt.sh/skill.md).

---

## Ampersend marketplace (x402 Bazaar)

[Ampersend](https://docs.ampersend.ai/platform/marketplace) lists pay-per-use x402 APIs from three sources: hand-curated `catalog`, community `bazaar`, and first-party `ampersend` agents. Syra is indexed via **Bazaar** after Base mainnet settlements — no separate submit form.

### Prerequisites (production)

1. **`BASE_PAYTO`** (or `EVM_PAYTO`) — wallet that receives Base USDC from x402 payers.
2. **`X402_BAZAAR_ENABLED`** — defaults to `true`; Bazaar metadata is attached to 402 responses and settle payloads.
3. **PayAI facilitator** — `FACILITATOR_URL_PAYAI` (or `PAYAI_FACILITATOR_URL`) with optional `PAYAI_API_KEY_ID` / `PAYAI_API_KEY_SECRET` for mainnet.
4. At least **one successful Base mainnet payment** on a discoverable route (e.g. `GET /health`) so the facilitator indexes the endpoint in Bazaar.

Ampersend production only surfaces **Base mainnet** (`eip155:8453`) endpoints. Solana-only discovery still works on x402scan and other directories.

### Validate readiness

```bash
cd api
npm run validate-ampersend
```

Optional: run a paid Base call to trigger Bazaar indexing (requires `CMC_PAYER_PRIVATE_KEY` or `BASE_PAYER_PRIVATE_KEY` with Base USDC):

```bash
npm run validate-ampersend -- --pay
```

### Optional: curated Ampersend listing

Email **ampersend@edgeandnode.com** or join **@ampersendbuilders** on Telegram with service name, description, category, public URLs, and docs (`https://docs.syraa.fun`) for hand-curated `catalog` placement.

---

## Register Syra on SAID Protocol

[SAID Protocol](https://www.saidprotocol.com/docs) provides persistent, verifiable on-chain identity for AI agents on Solana (program `5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G`).

### Prerequisites

1. **Solana signer** — same as 8004: `SOLANA_PRIVATE_KEY`, `PAYER_KEYPAIR`, or `AGENT_PRIVATE_KEY` in `.env`.
2. **Pinata** — `PINATA_JWT` for AgentCard metadata upload to IPFS.
3. **SOL** — at least ~0.012 SOL on mainnet (0.01 SOL verification fee + tx fees).
4. **RPC** — `SOLANA_RPC_URL` with full blockchain access (Helius, QuickNode, Alchemy).

### Run registration + verification

```bash
cd api
npm run register-said
```

The script registers Syra on-chain, pays the 0.01 SOL verification badge, syncs the off-chain SAID directory, and prints the identity wallet. Add it to `.env`:

```bash
SAID_AGENT_WALLET=<printed-wallet-address>
```

Optional env:

- `SAID_API_BASE_URL` — default `https://api.saidprotocol.com`
- `SYRA_SAID_NAME`, `SYRA_SAID_DESCRIPTION` — override agent metadata (defaults from `config/syraBranding.js`)
- `SYRA_AGENT_IMAGE_URI`, `SYRA_COLLECTION_X_URL`, `SYRA_COLLECTION_EXTERNAL_URL` — branding

After changing Syra branding, refresh the SAID profile:

```bash
cd api
npm run sync-said-metadata
```

This pins a new AgentCard to IPFS and calls SAID `update_agent` on-chain.

### Runtime routes (API key required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/said/status` | Syra's own SAID identity (`SAID_AGENT_WALLET`) |
| GET | `/said/verify/:wallet` | Full verification + reputation |
| GET | `/said/trust/:wallet` | Minimal trust tier |
| GET | `/said/agent/:wallet` | Full agent details |

---

## Quicknode RPC (optional)

The API can proxy **Quicknode** RPC for Solana and Base so agents and MCP clients can query balances and transaction status (and raw JSON-RPC) via x402.

### Setup

In `api/.env` set one or both:

- **`QUICKNODE_SOLANA_RPC_URL`** — Quicknode Solana endpoint (e.g. `https://xxx.solana-mainnet.quiknode.pro/YOUR_KEY/`)
- **`QUICKNODE_BASE_RPC_URL`** — Quicknode Base endpoint (e.g. `https://xxx.base-mainnet.quiknode.pro/YOUR_KEY/`)

Optional: **`QUICKNODE_RPC_TIMEOUT_MS`** (default 15000).

### Endpoints (x402)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/quicknode/balance` | Query params: `chain` (solana \| base), `address`. Returns native balance (lamports for Solana, wei hex for Base). |
| GET | `/quicknode/transaction` | Query params: `chain`, and `signature` (Solana) or `txHash` (Base). Returns transaction status. |
| POST | `/quicknode/rpc` | Body: `{ "chain": "solana" \| "base", "method": "...", "params": [...], "id"?: number }`. Forwards raw JSON-RPC. |

If neither env var is set, these routes return **503** with a message to configure Quicknode. The MCP server exposes `syra_v2_quicknode_balance`, `syra_v2_quicknode_transaction`, and `syra_v2_quicknode_rpc`.

---

## Bankr (optional)

The API integrates **Bankr** (api.bankr.bot) with a **server-side** `BANKR_API_KEY`. There are **no public** `/bankr/*` URLs on Syra. Use the Syra Agent: **GET /agent/tools** and **POST /agent/tools/call** with tool IDs `bankr-balances`, `bankr-prompt`, `bankr-job`, `bankr-job-cancel` (see `api/config/agentTools.js` and `api/libs/agentPartnerDirectTools.js`).

### Setup

In `api/.env` set:

- **`BANKR_API_KEY`** — Bankr API key (starts with `bk_...`). Create at [bankr.bot/api](https://bankr.bot/api) with **Agent API** enabled.

Optional: **`BANKR_API_URL`** (default `https://api.bankr.bot`), **`BANKR_TIMEOUT_MS`** (default 30000).

If `BANKR_API_KEY` is not set, agent tool calls return an error when those tools are invoked.

---

## ERC-8004 (Ethereum agent discovery)

The **`/erc8004`** path is an alias for the same 8004scan router used at `/8004scan`. Use it for Ethereum mainnet (chainId 1) and Sepolia (11155111) ERC-8004 agent discovery. Same endpoints: `GET /erc8004/agents`, `GET /erc8004/agents/search?q=...`, `GET /erc8004/agents/:chainId/:tokenId`, `GET /erc8004/stats`, `GET /erc8004/chains`, etc. Optional **EIGHTYFOUR_SCAN_API_KEY** in `.env` for higher 8004scan rate limits.

---

## Neynar (Farcaster API, optional)

**Neynar** is integrated for Farcaster user, feed, cast, and search. Set **`NEYNAR_API_KEY`** in `api/.env` (get a key at [dev.neynar.com](https://dev.neynar.com)). There are **no public** `/neynar/*` URLs on Syra — use agent tool IDs `neynar-user`, `neynar-feed`, `neynar-cast`, `neynar-search` via **POST /agent/tools/call**.

---

## SIWA (Sign-In With Agent, optional)

**SIWA** lets ERC-8004 agents authenticate with services. Set **`RECEIPT_SECRET`** (min 32 chars) and **`SIWA_RPC_URL`** (or **`ETH_RPC_URL`**) in `api/.env`. Optional **`SIWA_DOMAIN`** (default `api.syraa.fun`). Requires **`@buildersgarden/siwa`** (already in dependencies). There are **no public** `/siwa/*` URLs on Syra — use agent tools **`siwa-nonce`** and **`siwa-verify`** via **POST /agent/tools/call**.

---

## Jupiter Swap API — referral / platform fees

Direct Jupiter V1 swaps (`api.jup.ag/swap/v1`) used by **LP agent live sidecar swaps** (`api/libs/lpRealSidecarSwap.js`), **SYRA buyback** (`api/utils/buybackSYRA.js`), and the **jupiter-swap-order** Swap V1 fallback can route a platform fee to your Jupiter referral account. The same referral account is passed to **Jupiter Ultra** (`jupiter-swap-order` primary path via Corbits) as `referralAccount` + `referralFee`.

**Env (optional — defaults are set in code):**

| Variable | Description |
|----------|-------------|
| `JUPITER_API_KEY` | Jupiter API key for `api.jup.ag` (recommended in production) |
| `JUPITER_REFERRAL_ACCOUNT` | Your Jupiter referral account pubkey (default: Syra referral key) |
| `JUPITER_PLATFORM_FEE_BPS` | Platform fee in basis points, 0–255 (default: `100` = 1.00%) |

**One-time setup:** Create referral token accounts on [referral.jup.ag](https://referral.jup.ag) for each **output** mint you want to collect fees on. Jupiter takes the fee on the swap output (ExactIn). Syra applies the fee only when the matching on-chain referral token account exists — otherwise the swap proceeds without a fee so LP opens are never blocked.

Recommended mints to register:

- **wSOL** (`So11111111111111111111111111111111111111112`) — LP close sweeps and idle token→SOL
- **SYRA** (`SYRA_TOKEN_MINT`) — x402 revenue buyback (USDC→SYRA)
- **USDC** — if you add swaps with USDC output later

Logic lives in `api/libs/jupiterReferral.js`. The **jupiter-swap-order** agent tool applies the same referral account on both Jupiter Ultra (`referralAccount` + `referralFee`) and Swap V1 fallback (`platformFeeBps` + `feeAccount`).

---

## Pact Network (agent x402 refund coverage)

Syra always wraps agent outbound paid `fetch()` with [`@q3labs/pact-sdk`](https://www.pactnetwork.io/docs) so failed x402 upstream calls (5xx, timeout, malformed body) can be refunded on-chain to the agent wallet. No API key is required — V1 uses the agent wallet's ed25519 signer for proxy auth.

**Defaults** (hardcoded in `api/libs/pactConfig.js`): mainnet, Pact Market proxy, ~$0.001 premium estimate in balance checks, auto `pact.setup()` on first covered fetch.

**Validate:** `npm run validate-pact -- --agent <anonymousId>`

**API:** `GET /agent/pact/status`, `GET /agent/pact/refunds?anonymousId=...`

Composition: `globalThis.fetch` → Sentinel (if on) → Pact via `api/libs/agentFetch.js`.

---

## Hackathon Scout (internal admin)

Daily aggregator for **technology hackathons** (Indonesia + global) via Devpost JSON API and Exa web search. Admin UI: **`/hackathon`** on the dashboard (admin wallet only). API: **`/internal/hackathons`**.

| Env | Purpose |
|-----|---------|
| `EXA_API_KEY` | Exa web search for hackathons not on Devpost |
| `OPENROUTER_API_KEY` | LLM extraction from Exa search snippets |
| `SYRA_ADMIN_WALLETS` | Hardcoded in `api/libs/adminWallet.js` (no env required) |
| `HACKATHON_SCOUT_CRON_MS` | Scheduler interval (default `86400000` = 24h) |
| `HACKATHON_SCOUT_CRON_SECRET` | GitHub Action / cron `POST /internal/hackathons/run` |
| `HACKATHON_DEVPOST_GLOBAL_PAGES` | Devpost pages to fetch (default `3`) |
| `HACKATHON_DEVPOST_INDONESIA_PAGES` | Indonesia search pages (default `2`) |
| `HACKATHON_EXA_NUM_RESULTS` | Exa results per query (default `8`) |
| `HACKATHON_EXA_MIN_RELEVANCE` | Min tech relevance score 0–100 (default `40`) |

Cron header: `x-hackathon-scout-cron-secret`. Workflow: `.github/workflows/hackathon-scout-daily.yml`.

---

## API key and trusted origins

- **Never embed `API_KEY` or `API_KEYS` in client-side code.** The API injects the key for requests from trusted origins (syraa.fun, dashboard, agent, playground) so frontends do not need to send it.
- If an API key was ever exposed in a client bundle (e.g. in a built JS file), **rotate it immediately**: generate a new key, set it in the API’s `.env` as `API_KEY` or in `API_KEYS`, redeploy, and stop using the old key.

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
