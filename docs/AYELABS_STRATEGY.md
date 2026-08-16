# AyeLabs strategy (DLMM fee-farming)

AyeLabs is a **Meteora DLMM liquidity-provision lab**, not a spot memecoin trader. GMGN V/L radar finds trending Solana tokens; the desk opens simulated LP positions in matched pools and models P&L from **swap fees minus impermanent loss minus chain costs**.

**Real execution is not wired.** Enabling the real gate stores caps and a paper leader only. Cron returns `live_opens_not_wired_v1_paper_only`. Do not treat an enabled gate as live SOL at risk.

## Why the old desk lost

1. **1-hour max hold** vs **~1.5% round-trip costs** vs **~0.04–0.3% fee yield** after the 0.22 paper fee haircut.
2. **No pre-open expected-value gate** (the real LP desk already had one).
3. **Stop-loss on raw price drift**, take-profit on net PnL, so stops fired and targets almost never did.
4. **V/L boost + relaxed screening** chased already-pumped names.
5. **Single-sided `bid_ask` (`binsAbove: 0`)** maximized IL and sidecar swap cost.
6. **Real enable could skip graduation** (`requireGraduation: false`).

## Current paper strategy

| Knob | Value |
|---|---|
| Hold | 12 hours (`AYE_LABS_DEFAULTS.maxRunAgeHours`, `AYE_LABS_EV_HOLD_HOURS`) |
| Geometry | Two-sided spot / curve / balanced bid-ask (both sides ≥ 12 bins) |
| Concurrent | 3 positions × 1 SOL, 10 SOL virtual bank |
| Screening | Liq/TVL $5k, organic 50, fee/TVL 0.05 pp, volume $5k |
| Ranking | Fee velocity / fee-TVL, not raw V/L chase |

An 8-hour hold cannot cover calibrated round-trip costs even on 20%/day fee pools. 12h is the shortest window where a hot pool can be paper break-even after the 0.22 haircut.

## Expected-value gate

Before reserving cash, `evaluateAyeLabsOpenEv` in `api/libs/ayeLabsService.js`:

1. Project fees over 12h via `computeLpRiskRewardProfile`.
2. Apply the paper fee haircut (`getLpSimFeeCalibrationMult`, default 0.22).
3. Compare to open+close tx/slippage (`computeSimTransactionCostsSol`).
4. Skip unless calibrated expected fees ≥ round-trip cost (`AYE_LABS_MIN_FEE_TO_COST_RATIO = 1.0`).

Reason on skip: `fees_below_chain_costs`. The mirror (strategy 98) uses the same gate.

Paper uses **calibrated 1.0x** (true break-even after the haircut). The live LP desk uses **uncalibrated 2.0x** because real fills do not apply the paper haircut. Do not copy the real 2.0x onto AyeLabs paper or the desk never opens, or skip the haircut and paper PnL lies again.

## Exits

Stop-loss and take-profit both key off **net PnL %** (fees + IL), not raw price drift. After fees, a "win" with negative `simNetPnlSol` is relabeled a loss (`tp_below_cost` / `net_negative`).

## Real-money safety (still config-only)

Live opens/closes stay unwired. The enable path is a hard floor the client cannot bypass:

- Paper graduation: ≥20 decided (mirror excluded), **positive aggregate and average net SOL**, win rate ≥ 45%.
- Bandit leader must be net-positive with the same win-rate floor. No fallback to the least-bad loser.
- `POST /experiment/ayelabs-real/enable` ignores `requireGraduation: false`.
- Evolution will not spawn from underwater parents.

When a real executor is eventually wired, keep these floors and add the LP-desk uncalibrated 2x EV gate on the live path. Until then, AyeLabs is paper watch only (not an Earn Yield product).

## Files

- Config: `api/config/ayeLabsStrategies.js`
- Paper loop: `api/libs/ayeLabsService.js`
- Evolution: `api/libs/ayeLabsEvolution.js`
- Real gate: `api/libs/ayeLabsRealService.js`
- Tests: `api/libs/ayeLabsService.test.js`
