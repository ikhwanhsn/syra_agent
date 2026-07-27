/**
 * Completed-work outcome products: jobs Syra performs for agents (not copilot primitives).
 * Each product maps to a managed runtime handler and mandate schema.
 */

/** @typedef {'pilot' | 'beta' | 'live'} OutcomeProductStatus */

/**
 * @typedef {Object} OutcomeProductDef
 * @property {string} id
 * @property {string} label
 * @property {string} tagline
 * @property {string} description
 * @property {OutcomeProductStatus} status
 * @property {string} pillar
 * @property {string[]} allowedChains
 * @property {string[]} mandateToolIds
 * @property {boolean} requiresEvGate
 * @property {string | null} evGateProductId
 * @property {string} runtimeHandler
 */

/** @type {Record<string, OutcomeProductDef>} */
export const OUTCOME_PRODUCTS = Object.freeze({
  robinhood_lp_autopilot: Object.freeze({
    id: "robinhood_lp_autopilot",
    label: "LP Autopilot (Robinhood Chain)",
    tagline: "Your liquidity is managed for you",
    description:
      "Autonomous Uniswap concentrated-liquidity management on Robinhood Chain: deploy, keep in range, collect fees, rebalance.",
    status: "pilot",
    pillar: "invest",
    allowedChains: ["robinhood"],
    mandateToolIds: ["outcome_lp_open", "outcome_lp_close", "outcome_lp_rebalance"],
    requiresEvGate: true,
    evGateProductId: "robinhood_lp_autopilot",
    runtimeHandler: "robinhoodLpAutopilot",
  }),
  lp_autopilot_solana: Object.freeze({
    id: "lp_autopilot_solana",
    label: "LP Autopilot (Solana Meteora)",
    tagline: "Your DLMM liquidity is managed for you",
    description:
      "Autonomous Meteora DLMM LP management on Solana: deploy capital, manage positions, collect fees, rebalance.",
    status: "beta",
    pillar: "invest",
    allowedChains: ["solana"],
    mandateToolIds: ["lp_real_open", "lp_real_close", "lp_real_claim", "lp_real_swap"],
    requiresEvGate: true,
    evGateProductId: "lp_autopilot_solana",
    runtimeHandler: "solanaLpAutopilot",
  }),
  treasury_autopilot: Object.freeze({
    id: "treasury_autopilot",
    label: "Treasury Autopilot",
    tagline: "Your agent treasury is managed",
    description:
      "Idle stables earn yield, exposure is de-risked per policy, treasury is rebalanced automatically.",
    status: "pilot",
    pillar: "treasury",
    allowedChains: ["solana", "base"],
    mandateToolIds: ["outcome_treasury_rebalance", "outcome_treasury_deploy"],
    requiresEvGate: false,
    evGateProductId: null,
    runtimeHandler: "treasuryAutopilot",
  }),
  yield_autopilot: Object.freeze({
    id: "yield_autopilot",
    label: "Yield Autopilot",
    tagline: "Your idle capital earns optimal yield",
    description:
      "Capital is routed across Marinade, Jito, Giza, and other venues automatically based on mandate policy.",
    status: "pilot",
    pillar: "grow",
    allowedChains: ["solana"],
    mandateToolIds: ["outcome_yield_deposit", "outcome_yield_withdraw", "giza-activate", "giza-withdraw"],
    requiresEvGate: false,
    evGateProductId: null,
    runtimeHandler: "yieldAutopilot",
  }),
});

export const OUTCOME_PRODUCT_ORDER = Object.freeze([
  "robinhood_lp_autopilot",
  "lp_autopilot_solana",
  "treasury_autopilot",
  "yield_autopilot",
]);

/**
 * @param {string} productId
 * @returns {OutcomeProductDef | null}
 */
export function getOutcomeProduct(productId) {
  return OUTCOME_PRODUCTS[String(productId || "").trim()] ?? null;
}

/**
 * @returns {OutcomeProductDef[]}
 */
export function listOutcomeProducts() {
  return OUTCOME_PRODUCT_ORDER.map((id) => OUTCOME_PRODUCTS[id]).filter(Boolean);
}
