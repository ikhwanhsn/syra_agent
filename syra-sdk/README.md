# @syra-ai/sdk

Typed TypeScript client for **Syra machine money** — pay-per-call x402 APIs, agent wallets, and treasury policy on Solana.

Published as **`@syra-ai/sdk`** from the [Syra monorepo](../README.md). Syra-backed brands ([S3 Labs](https://s3labs.xyz), [Up Only Fund](https://uponlyfund.com)) integrate through the same API gateway.

---

## Install

```bash
npm install @syra-ai/sdk
```

For x402 auto-pay (Solana, Base, or Algorand), the SDK bundles `@x402/fetch` signers. Set env vars or pass inline credentials (see below).

---

## Quick start — auto-pay (recommended)

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

### Env vars

| Rail | Env |
|------|-----|
| Solana (default) | `SYRA_PAYER_KEYPAIR` — base58 or JSON byte array |
| Base | `X402_PREFERRED_NETWORK=base` + `SYRA_EVM_PAYER_PRIVATE_KEY` |
| Algorand | `X402_PREFERRED_NETWORK=algorand` + `SYRA_ALGORAND_PAYER_PRIVATE_KEY` |

### Inline payer (scripts / tests)

```typescript
const syra = await createSyraPaidClient({
  payer: { solanaKeypair: process.env.MY_KEY! },
  // or: payer: { evmPrivateKey: "...", network: "base" }
});
```

---

## Manual payment signer

Production routes return **HTTP 402** with x402 payment requirements. For custom signing, provide a `SyraPaymentSigner` that returns the `PAYMENT-SIGNATURE` header string (typically via `@x402/svm` + your agent wallet).

Without a signer or paid fetch, `request()` returns `{ success: false, error: "HTTP 402" }` after the first 402 response.

```typescript
import { createSyraClient, type SyraPaymentSigner } from "@syra-ai/sdk";

const signer: SyraPaymentSigner = {
  async signPayment(challenge, context) {
    // Build x402 payment proof for Solana USDC — return header value only
    return "..."; // PAYMENT-SIGNATURE value
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

Syra organizes capabilities around five pillars. Discover live routes at runtime:

```typescript
const pillars = await syra.get("/pillars");
// Earn, Treasury, Invest, Spend, Grow
```

Use typed helpers where available:

```typescript
import { SYRA_HIGH_VALUE_ROUTES } from "@syra-ai/sdk";

const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);
```

---

## Client API

| Method | Description |
|--------|-------------|
| `createSyraPaidClient(options)` | Factory with x402 auto-pay wired |
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

From repo root with workspaces:

```bash
npm install
npm run build:packages
```

---

## Related

| Resource | URL |
|----------|-----|
| API Marketplace | [syraa.fun/marketplace](https://syraa.fun/marketplace) |
| MCP server | [`@syra-ai/mcp-server`](../mcp-server) — `npx -y @syra-ai/mcp-server` |
| x402 payer utils | [`@syra-ai/x402-payer`](../packages/syra-x402-payer) |
| OpenAPI | [api.syraa.fun/openapi.json](https://api.syraa.fun/openapi.json) |
| x402 discovery | [api.syraa.fun/.well-known/x402](https://api.syraa.fun/.well-known/x402) |
| Docs | [docs.syraa.fun](https://docs.syraa.fun) |

---

## Publish

npm uses **security keys** (Windows Hello / Touch ID / passkey), not Google Authenticator.

**Option A — Granular token with Bypass 2FA (recommended, no prompts):**

1. [npmjs.com → Access Tokens](https://www.npmjs.com/settings) → Generate **Granular** token
2. **Read and write** on All packages (or `@syra-ai` scope)
3. Check **"Bypass two-factor authentication (2FA)"**
4. `npm config set //registry.npmjs.org/:_authToken npm_...`
5. From repo root:

```bash
npm run verify:npm-auth
npm run publish:packages
```

**Option B — Interactive (Windows Hello / passkey in terminal):**

```bash
npm login
npm run publish:packages:interactive
```

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
