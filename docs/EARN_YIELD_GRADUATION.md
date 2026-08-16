# Earn Yield graduation checklist

How an experiment becomes a public Earn Yield product.

## Architecture (already shipped)

```
earnProducts.js registry
  → earnYieldService dispatcher
    → per-product adapter (lp | momentumRotator | lstLoop | alphaSniper)
      → real service (lpReal / momentum / lst / sniper)
```

Adding a new product = adapter + registry row + (optional) publicEarnListed fields on config. No rewrite of the Earn page.

## Current products

| Product ID | Adapter | Real executor | Denom | Status path |
|---|---|---|---|---|
| `lp_meteora_dlmm` | `lpEarnAdapter` | `lpRealService` | SOL | `beta` |
| `momentum_rotator` | `momentumRotatorEarnAdapter` | momentum real | USDC | `coming_soon` → auto-`beta` when ready |
| `lst_loop` | `lstLoopEarnAdapter` | `lstLoopRealService` | SOL | `coming_soon` → auto-`beta` when ready |
| `alpha_sniper` | `alphaSniperEarnAdapter` | sniper real | SOL | `coming_soon` → auto-`beta` when ready |

## Lab → public gate (all products)

1. **Real executor exists** (not paper-only).
2. **Lab agent running** at small capital with cron enabled.
3. Adapter `getReadiness().ready === true`:
   - Net-positive real PnL
   - Error rate ≤ 5% (kill at ≥ 10%) on adequate sample (≥ 10)
   - Solana x402 settlement success ≥ 95% (when sample ≥ 10)
4. Board auto-sets `status: beta` and `actionable: true` when beta allowlist/open allows.
5. Kill monitor pauses `publicEarnListed` deposits on guardrail breach.

### Lab activation (LST)

```bash
# Preview
node api/scripts/activate-earn-lab-agents.js --dry-run --anonymous-id=<chatAid> --product=lst

# Enable lab (keeps publicEarnListed=false)
node api/scripts/activate-earn-lab-agents.js --anonymous-id=<chatAid> --product=lst --max-position-sol=0.5
```

Validate:

```bash
node api/scripts/validate-earn-yield-launch.js --product=lst_loop
node api/scripts/validate-earn-yield-launch.js --all
```

## Paper-only experiments (not ready)

These stay **out of Earn** until they have a real executor + lab track record.

**Hard rule:** do **not** add them to [`api/config/earnProducts.js`](../api/config/earnProducts.js) as `coming_soon` or `beta`. Fake scarcity without an executor path is worse than silence. `EARN_YIELD_BLOCKED_EXPERIMENTS` fails tests/boot if a blocked id is registered.

| Experiment | Main service | Gap to earn-ready |
|---|---|---|
| Stocks (xStocks) | `api/libs/stocksExperimentService.js` | Realistic paper sim (on-chain fill, spread/slippage, risk-fraction size). Need real swap path + compliance review for equity-like tokens. **Admin paper watch only at `/stocks`. Earn Yield blocked.** Dossier: [STOCKS_NEWS_PAPER_EDGE.md](./STOCKS_NEWS_PAPER_EDGE.md). |
| AyeLabs (GMGN V/L DLMM) | `api/libs/ayeLabsService.js` | Paper fee-farm with EV gate. Real gate is config-only (`live_opens_not_wired_v1_paper_only`). **Admin paper watch at `/ayelabs`.** Dossier: [AYELABS_STRATEGY.md](./AYELABS_STRATEGY.md). |
| Arbitrage CEX spread | `arbitrageExperimentAggregate.js` | Read-only feed — no execution. |

### Stocks News — current hold

- Stage: `paper_watch` ([`stocksEarnGraduation.js`](../api/config/stocksEarnGraduation.js))
- Paper dossier: `cd api && node scripts/stocksPaperEdgeDossier.js` (≥50 decided, net-positive champion)
- Real-money UX: point to `/equity` / `/spcx` or `/earn?track=skills`, not Stocks Yield deposits

### Graduation steps for a paper experiment

1. Prove **paper edge** is real (sample, net PnL, max drawdown, costs).
2. Implement **real executor** (prefer existing `walletBroker` / Jupiter patterns from LP / LST).
3. Add `*_real_config` with `enabled`, `publicEarnListed`, `depositsPaused`, deposit caps, performance fee.
4. Add cron gated by `*_REAL_CRON_ENABLED`.
5. Run **lab** at small capital until adapter readiness passes.
6. Add `api/libs/earnAdapters/<name>EarnAdapter.js` implementing:
   - `getStats` / `getReadiness` / `getUserStatus` / `enableForUser` / `disableForUser` / `enforceKill`
7. Register in `api/config/earnProducts.js` + `earnAdapters/index.js`.
8. Ship UI automatically via multi-product board (no Earn page rewrite).

## Known limitations (follow-ups)

- Settlement guardrail is Solana-scoped; do not mix Celo Labs credit outages into Earn readiness.
- Performance fee collection metering for USDC products is stamped on config (`performanceFeeBps`) but fee sweep automation may still be ops-manual.

## LP Lab metric semantics (do not regress)

Meteora LP Lab `simulation.sumNetPnlSol` is the **sum of every paper agent’s simulated net PnL** (cohort research scoreboard). It must **not** be labeled “Best practice”, “Top strategy”, or presented as Earn expectancy.

- UI source of truth: [`web/src/lib/lpLabStatsCopy.ts`](../web/src/lib/lpLabStatsCopy.ts) (`Paper cohort sim PnL`) + banner on [`LpExperimentGlobalStats`](../web/src/components/experiment/lp/LpExperimentGlobalStats.tsx)
- Leader’s own sim PnL is `leaderSumNetPnlSol` / per-agent stats, distinct from the cohort sum
- Earn opens use `passesRealTrackRecordGate` (real closes), not paper leaders; degen evo strategies stay sim-only
- Regression: `web/src/lib/lpLabStatsCopy.test.ts`, `api/config/earnProducts.test.js` (LP copy honesty)

## Profitability hardening (shipped)

| Fix | Where |
|-----|--------|
| LP refuse softFallback; safeFallback ≤50% size | `lpExperimentService`, `lpRealService` |

## Related docs

- [STOCKS_NEWS_PAPER_EDGE.md](./STOCKS_NEWS_PAPER_EDGE.md) — Stocks paper dossier, kill criteria, Earn hold
- [AYELABS_STRATEGY.md](./AYELABS_STRATEGY.md) — AyeLabs DLMM fee-farm EV gate, paper-only real gate
- `api/config/earnProducts.js` — product registry + blocked experiment guard
- `api/config/stocksEarnGraduation.js` — Stocks stage gates (config-only until executor exists)
- `api/libs/earnAdapters/` — adapters
