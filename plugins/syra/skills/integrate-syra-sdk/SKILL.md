---
name: integrate-syra-sdk
description: Install and integrate @syra-ai/sdk for typed x402 API calls with auto-pay. Use when building agents, scripts, or backends that call Syra machine money APIs on Solana.
---

# Integrate Syra SDK

## When to use

- User wants to call Syra APIs from TypeScript/JavaScript
- Building an agent, automation script, or backend that needs paid crypto data
- Integrating x402 pay-per-call routes into a new project

## Prerequisites

- Node.js 18+
- A USDC-funded Solana wallet (for production paid routes) or local API with dev routes

## Steps

### 1. Install

```bash
npm install @syra-ai/sdk
```

### 2. Configure payer (production)

Add to `.env` (never commit secrets):

```env
SYRA_PAYER_KEYPAIR=your-base58-or-json-solana-secret
```

For Base USDC: `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY`.

### 3. Create a paid client

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient({
  baseUrl: "https://api.syraa.fun",
});
```

### 4. Make a typed call

```typescript
const news = await syra.get("/news", { ticker: "BTC" });
if (!news.success) {
  throw new Error(news.error ?? "Syra API call failed");
}
console.log(news.data);
```

### 5. Discover pillars and routes

```typescript
const pillars = await syra.get("/pillars");
const opportunities = await syra.pillars.invest.opportunities();
```

Use `SYRA_HIGH_VALUE_ROUTES` from the SDK for curated route constants.

## Response contract

All SDK methods return `{ success: boolean; data?: T; error?: string }`. Always check `success` before using `data`.

## Local testing (no payment)

```env
SYRA_API_BASE_URL=http://localhost:3000
SYRA_USE_DEV_ROUTES=true
```

Run the Syra API locally from the monorepo `api/` package first.

## Related

| Resource | URL |
|----------|-----|
| Docs | https://docs.syraa.fun |
| OpenAPI | https://api.syraa.fun/openapi.json |
| x402 discovery | https://api.syraa.fun/.well-known/x402 |
| Marketplace | https://syraa.fun/marketplace |

## Security

- Never hardcode keypairs in source files
- Use environment variables or a secrets manager
- Validate user input before passing to API params
