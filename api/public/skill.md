# Syra — agent skill

Syra is **machine money for agents** — a pay-per-call x402 API rail across Solana, Base, multi-chain EVM (PayAI/Dexter), Algorand, BSC B402, and OKX X Layer when enabled. Most routes are **permissionless x402** (pay with USDC or the rail stablecoin, no identity).

**Canonical installable skill (repo):** `.agents/skills/syra/SKILL.md`  
**Full API reference:** https://api.syraa.fun/llms-full.txt  
**Capability list:** https://syraa.fun/skills.md  
**Product summary:** https://syraa.fun/llms.txt

---

## Quick start for agents

### 1. MCP (preferred for chat / IDE agents)

Fund a Solana wallet with **≥ $1 USDC** (+ SOL for fees), then:

```bash
claude mcp add syra \
  -e SYRA_API_BASE_URL=https://api.syraa.fun \
  -e SYRA_PAYER_KEYPAIR=your-solana-secret \
  -- npx -y @syra-ai/mcp-server@latest
```

Replace `your-solana-secret` with that funded keypair. Without it, paid tools return 402. Tools are named `syra_{pillar}_{toolId}` (e.g. `syra_spend_news`). Default profile is **curated** (~47 tools); use `SYRA_MCP_TOOL_PROFILE=full` for 257. Escape hatch: `syra_call_tool` with `{ toolId, params }`.

Docs: https://docs.syraa.fun/docs/build/mcp

### 2. Typed SDK (app / script agents)

```bash
npm install @syra-ai/sdk
```

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";
const syra = await createSyraPaidClient({ baseUrl: "https://api.syraa.fun" });
const news = await syra.get("/news", { ticker: "BTC" });
```

Docs: https://docs.syraa.fun/docs/build/sdk

### 3. Lightweight payer (raw fetch)

```bash
npm install @syra-ai/x402-payer
```

Wire your own `signPayment` for 402 → `PAYMENT-SIGNATURE` → retry.

### npm packages

| Package | Use when |
|---------|----------|
| `@syra-ai/mcp-server` | MCP tools in Cursor / Claude / agent frameworks |
| `@syra-ai/sdk` | Typed HTTP + auto-pay wallets |
| `@syra-ai/x402-payer` | Minimal 402 helper without the full SDK |

---

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

- x402: `GET /.well-known/x402`, `GET /x402/capabilities`, `GET /openapi.json`, `GET /mpp-openapi.json`
- MPP: `GET /mpp/health` (legacy `/mpp/v1/health` rewrites in-app to `/mpp/health`)
- This file: `GET /skill.md`
- Skills list: https://syraa.fun/skills.md
