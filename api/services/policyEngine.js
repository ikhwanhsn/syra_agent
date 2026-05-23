/**
 * Deterministic policy engine for the wallet broker.
 *
 * Pure functions, no side effects, no I/O. Easy to unit test.
 *
 * Inputs:
 *   - intent: what the agent wants to do (pay x402, sign tx, withdraw, sign message)
 *   - walletConfig: per-wallet caps + allowlists from MongoDB
 *   - history: recent sign events used for velocity / anomaly checks
 *
 * Output: { outcome: 'allow' | 'require_confirm' | 'deny', reasons, riskScore }
 *
 * Risk score is additive (each rule contributes a weighted delta); >= 70 forces deny, >= 30 forces
 * require_confirm. Rule order matters: earlier rules can short-circuit with a hard deny.
 */

/**
 * @typedef {'x402_pay' | 'tx_sign' | 'withdraw' | 'message_sign'} IntentType
 *
 * @typedef {Object} Intent
 * @property {IntentType} type
 * @property {'solana'|'base'|'tempo'} chain
 * @property {string=} toolId
 * @property {number=} estimatedUsd
 * @property {string=} toAddress
 * @property {string=} programId   - Solana program touched
 * @property {string=} contract    - EVM contract touched
 * @property {boolean=} guest
 *
 * @typedef {Object} WalletConfig
 * @property {string} anonymousId
 * @property {'active'|'frozen'|'migrating'|'retired'} status
 * @property {number} dailySpendCapUsd
 * @property {number} perTxCapUsd
 * @property {number=} hourlySpendCapUsd
 * @property {string[]=} allowedTools
 * @property {string[]=} destinationAllowlist
 * @property {string[]=} destinationDenylist
 * @property {string=} linkedUserWallet
 *
 * @typedef {Object} HistoryRow
 * @property {Date|string} ts
 * @property {string} action
 * @property {number=} amountUsd
 * @property {string=} status
 *
 * @typedef {Object} Decision
 * @property {'allow'|'require_confirm'|'deny'} outcome
 * @property {string[]} reasons
 * @property {number} riskScore
 */

/** LP Real Agent tool ids — must appear in AgentWallet.allowedTools (set on enable). */
export const LP_REAL_TOOL_IDS = Object.freeze([
  'lp_real_open',
  'lp_real_close',
  'lp_real_claim',
]);

const KNOWN_PROGRAMS_SOLANA = new Set([
  // Meteora DLMM (LB CLMM)
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  // Jupiter v6 aggregator
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  // pump.fun bonding curve program
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  // SPL token program
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  // Token-2022
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  // System program
  '11111111111111111111111111111111',
  // Associated token program
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  // Memo program
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
]);

const RULE_WEIGHTS = {
  status_not_active: 100,
  guest_signing: 100,
  tool_not_allowed: 100,
  destination_denylisted: 100,
  destination_not_allowlisted: 50,
  over_per_tx_cap: 40,
  over_daily_cap: 40,
  over_hourly_cap: 30,
  velocity_high: 35,
  anomaly_spike: 30,
  unknown_program: 25,
  unknown_contract: 25,
  large_amount: 20,
  no_estimated_amount: 5,
};

const DEFAULT_PER_TX_CAP = 50;
const DEFAULT_DAILY_CAP = 250;
const DEFAULT_HOURLY_CAP = 100;
const VELOCITY_WINDOW_MS = 60_000;
const VELOCITY_MAX = 10;
const ANOMALY_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const ANOMALY_SPIKE_MULT = 3;

/** LP real cron tools — skip volume-based soft rules; hard caps and simulation still apply. */
const LP_REAL_AUTO_TOOLS = new Set([
  'lp_real_open',
  'lp_real_close',
  'lp_real_claim',
  'lp_real_swap',
]);

/**
 * Evaluate an intent against a wallet configuration and recent history.
 * Pure function — deterministic given inputs.
 *
 * @param {Intent} intent
 * @param {WalletConfig} walletConfig
 * @param {HistoryRow[]} history
 * @returns {Decision}
 */
