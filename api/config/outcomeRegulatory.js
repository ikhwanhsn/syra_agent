/**
 * Legal / compliance notice surfaced on outcome API responses.
 */
export const OUTCOME_REGULATORY_NOTICE = Object.freeze({
  disclaimer:
    "Outcome products manage capital under a scoped mandate and may charge performance or AUM fees. This is not financial advice. Past paper-sim results do not guarantee future performance. Consult counsel before production scale.",
  docPath: "docs/OUTCOMES_REGULATORY.md",
  killSwitchEnv: "ROBINHOOD_LP_REAL_KILL_SWITCH",
  pilotEnv: "ROBINHOOD_LP_REAL_PILOT_ENABLED",
  requiredControls: Object.freeze([
    "EV gate pass before real capital",
    "Mandate kill switch",
    "Per-tx and daily caps",
    "Dry-run default for Robinhood LP Autopilot",
    "Verifiable outcome reports",
  ]),
});
