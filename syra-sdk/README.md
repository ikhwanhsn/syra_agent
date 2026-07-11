<div align="center">

<img src="https://syraa.fun/images/logo.jpg" alt="Syra" width="96" height="96" />

# @syra-ai/sdk

**Typed TypeScript client for Syra machine money**

Pay-per-call x402 APIs · auto-pay wallets · agent treasury  
Solana · Base · Algorand

[![npm version](https://img.shields.io/npm/v/@syra-ai/sdk.svg)](https://www.npmjs.com/package/@syra-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE)
[![Docs](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API](https://img.shields.io/badge/API-api.syraa.fun-26a5e4)](https://api.syraa.fun)

[Docs](https://docs.syraa.fun) · [Marketplace](https://syraa.fun/marketplace) · [OpenAPI](https://api.syraa.fun/openapi.json) · [Agent guide](https://api.syraa.fun/llms-full.txt) · [GitHub](https://github.com/ikhwanhsn/syra_agent)

</div>

---

## What this package does

`@syra-ai/sdk` is the official TypeScript client for the [Syra](https://syraa.fun) API gateway. It wraps HTTP calls to Syra’s machine-money rails and handles **x402 payment** (HTTP 402 → sign → retry) so agents and apps can call paid routes without custom payment plumbing.

| Capability | Detail |
|------------|--------|
| **Auto-pay client** | `createSyraPaidClient()` wires Solana / Base / Algorand signers |
| **Manual signer** | Pass a custom `SyraPaymentSigner` for production wallets |
| **Low-level fetch** | `@syra-ai/sdk/payment` — x402-wrapped `fetch` only |
| **Pillars** | Discover Earn / Treasury / Invest / Spend / Grow via `/pillars` |
| **Typed responses** | All methods return `{ success, data?, error? }` |

**For agents:** prefer `createSyraPaidClient` + env payer keys. Discovery: `GET https://api.syraa.fun/.well-known/x402` and [llms-full.txt](https://api.syraa.fun/llms-full.txt).

---

## Install

```bash
npm install @syra-ai/sdk
```

**Requirements:** Node.js ≥ 18

---

## Quick start (auto-pay)

```typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

// Reads SYRA_PAYER_KEYPAIR (Solana) or SYRA_EVM_PAYER_PRIVATE_KEY (Base) from env
const syra = await createSyraPaidClient({
  baseUrl: "https://api.syraa.fun",
});

const news = await syra.get("/news", { ticker: "BTC" });
if (news.success) {
  console.log(news.data);
}
```

### Payment env vars

| Rail | Environment |
|------|-------------|
| **Solana** (default) | `SYRA_PAYER_KEYPAIR` — base58 or JSON byte array |
| **Base** | `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY` |
| **Algorand** | `X402_PREFERRED_NETWORK=algorand` + `SYRA_ALGORAND_PAYER_PRIVATE_KEY` |

### Inline payer (scripts / tests)

```typescript
const syra = await createSyraPaidClient({
  payer: { solanaKeypair: process.env.MY_KEY! },
  // or: payer: { evmPrivateKey: "0x...", network: "base" }
});
```

---

## Manual payment signer

Production routes return **HTTP 402** with x402 requirements. Provide a `SyraPaymentSigner` that returns the `PAYMENT-SIGNATURE` header value.

Without a signer or paid fetch, `request()` returns `{ success: false, error: "HTTP 402" }` after the first 402.

```typescript
import { createSyraClient, type SyraPaymentSigner } from "@syra-ai/sdk";

const signer: SyraPaymentSigner = {
  async signPayment(challenge, context) {
    // Build x402 payment proof — return header value only
    return "...";
  },
};

const syra = createSyraClient({ signer });
```

---

## Low-level paid fetch

Use `@syra-ai/sdk/payment` when you only need x402-wrapped `fetch`:

```typescript
import { getPaidFetch, hasPaidFetchConfigured } from "@syra-ai/sdk/payment";

if (hasPaidFetchConfigured()) {
  const paidFetch = await getPaidFetch();
  const res = await paidFetch("https://api.syraa.fun/news?ticker=BTC");
}
```

---

## Pillars & discovery

```typescript
const pillars = await syra.get("/pillars");
// Earn, Treasury, Invest, Spend, Grow

import { SYRA_HIGH_VALUE_ROUTES } from "@syra-ai/sdk";

const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);
```

---

## Client API

| Method | Description |
|--------|-------------|
| `createSyraPaidClient(options)` | Factory with x402 auto-pay |
| `createSyraClient(options)` | Factory — `baseUrl`, optional `signer`, headers |
| `client.get(path, params?)` | GET with query params |
| `client.post(path, body?)` | POST JSON body |
| `client.request(method, path, options?)` | Low-level; handles 402 + retry after pay |

**Response shape:** `{ success: boolean; data?: T; error?: string }`

---

## Related packages

| Package | Role |
|---------|------|
| [`@syra-ai/mcp-server`](https://www.npmjs.com/package/@syra-ai/mcp-server) | MCP tools for Cursor / Claude — `npx -y @syra-ai/mcp-server` |
| [`@syra-ai/x402-payer`](https://www.npmjs.com/package/@syra-ai/x402-payer) | Standalone x402 sign / retry helper |
| [Syra monorepo](https://github.com/ikhwanhsn/syra_agent) | Source, API, docs, web |

| Resource | URL |
|----------|-----|
| Marketplace | [syraa.fun/marketplace](https://syraa.fun/marketplace) |
| OpenAPI | [api.syraa.fun/openapi.json](https://api.syraa.fun/openapi.json) |
| x402 discovery | [api.syraa.fun/.well-known/x402](https://api.syraa.fun/.well-known/x402) |
| Agent docs | [api.syraa.fun/llms-full.txt](https://api.syraa.fun/llms-full.txt) |
| Human docs | [docs.syraa.fun](https://docs.syraa.fun) |

---

## Development (monorepo)

```bash
git clone https://github.com/ikhwanhsn/syra_agent.git
cd syra_agent/syra-sdk
npm install
npm run build
```

From repo root:

```bash
npm install
npm run build:packages
```

---

## License

[MIT](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE) © Syra
