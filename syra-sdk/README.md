# @syra/sdk

Typed TypeScript client for **Syra machine money** — pay-per-call x402 APIs, agent wallets, and treasury policy on Solana.

Published as **`@syra/sdk`** from the [Syra monorepo](../README.md). Syra-backed brands ([S3 Labs](https://s3labs.id), [Up Only Fund](https://uponlyfund.com)) integrate through the same API gateway.

---

## Install

```bash
npm install @syra/sdk
```

---

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

---

## Payment signer

Production routes return **HTTP 402** with x402 payment requirements. Provide a `SyraPaymentSigner` that returns the `PAYMENT-SIGNATURE` header (typically via `@x402/svm` + your agent wallet).

Without a signer, `request()` returns `{ success: false, error: "HTTP 402" }` after the first 402 response.

```typescript
import { createSyraClient, type SyraPaymentSigner } from "@syra/sdk";

const signer: SyraPaymentSigner = {
  async signPayment(requirements) {
    // Build x402 payment proof for Solana USDC
    return { "PAYMENT-SIGNATURE": "..." };
  },
};
```

---

## Pillars & discovery

Syra organizes capabilities around five pillars. Discover live routes at runtime:

```typescript
const pillars = await syra.get("/pillars");
// Earn, Treasury, Invest, Spend, Grow
```

Use typed helpers where available:

```typescript
import { SYRA_HIGH_VALUE_ROUTES } from "@syra/sdk";

const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);
```

---

## Client API

| Method | Description |
|--------|-------------|
| `createSyraClient(options)` | Factory — `baseUrl`, optional `signer`, headers |
| `client.get(path, params?)` | GET with query params |
| `client.post(path, body?)` | POST JSON body |
| `client.request(method, path, options?)` | Low-level; handles 402 + retry after pay |

All methods return `{ success: boolean; data?: T; error?: string }`.

---

## Development (monorepo)

```bash
cd syra-sdk
npm install
npm run build
```

Link locally from another package:

```bash
npm link ../syra-sdk
```

---

## Related

| Resource | URL |
|----------|-----|
| API Playground | [playground.syraa.fun](https://playground.syraa.fun) |
| MCP server | [`@syra/mcp-server`](../mcp-server) |
| OpenAPI | [api.syraa.fun/openapi.json](https://api.syraa.fun/openapi.json) |
| x402 discovery | [api.syraa.fun/.well-known/x402](https://api.syraa.fun/.well-known/x402) |
| Docs | [docs.syraa.fun](https://docs.syraa.fun) |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
