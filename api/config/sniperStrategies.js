/**
 * New-Pair Alpha Sniper strategies — score thresholds + exit rules.
 */

export const SNIPER_STATIC_STRATEGY_COUNT = 6;
export const SNIPER_EVOLVABLE_MIN_ID = 6;
export const SNIPER_EVOLVABLE_MAX_ID = 30;
export const SNIPER_DAILY_SPAWN_COUNT = 2;
export const SNIPER_MAX_STRATEGIES = 18;

export const SNIPER_DEFAULTS = Object.freeze({
  startingBankSol: 5,
  maxConcurrentPositions: 5,
  maxPositionSol: 0.5,
  minTradeSol: 0.05,
  defaultMaxHoldMinutes: 90,
});

export const SNIPER_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: 'Safe Alpha 80+',
    minAlphaScore: 80,
    requireRugcheckPass: true,
    maxMcapUsd: 2_000_000,
    minLiqUsd: 40_000,
    maxHoldMinutes: 120,
    exit: { stopLossPct: -12, takeProfitPct: 25, trailingTriggerPct: 12, trailingGivebackPct: 6 },
    notes: 'High score only',
  },
  {
    id: 1,
    name: 'Balanced Sniper 70+',
    minAlphaScore: 70,
    requireRugcheckPass: true,
    maxMcapUsd: 3_000_000,
    minLiqUsd: 25_000,
    maxHoldMinutes: 90,
    exit: { stopLossPct: -15, takeProfitPct: 35, trailingTriggerPct: 15, trailingGivebackPct: 7 },
    notes: 'Default sniper',
  },
  {
    id: 2,
    name: 'Fast Scalp 75+',
    minAlphaScore: 75,
    requireRugcheckPass: true,
    maxMcapUsd: 1_500_000,
    minLiqUsd: 30_000,
    maxHoldMinutes: 45,
    exit: { stopLossPct: -10, takeProfitPct: 18, trailingTriggerPct: 8, trailingGivebackPct: 4 },
    notes: 'Quick in/out',
  },
  {
    id: 3,
    name: 'Graduated Only 72+',
    minAlphaScore: 72,
    requireRugcheckPass: true,
    requireGraduated: true,
    maxMcapUsd: 5_000_000,
    minLiqUsd: 50_000,
    maxHoldMinutes: 180,
    exit: { stopLossPct: -14, takeProfitPct: 40, trailingTriggerPct: 18, trailingGivebackPct: 8 },
    notes: 'Only graduated pumps',
  },
  {
    id: 4,
    name: 'Smart Money Echo 78+',
    minAlphaScore: 78,
    requireRugcheckPass: true,
    requireSmartMoney: true,
    maxMcapUsd: 2_500_000,
    minLiqUsd: 35_000,
    maxHoldMinutes: 100,
    exit: { stopLossPct: -12, takeProfitPct: 30, trailingTriggerPct: 14, trailingGivebackPct: 6 },
    notes: 'Prefer smart-money present',
  },
  {
    id: 5,
    name: 'Wide Net 65+',
    minAlphaScore: 65,
    requireRugcheckPass: true,
    maxMcapUsd: 4_000_000,
    minLiqUsd: 20_000,
    maxHoldMinutes: 60,
    exit: { stopLossPct: -18, takeProfitPct: 45, trailingTriggerPct: 20, trailingGivebackPct: 10 },
    notes: 'Higher variance',
  },
]);
