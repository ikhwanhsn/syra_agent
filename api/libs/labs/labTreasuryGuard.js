/**
 * Labs treasury circuit breaker — assess richest funder (PayTo or payer) + deposit-hub
 * capacity before scheduler ticks so an empty PayTo never pauses while another wallet
 * can still top up, and empty treasury never spams per-payer (funding) errors.
 */
import LabX402Settings, {
  normalizeLabChain,
  settingsKeyForChain,
} from '../../models/labs/LabX402Settings.js';
import { getMinLabX402PriceUsd } from './labX402Endpoints.js';
import {
  getActiveDepositWalletDoc,
  getActivePayToAlgorandAccount,
  getActivePayToEvmAccount,
  getActivePayToKeypair,
  getLabWalletBalances,
  isAlgorandAddressOptedInUsdc,
} from './labWalletService.js';
import {
  loadFunderCandidates,
  pickRichestFunder,
} from './labFunderSelector.js';
import {
  getAlgorandAccountSpendableMicro,
  MICRO_ALGO,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
} from './labAlgorandFeeBuffer.js';

/** Slow re-check when treasury is paused (15 min). */
export const TREASURY_PAUSE_RECHECK_MS = 15 * 60_000;

/** Throttle aggregated (treasury) call-log alerts (once per 30 min). */
export const TREASURY_ALERT_THROTTLE_MS = 30 * 60_000;

/** Min native gas reserve for Solana PayTo refunds (SOL). */
const PAYTO_MIN_SOL = 0.003;
/** Min native gas for Base PayTo (ETH). */
const PAYTO_MIN_ETH = 0.00005;
/** Min native gas for X Layer PayTo (OKB). */
const PAYTO_MIN_OKB = 0.00005;

const ALGOD_TIMEOUT_MS = 12_000;

/**
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 * @template T
 */
function withTimeout(promise, ms, label = 'timeout') {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return promise;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), n);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Pure: decide whether PayTo can fund at least one call, and how many.
 *
 * @param {{
 *   payToUsdc: number;
 *   payToSpendableNative: number;
 *   minNativeForFee: number;
 *   hubUsdc: number;
 *   hubNative: number;
 *   minPriceUsd: number;
 *   payerCount: number;
 *   payToOptedIn?: boolean | null;
 *   chain?: string;
 * }} input
 * @returns {{
 *   canFundAny: boolean;
 *   fundableCalls: number;
 *   hubHasFunds: boolean;
 *   shortfallUsdc: number;
 *   shortfallNative: number;
 *   reason: string | null;
 *   recommendedTopUpUsdc: number;
 *   recommendedTopUpNative: number;
 * }}
 */
