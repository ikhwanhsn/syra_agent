# Tokens API contract Syra depends on

**Production base URL:** `https://api.tokens.xyz` (override with `TOKENS_API_BASE_URL`).  
**Auth:** `x-api-key: $TOKENS_API_KEY` (server-side only).  
**OSS monorepo:** https://github.com/solana-foundation/tokens  
**Docs:** https://docs.tokens.xyz/v1/quickstart  

Syra does **not** self-host Tokens Cloud Run / Cloud SQL / ClickHouse. Track their OpenAPI and `db/` schema in the OSS repo for breaking changes; keep production on the hosted API.

## Endpoints used by Syra

| Syra tool / surface | Method | Path |
|---------------------|--------|------|
| tokens-assets-search | GET | `/v1/assets/search` |
| tokens-assets-resolve | GET | `/v1/assets/resolve` |
| tokens-asset-detail | GET | `/v1/assets/{assetId}` |
| tokens-asset-variants | GET | `/v1/assets/{assetId}/variants` |
| tokens-asset-markets | GET | `/v1/assets/{assetId}/markets` |
| tokens-asset-ohlcv | GET | `/v1/assets/{assetId}/ohlcv` |
| tokens-asset-price-chart | GET | `/v1/assets/{assetId}/price-chart` |
| tokens-asset-risk-summary | GET | `/v1/assets/{assetId}/risk-summary` |
| tokens-asset-risk-details | GET | `/v1/assets/{assetId}/risk-details` |
| tokens-risk-summary-mint | GET | `/v1/assets/risk-summary?mint=` |
| tokens-assets-curated | GET | `/v1/assets/curated` |
| tokens-market-snapshots | POST | `/v1/assets/market-snapshots` |
| tokens-variant-markets | GET | `/v1/assets/variant-markets` |
| Health smoke | GET | `/v1/health` |

Client: [`api/libs/tokensAgentService.js`](../libs/tokensAgentService.js).  
Composite research: [`api/libs/assetResearchService.js`](../libs/assetResearchService.js).

## Hygiene commands

```bash
cd api
npm run verify:tokens-api
```

When Tokens publishes npm packages with shared types, prefer those over ad-hoc response shaping in the client.
