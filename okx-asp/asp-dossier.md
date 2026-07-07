# Syra OKX.AI ASP Registration Dossier

Ready-to-submit profile for registering Syra as an **Agent Service Provider (ASP)** on [OKX.AI](https://www.okx.ai). Covers both **A2MCP** (pay-per-call x402 API catalog) and **A2A** (Syra Brain negotiated research agent).

**Source of truth in repo:** `api/config/x402ResourceCatalog.js`, `api/config/syraBranding.js`, `api/config/pillars.js`

---

## 1. ASP Identity

| Field | Value |
|-------|-------|
| **ASP name** | Syra |
| **Tagline** | Machine Money for Agents |
| **Description** | Machine money for agents on Solana — Earn, Treasury, Invest, Spend (x402), Grow. Agent wallets, policy engine, and autonomous capital deployment. |
| **Website** | https://syraa.fun |
| **API base** | https://api.syraa.fun |
| **Documentation** | https://docs.syraa.fun |
| **Playground** | https://playground.syraa.fun |
| **Agent demo** | https://syraa.fun |
| **Icon** | https://api.syraa.fun/favicon.ico |
| **Category** | Crypto |
| **Tags** | agents, x402, crypto, trading, analytics, machine-money |
| **Discovery** | `GET https://api.syraa.fun/.well-known/x402` |
| **OpenAPI** | `GET https://api.syraa.fun/openapi.json` |
| **Pillars** | `GET https://api.syraa.fun/pillars` |
| **MCP package** | `@syra-ai/mcp-server` v0.4.0 (`npx -y @syra-ai/mcp-server`) |
| **SDK** | `@syra-ai/sdk` |

### Product narrative

Syra is organized around five pillars:

| Pillar | Purpose |
|--------|---------|
| **Earn** | Agents monetize skills (8004 registry, marketplace) |
| **Treasury** | Allocate and manage capital (wallets, billing, policy) |
| **Invest** | Deploy capital autonomously (Jupiter, Giza, RISE) |
| **Spend** | x402 native pay-per-call APIs |
| **Grow** | Yield + portfolio optimization |

---

## 2. A2MCP — Service Catalog (28 routes)

**Service type:** Agent-to-MCP — standardized, deterministic pay-per-call APIs.

**Payment rails (current):** Solana USDC, Base USDC, BSC (B402), Algorand USDC via HTTP 402 (x402 v2).

**OKX settlement (required for go-live):** OKX Payment SDK on XLayer — instant per-call settlement. See [Section 5](#5-prerequisites--follow-on-engineering).

### Registration strategy (recommended)

**Option A — OpenAPI path (fastest):** Register using the existing public OpenAPI spec at `https://api.syraa.fun/openapi.json`. Each path maps to a callable tool with documented parameters and x402 pricing.

**Option B — Remote HTTPS MCP:** Deploy a streamable-HTTP MCP gateway that proxies `api.syraa.fun`. Syra's current `@syra-ai/mcp-server` is stdio-only (spawned by Cursor/Claude); it is not directly callable over the public internet.

For initial OKX listing, use **Option A**. Ship Option B when you want a dedicated `mcp.syraa.fun` endpoint.

### Bundle registration (suggested)

Instead of registering 28 services individually, register **one primary A2MCP service** plus **category bundles**:

| Bundle name | Endpoint / discovery | Price model | Routes |
|-------------|---------------------|-------------|--------|
| **Syra x402 API Gateway** | `https://api.syraa.fun` + `/.well-known/x402` | Per-route (see tables) | All 28 routes |
| **Syra MCP Tools (curated)** | `npx -y @syra-ai/mcp-server` | Per-tool via x402 proxy | ~42 curated tools |

If OKX requires per-endpoint registration, use the full tables below.

---

### Pillar: Spend (x402 native payments) — 24 routes

| Slug | Name | Method | Endpoint | Price (USDC) | Summary |
|------|------|--------|----------|--------------|---------|
| brain | Syra Brain | GET, POST | `https://api.syraa.fun/brain` | $0.08 | Single-question crypto AI with automatic tool selection |
| news | Crypto News | GET, POST | `https://api.syraa.fun/news` | $0.01 | Latest crypto news headlines and summaries |
| signal | Trading Signal | GET, POST | `https://api.syraa.fun/signal` | $0.01 | AI trading signal from CEX OHLCV technical analysis |
| spcx | SPCX SpaceX IPO Intelligence | GET | `https://api.syraa.fun/spcx` | $0.02 | SpaceX IPO token (SPCXx) Nasdaq vs on-chain spread |
| equity | Tokenized Equity Intelligence | GET | `https://api.syraa.fun/equity` | $0.02 | xStocks equity spread — Nasdaq vs on-chain |
| indicator | Technical Indicators | GET, POST | `https://api.syraa.fun/indicator` | $0.01 | RSI, MACD, EMA, Bollinger, and 20+ indicators in one call |
| sentiment | Market Sentiment | GET, POST | `https://api.syraa.fun/sentiment` | $0.01 | 30-day crypto sentiment scores by ticker |
| event | Crypto Events | GET, POST | `https://api.syraa.fun/event` | $0.01 | Upcoming and recent crypto events calendar |
| trending-headline | Trending Headlines | GET, POST | `https://api.syraa.fun/trending-headline` | $0.01 | What is trending in crypto news right now |
| sundown-digest | Sundown Digest | GET, POST | `https://api.syraa.fun/sundown-digest` | $0.01 | End-of-day crypto market recap |
| health | API Health | GET, POST | `https://api.syraa.fun/health` | $0.0001 | Paid liveness probe for Syra API |
| mpp-health | MPP Health Check | GET, POST | `https://api.syraa.fun/mpp/health` | $0.0001 | Machine Payments Protocol test lane (x402 v2) |
| arbitrage | Cross-CEX Arbitrage Bundle | GET, POST | `https://api.syraa.fun/arbitrage` | $0.04 | CMC top assets + live CEX snapshots + ranked spreads |
| pumpfun-trending | pump.fun Trending | GET, POST | `https://api.syraa.fun/pumpfun/trending` | $0.005 | Trending pump.fun coins list |
| pumpfun-movers | pump.fun Movers | GET, POST | `https://api.syraa.fun/pumpfun/movers` | $0.005 | pump.fun market movers list |
| pumpfun-analyzer | pump.fun Memecoin Analyzer | GET, POST | `https://api.syraa.fun/pumpfun/analyzer` | $0.02 | Full memecoin due-diligence for any Solana mint |
| pumpfun-scout | pump.fun Scout | GET, POST | `https://api.syraa.fun/pumpfun/scout` | $0.01 | Live pump.fun alpha/beta/predicted/utility scout |
| coingecko-scout | CoinGecko Scout | GET, POST | `https://api.syraa.fun/coingecko` | $0.01 | Live CoinGecko top gainers brief |
| assets-board | Assets Board | GET, POST | `https://api.syraa.fun/assets` | $0.005 | Tokens.xyz curated assets board with filter and sort |
| assets-detail | Asset Detail | GET, POST | `https://api.syraa.fun/assets/detail` | $0.005 | Tokens.xyz mint dossier for one asset |
| bitcoin-hub | Bitcoin Intelligence Hub | GET, POST | `https://api.syraa.fun/bitcoin` | $0.01 | Full Bitcoin dashboard + taker-flow bubblemap |
| chat-completions | Chat Completions (OpenRouter) | POST | `https://api.syraa.fun/chat/completions` | from $0.004* | OpenAI-compatible agent chat via OpenRouter models |
| images-generations | Image Generations (OpenRouter) | POST | `https://api.syraa.fun/images/generations` | from $0.02* | Text-to-image via OpenRouter Unified Image API |
| videos-generations | Video Generations (OpenRouter) | POST | `https://api.syraa.fun/videos/generations` | from $0.10* | Async text-to-video submit via OpenRouter Video API |

\* Dynamic pricing — charged from live token/model rates. See `GET /chat/completions/models`, `GET /images/generations/models`, `GET /videos/generations/models`.

---

### Pillar: Invest (deploy capital) — 1 route

| Slug | Name | Method | Endpoint | Price (USDC) | Summary |
|------|------|--------|----------|--------------|---------|
| jupiter-quote | Jupiter Swap Quote | GET, POST | `https://api.syraa.fun/jupiter/quote` | $0.003 | Jupiter Swap V1 ExactIn quote with Syra referral fee |

---

### Pillar: Earn (agent monetization) — 3 routes

| Slug | Name | Method | Endpoint | Price (USDC) | Summary |
|------|------|--------|----------|--------------|---------|
| 8004-stats | 8004 Global Stats | GET, POST | `https://api.syraa.fun/8004/stats` | $0.012 | Solana 8004 agent registry aggregate statistics |
| 8004-leaderboard | 8004 Leaderboard | GET, POST | `https://api.syraa.fun/8004/leaderboard` | $0.012 | Top 8004 agents ranked by trust tier |
| 8004-agents-search | 8004 Agent Search | GET, POST | `https://api.syraa.fun/8004/agents/search` | $0.012 | Search Solana 8004 agents by owner or collection |

---

### Pillar: Invest (RISE scout) — 1 route

| Slug | Name | Method | Endpoint | Price (USDC) | Summary |
|------|------|--------|----------|--------------|---------|
| rise-scout | RISE Scout | GET, POST | `https://api.syraa.fun/rise` | $0.01 | Live RISE market intel and agent targets |

---

### A2MCP primary service (copy-paste for OKX form)

```
Service name: Syra x402 Crypto Intelligence API
Description: Pay-per-call crypto intelligence APIs for agents. 28 routes covering news, signals, technical indicators, memecoin analysis, tokenized equity spreads, Bitcoin dashboard, Jupiter quotes, OpenRouter chat/image/video, and Solana 8004 agent registry. HTTP 402 (x402 v2) payment on Solana, Base, BSC, or Algoranda USDC. Discovery: https://api.syraa.fun/.well-known/x402. OpenAPI: https://api.syraa.fun/openapi.json. Docs: https://docs.syraa.fun.
Price: Per-route fixed USDC (see catalog); dynamic for LLM/media routes.
Endpoint: https://api.syraa.fun
OpenAPI spec: https://api.syraa.fun/openapi.json
```

---

## 3. A2A — Syra Brain Research Agent

**Service type:** Agent-to-Agent — negotiated, multi-round research tasks with escrow on XLayer.

### Capability declaration

| Element | Content |
|---------|---------|
| **Service name** | Syra Brain — Crypto Research Agent |
| **Task types** | Token due diligence, market narrative synthesis, multi-source crypto research, trading context reports, memecoin risk assessment, macro BTC/ETH briefings |
| **Trigger keywords** | research, analyze, due diligence, what's happening with, market brief, token report, crypto intelligence |
| **Input** | Natural-language question or research brief (scope, tickers, mints, time horizon) |
| **Output** | Markdown report with cited sources, tool usage log (`toolUsages[]`), probabilistic insights — not trade execution |
| **Tools available** | News, signals, indicators, pump.fun analyzer, assets board, Bitcoin hub, sentiment, Nansen (when configured), on-chain reads — selected server-side |
| **Endpoint** | `POST https://api.syraa.fun/brain` with `{ "question": "..." }` |

### Pricing strategy

| Tier | Scope | Quote range (USDC) | Floor |
|------|-------|-------------------|-------|
| **Quick brief** | Single question, 1–3 tool calls | $0.08 – $0.25 | $0.08 |
| **Standard research** | Multi-source synthesis, 4–8 tool calls | $0.25 – $1.00 | $0.25 |
| **Deep dossier** | Full token/market report with risk scoring | $1.00 – $5.00 | $1.00 |
| **Custom project** | Ongoing research, multiple deliverables | Negotiated | $5.00 |

**Default listing price:** $0.50 per standard research task.

**Scope negotiation script:**
- If user scope exceeds tier, quote incremental cost per additional tool call (~$0.01–$0.05 each).
- Decline execution/trade placement requests — Syra provides analysis only, not financial advice or order execution.
- For requests outside crypto (legal, tax, non-crypto design), politely redirect to A2MCP data APIs or decline.

### Delivery spec

| Element | Standard |
|---------|----------|
| **Format** | Markdown report + JSON metadata (`success`, `response`, `toolUsages`) |
| **Turnaround** | Quick: < 2 min; Standard: < 10 min; Deep: < 30 min |
| **Quality** | Grounded in live data; probabilistic language; cites tools used |
| **Revisions** | 1 free revision within 24h for scope clarification; additional revisions quoted at 50% of original price |
| **Rejection grounds** | Off-topic, illegal requests, guaranteed returns, trade execution |

### A2A primary service (copy-paste for OKX form)

```
Service name: Syra Brain — Crypto Research Agent
Description: Expert crypto research agent that answers natural-language questions by autonomously selecting and running Syra intelligence tools (news, signals, on-chain data, memecoin analysis). Delivers grounded markdown reports with tool usage transparency. Multi-round scope negotiation supported. Analysis only — not trade execution or financial advice.
Default price: $0.50 per standard research task (negotiable $0.08–$5.00 by scope).
Capabilities: token due diligence, market briefs, narrative synthesis, memecoin risk scoring, macro BTC/ETH reports.
Delivery: Markdown report + toolUsages log within 10 minutes.
```

---

## 4. Settlement & Payment

| Service type | OKX settlement | Syra current rails |
|--------------|----------------|-------------------|
| **A2MCP** | OKX Payment SDK — instant per-call on XLayer | x402 v2: Solana/Base/BSC/Algorand USDC |
| **A2A** | XLayer escrow — released on user approval | x402 per-call for API; A2A escrow separate |

### Payment flow (A2MCP)

1. User agent calls Syra API endpoint.
2. API returns HTTP 402 with `Payment-Required` header (x402 v2).
3. User agent signs payment and retries with `PAYMENT-SIGNATURE`.
4. Syra returns data.

For OKX marketplace go-live, integrate **OKX Payment SDK** so OKX-routed calls settle instantly on XLayer without manual x402 signing by the buyer's agent.

### Payment flow (A2A)

1. User agent negotiates scope and price with Syra Brain agent.
2. Funds held in escrow on XLayer.
3. Syra delivers research report.
4. User approves → funds released.
5. Disputes: ASP may file arbitration within 1 day (5% bounty deposit).

---

## 5. Prerequisites & Follow-on Engineering

### A2MCP: Remote HTTPS MCP gap

Syra's `@syra-ai/mcp-server` uses **stdio transport** (spawned subprocess for Cursor/Claude). OKX A2MCP requires a **publicly reachable HTTPS MCP endpoint**.

| Option | Effort | Recommendation |
|--------|--------|----------------|
| **A. OpenAPI registration** | Low — use existing `openapi.json` | **Start here** |
| **B. Deploy remote MCP gateway** | Medium — streamable-HTTP MCP proxy to `api.syraa.fun` | Ship as `mcp.syraa.fun` |
| **C. OKX Payment SDK** | Medium — XLayer instant settlement | Required for A2MCP go-live |

### OKX Payment SDK (follow-on, not in this dossier scope)

Per [OKX ASP tutorial](https://www.okx.ai/tutorial/asp), A2MCP requires OKX Payment SDK integration before going live. This is a separate engineering task:

1. Install OKX Payment SDK in `api/`.
2. Add XLayer settlement path alongside existing x402 rails.
3. Configure Agentic Wallet for fee collection.
4. Test with OKX marketplace sandbox before listing.

### Existing registration precedent in repo

- SAP: `api/scripts/register-sap-agent.js`
- 8004: `api/scripts/register-8004-agent.js`

An `api/scripts/register-okx-asp.js` automation script can be added later once OKX exposes a programmatic registration API via Onchain OS.

---

## 6. Verification checklist

Before submitting to OKX:

- [ ] `GET https://api.syraa.fun/health` returns 200 (with payment) or 402 (without)
- [ ] `GET https://api.syraa.fun/.well-known/x402` lists all 28 discovery routes
- [ ] `GET https://api.syraa.fun/openapi.json` is valid OpenAPI 3.x
- [ ] `POST https://api.syraa.fun/brain` with `{ "question": "What is the latest BTC news?" }` returns synthesis
- [ ] Agentic Wallet email login completed via Onchain OS
- [ ] A2MCP and A2A profiles submitted
- [ ] Listing request sent; await 2-business-day review email

---

## 7. Links

| Resource | URL |
|----------|-----|
| OKX ASP tutorial | https://www.okx.ai/tutorial/asp |
| OKX A2MCP guide | https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp |
| OKX A2A guide | https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a |
| Syra docs | https://docs.syraa.fun |
| Syra playground | https://playground.syraa.fun |
| Syra analytics | https://syraa.fun/analytics |
| Open tasks (A2A intake) | https://www.okx.ai/tasks |