export function evaluateTreasuryCapacity(input = {}) {
  const payToUsdc = Number(input.payToUsdc);
  const payToSpendableNative = Number(input.payToSpendableNative);
  const minNativeForFee = Number(input.minNativeForFee);
  const hubUsdc = Number(input.hubUsdc);
  const hubNative = Number(input.hubNative);
  const minPriceUsd = Number(input.minPriceUsd);
  const payerCount = Math.max(0, Math.floor(Number(input.payerCount) || 0));
  const chain = String(input.chain || '').toLowerCase();
  const payToOptedIn = input.payToOptedIn;

  const usdcOk = Number.isFinite(payToUsdc) ? Math.max(0, payToUsdc) : 0;
  const nativeOk = Number.isFinite(payToSpendableNative) ? Math.max(0, payToSpendableNative) : 0;
  const feeFloor = Number.isFinite(minNativeForFee) && minNativeForFee > 0 ? minNativeForFee : 0;
  const minPrice = Number.isFinite(minPriceUsd) && minPriceUsd > 0 ? minPriceUsd : 0.01;
  const hubU = Number.isFinite(hubUsdc) ? Math.max(0, hubUsdc) : 0;
  const hubN = Number.isFinite(hubNative) ? Math.max(0, hubNative) : 0;

  // Hub has usable funds if it holds at least one call's USDC, or meaningful native for Algorand opt-in.
  const hubHasFunds =
    hubU >= minPrice || (chain === 'algorand' ? hubN >= 0.3 : hubN > feeFloor);

  if (chain === 'algorand' && payToOptedIn === false) {
    return {
      canFundAny: false,
      fundableCalls: 0,
      hubHasFunds,
      shortfallUsdc: Math.max(0, minPrice - usdcOk),
      shortfallNative: Math.max(0, feeFloor - nativeOk),
      reason: 'payto_not_opted_in_usdc',
      recommendedTopUpUsdc: Math.max(minPrice * Math.max(payerCount, 1), 1),
      recommendedTopUpNative: Math.max(feeFloor * 2, 0.05),
    };
  }

  if (nativeOk < feeFloor) {
    return {
      canFundAny: false,
      fundableCalls: 0,
      hubHasFunds,
      shortfallUsdc: Math.max(0, minPrice - usdcOk),
      shortfallNative: Math.max(0, feeFloor - nativeOk),
      reason: 'payto_native_underfunded',
      recommendedTopUpUsdc: Math.max(minPrice * Math.max(payerCount, 1), 1),
      recommendedTopUpNative: Math.max(feeFloor - nativeOk + feeFloor, feeFloor * 2),
    };
  }

  if (usdcOk < minPrice) {
    return {
      canFundAny: false,
      fundableCalls: 0,
      hubHasFunds,
      shortfallUsdc: Math.max(0, minPrice - usdcOk),
      shortfallNative: 0,
      reason: 'payto_underfunded',
      recommendedTopUpUsdc: Math.max(minPrice * Math.max(payerCount, 1) * 2, 1),
      recommendedTopUpNative: 0,
    };
  }

  const fundableCalls = Math.floor(usdcOk / minPrice);
  return {
    canFundAny: fundableCalls >= 1,
    fundableCalls,
    hubHasFunds,
    shortfallUsdc: 0,
    shortfallNative: 0,
    reason: null,
    recommendedTopUpUsdc: 0,
    recommendedTopUpNative: 0,
  };
}

/**
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @returns {number}
 */
function minNativeForChain(chain) {
  if (chain === 'algorand') {
    return Number(PAYTO_USDC_REFUND_MIN_FEE_MICRO) / Number(MICRO_ALGO);
  }
  if (chain === 'base') return PAYTO_MIN_ETH;
  if (chain === 'xlayer') return PAYTO_MIN_OKB;
  return PAYTO_MIN_SOL;
}

/**
 * Resolve active PayTo address for a chain (no secret material).
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @returns {Promise<string | null>}
 */
