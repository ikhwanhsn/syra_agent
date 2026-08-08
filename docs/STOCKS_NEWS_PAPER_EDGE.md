# Stocks News Lab — paper edge dossier & Earn hold

**Status:** paper watch only. **Earn Yield: blocked.**

Do not list Stocks on Earn Yield (no `coming_soon` tease, no deposits) until every stage below clears.

## Decision (go / no-go)

| Surface | Open? |
|---|---|
| Public paper watch at `/stocks` | Yes (read-only leaderboard) |
| Earn Yield deposits | **No** |
| Earn Skills / paid `/equity` | Separate products; OK for real micropayments |

Registry guard: `EARN_YIELD_BLOCKED_EXPERIMENTS` in [`api/config/earnProducts.js`](../api/config/earnProducts.js) fails boot/tests if a `stocks_*` product is registered.

Gate constants: [`api/config/stocksEarnGraduation.js`](../api/config/stocksEarnGraduation.js).

## Paper edge dossier (required before real executor)

Run:

```bash
cd api && node scripts/stocksPaperEdgeDossier.js
```

Gates (`STOCKS_PAPER_EDGE_GATES`):

| Gate | Value |
|---|---|
| Min decided trades (cohort) | ≥ 50 |
| Champion net PnL after paper costs | > 0 |
| Champion win rate | ≥ 48% |
| Max drawdown from peak equity | ≤ 25% (document if measured) |
| Paper round-trip cost | ~110 bps (`STOCKS_PAPER_ROUND_TRIP_BPS`) |

Also run the cross-desk audit:

```bash
cd api && node scripts/auditExperimentProfitability.js
```

### Dossier fields to capture

1. Active `experimentId` / cohort start
2. Decided / wins / losses / expired / open
3. Cohort net PnL USD (after costs)
4. Champion `strategyId`, name, decided, win rate, net PnL, leader score
5. Max drawdown (if available from equity history)
6. Kill criteria status (pass/fail each item)
7. Explicit: **Earn Yield allowed = false** until compliance + real lab

## Kill criteria

From `STOCKS_EARN_KILL_CRITERIA`:

- Paper net-negative after costs
- Decided sample below 50
- Drawdown > 25% from peak
- Real lab error rate ≥ 10% (pause) / > 5% blocks Earn readiness
- Settlement success < 95% on sample ≥ 10
- Compliance review fails or is revoked

## Graduation path (do not skip)

1. **Paper watch** — public `/stocks`, no capital (current).
2. **Paper edge** — dossier script green.
3. **Compliance** — equity-like xStocks legal/reputational review.
4. **Real lab** — Jupiter + `walletBroker` executor, `stocks_real_config` with `publicEarnListed=false`, small notional, cron gated.
5. **Earn adapter** — `getStats` / `getReadiness` / enable / disable / `enforceKill`.
6. **Register** in `earnProducts.js` only after removing the stocks entry from `EARN_YIELD_BLOCKED_EXPERIMENTS` and clearing readiness.
7. **Earn beta** — allowlist or capped deposits; kill monitor live.

See also [EARN_YIELD_GRADUATION.md](./EARN_YIELD_GRADUATION.md).

## Real-money alternatives (shipped)

Point users who want real money to products that already settle:

| Product | Path | What they pay for |
|---|---|---|
| Tokenized equity intelligence | `/marketplace` → `/equity` / `/spcx` ($0.02 x402) | Nasdaq vs on-chain spread intel |
| Earn Skills | `/earn?track=skills` | Creator pay-per-call APIs |

These are **not** Stocks Yield strategy deposits.

## Evolution intelligence (paper lab)

Daily evolution (`stocksExperimentEvolution.js`) is **not** Earn unlock. It:

- Scores agents with sample confidence, expectancy, profit factor, expire penalty (`stocksExperimentScoring.js`)
- Requires ≥12 decided + ≥48% win rate + net+ avg for elite parents (rejects 5–7 trade lucky streaks)
- Culls worst **leader scores** (protects top elites); ~30% of spawns explore randomly
- Mutates smarter: shorter holds when expire-heavy, tighter gates when win rate soft

## What paper profitability does not prove

1. Real fill quality / slippage on xStocks beyond paper bps
2. Capacity at size
3. News → signal → execution latency under load
4. Compliance posture for equity-like tokens
5. Sample adequacy (leader/elite bar is 12 decided; Earn paper gate is 50 cohort decided)
