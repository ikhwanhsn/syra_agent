---
name: syra
description: >
  Syra machine money for agents — x402 pay-per-call crypto APIs, MCP tools, and typed SDK.
  Use when the user or agent needs crypto research (news, sentiment, signals, smart money),
  Solana/Base/Algorand micropayments on HTTP 402, Syra MCP setup, or @syra-ai/sdk / @syra-ai/x402-payer.
version: 0.1.0
---

# Syra — machine money for agents

Syra is **pay-per-call crypto intelligence** over HTTP x402 (USDC). Prefer the MCP path for chat agents; prefer the SDK for app code.

## When to use

- Crypto news, sentiment, signals, analytics, memecoin/scout screens
- Smart-money / on-chain research via Syra APIs
- Setting up Cursor / Claude / any MCP client against Syra
- Building TypeScript agents that auto-pay on HTTP 402
- Handling `402 Payment Required` from `api.syraa.fun`

## Preferred paths (pick one)

| Need | Package / action |
|------|------------------|
| Chat / IDE tools | `npx -y @syra-ai/mcp-server@latest` |
| Typed HTTP client + auto-pay | `npm i @syra-ai/sdk` → `createSyraPaidClient` |
| Raw `fetch` + 402 only | `npm i @syra-ai/x402-payer` |

### One-line MCP

```bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
```

### Cursor `mcp.json`

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

### SDK snippet

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient({ baseUrl: "https://api.syraa.fun" });
const news = await syra.get("/news", { ticker: "BTC" });
```

## Auto-pay env

| Rail | Env |
|------|-----|
| Solana USDC (default) | `SYRA_PAYER_KEYPAIR` |
| Base USDC | `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY` |
| Algorand | `X402_PREFERRED_NETWORK=algorand` + `SYRA_ALGORAND_PAYER_PRIVATE_KEY` |
| Local (no pay) | `SYRA_USE_DEV_ROUTES=true` + local `SYRA_API_BASE_URL` |

MCP injects `PAYMENT-SIGNATURE` on 402 when a payer is configured.

## MCP tool naming

- Pattern: `syra_{pillar}_{toolId}` — e.g. `syra_spend_news`, `syra_invest_squid_route`
- Default profile **curated**: ~47 tools; set `SYRA_MCP_TOOL_PROFILE=full` for 257
- Escape hatch: `syra_call_tool` with `{ toolId, params }` (toolId from `GET /agent/tools`)

| Intent | Tool |
|--------|------|
| News | `syra_spend_news` |
| Sentiment | `syra_spend_sentiment` |
| Signal | `syra_spend_signal` |
| Analytics | `syra_spend_analytics_summary` |
| Smart money | `syra_spend_nansen_smart_money_netflow` |
| Health | `syra_spend_health` |

Full curated table: https://syraa.fun/skills.md

## Discovery URLs (always fetch these first)

| Resource | URL |
|----------|-----|
| Full agent API guide | https://api.syraa.fun/llms-full.txt |
| This skill (HTTP) | https://api.syraa.fun/skill.md |
| Product summary | https://syraa.fun/llms.txt |
| Capability list | https://syraa.fun/skills.md |
| x402 resources | https://api.syraa.fun/.well-known/x402 |
| OpenAPI | https://api.syraa.fun/openapi.json |
| Install MCP docs | https://docs.syraa.fun/docs/build/mcp |
| Install SDK docs | https://docs.syraa.fun/docs/build/sdk |

## AgentScore (optional identity gate)

Some high-value routes may require AgentScore Passport (`X-Operator-Token`) on the **paid retry** leg. See the AgentScore section in https://api.syraa.fun/skill.md.

## Safety

- Outputs are **probabilistic analysis**, not financial advice or guaranteed trades.
- Never commit payer keypairs. Prefer env / secret managers.
- Separate research from execution.
