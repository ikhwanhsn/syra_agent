# Earn product #2 evaluation — cbBTC Onchain Signal

Status: **coming_soon** until adapter readiness passes, then auto-graduates to **beta** on the Earn board.

## Evidence

| Source | Metric | Value |
|--------|--------|-------|
| Paper (`tradingexperimentruns`, suite `btc_onchain`) | Win rate / net | ~76% / ~+$441 on ~51 trades |
| Real (`btc_quant_real_positions`, lane btc1) | Live track record | Accrues when `BTC_QUANT_REAL_CRON_ENABLED` + lab config enabled |

## Wiring (shipped)

- Product id: `cbbtc_onchain_signal`
- Adapter: `api/libs/earnAdapters/btcQuantEarnAdapter.js`
- Real service: `api/libs/btcQuantRealService.js` (Jupiter USDC↔cbBTC)
- Wallet: invest purpose (`/wallet?wallet=invest`)
- Denom: USDC (caps 25–200)

## Gate to public enable

Same as [EARN_YIELD_GRADUATION.md](./EARN_YIELD_GRADUATION.md):

1. Lab agent enabled at small capital (`activate-earn-lab-agents.js`)
2. `getReadiness().ready` — net-positive real PnL, error ≤5%, settlement ≥95%, ≥10 decided samples
3. Board sets `actionable: true` only then

## Ops

```bash
node api/scripts/activate-earn-lab-agents.js --dry-run --anonymous-id=<aid>
node api/scripts/validate-earn-yield-launch.js --product=cbbtc_onchain_signal
```

Env: `BTC_QUANT_REAL_CRON_ENABLED=true`

## Do not list until

- Real sample ≥10 decided trades with net-positive PnL
- Max drawdown / error rate within guards
- Settlement healthy on Solana

See registry: `api/config/earnProducts.js`.

## Profitability hardening (2026-07)

Real-agent PnL leaks fixed in code:

1. **BTC Quant** — refresh live leader each signal; pin live leaders from cull; score decided PnL only; no negative fallback; paper debits ~110 bps round-trip; real honors evolution notional multiplier + cooldowns.
2. **BTC3** — learning gates (`minConfidence`, `maxBtcTiltPct`, learned `minRebalancePct`) apply to real; paper min rebalance 5% + fee debit; optimizer clamps LLM return scale.
3. **LP** — softFallback (negative) no longer opens; safeFallback opens at ≤50% size.
4. **Stocks paper** — round-trip cost debit + tighter elite parent bar (still paper-only).

Lab activation remains required before Earn graduation — see [EARN_YIELD_GRADUATION.md](./EARN_YIELD_GRADUATION.md).
