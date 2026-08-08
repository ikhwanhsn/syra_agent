# SYRA MM — paper edge dossier & Earn hold

**Status:** paper lab only. **Earn Yield: blocked.**

Do not list Market Maker on Earn Yield until every stage below clears and a real two-sided executor exists.

## Decision (go / no-go)

| Surface | Open? |
|---|---|
| Admin paper lab at `/mm` | Yes |
| Earn Yield deposits | **No** |
| Real maker venue (e.g. Flint) | Deferred |

Registry guard: `EARN_YIELD_BLOCKED_EXPERIMENTS` in [`api/config/earnProducts.js`](../api/config/earnProducts.js) includes `mm` / `syra_mm`.

Gate constants: [`api/config/mmPaperEdge.js`](../api/config/mmPaperEdge.js).

## Paper edge dossier (required before real executor)

Run:

```bash
cd api && node scripts/mmPaperEdgeDossier.js
```

Gates (`MM_PAPER_EDGE_GATES`):

| Gate | Value |
|---|---|
| Min honest round trips | ≥ 50 |
| Promoted strategy net PnL (honest fills) | > 0 |
| Max mid_fallback share | ≤ 5% |
| Max inventory drift / maxInventory | ≤ 85% |
| Promotion stability (consecutive) | ≥ 3 |

### Dossier fields

1. Honest vs mid_fallback closed sample
2. Promoted strategy id + net PnL + win rate
3. Inventory drift fraction
4. Promotion stability
5. Kill criteria status (pass/fail each item)
6. Explicit: **Earn Yield allowed = false** until real executor + risk limits

## Kill criteria

From `MM_EARN_KILL_CRITERIA`:

- Paper net-negative on honest fills
- Honest sample below 50
- mid_fallback share above 5%
- Inventory drift breach
- Promotion churn
- Real executor still missing (`executeRealMmFill` throws)

## Graduation path (do not skip)

1. **Paper lab** — admin `/mm`, Jupiter-quote paper fills (current).
2. **Paper edge** — dossier script green.
3. **Real executor** — two-sided inventory, risk limits, no mid_fallback inventing PnL.
4. **Earn adapter** — readiness / enable / kill monitor.
5. **Register** in `earnProducts.js` only after removing `mm` / `syra_mm` from `EARN_YIELD_BLOCKED_EXPERIMENTS`.

See also [EARN_YIELD_GRADUATION.md](./EARN_YIELD_GRADUATION.md).

## Learning notes

- Learning is **batch heuristic** evolution (rate-limited), not online per-trade ML.
- Overrides evolve **incrementally** from current effective params.
- `inventorySkewFactor` from learning is applied in the quote cycle.
- `mid_fallback` fills fail closed and are excluded from promotion stats.
