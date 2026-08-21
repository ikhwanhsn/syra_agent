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
| Delphi | `/experiment/delphi` | none yet (phase 2) |

Cron intervals, evolution, and `realEnabled` are **code constants** in [`api/config/onchainEarnExperiments.js`](../api/config/onchainEarnExperiments.js). Flip `*.realEnabled = true` there when graduating — no per-experiment env vars.

As of 2026-08-12: **LST Loop `realEnabled: true`** (capped real lab; Earn public listing still requires adapter readiness). Momentum and Sniper remain `false` until paper gates pass. cbBTC/BTC3 use `activate-earn-lab-agents.js` + `BTC_QUANT_REAL_CRON_ENABLED` / `BTC3_REAL_CRON_ENABLED` (cbBTC also requires paper-edge pass).

As of 2026-08-17: **Delphi** paper lab is on (`DELPHI_CRON.realEnabled: false`). Signal source is Polymarket top crypto traders → per-asset bias → Jupiter-priced SOL/cbBTC/wETH paper fills. Live executor exists in `delphiRealService.js` but is not scheduled until the flag flips.

Optional: `EARN_EXPERIMENT_CRON_SECRET` (header `x-earn-experiment-secret` or `x-delphi-experiment-secret`) for remote cron POSTs. Empty = open.

Each lab: multi-strategy cohort + evolution + computed PnL. No capital risk.

### Delphi (Polymarket smart-money mirror)

- **Signal:** `api/libs/polymarketTraderSignals.js` ranks crypto traders on Polymarket (Gamma markets + data-api leaderboard/positions), maps live outcomes to BTC/ETH/SOL direction, emits `bias` in [-1, 1], `consensus`, and `sampleSize`.
- **Universe:** SOL (native), BTC (`cbBTC`), ETH (Wormhole). XRP/DOGE skipped (no viable Jupiter mint).
- **Paper:** `/experiment/delphi` — virtual USDC bank, Jupiter fill + 15 bps haircut, Pyth mark, SL/TP/time/reversal exits. Shorts are simulated in paper only.
- **Cron:** signal ~12 min (scaled by `SYRA_PAPER_CRON_MULT`), resolve ~3 min, evolution 45 min.
- **Graduation (Delphi-specific):** ≥20 decided paper trades, positive sum PnL, win rate ≥50%. Then set `DELPHI_CRON.realEnabled = true`. Real layer executes **longs only** via `executeJupiterBrokerSwap` with hard caps (`maxPositionUsd: 50`, `maxPositionSol: 0.3`, `maxConcurrentPositions: 2`).

### Graduation gate (paper → real / public list)

For Momentum / LST / Sniper:

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
- Delphi real: `delphiRealService.js` (no HTTP router until the paper gate passes)

Public Earn Yield enable still goes through `/earn/yield/enable` + adapter readiness (coming_soon → beta when `ready`).

## Shared foundations

- `api/libs/riseExecutor.js` — signs Rise program txs via walletBroker
- `api/libs/jupiterBrokerSwap.js` — generic Jupiter swap for rotator / sniper exits / LST proxy / Delphi real

## Guardrails

- Kill monitor: `earnYieldKillMonitor.js` (all products)
- Validate: `node api/scripts/validate-earn-yield-launch.js --all`
- Per-product: max error rate, kill error rate, settle success, deposit caps, sniper daily loss cap + RugCheck hard gate, LST min health / max borrow rate

## Sequencing

1. Accrue paper data (paper crons on from code defaults).
2. When graduation passes, set `realEnabled: true` in `onchainEarnExperiments.js` and enable a capped wallet.
3. When real readiness.ready, product auto-lists as beta on Earn Yield.
