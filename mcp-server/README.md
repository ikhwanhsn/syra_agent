<div align="center">

<img src="../web/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra MCP Server**

### Machine money for agents — MCP distribution for Cursor, Claude, and agent frameworks

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API Marketplace](https://img.shields.io/badge/build-syraa.fun%2Fmarketplace-26a5e4)](https://syraa.fun/marketplace)

**[Documentation](https://docs.syraa.fun)** · **[API Marketplace](https://syraa.fun/marketplace)** · **[SDK](../syra-sdk)** · **[Agent demo](https://syraa.fun)**

</div>

---

## One-line install (Cursor / Claude Desktop)

```bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
```

Or run directly:

```bash
npx -y @syra-ai/mcp-server
```

Set `SYRA_API_BASE_URL=https://api.syraa.fun`. For production auto-pay, set `SYRA_PAYER_KEYPAIR` (Solana USDC wallet). For agent-direct tools (web-search, Nansen, GMGN, etc.), configure the MCP bridge on the API (`SYRA_MCP_BRIDGE_ENABLED`, `SYRA_MCP_API_KEY`, `SYRA_MCP_AGENT_ANONYMOUS_ID`) and pass `SYRA_MCP_API_KEY` to the MCP server.

Use `SYRA_MCP_TOOL_PROFILE=full` to expose all ~240 tools; default `curated` exposes ~42 high-value tools plus `syra_call_tool` escape hatch.

---

A **Model Context Protocol (MCP)** server that exposes **Syra machine money** — x402 APIs, agent wallets, and treasury — as tools for AI assistants. Use it from **Cursor**, **Claude Desktop**, **ElizaOS**, or any MCP-compatible client.

Part of the [Syra monorepo](../README.md). The same API gateway powers Syra-backed brands **S3 Labs** and **Up Only Fund**; this MCP server targets the core Syra paid route surface.

---

## Table of Contents

- [Overview](#overview)
- [Who Can Use This](#who-can-use-this)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [Setting Up in Cursor](#setting-up-in-cursor)
- [Setting Up in Claude Desktop](#setting-up-in-claude-desktop)
- [Tools Reference](#tools-reference)
- [API Endpoint Mapping](#api-endpoint-mapping)
- [Payment (x402) and Dev Routes](#payment-x402-and-dev-routes)
- [Testing Against Local API](#testing-against-local-api)
- [Example Prompts](#example-prompts)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Version](#version)

---

## Overview

### What it does

The Syra MCP server **translates MCP tool calls into HTTP GET requests** to the Syra API. When an AI assistant (e.g. in Cursor) calls a tool like `syra_v2_news`, the server:

1. Receives the tool name and parameters over **stdio**.
2. Builds the corresponding API URL (e.g. `GET https://api.syraa.fun/news?ticker=BTC`).
3. Fetches the URL and returns the response body (or status + body on error) back to the client.

Each MCP tool maps to exactly one API path (unversioned paths, e.g. `/news`, `/signal`). The server does **not** add authentication or payment headers—it only proxies requests. For production, x402 payment must be handled by your API client or another layer.

### Transport: stdio

The server uses **stdio** (standard input/output) as the transport. The MCP client (Cursor, Claude Desktop, etc.) **spawns** the server as a subprocess and communicates via stdin/stdout using JSON-RPC. There is no HTTP server; the server only talks to the process that started it.

### Protocol and compatibility

- Built with the official [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) (`@modelcontextprotocol/sdk`).
- Compatible with **any MCP client** that supports **stdio** transport.
- Server name: `syra-mcp-server`, version: `0.4.0`.

### Payment (high level)

The **production** Syra API uses **x402 v2** (`Payment-Required` → `PAYMENT-SIGNATURE` retry). When you configure a payer wallet, this MCP server **auto-pays** via `@x402/fetch` (same stack as `api/libs/agentX402Client.js`). Supported rails: **Solana USDC** (default), **Base USDC** (`X402_PREFERRED_NETWORK=base`), **Algorand USDC** (`X402_PREFERRED_NETWORK=algorand`). For **local testing**, use dev routes (`SYRA_USE_DEV_ROUTES=true`) against a local API.

---

## Who Can Use This

| Audience | How they use it |
|----------|------------------|
| **Developers** | Add the server to Cursor or Claude Desktop; get crypto data (news, events, signals, research) directly in the AI chat while coding or researching. |
| **Analysts / researchers** | Use AI assistants with Syra tools to pull sentiment, trending headlines, smart money, memecoin screens, and deep research without leaving the chat. |
| **Traders** | Quick access to signals, token reports, Rugcheck data, Jupiter trending, and analytics summary via natural language in the assistant. |
| **Any MCP client user** | Anyone using an app that supports MCP (Cursor, Claude Desktop, or custom clients) can add this server and use it if they have access to the Syra API (and payment when using production). |

**Requirements for use:** Node.js 18+, ability to run `node dist/index.js` (or `npm start`), and either a local Syra API or production API access (with x402 payment for paid endpoints).

---

## Features

- **240+ MCP tools** (codegen from `api/config/agentTools.js`):
  - **Curated profile (default)** — ~42 high-value routes + `syra_call_tool` for any toolId
  - **Full profile** — every agent tool via `SYRA_MCP_TOOL_PROFILE=full`
  - **x402 v2 auto-pay** — `@x402/fetch` + `PAYMENT-SIGNATURE` (Solana / Base / Algorand)
  - **Agent-direct bridge** — web-search, crawl, Nansen, GMGN, etc. via `POST /mcp/tools/call`

- **Configurable base URL** — Point to production (`https://api.syraa.fun`) or your local API (e.g. `http://localhost:3000`).
- **Optional dev routes** — When `SYRA_USE_DEV_ROUTES=true`, the server appends `/dev` to each API path (e.g. `/news/dev`). Use with a local API that implements `/dev` routes to skip x402 payment during development.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | Version **18 or higher**. Check with `node -v`. |
| **Syra API** | Either the **production** API at `https://api.syraa.fun` or your **local** API (e.g. `http://localhost:3000`). The MCP server only works if this API is reachable from the machine running the server. |
| **Payment (production)** | Production endpoints use **x402 v2**. Set `SYRA_PAYER_KEYPAIR` (Solana) or the EVM/Algorand payer env for your rail. Without a payer, paid tools return **402**. For local testing, use `SYRA_USE_DEV_ROUTES=true`. |
| **MCP client** | An application that supports MCP with stdio (e.g. Cursor, Claude Desktop). |

---

## Installation

### Step 1: Clone or open the repo

Ensure you have the `syra-monorepo` (or at least the `mcp-server` folder) on your machine.

### Step 2: Install dependencies and build

From the **mcp-server** directory:

```bash
cd mcp-server
npm install
npm run build
```

This installs dependencies (`@modelcontextprotocol/sdk`, `zod`, and dev dependencies) and compiles TypeScript to `dist/index.js`.

### Step 3: Verify

Run the server once to ensure it starts (it will wait on stdin; press Ctrl+C to stop):

```bash
node dist/index.js
```

You should see no prompt; the process stays running. If you see a Node or module error, fix the environment (Node 18+, correct path) and try again.

### Optional: use from monorepo root

If you are at the monorepo root:

```bash
cd d:\business\syra-monorepo\mcp-server
npm install
npm run build
```

Then use the full path to `dist/index.js` in your MCP config (see below).

---

## Configuration

Configuration is done via **environment variables**. Copy `.env.example` to `.env` in the `mcp-server` folder and edit as needed.

### Environment variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SYRA_API_BASE_URL` | Base URL of the Syra API. No trailing slash. | `https://api.syraa.fun` | `http://localhost:3000` |
| `SYRA_PAYER_KEYPAIR` | Solana secret (base58 or JSON bytes) for x402 v2 auto-pay | not set | Phantom export |
| `PAYER_KEYPAIR` | Alias for `SYRA_PAYER_KEYPAIR` (matches API env) | not set | same as above |
| `X402_PREFERRED_NETWORK` | Payment rail: `solana` (default), `base`, `algorand` | `solana` | `base` |
| `SYRA_EVM_PAYER_PRIVATE_KEY` | Base USDC payer (32-byte hex) when `X402_PREFERRED_NETWORK=base` | not set | `0x...` |
| `SYRA_ALGORAND_PAYER_PRIVATE_KEY` | Algorand payer (base64 64-byte key) when `X402_PREFERRED_NETWORK=algorand` | not set | from wallet |
| `BASE_BUILDER_CODE` | Optional Base builder attribution on EVM payments | not set | `syra_mcp` |
| `SYRA_MCP_API_KEY` | Auth for agent-direct tools via `POST /mcp/tools/call` on the API | not set | shared with API env |
| `SYRA_MCP_TOOL_PROFILE` | `curated` (default) or `full` | `curated` | `full` |
| `SYRA_USE_DEV_ROUTES` | If set to `true` or `1`, appends `/dev` to each API path | not set (false) | `true` |
| `SYRA_CONNECTED_WALLET` | Optional `X-Connected-Wallet` header for dev/marketplace pricing | not set | wallet address |
| `SYRA_SOLANA_RPC_URL` | RPC for x402 Solana payment signing | `SOLANA_RPC_URL` or public RPC | Helius URL |
| `SOLANA_RPC_BLOCKCHAIN_URL` | Full-access Solana RPC (preferred for x402 mint/blockhash) | not set | Helius blockchain URL |
| `SOLANA_RPC_FALLBACK_URL` | Fallback when primary RPC blocks blockchain JSON-RPC | public mainnet-beta | Ankr URL |

### Example `.env` for local testing (no payment)

```env
SYRA_API_BASE_URL=http://localhost:3000
SYRA_USE_DEV_ROUTES=true
```

### Example `.env` for production (Solana x402 v2)

```env
SYRA_API_BASE_URL=https://api.syraa.fun
SYRA_PAYER_KEYPAIR=your-base58-or-json-solana-secret
SYRA_MCP_API_KEY=your-mcp-bridge-key
SYRA_SOLANA_RPC_URL=https://your-helius-rpc
# Do not set SYRA_USE_DEV_ROUTES
```

### How the client passes env

When you run the server **via an MCP client** (Cursor, Claude Desktop), the client’s config must pass these variables if you want to override defaults. For example, in Cursor you set `env` in the MCP server config (see [Setting Up in Cursor](#setting-up-in-cursor)). The server reads `process.env` at startup, so whatever environment the client uses when spawning the process is what the server sees.

---

## Running the Server

The server is **not** meant to be run manually for normal use. The **MCP client** (Cursor, Claude Desktop, etc.) spawns it and talks to it over stdio. You only run it manually for debugging or quick tests.

### Manual run (debugging)

```bash
# Default: production API (may get 402 on paid endpoints)
node dist/index.js

# Local API + dev routes
set SYRA_API_BASE_URL=http://localhost:3000
set SYRA_USE_DEV_ROUTES=true
node dist/index.js
```

On macOS/Linux use `export` instead of `set`. Or use a `.env` file and a loader (e.g. `dotenv`) if you integrate one.

### Via npm scripts

```bash
npm start          # same as: node dist/index.js
npm run dev        # runs tsx src/index.ts (no build step; for development)
```

### What “stdio” means

The server does not open a port. It reads JSON-RPC messages from **stdin** and writes responses to **stdout**. The MCP client starts the process and attaches to these streams. So “running” the server in production means the client starts it; you don’t need to keep a terminal open.

---

## Setting Up in Cursor

1. Open **Cursor Settings** (e.g. File → Preferences → Cursor Settings).
2. Go to **Features** → **MCP** (or search for “MCP”).
3. Add a new MCP server that uses **stdio** and runs this server.

### Option A: Cursor UI

- **Transport:** stdio  
- **Command:** Full path to Node and the built script, for example:
  - Windows: `node D:\business\syra-monorepo\mcp-server\dist\index.js`
  - macOS/Linux: `node /path/to/syra-monorepo/mcp-server/dist/index.js`

If the UI has fields for environment variables, set:

- `SYRA_API_BASE_URL` = `http://localhost:3000` (for local API)
- `SYRA_USE_DEV_ROUTES` = `true` (to use `/dev` routes when testing locally)

### Option B: Config file (mcp.json or Cursor MCP config)

Cursor may read an `mcpServers`-style config. Example (Windows path with escaped backslashes in JSON):

```json
{
  "mcpServers": {
    "syra": {
      "command": "node",
      "args": ["D:\\business\\syra-monorepo\\mcp-server\\dist\\index.js"],
      "env": {
        "SYRA_API_BASE_URL": "http://localhost:3000",
        "SYRA_USE_DEV_ROUTES": "true"
      }
    }
  }
}
```

macOS/Linux example:

```json
{
  "mcpServers": {
    "syra": {
      "command": "node",
      "args": ["/home/user/syra-monorepo/mcp-server/dist/index.js"],
      "env": {
        "SYRA_API_BASE_URL": "http://localhost:3000",
        "SYRA_USE_DEV_ROUTES": "true"
      }
    }
  }
}
```

Replace the path with your actual `mcp-server/dist/index.js` path. For production, set `SYRA_API_BASE_URL` to `https://api.syraa.fun` and remove or set `SYRA_USE_DEV_ROUTES` to `false`.

4. **Restart Cursor** or use “Reload MCP” (if available) so the new server is loaded.
5. In chat, ask for crypto news, events, or other data; the assistant will call tools like `syra_v2_news` and `syra_v2_event`.

---

## Setting Up in Claude Desktop

1. Find your Claude Desktop MCP config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the Syra MCP server under `mcpServers`. Example (adjust the path):

```json
{
  "mcpServers": {
    "syra": {
      "command": "node",
      "args": ["C:\\path\\to\\syra-monorepo\\mcp-server\\dist\\index.js"],
      "env": {
        "SYRA_API_BASE_URL": "http://localhost:3000",
        "SYRA_USE_DEV_ROUTES": "true"
      }
    }
  }
}
```

3. Restart Claude Desktop. The Syra tools should appear and Claude can call them when relevant.

---

## Tools Reference

All tools return the **raw API response body** (usually a JSON string) when the API returns **200**. For any other status (e.g. 402), the tool returns a text message that includes the status and body so the model (and you) can see what went wrong.

### News & events

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_news` | `ticker` (optional, default: `"general"`) — e.g. `BTC`, `ETH` | Latest crypto news. Use `general` for all. |
| `syra_v2_event` | `ticker` (optional, default: `"general"`) | Upcoming and recent crypto events, conferences, and launches. |

### Sentiment & headlines

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_sentiment` | `ticker` (optional, default: `"general"`) | Market sentiment analysis over the last 30 days. |
| `syra_v2_trending_headline` | `ticker` (optional, default: `"general"`) | Trending crypto headlines. |

### Signals

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_signal` | `token` (optional, default: `"bitcoin"`) — e.g. `solana`, `ethereum` | AI-generated trading signals with entry/exit recommendations. |

### Research & browse

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_research` | `query` (required), `type` (optional: `"quick"` \| `"deep"`) | AI-powered deep research on a crypto topic with cited sources. |
| `syra_v2_browse` | `query` (required) — URL or search query | AI-powered web browsing and information extraction. |
| `syra_v2_x_search` | `query` (required) | Deep research on X/Twitter for crypto trends and discussions. |
| `syra_spend_web_search` | `query` (required) | Free web search via DuckDuckGo/Bing scrape; only the search query is dynamic. |

### Token & address-based

All of these require a **token or contract address** (Solana where noted).

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_x_kol` | `address` (required) — Solana token contract address | KOL/influencer mentions and sentiment for a token on X. |
| `syra_v2_token_god_mode` | `tokenAddress` (required) | Nansen token god mode: deep research for a token. |
| `syra_v2_bubblemaps_maps` | `address` (required) — Solana token contract address | Bubblemaps holder/concentration map data. |

### Syra Brain (POST)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_brain` | `question` (required) — natural language question | Single-question API: Syra selects tools, runs them, and returns one synthesized answer (e.g. latest BTC news, trending pools). |

### No-parameter (GET only)

| Tool | Description |
|------|-------------|
| `syra_v2_check_status` | Health check: API server status and connectivity. |
| `syra_v2_sundown_digest` | Daily sundown digest (crypto roundup). |
| `syra_v2_gems` | Hidden gem crypto projects trending on X/Twitter. |
| `syra_v2_crypto_kol` | Latest insights from top crypto KOLs. |
| `syra_v2_smart_money` | Smart money tracking: net flow, holdings, DEX trades, DCA. |
| `syra_v2_trending_jupiter` | Trending tokens on Jupiter. |
| `syra_v2_analytics_summary` | Analytics summary: trending Jupiter, Nansen smart money, Binance correlation. |

### Squid Router (cross-chain)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_squid_route` | `fromAddress`, `fromChain`, `fromToken`, `fromAmount`, `toChain`, `toToken`, `toAddress`, `slippage` (optional, default 1) | Get cross-chain route/quote; returns route and transactionRequest for first leg (user signs on source chain). Requires API env `SQUID_INTEGRATOR_ID`. |
| `syra_v2_squid_status` | `transactionId`, `requestId`, `fromChainId`, `toChainId`, `quoteId` (optional, for Coral V2) | Check status of a cross-chain transaction. |

### Binance

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_binance_correlation` | `symbol` (optional, default: `"BTCUSDT"`) — e.g. `ETHUSDT` | Top correlated assets for a symbol. |
| `syra_v2_binance_correlation_matrix` | `symbol` (optional) | Full Binance correlation matrix. |

### Memecoin screens (all no-parameter)

| Tool | Description |
|------|-------------|
| `syra_v2_memecoin_fastest_holder_growth` | Fastest growing memecoins by holder growth rate. |
| `syra_v2_memecoin_most_mentioned_smart_money_x` | Memecoins most mentioned by smart money on X. |
| `syra_v2_memecoin_accumulating_before_cex_rumors` | Memecoins accumulating before CEX listing rumors. |
| `syra_v2_memecoin_strong_narrative_low_mcap` | Strong narrative, low market cap memecoins. |
| `syra_v2_memecoin_by_experienced_devs` | Memecoins by experienced developers. |
| `syra_v2_memecoin_unusual_whale_behavior` | Unusual whale behavior in memecoins. |
| `syra_v2_memecoin_trending_on_x_not_dex` | Memecoins trending on X but not yet on DEX. |
| `syra_v2_memecoin_organic_traction` | Memecoins with organic traction. |
| `syra_v2_memecoin_surviving_market_dumps` | Memecoins surviving market dumps. |

### Quicknode RPC (Solana, Base)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_quicknode_balance` | `chain` (solana \| base), `address` (required) | Get native balance for a wallet. Requires API env QUICKNODE_SOLANA_RPC_URL / QUICKNODE_BASE_RPC_URL. |
| `syra_v2_quicknode_transaction` | `chain`, `signature` (Solana) or `txHash` (Base) | Get transaction status. |
| `syra_v2_quicknode_rpc` | `chain`, `method`, `params` (optional JSON string) | Forward raw JSON-RPC to Quicknode. |

### Bankr (agent prompts, job status, balances)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_bankr_balances` | `chains` (optional, e.g. base,solana) | Wallet balances across chains. Requires BANKR_API_KEY in API. |
| `syra_v2_bankr_prompt` | `prompt` (required), `threadId` (optional) | Submit natural language prompt; returns jobId. Poll syra_v2_bankr_job for result. |
| `syra_v2_bankr_job` | `jobId` (required) | Get job status and result. |
| `syra_v2_bankr_job_cancel` | `jobId` (required) | Cancel a pending/processing job. |

### Neynar (Farcaster API)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_neynar_user` | `username` or `fids` (optional) | Farcaster user by username or FIDs. |
| `syra_v2_neynar_feed` | `feed_type`, `fid`, `channel_id`, `limit`, `cursor` | Farcaster feed. |
| `syra_v2_neynar_cast` | `identifier` (required) | Single cast by hash or URL. |
| `syra_v2_neynar_search` | `q` (required), `limit`, `channel_id` | Search casts. |

### SIWA (Sign-In With Agent)

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_siwa_nonce` | `address`, `agentId`, `agentRegistry` (optional) | Get nonce for agent sign-in. |
| `syra_v2_siwa_verify` | `message`, `signature` | Verify SIWA signed message. |

---

## API Endpoint Mapping

Every MCP tool performs a **GET** request to the path below. When `SYRA_USE_DEV_ROUTES=true`, the server appends `/dev` to the path (e.g. `/news` → `/news/dev`). Query parameters are passed as given by the tool schema. The API uses unversioned paths; the table shows the path used by the MCP server.

| MCP Tool | API Path |
|----------|----------|
| `syra_v2_brain` | `POST /brain` (body: `{ "question": "..." }`) |
| `syra_v2_news` | `/news` |
| `syra_v2_event` | `/event` |
| `syra_v2_sentiment` | `/sentiment` |
| `syra_v2_trending_headline` | `/trending-headline` |
| `syra_v2_signal` | `/signal` |
| `syra_v2_check_status` | `/health` |
| `syra_v2_sundown_digest` | `/sundown-digest` |
| `syra_v2_gems` | `/gems` |
| `syra_v2_crypto_kol` | `/crypto-kol` |
| `syra_v2_smart_money` | `/smart-money` |
| `syra_v2_trending_jupiter` | `/trending-jupiter` |
| `syra_v2_analytics_summary` | `/analytics/summary` |
| `syra_v2_squid_route` | `POST /squid/route` (body: fromAddress, fromChain, fromToken, fromAmount, toChain, toToken, toAddress, slippage) |
| `syra_v2_squid_status` | `/squid/status` (query: transactionId, requestId, fromChainId, toChainId, quoteId) |
| `syra_v2_research` | `/research` |
| `syra_v2_browse` | `/browse` |
| `syra_v2_x_search` | `/x-search` |
| `syra_spend_web_search` | `/web-search` |
| `syra_v2_x_kol` | `/x-kol` |
| `syra_v2_token_god_mode` | `/token-god-mode` |
| `syra_v2_bubblemaps_maps` | `/bubblemaps/maps` |
| `syra_v2_binance_correlation` | `/binance/correlation` |
| `syra_v2_binance_correlation_matrix` | `/binance/correlation-matrix` |
| `syra_v2_memecoin_fastest_holder_growth` | `/memecoin/fastest-holder-growth` |
| `syra_v2_memecoin_most_mentioned_smart_money_x` | `/memecoin/most-mentioned-by-smart-money-x` |
| `syra_v2_memecoin_accumulating_before_cex_rumors` | `/memecoin/accumulating-before-CEX-rumors` |
| `syra_v2_memecoin_strong_narrative_low_mcap` | `/memecoin/strong-narrative-low-market-cap` |
| `syra_v2_memecoin_by_experienced_devs` | `/memecoin/by-experienced-devs` |
| `syra_v2_memecoin_unusual_whale_behavior` | `/memecoin/unusual-whale-behavior` |
| `syra_v2_memecoin_trending_on_x_not_dex` | `/memecoin/trending-on-x-not-dex` |
| `syra_v2_memecoin_organic_traction` | `/memecoin/organic-traction` |
| `syra_v2_memecoin_surviving_market_dumps` | `/memecoin/surviving-market-dumps` |
| `syra_v2_quicknode_balance` | `/quicknode/balance` (query: chain, address) |
| `syra_v2_quicknode_transaction` | `/quicknode/transaction` (query: chain, signature or txHash) |
| `syra_v2_quicknode_rpc` | `POST /quicknode/rpc` (body: chain, method, params) |
| `syra_v2_bankr_balances` | `/bankr/balances` (query: chains) |
| `syra_v2_bankr_prompt` | `POST /bankr/prompt` (body: prompt, threadId) |
| `syra_v2_bankr_job` | `/bankr/job/:jobId` |
| `syra_v2_bankr_job_cancel` | `POST /bankr/job/:jobId/cancel` |
| `syra_v2_neynar_user` | `/neynar/user` (query: username or fids) |
| `syra_v2_neynar_feed` | `/neynar/feed` |
| `syra_v2_neynar_cast` | `/neynar/cast` (query: identifier) |
| `syra_v2_neynar_search` | `/neynar/search` (query: q) |
| `syra_v2_siwa_nonce` | `POST /siwa/nonce` |
| `syra_v2_siwa_verify` | `POST /siwa/verify` |

---

## Payment (x402 v2) and Dev Routes

### Production API (https://api.syraa.fun)

Paid endpoints return **402** with a `Payment-Required` header (x402 v2). When a payer wallet is configured, the MCP server:

1. Reads the payment challenge from the 402 response
2. Signs a `PAYMENT-SIGNATURE` payload via `@x402/fetch`
3. Retries the request automatically (with transient 402/429 backoff)

**Solana (default):** set `SYRA_PAYER_KEYPAIR` with a USDC-funded wallet.

**Base:** set `X402_PREFERRED_NETWORK=base` and `SYRA_EVM_PAYER_PRIVATE_KEY`.

**Algorand:** set `X402_PREFERRED_NETWORK=algorand` and `SYRA_ALGORAND_PAYER_PRIVATE_KEY`.

Without a payer, tools return the 402 body so the model can surface payment requirements.

### Dev routes (local testing)

When **`SYRA_USE_DEV_ROUTES=true`** and **`SYRA_API_BASE_URL`** points to your **local** API, the server appends **`/dev`** to each path it calls. For example:

- `/news` → `/news/dev`
- `/event` → `/event/dev`
- `/health` → `/health/dev`

Whether the API actually skips payment for a given path depends on how your **API** implements the `/dev` routes. Use dev routes **only** with a local or non-production API.

### Summary

| Scenario | Base URL | SYRA_USE_DEV_ROUTES | Result |
|----------|----------|---------------------|--------|
| Local testing, no payment | `http://localhost:3000` | `true` | Paths become `.../dev`; API may return 200 without payment. |
| Production (with payer) | `https://api.syraa.fun` | not set | Auto x402 v2 pay via configured wallet |
| Production (no payer) | `https://api.syraa.fun` | not set | 402 on paid routes |

---

## Testing Against Local API

1. **Start the Syra API** (e.g. from the monorepo `api` folder: `npm run dev`) so endpoints are available at `http://localhost:3000` (or your configured port).
2. **Configure the MCP server** with `SYRA_API_BASE_URL=http://localhost:3000` and `SYRA_USE_DEV_ROUTES=true` (in `.env` or in the MCP client’s `env` for this server).
3. **Add the MCP server** in Cursor (or Claude Desktop) as described above and restart/reload MCP.
4. **In chat**, ask for “crypto news” or “Syra events for ETH.” The assistant should call `syra_v2_news` or `syra_v2_event` and return data (or a 402 body if the API still requires payment for that route). Tool names keep the `syra_v2_*` prefix for backward compatibility; they call the Syra API at unversioned paths (e.g. `/news`, `/signal`).

If you get **402**, the tool result will include the response body so you can see the API’s payment requirements. For 200 without payment, ensure your local API exposes the `/dev` variants and the server is using dev routes.

---

## Example Prompts

Once the server is connected, you can try prompts like these in Cursor or Claude:

- “Get the latest crypto news.”
- “Fetch Syra news for BTC.”
- “What are the upcoming crypto events?”
- “Get market sentiment for ETH.”
- “Give me the sundown digest.”
- “What’s trending on Jupiter?”
- “Get the full analytics summary.”
- “Get a cross-chain route from Base to Arbitrum for 100 USDC.”
- “Deep research on [token or topic].”
- “Search X for [query].”
- “Rugcheck token report for address [address].”
- “Binance correlation for ETHUSDT.”
- “Memecoins with fastest holder growth.”

The model will choose the appropriate tool(s) and parameters. For a single natural-language question that runs multiple Syra tools and returns one answer, use **Syra Brain**: e.g. "Ask Syra Brain: what is the latest BTC news?" (uses `syra_v2_brain`).

---

## Project Structure

```
mcp-server/
├── src/
│   └── index.ts          # Server entry; all tools and fetch logic
├── dist/
│   ├── index.js          # Compiled output (run this)
│   └── index.d.ts        # Type declarations
├── .env                  # Your config (copy from .env.example)
├── .env.example          # Example env vars
├── package.json
├── tsconfig.json
└── README.md
```

---

## Development

### Source and build

- **Source:** `src/index.ts`
- **Build:** `npm run build` runs `tsc` and outputs to `dist/index.js` and `dist/index.d.ts`.
- **Dev run:** `npm run dev` runs `tsx src/index.ts` so you can edit TypeScript without rebuilding.

### Adding or changing tools

Tools are **generated** from [`api/config/agentTools.js`](../api/config/agentTools.js):

```bash
node scripts/sync-mcp-tools.mjs
# or: cd mcp-server && npm run sync:mcp-tools
```

Regenerate after editing agent tools, then `npm run build` in `mcp-server/` and reload MCP in Cursor.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **402 from tools** | Set payer for your rail: `SYRA_PAYER_KEYPAIR` (Solana), `SYRA_EVM_PAYER_PRIVATE_KEY` + `X402_PREFERRED_NETWORK=base`, or Algorand key + `X402_PREFERRED_NETWORK=algorand`. For agent-direct tools, enable MCP bridge on API and pass `SYRA_MCP_API_KEY`. Local: `SYRA_USE_DEV_ROUTES=true`. |
| **Connection refused / timeout** | Ensure the Syra API is running and reachable at `SYRA_API_BASE_URL`. If the API is on localhost, the MCP server must run on the same machine (or use a URL that is reachable from where the server runs). |
| **Cursor/Claude doesn’t list Syra tools** | Restart the app or reload MCP. Confirm the MCP config: correct path to `dist/index.js`, `command` and `args` (e.g. `node` and `["path/to/dist/index.js"]`). Run `node dist/index.js` manually to ensure it starts without errors. |
| **Wrong API or dev routes not used** | Verify `SYRA_API_BASE_URL` and `SYRA_USE_DEV_ROUTES` in the **environment** passed by the MCP client (e.g. `env` in the server config). The server reads only `process.env` at startup. |
| **Build or run errors** | Run `npm install` and `npm run build` inside `mcp-server`. Ensure Node.js is 18+ (`node -v`). On Windows, use the correct path format and escaped backslashes in JSON. |
| **Tool returns “API returned 402”** | Expected without a payer wallet. Set `SYRA_PAYER_KEYPAIR` or use local API + dev routes. |

---

## Version

- **Package:** `@syra-ai/mcp-server`
- **Version:** `0.4.0` (see `package.json`)

For more on the Syra API, x402, and the rest of the monorepo, see the main Syra documentation and API docs.
