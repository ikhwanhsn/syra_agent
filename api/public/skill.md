---
name: syra
version: 0.2.0
description: >
  Pay-per-call crypto intelligence for agents over x402 (USDC). Use when the task
  needs crypto news, sentiment, signals, TVL, smart money, or other Syra Spend intel.
  Call syra_consult first. It does not bill. Then call the tool it returns.
---

# Syra — machine money for agents

Syra is **pay-per-call crypto intelligence** over HTTP x402 (USDC). It is not a general tool mall.

**When the user needs crypto news, sentiment, signals, TVL, smart money, or other Syra Spend intel, call `syra_consult` first** with the whole intent. Consult is free. It does not execute. Then call the `toolName` it returns.

Agent one-liner: `set up https://api.syraa.fun/skill.md`

Humans: fund ≥ $1 Solana USDC, then install MCP with `SYRA_PAYER_KEYPAIR`.

## Once connected, try these

Your agent can pay for crypto intel mid-task. Try asking it:

- Get BTC news
- What's ETH sentiment?
- TVL for Aave

Every paid call quotes on HTTP 402. Consult itself costs $0.

## Setup

If `syra_consult` is already in your tool list, skip to **How to drive Syra**.

### Shell-capable agents (Claude Code, Cursor, Codex)

Fund a Solana wallet with **≥ $1 USDC** (+ SOL for fees). Paid tools return 402 without it.

```bash
claude mcp add syra \
  -e SYRA_API_BASE_URL=https://api.syraa.fun \
  -e SYRA_PAYER_KEYPAIR=your-solana-secret \
  -- npx -y @syra-ai/mcp-server@latest
```

Replace `your-solana-secret` with that funded keypair. Then call `syra_consult` with the user's intent.

Cursor `mcp.json`:

```json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_MCP_TOOL_PROFILE": "curated",
        "SYRA_PAYER_KEYPAIR": "your-solana-secret"
      }
    }
  }
}
```

Docs: https://docs.syraa.fun/docs/build/mcp

### App / script agents (SDK)

```bash
npm install @syra-ai/sdk
```

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";
const syra = await createSyraPaidClient({ baseUrl: "https://api.syraa.fun" });
const news = await syra.get("/news", { ticker: "BTC" });
```

Docs: https://docs.syraa.fun/docs/build/sdk

## How to drive Syra

**`syra_consult`** — first call for any crypto-intel intent. `{ intent: string }`. Returns JSON:

- `mode:"call"` → `calls[]` is `{ toolName, toolId, params, max_cost_usd, why }`. Run that `toolName` next. Do not invent a different tool.
- `mode:"unsupported"` → Syra does not cover that job (images, email, scraping a random URL). Tell the user. Point them at news / sentiment / TVL.

Consult never bills. Failed paid x402 calls can be insured with Syra hosted refund coverage (`@syra-ai/x402-refund`, `POST /refund/relay`). Coverage is allowlisted and off by default. Check `GET /refund/status`.

Escape hatch: `syra_call_tool` with `{ toolId, params }` for a curated toolId from https://syraa.fun/skills.md.

Default profile is **curated**. `SYRA_MCP_TOOL_PROFILE=full` registers every codegen tool. Consult still recommends curated Spend only.

## Identity-gated routes (optional AgentScore)

By default (unless `AGENTSCORE_GATE_ENABLED=false`), these routes require **AgentScore Passport** (`X-Operator-Token`) on the **paid retry** leg (after `Payment-Signature` / `X-Payment` is present):

| Route | Policy (default env) |
|-------|----------------------|
| `POST /8004/register-agent` | KYC + sanctions + US-only |
| `POST /payouts/tempo` | KYC + sanctions + US-only |

Anonymous discovery still works: first request without payment returns **HTTP 402** with pricing. Identity is checked only when payment credentials are attached.

### Buyer setup (Passport)

1. Install AgentScore Pay: `npm install -g @agent-score/pay`
2. Verify once: `agentscore-pay passport login`
3. Retry paid calls with `X-Operator-Token: opc_...` (Pay attaches automatically)

Docs: https://docs.agentscore.sh/passport

## Syra agent tools (buy side — AgentScore helpers)

Call via `POST /agent/tools/call` on the Syra API:

| Tool ID | Purpose |
|---------|---------|
| `agentscore-discover` | List AgentScore-gated merchants + x402 bazaar resources |
| `agentscore-check` | Probe a merchant URL (402 price / 403 identity bootstrap) |
| `agentscore-passport-status` | Check operator token / assess decision |
| `agentscore-pay` | Pay a merchant with agent wallet + optional Passport |

Public (no session): `GET /agentscore/discover`, `GET /agentscore/check?url=...`  
MCP free helpers: `syra_agentscore_discover`, `syra_agentscore_check`.

## Payment rails

- **Syra API (server 402 accepts)**: Solana + Base USDC; PayAI/Dexter multi-chain (Polygon, Arbitrum, Avalanche, Sei, SKALE, Optimism, World, Monad, Robinhood, …); BSC B402; Algorand (GoPlausible); OKX X Layer (USDT0) when enabled
- **Facilitator failover**: Dexter → GoPlausible → PayAI (live: `GET /x402/capabilities`)
- **MCP/SDK auto-pay signers today**: Solana (default), Base, Algorand — other accepts need a matching x402 client
- **Agent execution wallets**: `solana` | `base` | `bsc` (`GET /agent/chains`)
- **External AgentScore merchants**: may require MPP (Tempo/Solana) or Base x402 — use `@agent-score/pay` for multi-rail checkout when Syra agent wallet is Solana-only

## Discovery

- Skill: `GET /skill.md` (this file). Paste `set up https://api.syraa.fun/skill.md`
- x402: `GET /.well-known/x402`, `GET /x402/capabilities`, `GET /openapi.json`, `GET /mpp-openapi.json`
- Full API: https://api.syraa.fun/llms-full.txt
- Product summary: https://syraa.fun/llms.txt
- Curated tools: https://syraa.fun/skills.md
