<div align="center">

<img src="https://syraa.fun/images/logo.jpg" alt="Syra" width="96" height="96" />

# @syra-ai/mcp-server

**MCP server for Syra machine money**

240+ crypto & agent tools · x402 auto-pay · Cursor / Claude / any MCP client

[![npm version](https://img.shields.io/npm/v/@syra-ai/mcp-server.svg)](https://www.npmjs.com/package/@syra-ai/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE)
[![Docs](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Marketplace](https://img.shields.io/badge/build-syraa.fun%2Fmarketplace-26a5e4)](https://syraa.fun/marketplace)

[Docs](https://docs.syraa.fun) · [Marketplace](https://syraa.fun/marketplace) · [SDK](https://www.npmjs.com/package/@syra-ai/sdk) · [Agent guide](https://api.syraa.fun/llms-full.txt) · [GitHub](https://github.com/ikhwanhsn/syra_agent)

</div>

---

## What this package does

`@syra-ai/mcp-server` is a **Model Context Protocol (MCP)** server that exposes Syra’s API as tools over **stdio**. AI clients (Cursor, Claude Desktop, ElizaOS, custom agents) call tools like `syra_spend_news`; the server maps them to HTTP requests on `https://api.syraa.fun` and returns the response.

| Audience | How to use it |
|----------|----------------|
| **Developers** | Add MCP in Cursor / Claude; pull news, signals, research in chat |
| **Agents** | `npx -y @syra-ai/mcp-server` + payer env → auto-pay x402 routes |
| **Researchers / traders** | Sentiment, smart money, memecoin screens, analytics via natural language |

**Transport:** stdio (JSON-RPC). No HTTP port — the MCP client spawns this process.

**For agents:** default tool profile is `curated` (**47** high-value tools + `syra_call_tool` + free helpers). Set `SYRA_MCP_TOOL_PROFILE=full` for **257** tools. Naming: `syra_{pillar}_{toolId}`. Full agent docs: [llms-full.txt](https://api.syraa.fun/llms-full.txt) · [skill.md](https://api.syraa.fun/skill.md).

| Need | Use |
|------|-----|
| This package | MCP stdio tools + x402 auto-pay |
| Typed HTTP in app code | [`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk) |
| Raw fetch 402 helper | [`@syra-ai/x402-payer`](https://www.npmjs.com/package/@syra-ai/x402-payer) |
| Install docs | https://docs.syraa.fun/docs/build/mcp |

---

## Install (one line)

```bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
```

Or run directly:

```bash
npx -y @syra-ai/mcp-server
```

**Requirements:** Node.js ≥ 18

---

## Quick config

| Variable | Purpose | Default |
|----------|---------|---------|
| `SYRA_API_BASE_URL` | Syra API base (no trailing slash) | `https://api.syraa.fun` |
| `SYRA_PAYER_KEYPAIR` | Solana secret for x402 auto-pay | — |
| `X402_PREFERRED_NETWORK` | `solana` \| `base` \| `algorand` | `solana` |
| `SYRA_EVM_PAYER_PRIVATE_KEY` | Base payer when network=`base` | — |
| `SYRA_ALGORAND_PAYER_PRIVATE_KEY` | Algorand payer when network=`algorand` | — |
| `SYRA_MCP_TOOL_PROFILE` | `curated` \| `full` | `curated` |
| `SYRA_MCP_API_KEY` | Agent-direct bridge (`POST /mcp/tools/call`) | — |
| `SYRA_USE_DEV_ROUTES` | Append `/dev` to paths (local only) | `false` |

### Production (Solana)

```env
SYRA_API_BASE_URL=https://api.syraa.fun
SYRA_PAYER_KEYPAIR=your-base58-or-json-solana-secret
SYRA_MCP_API_KEY=your-mcp-bridge-key
```

### Local (no payment)

```env
SYRA_API_BASE_URL=http://localhost:3000
SYRA_USE_DEV_ROUTES=true
```

---

## Cursor setup

**mcp.json** (npx — recommended):

```json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_PAYER_KEYPAIR": "your-solana-secret"
      }
    }
  }
}
```

Restart Cursor or reload MCP. Ask for crypto news, events, or signals — tools such as `syra_spend_news` appear automatically.

---

## Claude Desktop setup

Config path:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_PAYER_KEYPAIR": "your-solana-secret"
      }
    }
  }
}
```

Restart Claude Desktop after editing.

---

## Features

- **257 tools** codegen from Syra `agentTools` (47 curated or full profile)
- **x402 v2 auto-pay** via `@x402/fetch` + `PAYMENT-SIGNATURE` (Solana / Base / Algorand)
- **`syra_call_tool`** escape hatch for any toolId when using curated profile
- **Agent-direct bridge** — web-search, Nansen, GMGN, etc. via API MCP bridge
- **Configurable base URL** — production or local API

---

## How it works

1. MCP client sends a tool call over stdio (e.g. `syra_spend_news` + `{ params: { ticker: "BTC" } }`).
2. Server builds `GET https://api.syraa.fun/news?ticker=BTC` (or POST where required).
3. On **402**, if a payer is configured, signs payment and retries.
4. Returns response body (or status + body on error) to the model.

Built with [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/sdk). Server name: `syra-mcp-server`.

---

## Tools (curated profile)

Tools return the raw API body on **200**. Non-200 responses include status + body so the model can surface errors (including 402). Naming: `syra_{pillar}_{toolId}`.

<!-- BEGIN:CURATED_MCP_TOOLS -->
| Tool name | toolId | Pillar | Role |
|-----------|--------|--------|------|
| `syra_earn_8004_agents_search` | `8004-agents-search` | earn | 8004 search agents by owner, creator, collection (optional limit, offset) |
| `syra_earn_8004_leaderboard` | `8004-leaderboard` | earn | 8004 agent leaderboard by trust tier (optional minTier, limit) |
| `syra_earn_8004_stats` | `8004-stats` | earn | 8004 registry global stats: total agents, feedbacks, trust tiers |
| `syra_invest_bankr_balances` | `bankr-balances` | invest | Wallet balances across chains (optional query: chains=base,solana). Requires BANKR_API_KEY in API. |
| `syra_invest_bankr_prompt` | `bankr-prompt` | invest | Submit a natural language prompt to Bankr agent (body: prompt, optional threadId). Returns jobId; poll bankr-job tool with jobId for result. |
| `syra_invest_giza_agent` | `giza-agent` | invest | Get or create Giza smart account (deposit address) for an owner EOA. Params: owner (0x... address) |
| `syra_invest_giza_protocols` | `giza-protocols` | invest | List DeFi protocols available for a token on Giza (e.g. USDC on Base). Params: token (contract address 0x...) |
| `syra_invest_jupiter_swap_order` | `jupiter-swap-order` | invest | Jupiter Ultra swap order on Solana (Corbits): returns a base64 transaction to sign. Params: inputMint, outputMint, amount (smallest units), taker (defaults to agent wallet). |
| `syra_invest_rise_borrow_quote` | `rise-borrow-quote` | invest | Get RISE borrow capacity and optional required deposit |
| `syra_invest_rise_buy_token` | `rise-buy-token` | invest | Build RISE buy transaction (wallet, market, cashIn, minTokenOut) |
| `syra_invest_rise_deposit_and_borrow` | `rise-deposit-and-borrow` | invest | Build RISE deposit+borrow transaction (wallet, market, borrowAmount) |
| `syra_invest_rise_market` | `rise-market` | invest | Get RISE market details by token mint or rise market address |
| `syra_invest_rise_market_ohlc` | `rise-market-ohlc` | invest | Get RISE OHLC candles by timeframe (1m, 5m, 1h, 1d) |
| `syra_invest_rise_market_quote` | `rise-market-quote` | invest | Get RISE buy/sell quote (amount RAW, direction buy\|sell) |
| `syra_invest_rise_market_transactions` | `rise-market-transactions` | invest | Get RISE market transaction history (optional page, limit) |
| `syra_invest_rise_markets` | `rise-markets` | invest | List RISE markets (optional page, limit) |
| `syra_invest_rise_portfolio_positions` | `rise-portfolio-positions` | invest | Get RISE wallet positions (optional page, limit) |
| `syra_invest_rise_portfolio_summary` | `rise-portfolio-summary` | invest | Get RISE wallet portfolio summary |
| `syra_invest_rise_repay_and_withdraw` | `rise-repay-and-withdraw` | invest | Build RISE repay+withdraw transaction (wallet, market, withdrawAmount) |
| `syra_invest_rise_scout` | `rise-scout` | invest | Live RISE intelligence — view=intel\|markets\|targets with optional mint, limit, tier=ready\|watch |
| `syra_invest_rise_sell_token` | `rise-sell-token` | invest | Build RISE sell transaction (wallet, market, tokenIn, minCashOut) |
| `syra_invest_rise_stream_new` | `rise-stream-new` | invest | Returns integration note for RISE SSE stream endpoint /markets/stream/new |
| `syra_invest_squid_route` | `squid-route` | invest | Get cross-chain route/quote from Squid Router (100+ chains); returns route and transactionRequest for first leg — user signs on source chain |
| `syra_invest_squid_status` | `squid-status` | invest | Check status of a cross-chain transaction (transactionId, requestId, fromChainId, toChainId, quoteId) |
| `syra_spend_analytics_summary` | `analytics-summary` | spend | Bundled analytics: Jupiter trending, Nansen smart money, Binance correlation |
| `syra_spend_arbitrage` | `arbitrage` | spend | CMC top tradable assets plus live cross-CEX USDT spot snapshots; ranked best buy/sell routes (gross spread, not financial advice) |
| `syra_spend_browser_use` | `browser-use` | spend | Run a natural-language browser task (e.g. open a URL, extract data); returns text or structured output. Body: task (required), optional model (bu-mini / bu-max), maxCostUsd. |
| `syra_spend_coingecko_scout` | `coingecko-scout` | spend | Live CoinGecko scout — view=brief\|gainers\|predictions with optional topN, minMarketCap, includeNews, llm |
| `syra_spend_defillama_tvl` | `defillama-tvl` | spend | Protocol or chain TVL from DefiLlama — protocol slug (e.g. aave) OR chain name (e.g. Solana). |
| `syra_spend_dexscreener_pairs` | `dexscreener-pairs` | spend | Onchain DEX pairs from DexScreener — chainId + tokenAddress OR q search. Returns price, liquidity, volume, txns. |
| `syra_spend_equity_intelligence` | `equity-intelligence` | spend | Parametric xStocks intel — Nasdaq vs on-chain premium/discount for TSLAx, NVDAx, AAPLx, and catalog symbols |
| `syra_spend_event` | `event` | spend | Event data and updates |
| `syra_spend_geckoterminal_pools` | `geckoterminal-pools` | spend | Trending or new DEX pools from GeckoTerminal — network (default solana), kind=trending\|new, limit. |
| `syra_spend_health` | `health` | spend | Liveness and connectivity check (paid x402 health endpoint) |
| `syra_spend_nansen_smart_money_netflow` | `nansen-smart-money-netflow` | spend | Smart money net flow / accumulation (chains e.g. ["solana"]; optional filters, pagination) |
| `syra_spend_news` | `news` | spend | Get latest crypto news and market updates (optional ticker: BTC, ETH, or "general") |
| `syra_spend_neynar_user` | `neynar-user` | spend | Farcaster user by username or by FIDs (query: username or fids). Requires NEYNAR_API_KEY. |
| `syra_spend_pumpfun_scout` | `pumpfun-scout` | spend | Live pump.fun scout — segment=alpha\|beta\|predicted\|utility with optional period, limit, minPumpScore, llm |
| `syra_spend_pyth_price` | `pyth-price` | spend | Real-time Pyth oracle prices via Hermes — symbols (comma-separated, e.g. BTC/USD,SOL/USD). |
| `syra_spend_rugcheck_report` | `rugcheck-report` | spend | Solana token risk report from RugCheck — mint (required). Returns risk score, authorities, top holders. |
| `syra_spend_sentiment` | `sentiment` | spend | Get market sentiment analysis |
| `syra_spend_signal` | `signal` | spend | Spot OHLC + technical signal; Syra Agent chat uses CoinGecko by default (set source for CEX or n8n\|webhook) |
| `syra_spend_siwa_nonce` | `siwa-nonce` | spend | Get a SIWA nonce for agent sign-in (body: address, agentId, agentRegistry?). Requires RECEIPT_SECRET, SIWA_RPC_URL. |
| `syra_spend_spcx_intelligence` | `spcx-intelligence` | spend | Tokenized SpaceX equity intel — Nasdaq vs on-chain SPCX/SPCXx premium/discount spread, liquidity, agent bias |
| `syra_spend_sundown_digest` | `sundown-digest` | spend | Sundown digest / daily summary |
| `syra_spend_trending_headline` | `trending-headline` | spend | Trending headlines |
| `syra_spend_web_search` | `web-search` | spend | Free web search via DuckDuckGo/Bing scrape – dynamic query only |

Escape hatch (always registered): **`syra_call_tool`** with `{ toolId, params }` for any catalog tool.

*Auto-generated by `scripts/sync-mcp-tools.mjs` — 47 curated / 257 total. Do not edit by hand.*
<!-- END:CURATED_MCP_TOOLS -->

**Full catalog:** set `SYRA_MCP_TOOL_PROFILE=full`, or call `syra_call_tool` with any toolId. Source map: [agentTools.js](https://github.com/ikhwanhsn/syra_agent/blob/main/api/config/agentTools.js).

---

## Payment (x402 v2)

| Scenario | Config | Result |
|----------|--------|--------|
| Production + payer | `SYRA_PAYER_KEYPAIR` (or Base/Algorand keys) | Auto-pay on 402 |
| Production, no payer | — | Tools return 402 body |
| Local testing | `SYRA_USE_DEV_ROUTES=true` + local API | Paths become `.../dev` |

Supported rails: **Solana USDC** (default), **Base USDC**, **Algorand USDC**.

---

## Example prompts

- “Get the latest crypto news for BTC.”
- “What’s market sentiment for ETH?”
- “Show analytics summary / Jupiter trending.”
- “RugCheck report for mint [address].”
- “Memecoins with fastest holder growth.”
- “Get a Squid route from Base to Arbitrum for 100 USDC.”

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **402 from tools** | Set `SYRA_PAYER_KEYPAIR` (or Base/Algorand payer). Local: `SYRA_USE_DEV_ROUTES=true`. |
| **Tools missing in Cursor/Claude** | Restart app / reload MCP. Confirm `npx` works and Node ≥ 18. |
| **Connection refused** | Check `SYRA_API_BASE_URL` is reachable from the machine running MCP. |
| **Agent-direct tools fail** | Enable MCP bridge on API; pass `SYRA_MCP_API_KEY`. |

---

## Development (from monorepo)

```bash
git clone https://github.com/ikhwanhsn/syra_agent.git
cd syra_agent/mcp-server
npm install
npm run build
npm start
```

Regenerate tools after editing `api/config/agentTools.js`:

```bash
npm run sync:mcp-tools
npm run build
```

---

## Related

| Resource | URL |
|----------|-----|
| npm | [npmjs.com/package/@syra-ai/mcp-server](https://www.npmjs.com/package/@syra-ai/mcp-server) |
| SDK | [`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk) |
| x402 helper | [`@syra-ai/x402-payer`](https://www.npmjs.com/package/@syra-ai/x402-payer) |
| Source | [github.com/ikhwanhsn/syra_agent](https://github.com/ikhwanhsn/syra_agent/tree/main/mcp-server) |
| Agent docs | [api.syraa.fun/llms-full.txt](https://api.syraa.fun/llms-full.txt) |
| x402 discovery | [api.syraa.fun/.well-known/x402](https://api.syraa.fun/.well-known/x402) |

---

## Version

- **Package:** `@syra-ai/mcp-server`
- **Version:** see `package.json` / [npm](https://www.npmjs.com/package/@syra-ai/mcp-server)

## License

[MIT](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE) © Syra
