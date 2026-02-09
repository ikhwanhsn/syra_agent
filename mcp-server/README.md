# Syra MCP Server

A **Model Context Protocol (MCP)** server that exposes the **Syra v2 API** as tools for AI assistants. Use it from **Cursor**, **Claude Desktop**, or any other MCP-compatible client to fetch crypto news, events, sentiment, signals, research, token reports, memecoin screens, and more—all from inside your AI chat.

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

The Syra MCP server **translates MCP tool calls into HTTP GET requests** to the Syra v2 API. When an AI assistant (e.g. in Cursor) calls a tool like `syra_v2_news`, the server:

1. Receives the tool name and parameters over **stdio**.
2. Builds the corresponding v2 URL (e.g. `GET https://api.syraa.fun/v2/news?ticker=BTC`).
3. Fetches the URL and returns the response body (or status + body on error) back to the client.

Each MCP tool maps to exactly one v2 API path. The server does **not** add authentication or payment headers—it only proxies requests. For production, x402 payment must be handled by your API client or another layer.

### Transport: stdio

The server uses **stdio** (standard input/output) as the transport. The MCP client (Cursor, Claude Desktop, etc.) **spawns** the server as a subprocess and communicates via stdin/stdout using JSON-RPC. There is no HTTP server; the server only talks to the process that started it.

### Protocol and compatibility

- Built with the official [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) (`@modelcontextprotocol/sdk`).
- Compatible with **any MCP client** that supports **stdio** transport.
- Server name: `syra-mcp-server`, version: `0.2.0`.

### Payment (high level)