async function resolvePayToAddress(chain) {
  try {
    if (chain === 'algorand') {
      const acct = await getActivePayToAlgorandAccount();
      return acct?.address ?? null;
    }
    if (chain === 'base' || chain === 'xlayer') {
      const acct = await getActivePayToEvmAccount(chain);
      return acct?.address ?? null;
    }
    const kp = await getActivePayToKeypair();
    return kp?.publicKey?.toBase58?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * Assess Labs treasury capacity for a chain using the richest funder wallet
 * (PayTo or any payer) rather than PayTo alone.
 *
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {{ payerCount?: number; priceMultiplier?: number; minPriceUsd?: number }} [opts]
 * @returns {Promise<object>}
 */
export async function assessLabTreasury(chain, opts = {}) {
  const c = normalizeLabChain(chain);
  const payerCount = Math.max(0, Math.floor(Number(opts.payerCount) || 0));
  const rawMult = Number(opts.priceMultiplier);
  const priceMultiplier =
    Number.isFinite(rawMult) ? Math.min(100, Math.max(1, rawMult)) : 1;
  const minPriceUsd =
    typeof opts.minPriceUsd === 'number' && opts.minPriceUsd > 0
      ? opts.minPriceUsd
      : getMinLabX402PriceUsd() * priceMultiplier;
  const feeFloor = minNativeForChain(c);

  /** @type {string | null} */
  let payToAddress = null;
  /** @type {string | null} */
  let hubAddress = null;
  /** @type {number} */
  let payToUsdc = 0;
  /** @type {number} */
  let payToSpendableNative = 0;
  /** @type {boolean | null} */
  let payToOptedInUsdc = c === 'algorand' ? false : null;
  /** @type {string | null} */
  let funderAddress = null;
  /** @type {number} */
  let funderUsdc = 0;
  /** @type {number} */
  let funderNative = 0;
  /** @type {string | null} */
  let funderRole = null;
  /** @type {boolean | null} */
  let funderOptedInUsdc = null;
  /** @type {number} */
  let hubUsdc = 0;
  /** @type {number} */
  let hubNative = 0;
  /** @type {string | undefined} */
  let error;

  try {
    payToAddress = await resolvePayToAddress(c);
    const candidates = await loadFunderCandidates(c);

    const payToCand = payToAddress
      ? candidates.find(
          (x) =>
            String(x.address || '').toLowerCase() ===
            String(payToAddress || '').toLowerCase(),
        )
      : null;
    if (payToCand) {
      payToUsdc = payToCand.usdc;
      payToSpendableNative = payToCand.native;
      payToOptedInUsdc = c === 'algorand' ? Boolean(payToCand.optedInUsdc) : null;
    } else if (payToAddress) {
      const payToBal = await withTimeout(
        getLabWalletBalances(payToAddress, c),
        ALGOD_TIMEOUT_MS,
        'payto_balance_timeout',
      );
      payToUsdc = payToBal?.usdcBalance ?? 0;
      if (c === 'algorand') {
        try {
          const spendable = await withTimeout(
            getAlgorandAccountSpendableMicro(payToAddress),
            ALGOD_TIMEOUT_MS,
            'payto_spendable_timeout',
          );
          payToSpendableNative = Number(spendable.spendableMicro) / Number(MICRO_ALGO);
        } catch (e) {
          payToSpendableNative = payToBal?.nativeBalance ?? 0;
          error = e?.message || String(e);
        }
        try {
          payToOptedInUsdc = await withTimeout(
            isAlgorandAddressOptedInUsdc(payToAddress),
            ALGOD_TIMEOUT_MS,
            'payto_optin_timeout',
          );
        } catch {
          payToOptedInUsdc = Boolean(payToBal?.optedInUsdc);
        }
      } else {
        payToSpendableNative = payToBal?.nativeBalance ?? 0;
      }
    }

    // Prefer a wallet that can fund ≥1 call; otherwise track richest for shortfall messaging.
    const canFundPick = pickRichestFunder(candidates, {
      minUsdc: minPriceUsd,
      minNative: feeFloor,
      reserveUsdc: 0,
      chain: c,
      requireOptedIn: c === 'algorand',
    });
    const richestAny = pickRichestFunder(candidates, {
      minUsdc: 0,
      minNative: 0,
      reserveUsdc: 0,
      chain: c,
      requireOptedIn: false,
    });
    const funder = canFundPick || richestAny;
    if (funder) {
      funderAddress = funder.address;
      funderUsdc = funder.usdc;
      funderNative = funder.native;
      funderRole = funder.role ?? null;
      funderOptedInUsdc =
        c === 'algorand'
          ? canFundPick
            ? true
            : funder.optedInUsdc ?? null
          : null;
    } else if (payToAddress) {
      funderAddress = payToAddress;
      funderUsdc = payToUsdc;
      funderNative = payToSpendableNative;
      funderRole = 'payto';
      funderOptedInUsdc = payToOptedInUsdc;
    }

    const hubDoc = await getActiveDepositWalletDoc(c);
    hubAddress = hubDoc?.address ?? null;
    if (hubAddress) {
      const hubBal = await withTimeout(
        getLabWalletBalances(hubAddress, c),
        ALGOD_TIMEOUT_MS,
        'hub_balance_timeout',
      );
      hubUsdc = hubBal?.usdcBalance ?? 0;
      hubNative = hubBal?.nativeBalance ?? 0;
    }
  } catch (e) {
    error = e?.message || String(e);
  }

  if (!payToAddress && !funderAddress) {
    const empty = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: feeFloor,
      hubUsdc,
      hubNative,
      minPriceUsd,
      payerCount,
      payToOptedIn: c === 'algorand' ? false : null,
      chain: c,
    });
    return {
      chain: c,
      ...empty,
      shortfallAlgo: empty.shortfallNative,
      recommendedTopUpAlgo: empty.recommendedTopUpNative,
      payToAddress: null,
      payToUsdc: 0,
      payToSpendableNative: 0,
      payToSpendableAlgo: 0,
      payToOptedInUsdc: c === 'algorand' ? false : null,
      funderAddress: null,
      funderUsdc: 0,
      funderNative: 0,
      funderRole: null,
      hubAddress,
      hubUsdc,
      hubNative,
      minPriceUsd,
      payerCount,
      reason: 'no_payto_wallet',
      ...(error ? { error } : {}),
    };
  }

  const capacity = evaluateTreasuryCapacity({
    payToUsdc: funderUsdc,
    payToSpendableNative: funderNative,
    minNativeForFee: feeFloor,
    hubUsdc,
    hubNative,
    minPriceUsd,
    payerCount,
    payToOptedIn: c === 'algorand' ? funderOptedInUsdc : null,
    chain: c,
  });

  return {
    chain: c,
    ...capacity,
    shortfallAlgo: capacity.shortfallNative,
    recommendedTopUpAlgo: capacity.recommendedTopUpNative,
    payToAddress,
    payToUsdc,
    payToSpendableNative,
    payToSpendableAlgo: c === 'algorand' ? payToSpendableNative : null,
    payToOptedInUsdc,
    funderAddress,
    funderUsdc,
    funderNative,
    funderRole,
    hubAddress,
    hubUsdc,
    hubNative,
    minPriceUsd,
    payerCount,
    ...(error ? { error } : {}),
  };
}

