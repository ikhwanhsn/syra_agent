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

`@syra-ai/mcp-server` is a **Model Context Protocol (MCP)** server that exposes Syra’s API as tools over **stdio**. AI clients (Cursor, Claude Desktop, ElizaOS, custom agents) call tools like `syra_v2_news`; the server maps them to HTTP requests on `https://api.syraa.fun` and returns the response.

| Audience | How to use it |
|----------|----------------|
| **Developers** | Add MCP in Cursor / Claude; pull news, signals, research in chat |
| **Agents** | `npx -y @syra-ai/mcp-server` + payer env → auto-pay x402 routes |
| **Researchers / traders** | Sentiment, smart money, memecoin screens, analytics via natural language |

**Transport:** stdio (JSON-RPC). No HTTP port — the MCP client spawns this process.

**For agents:** default tool profile is `curated` (~42 high-value tools + `syra_call_tool`). Set `SYRA_MCP_TOOL_PROFILE=full` for ~240 tools. Full agent docs: [llms-full.txt](https://api.syraa.fun/llms-full.txt).

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

Restart Cursor or reload MCP. Ask for crypto news, events, or signals — tools such as `syra_v2_news` appear automatically.

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

- **240+ tools** codegen from Syra `agentTools` (curated or full profile)
- **x402 v2 auto-pay** via `@x402/fetch` + `PAYMENT-SIGNATURE` (Solana / Base / Algorand)
- **`syra_call_tool`** escape hatch for any toolId when using curated profile
- **Agent-direct bridge** — web-search, Nansen, GMGN, etc. via API MCP bridge
- **Configurable base URL** — production or local API

---

## How it works

1. MCP client sends a tool call over stdio (e.g. `syra_v2_news` + `{ ticker: "BTC" }`).
2. Server builds `GET https://api.syraa.fun/news?ticker=BTC` (or POST where required).
3. On **402**, if a payer is configured, signs payment and retries.
4. Returns response body (or status + body on error) to the model.

Built with [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/sdk). Server name: `syra-mcp-server`.

---

## Tools (high-value subset)

Tools return the raw API body on **200**. Non-200 responses include status + body so the model can surface errors (including 402).

### News, sentiment, signals

| Tool | Params | Description |
|------|--------|-------------|
| `syra_v2_news` | `ticker?` | Latest crypto news |
| `syra_v2_event` | `ticker?` | Upcoming / recent events |
| `syra_v2_sentiment` | `ticker?` | 30-day sentiment |
| `syra_v2_trending_headline` | `ticker?` | Trending headlines |
| `syra_v2_signal` | `token?` | AI trading signal |
| `syra_v2_brain` | `question` | Multi-tool synthesized answer (POST) |

### Research & social

| Tool | Params | Description |
|------|--------|-------------|
| `syra_v2_research` | `query`, `type?` | Deep research with sources |
| `syra_v2_browse` | `query` | Web browse / extract |
| `syra_v2_x_search` | `query` | X/Twitter research |
| `syra_spend_web_search` | `query` | Free web search |

### Token / on-chain

| Tool | Params | Description |
|------|--------|-------------|
| `syra_v2_x_kol` | `address` | KOL mentions for Solana token |
| `syra_v2_token_god_mode` | `tokenAddress` | Nansen deep research |
| `syra_v2_bubblemaps_maps` | `address` | Holder concentration map |

### No-param snapshots

| Tool | Description |
|------|-------------|
| `syra_v2_check_status` | API health |
| `syra_v2_sundown_digest` | Daily crypto roundup |
| `syra_v2_smart_money` | Smart money flows |
| `syra_v2_trending_jupiter` | Jupiter trending |
| `syra_v2_analytics_summary` | Aggregated analytics |

### Cross-chain, Bankr, Farcaster, SIWA

| Tool | Description |
|------|-------------|
| `syra_v2_squid_route` / `syra_v2_squid_status` | Squid cross-chain quote & status |
| `syra_v2_bankr_*` | Bankr balances, prompts, jobs |
| `syra_v2_neynar_*` | Farcaster user / feed / cast / search |
| `syra_v2_siwa_nonce` / `syra_v2_siwa_verify` | Sign-In With Agent |

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
- “Ask Syra Brain: what is trending on Jupiter?”
- “Deep research on [token].”
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
