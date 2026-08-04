/**
 * Scheduler for x402 Labs auto-caller — periodically runs paid /insights/* calls from payer wallets.
 * Runs independently per chain (solana | base | algorand | xlayer).
 *
 * Treasury circuit breaker: preflight assessLabTreasury once per tick. When no payer/payto
 * funder can fund any call, auto-pause with a single aggregated (treasury) log instead of
 * N per-payer (funding) errors. Deposit-hub distribution is manual-only (UI/route).
 */
import { listActivePayerWallets } from './labWalletService.js';
import { runLabX402Payment, getLabX402Settings } from './labX402Payer.js';
import { checkLabDailyCallBudget, logLabX402Call } from './labX402CallLog.js';
import { formatFundingSkipError } from './labFundingSkipMessage.js';
import { ensurePayerFundedForNextCall } from './labX402Refund.js';
import {
  assessLabTreasury,
  markTreasuryAlertLogged,
  pauseLabAutoCallForTreasury,
  resumeLabAutoCallFromTreasury,
  shouldLogTreasuryAlert,
  TREASURY_PAUSE_RECHECK_MS,
} from './labTreasuryGuard.js';
import { LAB_X402_CHAINS, normalizeLabChain } from '../../models/labs/LabX402Settings.js';
import { startupVerbose } from '../../utils/startupLog.js';

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const timerByChain = new Map();
/** @type {Set<string>} */
const runningByChain = new Set();

/** Reasons that indicate shared treasury exhaustion (not payer-specific). */
const TREASURY_SKIP_REASONS = new Set([
  'payto_underfunded',
  'payto_native_underfunded',
  'payto_not_opted_in_usdc',
  'no_payto_wallet',
]);

function computeJitteredDelay(baseMs, jitterPct) {
  const jitter = (jitterPct / 100) * baseMs;
  const offset = (Math.random() * 2 - 1) * jitter;
  return Math.max(60_000, Math.round(baseMs + offset));
}

/**
 * Log a single aggregated treasury alert (throttled).
 * @param {{
 *   chain: string;
 *   assessment: object;
 *   settings: object;
 *   payerCount: number;
 * }} args
 */
