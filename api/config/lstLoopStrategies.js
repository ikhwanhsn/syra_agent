/**
 * Leveraged LST Loop strategies — leverage tiers + rebalance bands.
 */

export const LST_LOOP_STATIC_STRATEGY_COUNT = 6;
export const LST_LOOP_EVOLVABLE_MIN_ID = 6;
export const LST_LOOP_EVOLVABLE_MAX_ID = 30;
export const LST_LOOP_DAILY_SPAWN_COUNT = 2;
export const LST_LOOP_MAX_STRATEGIES = 18;

export const LST_LOOP_DEFAULTS = Object.freeze({
  startingBankSol: 10,
  maxLeverage: 3,
  targetLtv: 0.55,
  minHealthFactor: 1.35,
  maxBorrowRateApr: 0.18,
});

export const LST_LOOP_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: 'mSOL Conservative 1.5x',
    lstSymbol: 'mSOL',
    targetLeverage: 1.5,
    targetLtv: 0.4,
    minHealthFactor: 1.6,
    maxBorrowRateApr: 0.12,
    rebalanceBand: 0.05,
    notes: 'Low leverage mSOL loop',
  },
  {
    id: 1,
    name: 'mSOL Balanced 2x',
    lstSymbol: 'mSOL',
    targetLeverage: 2.0,
    targetLtv: 0.5,
    minHealthFactor: 1.4,
    maxBorrowRateApr: 0.14,
    rebalanceBand: 0.06,
    notes: 'Mid leverage mSOL',
  },
  {
    id: 2,
    name: 'JitoSOL Conservative 1.5x',
    lstSymbol: 'JitoSOL',
    targetLeverage: 1.5,
    targetLtv: 0.4,
    minHealthFactor: 1.6,
    maxBorrowRateApr: 0.12,
    rebalanceBand: 0.05,
    notes: 'Low leverage JitoSOL',
  },
  {
    id: 3,
    name: 'JitoSOL Balanced 2x',
    lstSymbol: 'JitoSOL',
    targetLeverage: 2.0,
    targetLtv: 0.5,
    minHealthFactor: 1.4,
    maxBorrowRateApr: 0.15,
    rebalanceBand: 0.06,
    notes: 'Mid leverage JitoSOL',
  },
  {
    id: 4,
    name: 'mSOL Aggressive 2.5x',
    lstSymbol: 'mSOL',
    targetLeverage: 2.5,
    targetLtv: 0.58,
    minHealthFactor: 1.3,
    maxBorrowRateApr: 0.16,
    rebalanceBand: 0.04,
    notes: 'Higher leverage — tighter bands',
  },
  {
    id: 5,
    name: 'Best-APY Router 2x',
    lstSymbol: 'auto',
    targetLeverage: 2.0,
    targetLtv: 0.5,
    minHealthFactor: 1.4,
    maxBorrowRateApr: 0.14,
    rebalanceBand: 0.05,
    notes: 'Pick mSOL vs JitoSOL by net APY',
  },
]);
