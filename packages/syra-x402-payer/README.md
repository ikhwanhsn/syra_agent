<div align="center">

<img src="https://syraa.fun/images/logo.jpg" alt="Syra" width="96" height="96" />

# @syra-ai/x402-payer

**Lightweight x402 v2 payment helper**

Sign · retry · safe double-charge detection — for Syra or any x402 HTTP API

[![npm version](https://img.shields.io/npm/v/@syra-ai/x402-payer.svg)](https://www.npmjs.com/package/@syra-ai/x402-payer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE)
[![Docs](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API](https://img.shields.io/badge/API-api.syraa.fun-26a5e4)](https://api.syraa.fun)

[Docs](https://docs.syraa.fun) · [x402 discovery](https://api.syraa.fun/.well-known/x402) · [Agent guide](https://api.syraa.fun/llms-full.txt) · [GitHub](https://github.com/ikhwanhsn/syra_agent)

</div>

---

## What this package does

`@syra-ai/x402-payer` is a small, MIT-licensed helper for **HTTP 402 / x402 v2** flows:

1. Call a paid endpoint
2. On **402**, read payment requirements
3. Call your `signPayment` callback → get `PAYMENT-SIGNATURE`
4. Retry the request
5. Treat **“Payment was NOT charged”** responses as safe to retry (no double-billing)

Use it when you want payment plumbing without the full [`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk) client.

**For agents:** wire `signPayment` to `@x402/svm`, `@x402/evm`, or your wallet. Discovery: [/.well-known/x402](https://api.syraa.fun/.well-known/x402).

| Need | Use |
|------|-----|
| Full typed client + auto-pay | [`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk) |
| MCP tools in Cursor / Claude | [`@syra-ai/mcp-server`](https://www.npmjs.com/package/@syra-ai/mcp-server) |
| This package | Minimal 402 → sign → retry on any x402 HTTP API |
| Agent skill | https://api.syraa.fun/skill.md |

---

## Install

```bash
npm install @syra-ai/x402-payer
```

**Requirements:** Node.js ≥ 18  
**Dependencies:** none (you bring the signer)

---

## Usage

```typescript
import { fetchWithX402Payment, microUsdcToUsd } from "@syra-ai/x402-payer";

const result = await fetchWithX402Payment(
  "https://api.syraa.fun/signal?token=solana",
  { method: "GET", headers: { Accept: "application/json" } },
  {
    async signPayment(requirement) {
      // Wire to @x402/svm, @x402/evm, or your wallet
      const amountUsd = microUsdcToUsd(requirement.amount);
      console.log("Paying", amountUsd, "USDC on", requirement.network);
      return "..."; // PAYMENT-SIGNATURE header value
    },
  },
);

if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

---

## API

| Export | Description |
|--------|-------------|
| `fetchWithX402Payment(url, init, options)` | Fetch with 402 → sign → retry |
| `microUsdcToUsd(amount)` | Convert micro-USDC integer to USD number |

### `signPayment(requirement)`

Your callback receives the x402 payment requirement from the 402 response and must return the **`PAYMENT-SIGNATURE`** header string.

---

## Safe retry

Responses containing **"Payment was NOT charged"** are treated as safe to retry — the helper will not assume a successful charge, reducing double-billing risk.

---

## When to use which package

| Package | Use when |
|---------|----------|
| **`@syra-ai/x402-payer`** | You only need sign + retry around raw `fetch` |
| **[`@syra-ai/sdk`](https://www.npmjs.com/package/@syra-ai/sdk)** | Full Syra client (routes, pillars, auto-pay factories) |
| **[`@syra-ai/mcp-server`](https://www.npmjs.com/package/@syra-ai/mcp-server)** | Cursor / Claude MCP tools — `npx -y @syra-ai/mcp-server` |

---

## Links

| Resource | URL |
|----------|-----|
| Syra API | [api.syraa.fun](https://api.syraa.fun) |
| x402 discovery | [api.syraa.fun/.well-known/x402](https://api.syraa.fun/.well-known/x402) |
| Agent docs | [api.syraa.fun/llms-full.txt](https://api.syraa.fun/llms-full.txt) |
| Human docs | [docs.syraa.fun](https://docs.syraa.fun) |
| Source | [github.com/ikhwanhsn/syra_agent](https://github.com/ikhwanhsn/syra_agent/tree/main/packages/syra-x402-payer) |

---

## License

[MIT](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE) © Syra
