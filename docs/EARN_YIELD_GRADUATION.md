# Earn Yield graduation checklist

How an experiment becomes a public Earn Yield product.

## Architecture (already shipped)

```
earnProducts.js registry
  → earnYieldService dispatcher
    → per-product adapter (lp | btcQuant | btc3)
      → real service (lpReal / btcQuantReal / btc3Real)
```

Adding a new product = adapter + registry row + (optional) publicEarnListed fields on config. No rewrite of the Earn page.

## Current products

| Product ID | Adapter | Real executor | Denom | Status path |
|---|---|---|---|---|
| `lp_meteora_dlmm` | `lpEarnAdapter` | `lpRealService` | SOL | `beta` |
| `cbbtc_onchain_signal` | `btcQuantEarnAdapter` | `btcQuantRealService` (lane btc1) | USDC | `coming_soon` → auto-`beta` when ready |
| `btc3_macro` | `btc3EarnAdapter` | `btc3RealService` | USDC | `coming_soon` → auto-`beta` when ready |

## Lab → public gate (all products)

1. **Real executor exists** (not paper-only).
2. **Lab agent running** at small capital with cron enabled.
3. Adapter `getReadiness().ready === true`:
   - Net-positive real PnL (or equity vs baseline for BTC3)
   - Error rate ≤ 5% (kill at ≥ 10%) on adequate sample (≥ 10)
   - Solana x402 settlement success ≥ 95% (when sample ≥ 10)
   - BTC3 also: drawdown ≤ 25% from peak equity
   - cbBTC / BTC3 also: ≥ 10 decided real samples before graduation
4. Board auto-sets `status: beta` and `actionable: true` when beta allowlist/open allows.
5. Kill monitor pauses `publicEarnListed` deposits on guardrail breach.

### Lab activation (cbBTC + BTC3)

```bash
# Preview
node api/scripts/activate-earn-lab-agents.js --dry-run --anonymous-id=<chatAid>

# Enable lab at ~50 USDC max notional (keeps publicEarnListed=false)
node api/scripts/activate-earn-lab-agents.js --anonymous-id=<chatAid> --max-usdc=50
```

Set in env:

- `BTC_QUANT_REAL_CRON_ENABLED=true`
- `BTC3_REAL_CRON_ENABLED=true`

Validate:

```bash
node api/scripts/validate-earn-yield-launch.js --product=cbbtc_onchain_signal
node api/scripts/validate-earn-yield-launch.js --product=btc3_macro
node api/scripts/validate-earn-yield-launch.js --all
```

## Paper-only experiments (not ready)

These stay **out of Earn** until they have a real executor + lab track record.

| Experiment | Main service | Gap to earn-ready |
|---|---|---|
| Scalper | `api/libs/scalper/scalperService.js` | Paper only. `scalperFillEngine.js` has an adapter boundary — wire `walletBroker` / Jupiter, add `scalper_real_config`, cron, then `scalperEarnAdapter`. |
| Market Maker | `api/libs/mm/mmService.js` | Paper Jupiter-quote fills. Need real two-sided inventory + risk limits before any public deposits. |
| Stocks (xStocks) | `api/libs/stocksExperimentService.js` | Paper via Jupiter price feeds. Need real swap path + compliance review for equity-like tokens. |
| Legacy trading suites (`primary` / `secondary`) | retired | Do not revive — use BTC quant / BTC3 instead. |
| Arbitrage CEX spread | `arbitrageExperimentAggregate.js` | Read-only feed — no execution. |

### Graduation steps for a paper experiment

1. Prove **paper edge** is real (sample, net PnL, max drawdown, costs).
2. Implement **real executor** (prefer existing `walletBroker` / Jupiter patterns from BTC quant).
3. Add `*_real_config` with `enabled`, `publicEarnListed`, `depositsPaused`, deposit caps, performance fee.
4. Add cron gated by `*_REAL_CRON_ENABLED`.
5. Run **lab** at small capital until adapter readiness passes.
6. Add `api/libs/earnAdapters/<name>EarnAdapter.js` implementing:
   - `getStats` / `getReadiness` / `getUserStatus` / `enableForUser` / `disableForUser` / `enforceKill`
7. Register in `api/config/earnProducts.js` + `earnAdapters/index.js`.
8. Ship UI automatically via multi-product board (no Earn page rewrite).

## Known limitations (follow-ups)

- **cbBTC / BTC3 configs are singletons** today (one active invest wallet per product). Multi-tenant public scale needs per-`agentAddress` configs + cron iteration (same pattern as `LpRealConfig`).
- Settlement guardrail is Solana-scoped; do not mix Celo Labs credit outages into Earn readiness.
- Performance fee collection metering for USDC products is stamped on config (`performanceFeeBps`) but fee sweep automation may still be ops-manual.

## Profitability hardening (shipped)

Real-agent edge leaks closed:

| Fix | Where |
|-----|--------|
| Refresh + pin live BTC Quant leader; no negative `pickBest` fallback; score decided PnL | `btcQuantRealService` / `btcQuantExperimentEvolution` |
| Paper round-trip cost (~110 bps) so barely-green sim stays out of real | `btcQuantExperimentService`, `stocksExperimentService` |
| Honor real evolution notional multiplier + cooldowns | `btcQuantRealService` |
| BTC3 learning gates on real; paper fee + 5% min rebalance; clamp LLM returns | `btc3RealService`, `btc3PaperTradingService`, `portfolioOptimizer` |
| LP refuse softFallback; safeFallback ≤50% size | `lpExperimentService`, `lpRealService` |

Scalper/MM remain paper-only — do not list on Earn until a real executor exists.

## Related docs

- [EARN_YIELD_CBBTC_EVAL.md](./EARN_YIELD_CBBTC_EVAL.md) — original cbBTC evaluation notes
- `api/config/earnProducts.js` — product registry
- `api/libs/earnAdapters/` — adapters
