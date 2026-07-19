---
name: use-syra-mcp
description: Use the Syra MCP server in Cursor for crypto research, signals, smart money, and agent tools. Use when the user wants market data, news, sentiment, or on-chain intelligence from chat.
---

# Use Syra MCP

## When to use

- User asks for crypto news, sentiment, signals, or market research in Cursor chat
- User wants smart money flows, memecoin screens, or Nansen data
- User asks a natural-language crypto question that needs multi-source synthesis
- Setting up or troubleshooting the Syra MCP server in Cursor

## Prerequisites

- Syra Cursor plugin installed (or manual MCP config)
- Node.js 18+ (MCP server runs via `npx @syra-ai/mcp-server`)
- Optional: `SYRA_PAYER_KEYPAIR` for auto-pay on production routes

## Verify MCP is loaded

1. Open **Customize** in Cursor sidebar
2. Find **syra** under MCP servers — toggle on
3. Reload MCP if tools don't appear

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SYRA_API_BASE_URL` | API host | `https://api.syraa.fun` |
| `SYRA_MCP_TOOL_PROFILE` | `curated` or `full` | `curated` |
| `SYRA_PAYER_KEYPAIR` | Solana x402 auto-pay | not set |
| `SYRA_MCP_API_KEY` | Agent-direct bridge tools | not set |
| `SYRA_USE_DEV_ROUTES` | Local `/dev` paths | not set |

## Common prompts

Try these in Cursor chat after MCP is connected:

- "Get the latest crypto news for BTC"
- "What's the market sentiment for ETH?"
- "Show me smart money flows on Solana"
- "Get the analytics summary"
- "Get a trading signal for bitcoin"
- "Check Syra API health status"
- "Memecoins with fastest holder growth"

## Tool selection guide

| User intent | Tool |
|-------------|------|
| News | `syra_spend_news` |
| Events | `syra_spend_event` |
| Sentiment | `syra_spend_sentiment` |
| Trading signal | `syra_spend_signal` |
| Analytics / trending | `syra_spend_analytics_summary` |
| Smart money | `syra_spend_nansen_smart_money_netflow` |
| Health | `syra_spend_health` |
| Any catalog tool | `syra_call_tool` with `{ toolId, params }` |

Naming: `syra_{pillar}_{toolId}`. Full curated list: https://syraa.fun/skills.md

## Curated vs full profile

- **curated** (default): **47** high-value tools — sufficient for most research workflows
- **full**: all **257** tools — set `SYRA_MCP_TOOL_PROFILE=full` when you need a specific tool not in curated set

## Output handling

- Parse JSON responses and summarize for the user
- Treat signals and sentiment as **probabilistic analysis**, not financial advice
- Never present analysis as guaranteed trade execution
- If 402 is returned, guide user to configure `SYRA_PAYER_KEYPAIR`

## Manual MCP setup (without plugin)

```json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_MCP_TOOL_PROFILE": "curated",
        "SYRA_PAYER_KEYPAIR": "${SYRA_PAYER_KEYPAIR}"
      }
    }
  }
}
```

## References

- Docs: https://docs.syraa.fun/docs/build/mcp
- Skills catalog: https://syraa.fun/skills.md
- Agent skill: https://api.syraa.fun/skill.md
- Marketplace: https://syraa.fun/marketplace
- One-line CLI: `claude mcp add syra -- npx -y @syra-ai/mcp-server@latest`
