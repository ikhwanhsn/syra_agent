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
  FUNDER_SPARE_MIN_FEE_MICRO,
  getAlgorandAccountSpendableMicro,
  lendableAlgorandMicro,
  MICRO_ALGO,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
} from './labAlgorandFeeBuffer.js';

/** Slow re-check when treasury is paused (15 min). */
export const TREASURY_PAUSE_RECHECK_MS = 15 * 60_000;

/**
 * Legacy throttle for aggregated (treasury) call-log alerts.
 * Scheduler now uses once-per-episode gating via shouldLogTreasuryEpisodeAlert;
 * this remains for tests / Telegram-adjacent callers.
 */
export const TREASURY_ALERT_THROTTLE_MS = 30 * 60_000;

/** After continuous treasury pause this long, flip autoCallEnabled off. */
export const TREASURY_CHRONIC_DISABLE_MS = 6 * 60 * 60_000;

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
 * Pure: decide whether the richest funder (or borrowable pool gas) can fund at least
 * one call, and how many.
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
 *   borrowableNative?: number;
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
  const borrowableNativeRaw = Number(input.borrowableNative);

  const usdcOk = Number.isFinite(payToUsdc) ? Math.max(0, payToUsdc) : 0;
  const nativeOk = Number.isFinite(payToSpendableNative) ? Math.max(0, payToSpendableNative) : 0;
  const borrowableOk = Number.isFinite(borrowableNativeRaw)
    ? Math.max(0, borrowableNativeRaw)
    : 0;
  // Gas can sit on a sibling/hub and be borrowed onto the funder mid-tick.
  const effectiveNative = Math.max(nativeOk, borrowableOk);
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

  if (effectiveNative < feeFloor) {
    const usdcShort = Math.max(0, minPrice - usdcOk);
    return {
      canFundAny: false,
      fundableCalls: 0,
      hubHasFunds,
      shortfallUsdc: usdcShort,
      shortfallNative: Math.max(0, feeFloor - Math.max(nativeOk, borrowableOk)),
      reason: 'payto_native_underfunded',
      // Do not send operators chasing USDC when only fee ALGO is missing.
      recommendedTopUpUsdc:
        usdcShort > 0 ? Math.max(minPrice * Math.max(payerCount, 1), 1) : 0,
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
  /** @type {Array<{ address: string; usdc: number; native: number; role?: string; optedInUsdc?: boolean | null }>} */
  let candidates = [];

  try {
    payToAddress = await resolvePayToAddress(c);
    candidates = await loadFunderCandidates(c);

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
      borrowableNative: c === 'algorand' ? hubNative : 0,
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

  // Algorand: gas can be borrowed onto the funder from siblings / hub mid-tick.
  // Count only lendable ALGO after min-fee spare (matches PayTo(min) borrow path).
  let borrowableNative = 0;
  if (c === 'algorand') {
    const funderNorm = String(funderAddress || '').toLowerCase();
    for (const cand of candidates) {
      const addr = String(cand.address || '').toLowerCase();
      if (!addr || (funderNorm && addr === funderNorm)) continue;
      const n = Number(cand.native);
      if (!Number.isFinite(n) || n <= 0) continue;
      const lendableMicro = lendableAlgorandMicro(
        BigInt(Math.round(n * Number(MICRO_ALGO))),
        FUNDER_SPARE_MIN_FEE_MICRO,
      );
      borrowableNative += Number(lendableMicro) / Number(MICRO_ALGO);
    }
    if (Number.isFinite(hubNative) && hubNative > 0) {
      const hubLendableMicro = lendableAlgorandMicro(
        BigInt(Math.round(hubNative * Number(MICRO_ALGO))),
        FUNDER_SPARE_MIN_FEE_MICRO,
      );
      borrowableNative += Number(hubLendableMicro) / Number(MICRO_ALGO);
    }
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
    borrowableNative,
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
 * Same reason while already paused keeps the original autoCallPausedAt (chronic timer).
 *
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {string} reason
 * @returns {Promise<{ isTransition: boolean; pausedAt: Date | null }>}
 */
export async function pauseLabAutoCallForTreasury(chain, reason) {
  const key = settingsKeyForChain(chain);
  const now = new Date();
  const reasonStr = String(reason || 'payto_underfunded').slice(0, 200);
  const existing = await LabX402Settings.findOne({ singletonKey: key }).lean();
  if (
    existing?.autoCallPausedReason &&
    String(existing.autoCallPausedReason) === reasonStr &&
    existing.autoCallPausedAt
  ) {
    const pausedAt =
      existing.autoCallPausedAt instanceof Date
        ? existing.autoCallPausedAt
        : new Date(existing.autoCallPausedAt);
    return { isTransition: false, pausedAt };
  }
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: {
        autoCallPausedReason: reasonStr,
        autoCallPausedAt: now,
      },
      $setOnInsert: { singletonKey: key },
    },
    { upsert: true },
  );
  return { isTransition: true, pausedAt: now };
}

/**
 * Clear treasury pause so scheduler resumes at normal cadence.
 * Also clears the episode alert gate so a future underfund can log once again.
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
        treasuryLastAlertAt: null,
      },
    },
  );
}

/**
 * Disable auto-call after chronic treasury underfunding (stops 15-min rechecks).
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {string} [reason]
 */
export async function disableLabAutoCallForChronicTreasury(chain, reason) {
  const key = settingsKeyForChain(chain);
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: {
        autoCallEnabled: false,
        autoCallPausedReason: String(reason || 'payto_underfunded').slice(0, 200),
      },
      $setOnInsert: { singletonKey: key },
    },
    { upsert: true },
  );
}

/**
 * Record that a treasury alert was logged (episode marker).
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
 * Once-per-underfund-episode gate for (treasury) call-log rows.
 * Logs only when entering pause, or when the pause reason changes.
 *
 * @param {{
 *   autoCallPausedReason?: string | null;
 *   newReason?: string | null;
 * }} input
 * @returns {boolean}
 */
export function shouldLogTreasuryEpisodeAlert(input = {}) {
  const next = String(input.newReason || 'payto_underfunded').trim() || 'payto_underfunded';
  const prev = input.autoCallPausedReason
    ? String(input.autoCallPausedReason).trim()
    : '';
  if (prev && prev === next) return false;
  return true;
}

/**
 * @param {Date | string | null | undefined} autoCallPausedAt
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function shouldChronicDisableAutoCall(autoCallPausedAt, nowMs = Date.now()) {
  if (!autoCallPausedAt) return false;
  const t =
    autoCallPausedAt instanceof Date
      ? autoCallPausedAt.getTime()
      : new Date(autoCallPausedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return nowMs - t >= TREASURY_CHRONIC_DISABLE_MS;
}

/**
 * Legacy time-based throttle (kept for unit tests / callers that still use it).
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
