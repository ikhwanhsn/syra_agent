/**
 * Multi-product Earn Yield registry.
 * Each product maps to an adapter that implements the common Earn Yield interface.
 * Status in registry is the *declared* default; the board may auto-graduate
 * `coming_soon` → `beta` when adapter readiness.ready === true.
 */

/** @typedef {'SOL' | 'USDC'} EarnDenom */
/** @typedef {'lp' | 'btcQuant' | 'btc3' | 'momentumRotator' | 'lstLoop' | 'alphaSniper'} EarnAdapterKey */
/** @typedef {'beta' | 'coming_soon' | 'lab'} EarnProductStatus */

/**
 * @typedef {object} EarnProductDef
 * @property {string} id
 * @property {string} label
 * @property {EarnProductStatus} status
 * @property {string} chain
 * @property {string} description
 * @property {EarnAdapterKey} adapterKey
 * @property {EarnDenom} denom
 * @property {string} walletPurpose - agent wallet purpose for deposits
 * @property {string} walletQuery - /wallet?wallet=…
 * @property {number} minDeposit
 * @property {number} maxDeposit
 * @property {number} performanceFeeBps
 * @property {number} maxErrorRate
 * @property {number} killErrorRate
 * @property {number} minSettleSuccessRate
 * @property {number} minSample
 * @property {Record<string, unknown>} [evidence]
 * @property {string[]} [disclosures]
 */

export const EARN_PRODUCT_LP = "lp_meteora_dlmm";
export const EARN_PRODUCT_CBBTC = "cbbtc_onchain_signal";
export const EARN_PRODUCT_BTC3 = "btc3_macro";
export const EARN_PRODUCT_MOMENTUM = "momentum_rotator";
export const EARN_PRODUCT_LST_LOOP = "lst_loop";
export const EARN_PRODUCT_SNIPER = "alpha_sniper";