The **production** Syra v2 API at `https://api.syraa.fun` uses **x402** for many endpoints. Without a valid payment header, those endpoints return **402 Payment Required**. This MCP server only forwards requests; it does **not** inject payment. For **local testing**, you can point the server at your own API and use **dev routes** (see [Configuration](#configuration) and [Payment (x402) and Dev Routes](#payment-x402-and-dev-routes)) to avoid payment.

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

- **30+ MCP tools** covering the full Syra v2 API:
  - **News & events** — Latest crypto news and upcoming/recent events (optional ticker: BTC, ETH, or `general`).
  - **Sentiment & headlines** — Market sentiment (30 days) and trending crypto headlines (optional ticker).
  - **Signals** — AI-generated trading signals with entry/exit (optional token name).
  - **Research & browse** — Deep research on crypto topics (quick/deep), web browse and extract from URL or query, X/Twitter search.
  - **Token & chain data** — Rugcheck token report and statistics, Nansen token god mode, Bubblemaps holder/concentration maps, X KOL analysis (by Solana token address).
  - **Analytics** — Health check, daily sundown digest, hidden gems (X), crypto KOL insights, smart money tracking, DEXScreener, Jupiter trending, full analytics summary.
  - **Binance** — Correlation for a symbol (default BTCUSDT) and full correlation matrix.
  - **Pump.fun** — Workfun/pump data (trending, etc.).
  - **Memecoin screens** — Fastest holder growth, smart money mentions, pre-CEX accumulation, strong narrative + low mcap, by experienced devs, unusual whale behavior, trending on X not DEX, organic traction, surviving market dumps.

- **Configurable base URL** — Point to production (`https://api.syraa.fun`) or your local API (e.g. `http://localhost:3000`).
- **Optional dev routes** — When `SYRA_USE_DEV_ROUTES=true`, the server appends `/dev` to **every** v2 path (e.g. `/v2/news/dev`). Use with a local API that implements `/dev` routes to skip x402 payment during development.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | Version **18 or higher**. Check with `node -v`. |
| **Syra v2 API** | Either the **production** API at `https://api.syraa.fun` or your **local** API (e.g. `http://localhost:3000`). The MCP server only works if this API is reachable from the machine running the server. |
| **Payment (production)** | Production v2 endpoints use **x402**. Without a valid payment header you will get **402** responses. For local testing, use your local API and set `SYRA_USE_DEV_ROUTES=true` to call `/dev` routes (no payment), if your API supports them. |
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
| `SYRA_API_BASE_URL` | Base URL of the Syra v2 API. No trailing slash. | `https://api.syraa.fun` | `http://localhost:3000` |
| `SYRA_USE_DEV_ROUTES` | If set to `true` or `1`, the server appends `/dev` to every v2 path (e.g. `/v2/news` → `/v2/news/dev`). Use **only** with a local API that implements these routes; do not use in production. | not set (false) | `true` |

### Example `.env` for local testing (no payment)

```env
SYRA_API_BASE_URL=http://localhost:3000
SYRA_USE_DEV_ROUTES=true
```

### Example `.env` for production

```env
SYRA_API_BASE_URL=https://api.syraa.fun
# Do not set SYRA_USE_DEV_ROUTES; paid endpoints require x402 payment from your client/setup.
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

### Token & address-based

All of these require a **token or contract address** (Solana where noted).

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_x_kol` | `address` (required) — Solana token contract address | KOL/influencer mentions and sentiment for a token on X. |
| `syra_v2_token_report` | `address` (required) | Rugcheck token report. |
| `syra_v2_token_god_mode` | `tokenAddress` (required) | Nansen token god mode: deep research for a token. |
| `syra_v2_bubblemaps_maps` | `address` (required) — Solana token contract address | Bubblemaps holder/concentration map data. |

### No-parameter (GET only)

| Tool | Description |
|------|-------------|
| `syra_v2_check_status` | Health check: API server status and connectivity. |
| `syra_v2_sundown_digest` | Daily sundown digest (crypto roundup). |
| `syra_v2_gems` | Hidden gem crypto projects trending on X/Twitter. |
| `syra_v2_crypto_kol` | Latest insights from top crypto KOLs. |
| `syra_v2_token_statistic` | Rugcheck token statistics (new, recent, trending, verified). |
| `syra_v2_smart_money` | Smart money tracking: net flow, holdings, DEX trades, DCA. |
| `syra_v2_dexscreener` | DEXScreener: token profiles, community takeovers, ads, boosted tokens. |
| `syra_v2_trending_jupiter` | Trending tokens on Jupiter. |
| `syra_v2_analytics_summary` | Full analytics summary (dexscreener, token-statistic, trending-jupiter, smart-money, binance correlation, memecoin screens). |

### Binance

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_binance_correlation` | `symbol` (optional, default: `"BTCUSDT"`) — e.g. `ETHUSDT` | Top correlated assets for a symbol. |
| `syra_v2_binance_correlation_matrix` | `symbol` (optional) | Full Binance correlation matrix. |

### Pump / Workfun

| Tool | Parameters | Description |
|------|------------|-------------|
| `syra_v2_pump` | — | Pump.fun / Workfun data (trending, etc.). |

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

---

## API Endpoint Mapping

Every MCP tool performs a **GET** request to the path below. When `SYRA_USE_DEV_ROUTES=true`, the server appends `/dev` to the path (e.g. `/v2/news` → `/v2/news/dev`). Query parameters are passed as given by the tool schema.

| MCP Tool | API Path |
|----------|----------|
| `syra_v2_news` | `/v2/news` |
| `syra_v2_event` | `/v2/event` |
| `syra_v2_sentiment` | `/v2/sentiment` |
| `syra_v2_trending_headline` | `/v2/trending-headline` |
| `syra_v2_signal` | `/v2/signal` |
| `syra_v2_check_status` | `/v2/check-status` |
| `syra_v2_sundown_digest` | `/v2/sundown-digest` |
| `syra_v2_gems` | `/v2/gems` |
| `syra_v2_crypto_kol` | `/v2/crypto-kol` |
| `syra_v2_token_statistic` | `/v2/token-statistic` |
| `syra_v2_smart_money` | `/v2/smart-money` |
| `syra_v2_dexscreener` | `/v2/dexscreener` |
| `syra_v2_trending_jupiter` | `/v2/trending-jupiter` |
| `syra_v2_analytics_summary` | `/v2/analytics/summary` |
| `syra_v2_research` | `/v2/research` |
| `syra_v2_browse` | `/v2/browse` |
| `syra_v2_x_search` | `/v2/x-search` |
| `syra_v2_x_kol` | `/v2/x-kol` |
| `syra_v2_token_report` | `/v2/token-report` |
| `syra_v2_token_god_mode` | `/v2/token-god-mode` |
| `syra_v2_bubblemaps_maps` | `/v2/bubblemaps/maps` |
| `syra_v2_binance_correlation` | `/v2/binance/correlation` |
| `syra_v2_binance_correlation_matrix` | `/v2/binance/correlation-matrix` |
| `syra_v2_pump` | `/v2/pump` |
| `syra_v2_memecoin_fastest_holder_growth` | `/v2/memecoin/fastest-holder-growth` |
| `syra_v2_memecoin_most_mentioned_smart_money_x` | `/v2/memecoin/most-mentioned-by-smart-money-x` |
| `syra_v2_memecoin_accumulating_before_cex_rumors` | `/v2/memecoin/accumulating-before-CEX-rumors` |
| `syra_v2_memecoin_strong_narrative_low_mcap` | `/v2/memecoin/strong-narrative-low-market-cap` |
| `syra_v2_memecoin_by_experienced_devs` | `/v2/memecoin/by-experienced-devs` |
| `syra_v2_memecoin_unusual_whale_behavior` | `/v2/memecoin/unusual-whale-behavior` |
| `syra_v2_memecoin_trending_on_x_not_dex` | `/v2/memecoin/trending-on-x-not-dex` |
| `syra_v2_memecoin_organic_traction` | `/v2/memecoin/organic-traction` |
| `syra_v2_memecoin_surviving_market_dumps` | `/v2/memecoin/surviving-market-dumps` |

---

## Payment (x402) and Dev Routes

### Production API (https://api.syraa.fun)

Many v2 endpoints require **x402 payment**. If the request does not include a valid payment header, the API responds with **402 Payment Required**. This MCP server **does not add** payment headers; it only forwards the request. To get **200** in production, payment must be handled elsewhere (e.g. API playground, gateway, or a client that sends x402 headers).

### Dev routes (local testing)

When **`SYRA_USE_DEV_ROUTES=true`** and **`SYRA_API_BASE_URL`** points to your **local** API, the server appends **`/dev`** to every v2 path it calls. For example:

- `/v2/news` → `/v2/news/dev`
- `/v2/event` → `/v2/event/dev`
- `/v2/check-status` → `/v2/check-status/dev`

Whether the API actually skips payment for a given path depends on how your **API** implements the `/dev` routes. Commonly, at least `/v2/news/dev` and `/v2/event/dev` are implemented to return data without payment. Use dev routes **only** with a local or non-production API.

### Summary

| Scenario | Base URL | SYRA_USE_DEV_ROUTES | Result |
|----------|----------|---------------------|--------|
| Local testing, no payment | `http://localhost:3000` | `true` | Paths become `.../dev`; API may return 200 without payment. |
| Production | `https://api.syraa.fun` | not set | No `/dev`; 402 unless payment is sent by another component. |

---

## Testing Against Local API

1. **Start the Syra API** (e.g. from the monorepo `api` folder: `npm run dev`) so v2 endpoints are available at `http://localhost:3000` (or your configured port).
2. **Configure the MCP server** with `SYRA_API_BASE_URL=http://localhost:3000` and `SYRA_USE_DEV_ROUTES=true` (in `.env` or in the MCP client’s `env` for this server).
3. **Add the MCP server** in Cursor (or Claude Desktop) as described above and restart/reload MCP.
4. **In chat**, ask for “crypto news” or “Syra events for ETH.” The assistant should call `syra_v2_news` or `syra_v2_event` and return data (or a 402 body if the API still requires payment for that route).

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
- “Deep research on [token or topic].”
- “Search X for [query].”
- “Rugcheck token report for address [address].”
- “Binance correlation for ETHUSDT.”
- “Memecoins with fastest holder growth.”

The model will choose the appropriate tool(s) and parameters.

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

1. Open `src/index.ts`.
2. Use `server.tool(name, description, schema, handler)`:
   - **name:** string, e.g. `syra_v2_news`
   - **description:** string (shown to the model; you can append `PAYMENT_NOTE` for consistency)
   - **schema:** Zod object, e.g. `{ ticker: z.string().optional().default("general") }`
   - **handler:** async function that receives the parsed arguments, calls `fetchV2(path, params)`, and returns `{ content: [{ type: "text", text: formatToolResult(status, body) }] }`
3. For a simple GET with no query params, you can follow the pattern used for `noParamTools` or `memecoinTools` (array of `{ name, path, description }` with a shared handler).
4. Run `npm run build` and test via your MCP client.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **402 from tools** | Production API requires x402. Use a local API with `SYRA_USE_DEV_ROUTES=true`, or add payment via another component (e.g. API playground or client that sends payment headers). |
| **Connection refused / timeout** | Ensure the Syra API is running and reachable at `SYRA_API_BASE_URL`. If the API is on localhost, the MCP server must run on the same machine (or use a URL that is reachable from where the server runs). |
| **Cursor/Claude doesn’t list Syra tools** | Restart the app or reload MCP. Confirm the MCP config: correct path to `dist/index.js`, `command` and `args` (e.g. `node` and `["path/to/dist/index.js"]`). Run `node dist/index.js` manually to ensure it starts without errors. |
| **Wrong API or dev routes not used** | Verify `SYRA_API_BASE_URL` and `SYRA_USE_DEV_ROUTES` in the **environment** passed by the MCP client (e.g. `env` in the server config). The server reads only `process.env` at startup. |
| **Build or run errors** | Run `npm install` and `npm run build` inside `mcp-server`. Ensure Node.js is 18+ (`node -v`). On Windows, use the correct path format and escaped backslashes in JSON. |
| **Tool returns “API returned 402”** | Expected when calling production without payment. Use local API + dev routes, or implement x402 payment in your setup. |

---

## Version

- **Package:** `@syra/mcp-server`
- **Version:** `0.2.0` (see `package.json`)

For more on the Syra API, x402, and the rest of the monorepo, see the main Syra documentation and API docs.
