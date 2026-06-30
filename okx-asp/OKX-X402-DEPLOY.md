# OKX X Layer x402 — Deploy Guide

**Best path when ASP marketplace registration is blocked:** accept payments from OKX Agentic Wallets on X Layer without an OKX.AI ASP listing.

Syra's API already runs x402 on Solana, Base, BSC, and Algorand. This adds **OKX facilitator settlement on X Layer (`eip155:196`)** so Onchain OS / Agentic Wallet clients can pay per API call.

## 1. Get OKX API keys

1. Open [OKX Onchain OS Dev Portal](https://web3.okx.com/onchain-os/dev-portal)
2. Create API key with **Payments / x402** permissions (DEX-only keys return 401 on facilitator)
3. Copy: API Key, Secret Key, Passphrase

## 2. Set production env on `api.syraa.fun`

Add to `api/.env` (or your host secrets):

```env
# OKX facilitator (required)
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret
OKX_PASSPHRASE=your_passphrase

# Where X Layer USDT payments land (your Agentic Wallet or treasury)
OKX_X402_PAYTO=0x3b35c4bb0b5304f97644de429f68e3b5be2b400c

# Optional
OKX_X402_SYNC_SETTLE=true
OKX_X402_NETWORKS=xlayer
```

`OKX_X402_PAYTO` can also be `XLAYER_PAYTO` or fall back to `EVM_PAYTO` / `BASE_PAYTO`.

## 3. Deploy and verify

```powershell
cd d:\business\syra-monorepo\api
npm run validate-okx-x402
```

Or against production:

```powershell
$env:BASE_URL="https://api.syraa.fun"
npm run validate-okx-x402
```

Expect:

- `GET /x402/capabilities` → `data.okx.enabled: true`, `data.networks.xlayer: true`
- `GET /health` without payment → 402 with an `eip155:196` accept option

## 4. Test with Agentic Wallet

From Cursor with Onchain OS skills:

> Pay for Syra API health check on X Layer

Or hit any paid route; wallet should see X Layer USDT option and auto-retry after signing.

## 5. ASP listing (later)

When `onchainos agent create` works, run:

```powershell
node okx-asp/register-syra-asp.mjs
```

Marketplace listing is **discovery only** — payments work once Step 2–3 are live.

## References

- [OKX Service Seller SDK](https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk)
- Code: `api/config/okxX402Networks.js`, `api/utils/okxX402ResourceServer.js`, `api/utils/x402PaymentV2.js`