/**
 * Persist treasury auto-pause on settings (does not flip autoCallEnabled).
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {string} reason
 */
export async function pauseLabAutoCallForTreasury(chain, reason) {
  const key = settingsKeyForChain(chain);
  const now = new Date();
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: {
        autoCallPausedReason: String(reason || 'payto_underfunded').slice(0, 200),
        autoCallPausedAt: now,
      },
      $setOnInsert: { singletonKey: key },
    },
    { upsert: true },
  );
}

/**
 * Clear treasury pause so scheduler resumes at normal cadence.
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 */
export async function resumeLabAutoCallFromTreasury(chain) {
  const key = settingsKeyForChain(chain);
  await LabX402Settings.updateOne(
    { singletonKey: key },
    {
      $set: {
        autoCallPausedReason: null,
        autoCallPausedAt: null,
      },
    },
  );
}

/**
 * Record that a treasury alert was logged (throttle subsequent ones).
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 */
export async function markTreasuryAlertLogged(chain) {
  const key = settingsKeyForChain(chain);
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: { treasuryLastAlertAt: new Date() },
      $setOnInsert: { singletonKey: key },
    },
    { upsert: true },
  );
}

/**
 * @param {Date | string | null | undefined} lastAlertAt
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function shouldLogTreasuryAlert(lastAlertAt, nowMs = Date.now()) {
  if (!lastAlertAt) return true;
  const t = lastAlertAt instanceof Date ? lastAlertAt.getTime() : new Date(lastAlertAt).getTime();
  if (!Number.isFinite(t)) return true;
  return nowMs - t >= TREASURY_ALERT_THROTTLE_MS;
}
