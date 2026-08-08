# BTC Quant — paper edge dossier & kill bar

**Status:** paper measure. **Earn Yield:** btc1 adapter readiness only (never from paper edge alone). **btc2:** experimental desk, not Earn.

Learning is **daily batch evolution** (cull/mutate gates + real cooldowns), **not** per-trade ML. UI factor weights on `/btc2-experiment` are fixed display weights.

## Decision (go / no-go)

| Surface | Open? |
|---|---|
| Paper lab `/btc-experiment` (btc1) | Yes |
| Agent desk `/btc2-experiment` (btc2) | Yes (experimental) |
| Earn Yield `cbbtc_onchain_signal` | Only when btc1 real adapter readiness is green |

Gate constants: [`api/config/btcQuantPaperEdge.js`](../api/config/btcQuantPaperEdge.js).

## Paper edge dossier

```bash
cd api && node scripts/btcQuantPaperEdgeDossier.js --lane=btc2
cd api && node scripts/btcQuantPaperEdgeDossier.js --lane=btc1
cd api && node scripts/btcQuantPaperEdgeDossier.js --lane=all
```

Gates (`BTC_QUANT_PAPER_EDGE_GATES`):

| Gate | Value |
|---|---|
| Min decided trades (cohort) | ≥ 50 |
| Qualified leader decided | ≥ 8 |
| Leader win rate | ≥ 52% |
| Leader net PnL after paper costs | > 0 |
| Paper round-trip cost | ~110 bps (`BTC_QUANT_PAPER_ROUND_TRIP_BPS`) |

Also run:

```bash
cd api && node scripts/auditExperimentProfitability.js
```

### Dossier fields

1. Active `experimentId` / lane
2. Decided / wins / losses / expired / open
3. Cohort net PnL USD (after costs; active runs only, not evolution-archived)
4. Qualified leader (or null → `no_qualified_leader` on real)
5. Evolution snapshot (last summary, overrides, cooldowns)
6. Kill criteria status
7. Explicit: **Earn Yield allowed = false** from paper edge alone

## Kill criteria

From `BTC_QUANT_PAPER_EDGE_KILL_CRITERIA`:

- Paper net-negative after costs
- Decided sample below 50
- No qualified leader (decided ≥8, WR ≥52%, net+)
- Real lab error rate ≥ 10% (pause) / > 5% blocks Earn readiness
- Settlement success < 95% on sample ≥ 10
- **Endless almost (btc2):** no qualified leader after ≥3 evolution ticks with cohort decided ≥ 50 → redesign signal, do not add more mutations

## Graduation path (do not skip)

1. **Paper measure** — dossier on btc1/btc2 (current).
2. **Paper edge** — dossier script green.
3. **Real lab** — Jupiter cbBTC, learned `minConfidence` / `minPassesDelta` / notional multiplier + cooldowns enforced.
4. **Earn beta** — btc1 adapter readiness only (`btcQuantEarnAdapter`). Do not wire Earn to btc2.

See also [EARN_YIELD_GRADUATION.md](./EARN_YIELD_GRADUATION.md) and [EARN_YIELD_CBBTC_EVAL.md](./EARN_YIELD_CBBTC_EVAL.md).

## Evolution intelligence (paper lab)

Daily evolution (`btcQuantExperimentEvolution.js`):

- Scores agents with sample confidence, expectancy, profit factor, expire penalty (`btcQuantExperimentScoring.js`)
- ~30% of spawns explore randomly instead of elite mutation
- Archives culled strategy run history (`summary.evolutionArchived`) instead of deleting it
- Real WR < 45% sets `minConfidence=HIGH`, `minPassesDelta=1`, size haircut (enforced on paper + real signal paths)

## What paper profitability does not prove

1. Real Jupiter fill quality / slippage beyond paper bps
2. Cross-venue basis (Binance BTCUSDT features vs Jupiter cbBTC marks)
3. Capacity at size
4. Spot-long performance in hostile regimes (learning cannot invent shorts)
