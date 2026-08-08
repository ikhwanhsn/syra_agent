/**
 * Scheduler for x402 Labs auto-caller — periodically runs paid /insights/* calls from payer wallets.
 * Runs independently per chain (solana | base | algorand | xlayer).
 *
 * Treasury circuit breaker: preflight assessLabTreasury once per tick. When no payer/payto
 * funder can fund any call, try deposit-hub distribute (if enabled + hub funded), then
 * auto-pause with a single once-per-episode (treasury) log. Chronic underfund disables
 * autoCallEnabled after TREASURY_CHRONIC_DISABLE_MS.
 */
import { listActivePayerWallets } from './labWalletService.js';
import { runLabX402Payment, getLabX402Settings } from './labX402Payer.js';
import { checkLabDailyCallBudget, logLabX402Call } from './labX402CallLog.js';
import { formatFundingSkipError } from './labFundingSkipMessage.js';
import { ensurePayerFundedForNextCall } from './labX402Refund.js';
import { distributeLabDeposit } from './labDepositDistributor.js';
import {
  assessLabTreasury,
  disableLabAutoCallForChronicTreasury,
  markTreasuryAlertLogged,
  pauseLabAutoCallForTreasury,
  resumeLabAutoCallFromTreasury,
  shouldChronicDisableAutoCall,
  shouldLogTreasuryEpisodeAlert,
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
 * Log a single aggregated treasury alert (once per underfund episode).
 * @param {{
 *   chain: string;
 *   assessment: object;
 *   settings: object;
 *   payerCount: number;
 * }} args
 */
async function logAggregatedTreasuryAlert(args) {
  const { chain, assessment, settings, payerCount } = args;
  const reason = assessment.reason || 'payto_underfunded';
  if (
    !shouldLogTreasuryEpisodeAlert({
      autoCallPausedReason: settings.autoCallPausedReason,
      newReason: reason,
    })
  ) {
    return;
  }

  const payers = await listActivePayerWallets(chain);
  const representative = payers[0]?.address;
  if (!representative) return;

  const detail = [
    reason,
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
      reason,
      error: detail,
      includeTopUpHint: true,
    }),
    trigger: 'scheduler',
  }).catch(() => {});

  await markTreasuryAlertLogged(chain).catch(() => {});
}

/**
 * When treasury cannot fund: try hub distribute, chronic-disable, or pause + once-per-episode log.
 *
 * `allowAlreadyFundedRecovery` (default true): an already-fundable assessment counts as
 * recovered. Mid-tick PayTo exhaustion sets this false so a rich sibling payer cannot
 * unblock the loop while PayTo top-ups are still failing.
 *
 * @param {{
 *   chain: string;
 *   assessment: object;
 *   settings: object;
 *   payerCount: number;
 *   priceMultiplier?: number;
 *   allowAlreadyFundedRecovery?: boolean;
 * }} args
 * @returns {Promise<{
 *   recovered: boolean;
 *   disabled: boolean;
 *   assessment: object;
 * }>}
 */
async function handleTreasuryUnderfunded(args) {
  const { chain, settings, payerCount, priceMultiplier } = args;
  const allowAlreadyFundedRecovery = args.allowAlreadyFundedRecovery !== false;
  let assessment = args.assessment;

  if (assessment.canFundAny && allowAlreadyFundedRecovery) {
    if (settings.autoCallPausedReason) {
      await resumeLabAutoCallFromTreasury(chain);
    }
    return { recovered: true, disabled: false, assessment };
  }

  if (assessment.hubHasFunds && settings.depositDistributeEnabled !== false) {
    console.info(
      `[lab-x402-scheduler] ${chain} hub has funds; auto-distributing before pause`,
    );
    try {
      await distributeLabDeposit(chain, { force: true });
    } catch (e) {
      console.warn(
        `[lab-x402-scheduler] ${chain} auto-distribute failed:`,
        e?.message || e,
      );
    }
    assessment = await assessLabTreasury(chain, {
      payerCount,
      priceMultiplier,
    });
    if (assessment.canFundAny) {
      if (settings.autoCallPausedReason) {
        console.info(
          `[lab-x402-scheduler] ${chain} treasury recovered via hub distribute; resuming`,
        );
        await resumeLabAutoCallFromTreasury(chain);
      }
      return { recovered: true, disabled: false, assessment };
    }
  }

  if (
    settings.autoCallPausedReason &&
    shouldChronicDisableAutoCall(settings.autoCallPausedAt)
  ) {
    console.warn(
      `[lab-x402-scheduler] ${chain} chronic treasury underfund; disabling auto-call`,
    );
    await disableLabAutoCallForChronicTreasury(
      chain,
      assessment.reason || 'payto_underfunded',
    );
    return { recovered: false, disabled: true, assessment };
  }

  console.warn(
    `[lab-x402-scheduler] ${chain} treasury underfunded (${assessment.reason}); pausing auto-call`,
  );
  await pauseLabAutoCallForTreasury(chain, assessment.reason || 'payto_underfunded');
  await logAggregatedTreasuryAlert({
    chain,
    assessment,
    settings,
    payerCount,
  });
  return { recovered: false, disabled: false, assessment };
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

    let assessment = await assessLabTreasury(c, {
      payerCount: payers.length,
      priceMultiplier: settings.priceMultiplier,
    });

    if (!assessment.canFundAny) {
      const result = await handleTreasuryUnderfunded({
        chain: c,
        assessment,
        settings,
        payerCount: payers.length,
        priceMultiplier: settings.priceMultiplier,
      });
      if (result.disabled) return;
      if (!result.recovered) {
        forceSlowRecheck = true;
        return;
      }
      assessment = result.assessment;
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
            const midSettings = await getLabX402Settings(c);
            const midAssessment = await assessLabTreasury(c, {
              payerCount: payers.length,
              priceMultiplier: settings.priceMultiplier,
            });
            const result = await handleTreasuryUnderfunded({
              chain: c,
              assessment: {
                ...midAssessment,
                canFundAny: false,
                reason: midAssessment.reason || funding.reason,
                hubHasFunds: midAssessment.hubHasFunds,
              },
              settings: midSettings,
              payerCount: payers.length,
              priceMultiplier: settings.priceMultiplier,
              // PayTo top-up path failed; do not treat a rich sibling payer as recovery.
              allowAlreadyFundedRecovery: false,
            });
            if (result.recovered) {
              // Only via successful hub distribute.
              assessment = result.assessment;
              continue;
            }
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
  handleTreasuryUnderfunded,
  logAggregatedTreasuryAlert,
  TREASURY_SKIP_REASONS,
  computeJitteredDelay,
};
