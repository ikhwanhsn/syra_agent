# Syra Agent Commerce (AgentScore)

Syra is machine money for agents on Solana — a pay-per-call x402 API rail. Most routes are **permissionless x402** (pay with USDC, no identity).

## Identity-gated routes (optional)

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

## Syra agent tools (buy side)

Call via `POST /agent/tools/call` on [syraa.fun](https://syraa.fun):

| Tool ID | Purpose |
|---------|---------|
| `agentscore-discover` | List AgentScore-gated merchants + x402 bazaar resources |
| `agentscore-check` | Probe a merchant URL (402 price / 403 identity bootstrap) |
| `agentscore-passport-status` | Check operator token / assess decision |
| `agentscore-pay` | Pay a merchant with agent wallet + optional Passport |

Public (no session): `GET /agentscore/discover`, `GET /agentscore/check?url=...`

## Payment rails

- **Syra API**: x402 Solana USDC + Base USDC (+ optional BSC B402)
- **External AgentScore merchants**: may require MPP (Tempo/Solana) or Base x402 — use `@agent-score/pay` for multi-rail checkout when Syra agent wallet is Solana-only

## Discovery

- x402: `GET /.well-known/x402`, `GET /openapi.json`, `GET /mpp-openapi.json`
- MPP: `GET /mpp/health` (legacy `/mpp/v1/health` → 308 redirect)
- This file: `GET /skill.md`
