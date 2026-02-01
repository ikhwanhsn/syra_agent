# PayAI x402 v2 Example Server (Shareable)

This example is intentionally **small and generic** so you can share it with a developer (or their agent) without exposing any Wurk production code.

It is an Express server that implements **x402 v2** payments for **Solana** and **Base (EVM)** via a facilitator (PayAI, or any other compatible facilitator URL).

## What you get

### Paid endpoints

- `GET/POST /solana/example` — **$0.01 USDC**
- `GET/POST /base/example` — **$0.01 USDC**

After successful payment, each endpoint returns:

```json
{ "ok": true, "paid": true, "message": "this endpoint is working, payment received." }
```

### Discovery

- `GET /.well-known/x402` — x402scan discovery document listing both endpoints (per spec)

Spec reference: [x402scan discovery document](https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md)

## Files to share

- `server/scripts/payai_example_server.ts` — server bootstrap + discovery + CORS
- `server/scripts/payai_example_routes.ts` — endpoint logic (402 descriptor, verify, settle)
- `docs/PAYAI_EXAMPLE_SERVER_README.md` — this file
- `docs/PAYAI_EXAMPLE_SERVER.env.example` — example environment file

## How it works (high level)

1. Calling an endpoint without payment returns a **402** with:
   - `Payment-Required` header (canonical x402 v2)
   - JSON body that includes `x402Version`, `accepts`, `resource`, and a Bazaar discovery extension schema (so tools like x402scan can render forms / metadata).
2. A client (x402scan, SDK, agent, etc.) creates a `PAYMENT-SIGNATURE` header for one of the `accepts` options and re-calls the endpoint.
3. The server:
   - decodes the payment payload,
   - verifies it with the facilitator,
   - settles it with the facilitator,
   - returns the success JSON plus a `Payment-Response` header.

## Setup

### 1) Install deps

```bash
npm install
```

### 2) Configure environment

Copy `docs/PAYAI_EXAMPLE_SERVER.env.example` to `.env` and fill values.

This example server intentionally supports **the same env var names as the main Wurk x402 server**, plus optional `PAYAI_*` aliases.

#### Env var mapping (recommended: use the standard names)

- **Solana**
  - **facilitator URL**: `FACILITATOR_URL` (or `PAYAI_FACILITATOR_URL` / `PAYAI_SOLANA_FACILITATOR_URL`)
  - **payTo**: `ADDRESS` (or `SOLANA_PAYTO`)
  - **USDC mint**: `USDC_MINT` (or `SOLANA_USDC_MINT`)
  - **network**: `NETWORK` (supports `solana`, `solana:mainnet`, `solana-devnet`, or CAIP like `solana:<genesis>`)

- **Base / EVM**
  - **facilitator URL**: `BASE_FACILITATOR_URL` (or `PAYAI_BASE_FACILITATOR_URL`; can fallback to `FACILITATOR_URL`)
  - **payTo**: `BASE_ADDRESS` (or `BASE_PAYTO`)
  - **USDC contract**: `BASE_USDC`
  - **network**: `BASE_NETWORK` (supports `base`, `base-sepolia`, or CAIP like `eip155:8453`)

#### Common mainnet USDC values

- **Solana USDC mint (mainnet)**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Base USDC (mainnet)**: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

#### Optional env vars

- `PUBLIC_ORIGIN`: recommended when deployed (so discovery URLs are stable and match ownership proofs)
- `X402_OWNERSHIP_PROOFS`: comma/newline separated signatures (optional verification for x402scan)
- `PORT`: defaults to `3000`

### 3) Run locally

```bash
npm run payai:example
```

Then open:

- `http://localhost:3000/` (plain text landing page)
- `http://localhost:3000/.well-known/x402`
- `http://localhost:3000/solana/example`
- `http://localhost:3000/base/example`

## Test on x402scan

1. Deploy this server to a **public HTTPS** domain (x402scan must reach it from the internet).
2. Make sure `/.well-known/x402` returns JSON like:
   - `version: 1`
   - `resources: ["https://<your-domain>/solana/example", "https://<your-domain>/base/example"]`
3. In x402scan:
   - Use the “Resource Preview” / developer tools to test each endpoint.
   - It should first show a 402 descriptor, then after payment show the success JSON.

## Troubleshooting

### x402scan shows “Expected 402, got 404”

This usually means x402scan is not reaching *your* running server:

- the app is sleeping / not deployed,
- wrong start command (not running `npm run payai:example`),
- wrong domain/port routing.

Verify by opening:

- `https://<your-domain>/` → should show the plain text landing page from this server.

### Browser shows an HTML paywall instead of JSON

`@x402/express` can return HTML paywall pages for browser-like requests.
This example server avoids that by always returning a JSON 402 descriptor for these endpoints.

### Base payment payload error (EIP-712 domain)

If a client complains about missing EIP-712 domain (`name`, `version`) for USDC, this example server injects a safe default:

- `name: "USD Coin"`
- `version: "2"`

If you change `BASE_USDC` to a different token, you may need to adjust the EIP-712 domain details accordingly.


