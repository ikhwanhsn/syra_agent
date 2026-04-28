# Syra — agent capability list

**This file on the main site:** [https://syraa.fun/skills.md](https://syraa.fun/skills.md)

This document lists **what automated agents and integrators can do** with Syra: product-level capabilities, **dynamic** API-exposed tools (x402 agent), and **MCP** tool names (official `syra-mcp-server` in this repo). It is for machines and implementers; it is not financial advice.

**Convention:** Many HTTP routes return **402 Payment Required** on production until x402 (or a documented dev path) is satisfied. Tool availability and pricing change with the API; use `GET https://api.syraa.fun/.well-known/x402` and the OpenAPI documents for the live list.

**Companion on syraa.fun:** [llms.txt](https://syraa.fun/llms.txt) · [docs.md](https://syraa.fun/docs.md)

---

## 1. Product output shape (what “Syra analysis” contains)

When users get trading or research output from Syra (e.g. Telegram, agent chat), it is designed to include structured sections where applicable:

| Capability | Description |
|------------|-------------|
| Market overview | Price, volume, volatility, trend strength |
| Technical context | e.g. RSI, MACD, moving averages, Bollinger-style bands (per product configuration) |
| Action perspectives | Key levels, momentum bias, scenario-style outlooks |
| Risk context | R/R and exposure *considerations* (not a recommendation) |
| AI insights | Confidence and sentiment *interpretation* as surfaced by the model and APIs |

**Limits:** Syra does not guarantee accuracy of third-party or on-chain data, model outputs, or future prices. Research and signals are for decision support, not a substitute for your own due diligence and compliance.

---

## 2. Web agent and dynamic tools (API)

The **ai-agent** app calls the **api** backend. Paid and catalogued capabilities are discoverable on the live API:

| Mechanism | Purpose |
|-----------|---------|
| `GET /agent/tools` | List tool names, schemas, and metadata the agent may call (as implemented by the API) |
| `POST /agent/tools/call` | Execute a tool by name with JSON body; uses agent wallet and x402 where required |
| `GET /.well-known/x402` | x402 resource list for direct paid HTTP routes |
| `GET /openapi.json` | Gateway OpenAPI (subset of operations) |
| `GET /mpp-openapi.json` | MPP/x402 discovery document with per-route guidance and pricing hints |

Deeper partner integrations (Binance, Giza, Bankr, Neynar, SIWA, Nansen, Jupiter, Squid, Bubblemaps, etc.) are exposed per `api` configuration—see [Agent tools partners](https://docs.syraa.fun/docs/api/agent-tools-partners) in the docs.

**Syra Brain:** `POST /brain` — natural-language question; server selects internal tools and returns one synthesized answer (MCP: `syra_v2_brain`).

---

## 3. MCP server tools (`syra-mcp-server` v0.2.0)

The repository `mcp-server` exposes the Syra API as **stdio MCP tools** (one HTTP call per tool, unless noted). **Production** calls may return **402** if payment headers are not supplied by the client. Optional `SYRA_USE_DEV_ROUTES=true` targets `.../dev` paths for local APIs.

| Tool name | Role |
|-----------|------|
| `syra_v2_news` | Latest crypto news; optional `ticker` (e.g. BTC) or `general` |
| `syra_v2_event` | Upcoming/recent events; optional `ticker` |
| `syra_v2_sentiment` | ~30d sentiment; optional `ticker` |
| `syra_v2_trending_headline` | Trending headlines; optional `ticker` |
| `syra_v2_signal` | Technical/signal data; `token`, optional CEX `source`, `instId`, `bar`, `limit` |
| `syra_v2_check_status` | `GET /health` |
| `syra_v2_sundown_digest` | Daily digest |
| `syra_v2_smart_money` | Nansen smart-money style aggregate |
| `syra_v2_trending_jupiter` | Jupiter trending tokens |
| `syra_v2_analytics_summary` | `GET /analytics/summary` composite |
| `syra_v2_brain` | `POST /brain` — one NL question, synthesized answer |
| `syra_v2_pumpfun_agents_swap` | `POST /pumpfun/agents/swap` — build swap transaction (pump fun agents) |
| `syra_v2_squid_route` | `POST /squid/route` — cross-chain route/quote (Squid) |
| `syra_v2_squid_status` | `GET /squid/status` — cross-chain tx status |
| `syra_v2_exa_search` | `GET /exa-search` — web search |
| `syra_v2_token_god_mode` | `GET /token-god-mode` — Nansen token research |
| `syra_v2_bubblemaps_maps` | `GET /bubblemaps/maps` — holder map |
| `syra_v2_8004_stats` | 8004 registry global stats |
| `syra_v2_8004_leaderboard` | 8004 leaderboard; optional `minTier`, `limit` |
| `syra_v2_8004_agents_search` | Search agents; optional `owner`, `creator`, `collection`, pagination |
| `syra_v2_8004_agent_liveness` | Liveness for agent NFT `asset` |
| `syra_v2_8004_agent_integrity` | Indexer/chain integrity for agent `asset` |
| `syra_v2_8004_agent_by_wallet` | Resolve agent by operational wallet |
| `syra_v2_quicknode_balance` | Native balance (Solana or Base) |
| `syra_v2_quicknode_transaction` | Transaction status (Solana signature or Base hash) |
| `syra_v2_quicknode_rpc` | `POST /quicknode/rpc` — raw JSON-RPC forward |

*Not every API route is mirrored in MCP;* for a full route list use OpenAPI and x402 discovery on the API host.

---

## 4. Solana 8004 and registry-related capabilities

The API and MCP expose [8004 Trustless Agent Registry](https://docs.syraa.fun/docs/api/8004)–style operations (stats, leaderboard, search, liveness, integrity, resolve-by-wallet) for building trust and discovery for agents on Solana.

---

## 5. User-facing entrypoints (for routing questions)

| Entry | URL |
|-------|-----|
| Main site + machine-readable pack | https://syraa.fun (see `/llms.txt`, `/docs.md`, `/skills.md`) |
| Docs | https://docs.syraa.fun |
| API | https://api.syraa.fun |
| Web agent | https://agent.syraa.fun |
| Playground | https://playground.syraa.fun |
| Telegram | https://t.me/syra_trading_bot |

---

*Derived from `README.md`, `api/README.md`, `mcp-server/src/index.ts`, and `documentation/src/data/docsNav.ts`. Source in repo: `landing/public/skills.md`.*
