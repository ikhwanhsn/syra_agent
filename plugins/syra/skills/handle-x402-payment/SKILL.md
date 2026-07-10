---
name: handle-x402-payment
description: Detect and handle HTTP 402 Payment Required from Syra APIs. Use when a request returns 402, when setting up x402 auto-pay, or when configuring multi-rail payment (Solana, Base, Algorand).
---

# Handle x402 Payment

## When to use

- HTTP request to Syra API returns **402 Payment Required**
- User needs to configure auto-pay for agent or script
- Setting up payment on Solana, Base, or Algorand rails
- Debugging payment failures or missing payer configuration

## x402 v2 flow

1. **First request** → API returns `402` with payment challenge in body and `Payment-Required` header.
2. **Sign challenge** → Client builds `PAYMENT-SIGNATURE` header value.
3. **Retry request** → Same URL with `PAYMENT-SIGNATURE` header → `200` with data.

## Quick fix: auto-pay via SDK

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient();
// Auto-handles 402 → sign → retry
const result = await syra.get("/sentiment", { ticker: "BTC" });
```

Requires `SYRA_PAYER_KEYPAIR` in env (Solana USDC wallet with USDC balance).

## Quick fix: auto-pay via MCP

Set in MCP server env (Cursor Customize → MCP → syra):

```env
SYRA_PAYER_KEYPAIR=your-keypair
SYRA_API_BASE_URL=https://api.syraa.fun
```

The `@syra-ai/mcp-server` handles 402 automatically when payer is configured.

## Payment rails

| Rail | Configuration |
|------|---------------|
| Solana USDC (default) | `SYRA_PAYER_KEYPAIR` |
| Base USDC | `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY` |
| Algorand USDC | `X402_PREFERRED_NETWORK=algorand` + `SYRA_ALGORAND_PAYER_PRIVATE_KEY` |

## Low-level paid fetch

When you only need x402-wrapped `fetch` without the full client:

```typescript
import { getPaidFetch, hasPaidFetchConfigured } from "@syra-ai/sdk/payment";

if (hasPaidFetchConfigured()) {
  const paidFetch = await getPaidFetch();
  const res = await paidFetch("https://api.syraa.fun/news?ticker=BTC");
}
```

## No payer configured

When no payer is set, tools and SDK calls return 402 with pricing info in the response body. Surface the price to the user and guide them to:

1. Fund a Solana wallet with USDC
2. Set `SYRA_PAYER_KEYPAIR` in env
3. Retry the request

## Local dev (skip payment)

```env
SYRA_API_BASE_URL=http://localhost:3000
SYRA_USE_DEV_ROUTES=true
```

Only use with local/non-production APIs.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Persistent 402 | Check payer has USDC balance; verify RPC URL (`SYRA_SOLANA_RPC_URL`) |
| RPC 403 on signing | Use a full-access RPC (Helius recommended) |
| Wrong rail | Set `X402_PREFERRED_NETWORK` to match your wallet type |
| Agent-direct 402 | Also set `SYRA_MCP_API_KEY` for bridge tools |

## Security

- Never log or commit private keys
- Never hardcode keypairs in source code
- Use env vars exclusively for payer credentials

## Discovery

Check live pricing: `GET https://api.syraa.fun/.well-known/x402`