async function logAggregatedTreasuryAlert(args) {
  const { chain, assessment, settings, payerCount } = args;
  if (!shouldLogTreasuryAlert(settings.treasuryLastAlertAt)) return;

  const payers = await listActivePayerWallets(chain);
  const representative = payers[0]?.address;
  if (!representative) return;

  const detail = [
    assessment.reason || 'payto_underfunded',
    `payers=${payerCount}`,
    `funderUsdc=${Number(assessment.funderUsdc ?? assessment.payToUsdc ?? 0).toFixed(4)}`,
    assessment.funderAddress
      ? `funder=${String(assessment.funderAddress).slice(0, 8)}…`
      : assessment.payToAddress
        ? `payTo=${assessment.payToAddress.slice(0, 8)}…`
        : null,
    assessment.recommendedTopUpUsdc > 0
      ? `needUsdc~${Number(assessment.recommendedTopUpUsdc).toFixed(2)}`
      : null,
    assessment.recommendedTopUpNative > 0
      ? `needNative~${Number(assessment.recommendedTopUpNative).toFixed(4)}`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  await logLabX402Call({
    payerAddress: representative,
    endpoint: '(treasury)',
    priceUsd: 0,
    chain,
    status: 'error',
    error: formatFundingSkipError({
      reason: assessment.reason || 'payto_underfunded',
      error: detail,
      includeTopUpHint: true,
    }),
    trigger: 'scheduler',
  }).catch(() => {});

  await markTreasuryAlertLogged(chain).catch(() => {});
}

/**
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {{ forceSlowRecheck?: boolean }} [opts]
 */
async function scheduleNext(chain, opts = {}) {
  const c = normalizeLabChain(chain);
  const existing = timerByChain.get(c);
  if (existing) {
    clearTimeout(existing);
    timerByChain.delete(c);
  }
  try {
    const settings = await getLabX402Settings(c);
    if (!settings.autoCallEnabled) return;
    const delay = opts.forceSlowRecheck
      ? TREASURY_PAUSE_RECHECK_MS
      : settings.autoCallPausedReason
        ? TREASURY_PAUSE_RECHECK_MS
        : computeJitteredDelay(settings.intervalMs, settings.jitterPct);
    timerByChain.set(
      c,
      setTimeout(() => {
        void tick(c);
      }, delay),
    );
  } catch {
    timerByChain.set(
      c,
      setTimeout(() => {
        void tick(c);
      }, 300_000),
    );
  }
}

/**
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 */
async function tick(chain) {
  const c = normalizeLabChain(chain);
  if (runningByChain.has(c)) return;
  runningByChain.add(c);
  /** When true, next schedule uses the slow treasury re-check cadence. */
  let forceSlowRecheck = false;
  try {
    const settings = await getLabX402Settings(c);
    if (!settings.autoCallEnabled) return;

    const budget = await checkLabDailyCallBudget(c);
    if (!budget.allowed) {
      console.warn(
        `[lab-x402-scheduler] ${c} daily cap reached (${budget.count}/${budget.max}); skipping tick`,
      );
      return;
    }

    const payers = await listActivePayerWallets(c);
    if (payers.length === 0) return;

    const assessment = await assessLabTreasury(c, {
      payerCount: payers.length,
      priceMultiplier: settings.priceMultiplier,
    });

    if (!assessment.canFundAny) {
      console.warn(
        `[lab-x402-scheduler] ${c} treasury underfunded (${assessment.reason}); pausing auto-call`,
      );
      await pauseLabAutoCallForTreasury(c, assessment.reason || 'payto_underfunded');
      await logAggregatedTreasuryAlert({
        chain: c,
        assessment,
        settings,
        payerCount: payers.length,
      });
      forceSlowRecheck = true;
      return;
    }

    // Treasury healthy: clear any prior pause so we run at normal cadence.
    if (settings.autoCallPausedReason) {
      console.info(`[lab-x402-scheduler] ${c} treasury recovered; resuming auto-call`);
      await resumeLabAutoCallFromTreasury(c);
    }

    for (const payer of payers) {
      const remaining = await checkLabDailyCallBudget(c);
      if (!remaining.allowed) break;
      try {
        const funding = await ensurePayerFundedForNextCall(payer.address, {
          refundEnabled: settings.refundEnabled,
          chain: c,
          priceMultiplier: settings.priceMultiplier,
        });
        if (!funding.canPay) {
          // Shared treasury exhaustion: break the loop and pause (do not spam N rows).
          if (TREASURY_SKIP_REASONS.has(String(funding.reason || ''))) {
            console.warn(
              `[lab-x402-scheduler] ${c} mid-tick treasury exhaustion (${funding.reason}); pausing`,
            );
            await pauseLabAutoCallForTreasury(c, funding.reason || 'payto_underfunded');
            await logAggregatedTreasuryAlert({
              chain: c,
              assessment: {
                ...assessment,
                reason: funding.reason,
                payToUsdc: funding.balanceUsdc,
              },
              settings: await getLabX402Settings(c),
              payerCount: payers.length,
            });
            forceSlowRecheck = true;
            break;
          }
          // Payer-specific failure (e.g. opt-in): log once for that payer and continue.
          console.warn(
            `[lab-x402-scheduler] skipping ${c} ${payer.address}: insufficient USDC (${funding.reason})`,
          );
          await logLabX402Call({
            payerAddress: payer.address,
            endpoint: '(funding)',
            priceUsd: 0,
            chain: c,
            status: 'error',
            error: formatFundingSkipError({
              reason: funding.reason,
              error: funding.error,
              includeTopUpHint: false,
            }),
            trigger: 'scheduler',
          }).catch(() => {});
          continue;
        }
        await runLabX402Payment(payer.address, { trigger: 'scheduler', chain: c });
      } catch (e) {
        console.warn(
          `[lab-x402-scheduler] ${c} payer call failed:`,
          payer.address,
          e?.message || e,
        );
      }
    }
  } catch (e) {
    console.warn(`[lab-x402-scheduler] ${c} tick failed:`, e?.message || e);
  } finally {
    runningByChain.delete(c);
    scheduleNext(c, { forceSlowRecheck });
  }
}

/**
 * Start the lab x402 scheduler for all chains. Safe to call once at boot.
 */
export function startLabX402Scheduler() {
  startupVerbose('[lab-x402-scheduler] started (solana + base + algorand + xlayer)');
  for (const chain of LAB_X402_CHAINS) {
    scheduleNext(chain);
  }
}

/**
 * Restart scheduler after settings change (e.g. interval updated).
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} [chain] - when omitted, restart all chains
 */
export function restartLabX402Scheduler(chain) {
  if (chain) {
    scheduleNext(normalizeLabChain(chain));
    return;
  }
  for (const c of LAB_X402_CHAINS) {
    scheduleNext(c);
  }
}

/** @internal Exported for unit tests. */
export const __test = {
  tick,
  scheduleNext,
  TREASURY_SKIP_REASONS,
  computeJitteredDelay,
};