/** @type {EarnProductDef[]} */
export const EARN_PRODUCTS = [
  {
    id: EARN_PRODUCT_LP,
    label: "LP Auto (Meteora DLMM)",
    status: "beta",
    chain: "solana",
    description:
      "Automated Meteora DLMM liquidity — earn trading fees from your LP agent wallet. Non-custodial; you fund the agent, Syra runs the strategy.",
    adapterKey: "lp",
    denom: "SOL",
    walletPurpose: "lp",
    walletQuery: "lp",
    minDeposit: 1,
    maxDeposit: 5,
    performanceFeeBps: 1000,
    maxErrorRate: 0.05,
    killErrorRate: 0.1,
    minSettleSuccessRate: 0.95,
    minSample: 10,
    evidence: {
      realWinRateHint: "~90% on resolved real positions (historical lab)",
      paperSample: "27k+ paper positions",
    },
    disclosures: [
      "Non-custodial: you deposit SOL into your LP agent wallet. Syra does not take custody of your principal.",
      "Past lab performance is not a guarantee of future returns. You can lose capital from IL, fees, and bad exits.",
      "Strategy opens may pause when no qualified sim leader exists; open positions are still managed.",
      "Beta is capped (1–5 SOL). Kill switch auto-pauses new deposits if error rate or PnL guardrails trip.",
    ],
  },
  {
    id: EARN_PRODUCT_CBBTC,
    label: "cbBTC Onchain Signal",
    status: "coming_soon",
    chain: "solana",
    description:
      "BTC onchain signal agent — mirrors paper BUY signals into real USDC↔cbBTC Jupiter swaps on your invest wallet. Graduates to beta after lab track record passes readiness guards.",
    adapterKey: "btcQuant",
    denom: "USDC",
    walletPurpose: "invest",
    walletQuery: "invest",
    minDeposit: 25,
    maxDeposit: 200,
    performanceFeeBps: 1000,
    maxErrorRate: 0.05,
    killErrorRate: 0.1,
    minSettleSuccessRate: 0.95,
    minSample: 10,
    evidence: {
      paperWinRateHint: "~76%",
      paperNetUsd: 441,
      sample: 51,
    },
    disclosures: [
      "Non-custodial: you deposit USDC into your invest agent wallet. Syra does not take custody of your principal.",
      "Spot-long cbBTC only — you can lose capital from adverse moves, slippage, and failed exits.",
      "Product stays coming-soon until real lab PnL is net-positive with error rate under guardrails.",
      "Beta deposit caps apply (25–200 USDC). Kill switch auto-pauses new deposits on guardrail breach.",
    ],
  },
  {
    id: EARN_PRODUCT_BTC3,
    label: "BTC3 Macro Allocation",
    status: "coming_soon",
    chain: "solana",
    description:
      "Macro-driven USDC↔cbBTC allocation on your invest wallet. Equity/drawdown based — graduates to beta after lab track record passes readiness guards.",
    adapterKey: "btc3",
    denom: "USDC",
    walletPurpose: "invest",
    walletQuery: "invest",
    minDeposit: 50,
    maxDeposit: 500,
    performanceFeeBps: 1000,
    maxErrorRate: 0.05,
    killErrorRate: 0.1,
    minSettleSuccessRate: 0.95,
    minSample: 10,
    evidence: {
      style: "allocation / rebalance",
      metric: "equity + drawdown (not win rate)",
    },
    disclosures: [
      "Non-custodial: you deposit USDC into your invest agent wallet. Syra does not take custody of your principal.",
      "Macro rebalancing can underperform buy-and-hold; drawdowns and failed swaps are possible.",
      "Readiness uses net equity vs baseline and rebalance error rate (no classic win rate).",
      "Beta deposit caps apply (50–500 USDC). Kill switch auto-pauses new deposits on guardrail breach.",
    ],
  },
  {
    id: EARN_PRODUCT_MOMENTUM,
    label: "Momentum Rotator",
    status: "coming_soon",
    chain: "solana",
    description:
      "Trend-following rotator across liquid Solana majors (SOL, cbBTC, JLP, blue-chips) via Jupiter swaps on your invest wallet. Paper lab first; graduates to beta after positive expectancy.",
    adapterKey: "momentumRotator",
    denom: "USDC",
    walletPurpose: "invest",
    walletQuery: "invest",
    minDeposit: 25,
    maxDeposit: 250,
    performanceFeeBps: 1000,
    maxErrorRate: 0.05,
    killErrorRate: 0.1,
    minSettleSuccessRate: 0.95,
    minSample: 10,
    evidence: {
      style: "directional spot momentum",
      rails: "Jupiter + walletBroker",
    },
    disclosures: [
      "Non-custodial: you deposit USDC into your invest agent wallet.",
      "Directional spot trading can lose capital from adverse moves, slippage, and failed exits.",
      "Past paper performance is not a guarantee of future returns.",
      "Beta deposit caps apply (25–250 USDC). Kill switch auto-pauses new deposits on guardrail breach.",
    ],
  },
  {
    id: EARN_PRODUCT_LST_LOOP,
    label: "Leveraged LST Loop",
    status: "coming_soon",
    chain: "solana",
    description:
      "Loop SOL → mSOL/JitoSOL → Rise borrow → restake to amplify LST staking yield. Auto-manages LTV and deleverages on rate spikes. Graduates after paper loop PnL proves out.",
    adapterKey: "lstLoop",
    denom: "SOL",
    walletPurpose: "invest",
    walletQuery: "invest",
    minDeposit: 1,
    maxDeposit: 10,
    performanceFeeBps: 1000,
    maxErrorRate: 0.05,
    killErrorRate: 0.1,
    minSettleSuccessRate: 0.95,
    minSample: 10,
    evidence: {
      style: "leveraged LST yield",
      rails: "Marinade/Jito + Rise + walletBroker",
    },
    disclosures: [
      "Non-custodial: you deposit SOL into your invest agent wallet.",
      "Leverage amplifies losses. Liquidation / health-factor breaches can realize losses.",
      "Borrow rates and LST APYs change; loops can go negative when borrow > staking yield.",
      "Beta deposit caps apply (1–10 SOL). Kill switch auto-pauses new deposits on guardrail breach.",
    ],
  },
  {
    id: EARN_PRODUCT_SNIPER,
    label: "New-Pair Alpha Sniper",
    status: "coming_soon",
    chain: "solana",
    description:
      "RugCheck-gated sniper for high-quality new pump.fun / graduated pairs. Entries via pump.fun swap, exits via Jupiter. Highest variance — paper lab mandatory before beta.",
    adapterKey: "alphaSniper",
    denom: "SOL",
    walletPurpose: "lp",
    walletQuery: "lp",
    minDeposit: 0.5,
    maxDeposit: 3,
    performanceFeeBps: 1500,
    maxErrorRate: 0.08,
    killErrorRate: 0.15,
    minSettleSuccessRate: 0.95,
    minSample: 15,
    evidence: {
      style: "new-pair alpha",
      rails: "pump.fun + Jupiter + RugCheck",
    },
    disclosures: [
      "Non-custodial: you deposit SOL into your LP agent wallet.",
      "Memecoin / new-pair trading is extremely risky. You can lose most or all capital.",
      "RugCheck gates reduce but do not eliminate rug / honeypot risk.",
      "Beta deposit caps apply (0.5–3 SOL). Kill switch auto-pauses new deposits on guardrail breach.",
    ],
  },
];

/** @type {Map<string, EarnProductDef>} */
const BY_ID = new Map(EARN_PRODUCTS.map((p) => [p.id, p]));

/**
 * @param {string} productId
 * @returns {EarnProductDef | null}
 */
export function getEarnProduct(productId) {
  return BY_ID.get(String(productId || "").trim()) || null;
}

/**
 * @returns {EarnProductDef[]}
 */
export function listEarnProducts() {
  return EARN_PRODUCTS.slice();
}

/**
 * Shared beta gate (allowlist / open flag) — same env as LP beta.
 */
export function isEarnYieldBetaOpen() {
  const raw = String(process.env.EARN_YIELD_BETA_OPEN ?? "true").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(raw);
}

/**
 * @returns {Set<string>}
 */
export function getEarnYieldBetaAllowlist() {
  const raw = String(process.env.EARN_YIELD_BETA_ALLOWLIST || "").trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * @param {string|null|undefined} walletOrAgent
 * @param {{ isAdmin?: boolean }} [opts]
 */
export function isEarnYieldBetaAllowed(walletOrAgent, opts = {}) {
  if (opts.isAdmin) return true;
  if (!isEarnYieldBetaOpen()) return false;
  const allow = getEarnYieldBetaAllowlist();
  if (allow.size === 0) return true;
  const key = String(walletOrAgent || "").trim();
  if (!key) return false;
  return allow.has(key);
}

/**
 * Resolve public status: auto-graduate coming_soon → beta when ready.
 * @param {EarnProductDef} product
 * @param {{ ready?: boolean }} readiness
 * @returns {EarnProductStatus}
 */
export function resolvePublicProductStatus(product, readiness = {}) {
  if (product.status === "beta") return "beta";
  if (product.status === "coming_soon" && readiness.ready) return "beta";
  return product.status;
}
