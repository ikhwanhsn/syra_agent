# x402 Agent Ergonomics

Syra follows **agent-native payment semantics** aligned with BlockRun and the x402 v2 spec.

## Payment flow

1. `GET /news` (no payment header)
2. **HTTP 402** with `accepts[]` pricing and `Payment-Required` header
3. Sign USDC locally (private key never leaves your machine)
4. Retry with `PAYMENT-SIGNATURE` or `X-Payment`
5. **200** + `X-Payment-Receipt` on success

## Price discovery

Every paid endpoint quotes its price **in the 402 body before you commit**. No accounts, no API keys.

```bash
curl -s https://api.syraa.fun/signal?token=solana -D -
# HTTP/2 402
# Payment-Required: ...
```

Full catalog: `GET /.well-known/x402` and `GET /openapi.json`.

## Safe retry (critical for agents)

| Status | Charged? | Action |
|--------|----------|--------|
| 200/201 | Yes | Use response |
| 400/404 | No | Fix request |
| 402 | No | Sign payment and retry |
| 5xx with `"Payment was NOT charged"` | No | Safe to retry same request |

Always verify `X-Payment-Response` — `success=true` means USDC settled on-chain.

## Pricing tiers (July 2026)

| Tier | Price | Examples |
|------|-------|----------|
| 1 | $0.001 | health, jupiter/quote, coingecko, dexscreener/pairs, geckoterminal/pools, defillama/tvl, pyth/price, assets board, pumpfun lists |
| 1b | $0.005 | rugcheck/report |
| 2 | $0.005 | news, signal, sentiment, indicator, dossier detail |
| 3 | $0.02+ | pumpfun analyzer, equity intel |
| 4 | $0.08 | /brain multi-tool synthesis |

## Free tier (onboarding)

No USDC required:

- `GET /free/pillars`
- `GET /free/assets`
- `GET /free/coingecko/price?ids=bitcoin,ethereum,solana`
- `GET /free/dossier/basic?mint={solanaMint}`

## Networks

**Preferred:** Base USDC (`eip155:8453`) for leaderboard indexing.

**Also supported:** Solana USDC (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`).

Check live: `GET /x402/capabilities`.

## Tools

- **Marketplace UI:** https://syraa.fun/marketplace — browse Core vs Partners, per-API detail pages with agent manifests
- **MCP:** `claude mcp add syra -- npx -y @syra-ai/mcp-server@latest`
- **SDK:** `npm install @syra-ai/sdk`
- **Payer util:** `npm install @syra-ai/x402-payer` (MIT)
- **Agent docs:** `GET /llms-full.txt`

## Public metrics

- `GET /api/metrics` — lifetime calls, USDC, wallets, treasury
- `GET /api/live/calls` — SSE feed of recent settlements (sanitized)

Web UI: https://syraa.fun (growth home; `/metrics` redirects there)
