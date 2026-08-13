/**
 * EV gate thresholds for outcome products before real-capital deployment.
 */
export const OUTCOME_EV_GATE = Object.freeze({
  lp_autopilot_solana: Object.freeze({
    productId: "lp_autopilot_solana",
    minDecided: 10,
    minWinRate: 0.55,
    minSumNetPnlSol: 0,
    maxValidationRounds: 50,
  }),
});

/** @typedef {keyof typeof OUTCOME_EV_GATE} OutcomeEvGateProductId */