export function evaluate(intent, walletConfig, history) {
  const reasons = [];
  let riskScore = 0;
  const add = (key, extra) => {
    riskScore += RULE_WEIGHTS[key] || 0;
    reasons.push(extra ? `${key}:${extra}` : key);
  };

  // Hard rules — short-circuit deny ----------------------------------------
  if (!walletConfig) {
    return { outcome: 'deny', reasons: ['wallet_config_missing'], riskScore: 100 };
  }
  if (walletConfig.status !== 'active') {
    add('status_not_active', walletConfig.status);
    return { outcome: 'deny', reasons, riskScore };
  }
  if (intent.guest && intent.type !== 'message_sign') {
    add('guest_signing');
    return { outcome: 'deny', reasons, riskScore };
  }
  const allowed = walletConfig.allowedTools;
  if (intent.toolId && Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(intent.toolId)) {
    add('tool_not_allowed', intent.toolId);
    return { outcome: 'deny', reasons, riskScore };
  }
  if (intent.toAddress && Array.isArray(walletConfig.destinationDenylist) && walletConfig.destinationDenylist.includes(intent.toAddress)) {
    add('destination_denylisted', intent.toAddress);
    return { outcome: 'deny', reasons, riskScore };
  }

  // Velocity (too many signs in a short window) ----------------------------
  const now = Date.now();
  const recent = (history || []).filter((h) => {
    const t = h.ts instanceof Date ? h.ts.getTime() : new Date(h.ts).getTime();
    return Number.isFinite(t) && now - t <= VELOCITY_WINDOW_MS && h.status !== 'rejected';
  });
  if (recent.length >= VELOCITY_MAX) {
    add('velocity_high', String(recent.length));
    return { outcome: 'deny', reasons, riskScore };
  }

  // Soft rules — accumulate risk and decide --------------------------------
  const amount = Number.isFinite(intent.estimatedUsd) ? Number(intent.estimatedUsd) : 0;
  if (intent.type !== 'message_sign' && amount <= 0 && intent.type === 'withdraw') {
    add('no_estimated_amount');
  }

  const perTxCap = numOr(walletConfig.perTxCapUsd, DEFAULT_PER_TX_CAP);
  const dailyCap = numOr(walletConfig.dailySpendCapUsd, DEFAULT_DAILY_CAP);
  const hourlyCap = numOr(walletConfig.hourlySpendCapUsd, DEFAULT_HOURLY_CAP);

  if (amount > perTxCap) add('over_per_tx_cap', `${amount.toFixed(2)}>${perTxCap}`);

  const sumLast24h = sumAmount(history, now - ANOMALY_LOOKBACK_MS);
  const sumLast1h = sumAmount(history, now - 60 * 60 * 1000);
  if (sumLast24h + amount > dailyCap) add('over_daily_cap', `${(sumLast24h + amount).toFixed(2)}>${dailyCap}`);
  if (sumLast1h + amount > hourlyCap) add('over_hourly_cap', `${(sumLast1h + amount).toFixed(2)}>${hourlyCap}`);

  const isLpAuto = intent.toolId && LP_REAL_AUTO_TOOLS.has(intent.toolId);

  // Anomaly: spend > N x last-30-day median (rough proxy: average over lookback) within last 1h
  const median = approxMedianAmount(history);
  if (!isLpAuto) {
    if (median > 0 && sumLast1h + amount > median * ANOMALY_SPIKE_MULT) {
      add('anomaly_spike', `${(sumLast1h + amount).toFixed(2)}>${(median * ANOMALY_SPIKE_MULT).toFixed(2)}`);
    }
    if (amount > 100) add('large_amount', amount.toFixed(2));
  }

  // Destination allowlist — strict for withdrawals; advisory elsewhere
  if (intent.type === 'withdraw' && intent.toAddress) {
    const allowList = Array.isArray(walletConfig.destinationAllowlist) ? walletConfig.destinationAllowlist : [];
    const isLinked = walletConfig.linkedUserWallet && walletConfig.linkedUserWallet === intent.toAddress;
    if (!isLinked && !allowList.includes(intent.toAddress)) {
      add('destination_not_allowlisted', intent.toAddress);
      // Withdrawing to an unknown address is a hard deny; user must add to allowlist or it must match linked wallet.
      return { outcome: 'deny', reasons, riskScore };
    }
  }

  // Program / contract awareness (advisory)
  if (intent.chain === 'solana' && intent.programId && !KNOWN_PROGRAMS_SOLANA.has(intent.programId)) {
    add('unknown_program', intent.programId);
  }
  if (intent.chain === 'base' && intent.contract) {
    // We don't ship a static allowlist here; any contract that isn't on a per-wallet allowlist is unknown.
    const allowList = Array.isArray(walletConfig.destinationAllowlist) ? walletConfig.destinationAllowlist : [];
    if (!allowList.includes(intent.contract)) add('unknown_contract', intent.contract);
  }

  if (riskScore >= 70) return { outcome: 'deny', reasons, riskScore };
  if (riskScore >= 30) return { outcome: 'require_confirm', reasons, riskScore };
  return { outcome: 'allow', reasons, riskScore };
}

function numOr(v, fallback) {
  return Number.isFinite(v) && v > 0 ? Number(v) : fallback;
}

function sumAmount(history, sinceMs) {
  if (!Array.isArray(history)) return 0;
  let s = 0;
  for (const h of history) {
    const t = h.ts instanceof Date ? h.ts.getTime() : new Date(h.ts).getTime();
    if (!Number.isFinite(t) || t < sinceMs) continue;
    if (h.status === 'rejected') continue;
    if (Number.isFinite(h.amountUsd)) s += Number(h.amountUsd);
  }
  return s;
}

function approxMedianAmount(history) {
  if (!Array.isArray(history) || history.length === 0) return 0;
  const xs = history
    .filter((h) => h.status !== 'rejected' && Number.isFinite(h.amountUsd))
    .map((h) => Number(h.amountUsd))
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
  if (xs.length === 0) return 0;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
}

export { RULE_WEIGHTS, KNOWN_PROGRAMS_SOLANA };
