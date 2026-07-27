/**
 * EV gate thresholds for outcome products before real-capital deployment.
 * Robinhood LP Autopilot must pass sim validation before pilot execution unlocks.
 */
export const OUTCOME_EV_GATE = Object.freeze({
  robinhood_lp_autopilot: Object.freeze({
    productId: "robinhood_lp_autopilot",
    minDecided: 8,
    minWinRate: 0.52,
    minSumNetPnlUsd: 0,
    maxValidationRounds: 40,
    hoursAdvancePerRound: 40,
  }),
  lp_autopilot_solana: Object.freeze({
    productId: "lp_autopilot_solana",
    minDecided: 10,
    minWinRate: 0.55,
    minSumNetPnlSol: 0,
    maxValidationRounds: 50,
  }),
});

/** @typedef {keyof typeof OUTCOME_EV_GATE} OutcomeEvGateProductId */
