# @syra/sdk

Typed client for **Syra machine money** — pay-per-call x402 APIs, agent wallets, and treasury policy on Solana.

## Install

```bash
npm install @syra/sdk
```

## Quick start

```typescript
import { createSyraClient } from "@syra/sdk";

const syra = createSyraClient({
  baseUrl: "https://api.syraa.fun",
  signer: myPaymentSigner, // implements SyraPaymentSigner
});

const news = await syra.get("/news", { ticker: "BTC" });
if (news.success) {
  console.log(news.data);
}
```

## Payment signer

Production routes return **HTTP 402** with x402 payment requirements. Provide a `SyraPaymentSigner` that returns the `PAYMENT-SIGNATURE` header (typically via `@x402/svm` + your agent wallet).

Without a signer, `request()` returns `{ success: false, error: "HTTP 402" }` after the first 402 response.

## High-value routes

```typescript
import { SYRA_HIGH_VALUE_ROUTES } from "@syra/sdk";

// Sentiment, signals, smart-money netflow, analytics summary, brain Q&A
const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);
```

## Related

- [API Playground](https://playground.syraa.fun) — interactive testing
- [@syra/mcp-server](../mcp-server) — MCP tools for Cursor / Claude
- [Docs](https://docs.syraa.fun)
