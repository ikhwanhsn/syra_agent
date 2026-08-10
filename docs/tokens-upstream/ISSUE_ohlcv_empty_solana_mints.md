# Sparse / empty OHLCV for many Solana mints

## Context

Syra (https://www.syraa.fun) is a production consumer of Tokens Assets API v1 (`api.tokens.xyz`) for agent dossiers, swap charts, and MCP `tokens-asset-ohlcv` / `tokens-asset-price-chart` tools.

## Problem

For a meaningful set of Solana mints (especially newer / lower-liquidity tokens), `GET /v1/assets/{assetId}/ohlcv` and related price-chart paths return successfully but with empty or too-sparse candle arrays (`candles.length < 2`). Syra currently falls back to pump.fun → CoinGecko → Binance → GeckoTerminal in `mintChartFallbackService` when Tokens OHLCV is empty.

## Expected

- Document when OHLCV may be empty (coverage rules, intervals, lookback)
- Prefer a structured empty state, e.g. `{ candles: [], reason: "insufficient_history" | "unsupported_interval" | "no_venue_data" }`
- If possible, improve coverage for Solana variants that already resolve to a valid `assetId`

## Repro sketch

1. Resolve a Solana mint via `GET /v1/assets/resolve?mint=<mint>`
2. Call `GET /v1/assets/{assetId}/ohlcv?interval=5m` (and `1H`)
3. Observe empty or near-empty `candles` while DexScreener / pump.fun still have candles for the same mint

## Why it matters for agents

Agents treat HTTP 200 + empty candles as “no market,” which is worse than an explicit coverage error. Clear empty reasons reduce fallback complexity for every Tokens consumer.

## Syra contact

https://www.syraa.fun · OSS consumer note: we stay on hosted API; happy to help validate fixes.
