# Three Onchain Earn Experiments

Paper-first labs that graduate to capped Earn Yield beta products.

## Products

| Product id | Label | Wallet | Rails |
|---|---|---|---|
| `momentum_rotator` | Momentum Rotator | invest (USDC) | Jupiter + walletBroker |
| `lst_loop` | Leveraged LST Loop | invest (SOL) | Marinade/Jito + Rise + `riseExecutor` |
| `alpha_sniper` | New-Pair Alpha Sniper | lp (SOL) | pump.fun swap + Jupiter + RugCheck |

Registry: `api/config/earnProducts.js`. Adapters: `api/libs/earnAdapters/*`.

## Paper labs

| Lab | API | Admin UI |
|---|---|---|
| Momentum | `/experiment/momentum-rotator` | `/momentum-rotator` |
| LST Loop | `/experiment/lst-loop` | `/lst-loop` |
| Sniper | `/experiment/sniper` | `/alpha-sniper` |

Cron intervals, evolution, and `realEnabled` are **code constants** in [`api/config/onchainEarnExperiments.js`](../api/config/onchainEarnExperiments.js). Flip `*.realEnabled = true` there when graduating — no per-experiment env vars.

Optional: `EARN_EXPERIMENT_CRON_SECRET` (header `x-earn-experiment-secret`) for remote cron POSTs. Empty = open.

Each lab: multi-strategy cohort + evolution + computed PnL. No capital risk.

### Graduation gate (paper → real / public list)

For all three:

1. **≥ 50 decided** paper trades (win + loss + expired)
2. **Positive sum PnL** (expectancy)
3. Real readiness still requires settlement ≥95%, error-rate guards, and net-positive real sample when present

Checked by `check*PaperGraduation()` in each `*RealService.js` and by `validate-earn-yield-launch.js`.

## Real (gated)

Set `realEnabled: true` on the product block in `onchainEarnExperiments.js`, restart API, then enable a capped wallet via real routes / Earn Yield.

APIs:

- `/experiment/momentum-rotator-real`
- `/experiment/lst-loop-real`
- `/experiment/sniper-real`

Public Earn Yield enable still goes through `/earn/yield/enable` + adapter readiness (coming_soon → beta when `ready`).

## Shared foundations

- `api/libs/riseExecutor.js` — signs Rise program txs via walletBroker
- `api/libs/jupiterBrokerSwap.js` — generic Jupiter swap for rotator / sniper exits / LST proxy

## Guardrails

- Kill monitor: `earnYieldKillMonitor.js` (all products)
- Validate: `node api/scripts/validate-earn-yield-launch.js --all`
- Per-product: max error rate, kill error rate, settle success, deposit caps, sniper daily loss cap + RugCheck hard gate, LST min health / max borrow rate

## Sequencing

1. Accrue paper data (paper crons on from code defaults).
2. When graduation passes, set `realEnabled: true` in `onchainEarnExperiments.js` and enable a capped wallet.
3. When real readiness.ready, product auto-lists as beta on Earn Yield.
