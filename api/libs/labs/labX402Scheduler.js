/**
 * Scheduler for x402 Labs auto-caller — periodically runs paid /insights/* calls from payer wallets.
 * Runs independently per chain (solana | base | algorand | xlayer).
 *
 * Treasury circuit breaker: preflight assessLabTreasury once per tick. When no payer/payto
 * funder can fund any call, try deposit-hub distribute (if enabled + hub funded), then
 * auto-pause with a single once-per-episode (treasury) log. Chronic underfund escalates
 * recheck cadence (does NOT flip autoCallEnabled — that stranded Labs permanently).
 */
import { listActivePayerWallets } from './labWalletService.js';
import { runLabX402Payment, getLabX402Settings } from './labX402Payer.js';
import { checkLabDailyCallBudget, logLabX402Call } from './labX402CallLog.js';
import { formatFundingSkipError } from './labFundingSkipMessage.js';
import { ensurePayerFundedForNextCall } from './labX402Refund.js';
import { distributeLabDeposit } from './labDepositDistributor.js';
import { ensurePayToAlgoForUsdcRefund } from './labAlgorandFeeBuffer.js';
import {
  assessLabTreasury,
  ensureLabAutoCallEnabledForTreasuryWatch,
  markTreasuryAlertLogged,
  pauseLabAutoCallForTreasury,
  recoverLabAutoCallFromTreasury,
  shouldEscalateTreasuryRecheck,
  shouldLogTreasuryEpisodeAlert,
  shouldSoftSkipTreasuryAssessment,
  treasuryPauseRecheckDelayMs,
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

/** Algorand payer funding failures that are usually systemic fee-ALGO starvation. */
const ALGORAND_FEE_HEAL_REASONS = new Set([
  'payto_native_underfunded',
  'insufficient_algo_for_opt_in',
  'insufficient_algo_for_usdc_refund',
  'usdc_opt_in_failed',
]);

/** Random wait between scheduler batches. Interval/jitter settings are unused. */
const AUTO_BATCH_DELAY_MIN_MS = 15 * 60_000;
const AUTO_BATCH_DELAY_MAX_MS = 60 * 60_000;

function computeRandomBatchDelay() {
  const span = AUTO_BATCH_DELAY_MAX_MS - AUTO_BATCH_DELAY_MIN_MS;
  const delay = AUTO_BATCH_DELAY_MIN_MS + Math.random() * span;
  return Math.max(60_000, Math.round(delay));
}

/**
 * Pure mid-tick decision: never sticky-pause when capacity still says canFundAny.
 * @param {{ canFundAny?: boolean }} midAssessment
 * @returns {'skip_payer' | 'pause_treasury'}
 */
export function decideMidTickTreasurySkipAction(midAssessment) {
  if (midAssessment?.canFundAny) return 'skip_payer';
  return 'pause_treasury';
}

/**
 * Algorand-only: attempt fee ALGO consolidation before pausing (Base/X Layer borrow gas
 * during funding; Algorand previously paused at preflight before that heal could run).
 * @param {{
 *   canFundAny?: boolean;
 *   reason?: string | null;
 *   funderUsdc?: number;
 *   payToUsdc?: number;
 *   minPriceUsd?: number;
 *   funderAddress?: string | null;
 *   payToAddress?: string | null;
 * }} assessment
 * @returns {boolean}
 */
export function shouldAttemptAlgorandFeeHeal(assessment) {
  if (!assessment || assessment.canFundAny) return false;
  const reason = String(assessment.reason || '');
  if (reason === 'payto_native_underfunded') return true;
  // USDC present but mislabeled / native-short — still worth consolidating fee ALGO.
  const minPrice =
    Number.isFinite(Number(assessment.minPriceUsd)) && Number(assessment.minPriceUsd) > 0
      ? Number(assessment.minPriceUsd)
      : 0.01;
  const usdc = Math.max(
    0,
    Number(assessment.funderUsdc ?? 0),
    Number(assessment.payToUsdc ?? 0),
  );
  return usdc >= minPrice && reason !== 'payto_not_opted_in_usdc' && reason !== 'no_payto_wallet';
}

/**
 * Unique Algorand addresses to top up with fee ALGO (funder first, then PayTo).
 * @param {{ funderAddress?: string | null; payToAddress?: string | null }} assessment
 * @returns {string[]}
 */
export function algorandFeeHealTargets(assessment) {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const raw of [assessment?.funderAddress, assessment?.payToAddress]) {
    const addr = String(raw || '').trim();
    if (!addr) continue;
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(addr);
  }
  return out;
}

/**
 * Borrow spendable ALGO onto funder/PayTo from hub + siblings before treasury pause.
 * @param {object} assessment
 * @param {{
 *   ensurePayToAlgoForUsdcRefund?: typeof ensurePayToAlgoForUsdcRefund;
 * }} [deps]
 * @returns {Promise<{ attempted: boolean; ok: boolean; targets: string[]; results: object[] }>}
 */
async function tryAlgorandFeeHealBeforePause(assessment, deps = {}) {
  if (!shouldAttemptAlgorandFeeHeal(assessment)) {
    return { attempted: false, ok: false, targets: [], results: [] };
  }
  const targets = algorandFeeHealTargets(assessment);
  if (targets.length === 0) {
    return { attempted: false, ok: false, targets: [], results: [] };
  }

  const ensureFn = deps.ensurePayToAlgoForUsdcRefund || ensurePayToAlgoForUsdcRefund;

  /** @type {object[]} */
  const results = [];
  let anyOk = false;
  for (const addr of targets) {
    try {
      const result = await ensureFn(addr, {
        includePayTo: true,
        includeSiblingPayers: true,
      });
      results.push({ address: addr, ...result });
      if (result?.ok) anyOk = true;
    } catch (e) {
      results.push({ address: addr, ok: false, error: e?.message || String(e) });
    }
  }
  return { attempted: true, ok: anyOk, targets, results };
}

/**
 * Proactive Algorand fee maintain: consolidate dust onto PayTo (and funder if distinct)
 * every tick so USDC refunds don't die at ASA min-balance.
 * @param {{
 *   funderAddress?: string | null;
 *   payToAddress?: string | null;
 * }} [assessment]
 * @param {{
 *   ensurePayToAlgoForUsdcRefund?: typeof ensurePayToAlgoForUsdcRefund;
 * }} [deps]
 * @returns {Promise<{ attempted: boolean; ok: boolean; targets: string[]; results: object[] }>}
 */
export async function maintainAlgorandPayToFeeBuffer(assessment = {}, deps = {}) {
  const targets = algorandFeeHealTargets(assessment);
  if (targets.length === 0) {
    // Fall back to active PayTo only when assessment omitted addresses.
    return { attempted: false, ok: false, targets: [], results: [] };
  }
  const ensureFn = deps.ensurePayToAlgoForUsdcRefund || ensurePayToAlgoForUsdcRefund;
  /** @type {object[]} */
  const results = [];
  let anyOk = false;
  for (const addr of targets) {
    try {
      const result = await ensureFn(addr, {
        includePayTo: true,
        includeSiblingPayers: true,
      });
      results.push({ address: addr, ...result });
      if (result?.ok) anyOk = true;
    } catch (e) {
      results.push({ address: addr, ok: false, error: e?.message || String(e) });
    }
  }
  return { attempted: true, ok: anyOk, targets, results };
}

/**
 * True when a mid-tick funding failure should trigger Algorand fee consolidation.
 * @param {string | null | undefined} reason
 * @returns {boolean}
 */
export function shouldHealAlgorandFundingReason(reason) {
  return ALGORAND_FEE_HEAL_REASONS.has(String(reason || ''));
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
 * When treasury cannot fund: try hub distribute, pause + once-per-episode log.
 * Chronic pause escalates recheck cadence (never disables autoCallEnabled).
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
 *   chronicEscalated: boolean;
 *   assessment: object;
 * }>}
 */
async function handleTreasuryUnderfunded(args) {
  const { chain, settings, payerCount, priceMultiplier } = args;
  const allowAlreadyFundedRecovery = args.allowAlreadyFundedRecovery !== false;
  let assessment = args.assessment;

  if (assessment.canFundAny && allowAlreadyFundedRecovery) {
    if (settings.autoCallPausedReason || !settings.autoCallEnabled) {
      await recoverLabAutoCallFromTreasury(chain);
    }
    return { recovered: true, disabled: false, chronicEscalated: false, assessment };
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
      console.info(
        `[lab-x402-scheduler] ${chain} treasury recovered via hub distribute; resuming`,
      );
      await recoverLabAutoCallFromTreasury(chain);
      return { recovered: true, disabled: false, chronicEscalated: false, assessment };
    }
  }

  // Algorand: consolidate fee ALGO (hub/siblings → funder/PayTo) before pausing —
  // matches Base/X Layer native borrow during funding instead of preflight-dead-end.
  if (chain === 'algorand' && shouldAttemptAlgorandFeeHeal(assessment)) {
    console.info(
      `[lab-x402-scheduler] algorand fee ALGO heal before pause (${assessment.reason})`,
    );
    const heal = await tryAlgorandFeeHealBeforePause(assessment);
    if (heal.attempted) {
      assessment = await assessLabTreasury(chain, {
        payerCount,
        priceMultiplier,
      });
      if (assessment.canFundAny) {
        console.info(
          `[lab-x402-scheduler] algorand treasury recovered via fee ALGO heal; resuming`,
        );
        await recoverLabAutoCallFromTreasury(chain);
        return { recovered: true, disabled: false, chronicEscalated: false, assessment };
      }
      console.warn(
        `[lab-x402-scheduler] algorand fee ALGO heal did not restore capacity`,
        heal.results.map((r) => ({
          address: String(r.address || '').slice(0, 8),
          ok: r.ok,
          error: r.error,
        })),
      );
    }
  }

  const chronicEscalated = shouldEscalateTreasuryRecheck(settings.autoCallPausedAt);
  if (chronicEscalated) {
    console.warn(
      `[lab-x402-scheduler] ${chain} chronic treasury underfund; slowing recheck (keeping auto-call enabled)`,
    );
    // Heal any prior chronic-disable dead-end so rechecks continue.
    if (!settings.autoCallEnabled) {
      await ensureLabAutoCallEnabledForTreasuryWatch(chain);
    }
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
  return { recovered: false, disabled: false, chronicEscalated, assessment };
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
    const delay =
      opts.forceSlowRecheck || settings.autoCallPausedReason
        ? treasuryPauseRecheckDelayMs({
            autoCallPausedAt: settings.autoCallPausedAt,
            forceSlowRecheck: opts.forceSlowRecheck,
          })
        : computeRandomBatchDelay();
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
 * Boot heal: recover fundable treasuries; re-enable watch if prior chronic disable
 * left autoCallEnabled false while still paused.
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 */
async function healChainTreasuryOnBoot(chain) {
  const c = normalizeLabChain(chain);
  try {
    const settings = await getLabX402Settings(c);
    const stuckPaused = Boolean(settings.autoCallPausedReason);
    const stuckDisabled =
      !settings.autoCallEnabled &&
      (Boolean(settings.autoCallPausedReason) || Boolean(settings.autoCallPausedAt));

    if (!stuckPaused && !stuckDisabled) {
      scheduleNext(c);
      return;
    }

    const payers = await listActivePayerWallets(c);
    let assessment = await assessLabTreasury(c, {
      payerCount: payers.length,
      priceMultiplier: settings.priceMultiplier,
    });

    if (
      !assessment.canFundAny &&
      assessment.hubHasFunds &&
      settings.depositDistributeEnabled !== false
    ) {
      console.info(`[lab-x402-scheduler] ${c} boot heal: hub has funds; distributing`);
      try {
        await distributeLabDeposit(c, { force: true });
      } catch (e) {
        console.warn(
          `[lab-x402-scheduler] ${c} boot heal distribute failed:`,
          e?.message || e,
        );
      }
      assessment = await assessLabTreasury(c, {
        payerCount: payers.length,
        priceMultiplier: settings.priceMultiplier,
      });
    }

    if (c === 'algorand' && !assessment.canFundAny && shouldAttemptAlgorandFeeHeal(assessment)) {
      console.info(`[lab-x402-scheduler] ${c} boot heal: attempting fee ALGO heal`);
      await tryAlgorandFeeHealBeforePause(assessment);
      assessment = await assessLabTreasury(c, {
        payerCount: payers.length,
        priceMultiplier: settings.priceMultiplier,
      });
    }

    if (assessment.canFundAny) {
      console.info(`[lab-x402-scheduler] ${c} boot heal: treasury fundable; recovering auto-call`);
      await recoverLabAutoCallFromTreasury(c);
    } else if (!settings.autoCallEnabled) {
      console.info(
        `[lab-x402-scheduler] ${c} boot heal: re-enabling auto-call watch while still paused`,
      );
      await ensureLabAutoCallEnabledForTreasuryWatch(c);
    }
  } catch (e) {
    console.warn(`[lab-x402-scheduler] ${c} boot heal failed:`, e?.message || e);
  }
  scheduleNext(c);
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

    // Algorand: always consolidate fee ALGO onto PayTo/funder before funding payers
    // (Base/X Layer borrow gas during funding; Algorand must reshuffle dust first).
    if (c === 'algorand') {
      const maintain = await maintainAlgorandPayToFeeBuffer(assessment);
      if (maintain.attempted && maintain.ok) {
        assessment = await assessLabTreasury(c, {
          payerCount: payers.length,
          priceMultiplier: settings.priceMultiplier,
        });
      }
    }

    if (!assessment.canFundAny) {
      if (shouldSoftSkipTreasuryAssessment(assessment)) {
        console.warn(
          `[lab-x402-scheduler] ${c} treasury assessment RPC degraded (${assessment.error}); soft-skip (no pause)`,
        );
        forceSlowRecheck = true;
        return;
      }
      const result = await handleTreasuryUnderfunded({
        chain: c,
        assessment,
        settings,
        payerCount: payers.length,
        priceMultiplier: settings.priceMultiplier,
      });
      if (!result.recovered) {
        forceSlowRecheck = true;
        return;
      }
      assessment = result.assessment;
    }

    // Treasury healthy: clear any prior pause and ensure auto-call stays enabled.
    if (settings.autoCallPausedReason || !settings.autoCallEnabled) {
      console.info(`[lab-x402-scheduler] ${c} treasury recovered; resuming auto-call`);
      await recoverLabAutoCallFromTreasury(c);
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
          // Algorand systemic fee-ALGO failures: consolidate once, then retry this payer.
          if (
            c === 'algorand' &&
            shouldHealAlgorandFundingReason(funding.reason)
          ) {
            console.info(
              `[lab-x402-scheduler] ${c} mid-tick ALGO fee heal after ${funding.reason}`,
            );
            await maintainAlgorandPayToFeeBuffer(assessment);
            const retryFunding = await ensurePayerFundedForNextCall(payer.address, {
              refundEnabled: settings.refundEnabled,
              chain: c,
              priceMultiplier: settings.priceMultiplier,
            });
            if (retryFunding.canPay) {
              await runLabX402Payment(payer.address, { trigger: 'scheduler', chain: c });
              continue;
            }
            // Still failing — fall through using retry reason for treasury/skip logic.
            Object.assign(funding, retryFunding);
          }

          // Shared treasury skip reasons (and Algorand systemic fee-ALGO after heal):
          // re-assess. Capacity truth wins over one failed top-up.
          const treatAsTreasurySkip =
            TREASURY_SKIP_REASONS.has(String(funding.reason || '')) ||
            (c === 'algorand' && shouldHealAlgorandFundingReason(funding.reason));
          if (treatAsTreasurySkip) {
            const midSettings = await getLabX402Settings(c);
            const midAssessment = await assessLabTreasury(c, {
              payerCount: payers.length,
              priceMultiplier: settings.priceMultiplier,
            });
            if (shouldSoftSkipTreasuryAssessment(midAssessment)) {
              console.warn(
                `[lab-x402-scheduler] ${c} mid-tick assessment RPC degraded; soft-skip (no pause)`,
              );
              forceSlowRecheck = true;
              break;
            }
            const midAction = decideMidTickTreasurySkipAction(midAssessment);
            if (midAction === 'skip_payer') {
              console.warn(
                `[lab-x402-scheduler] ${c} mid-tick top-up failed (${funding.reason}) but treasury canFundAny; skipping payer (no pause)`,
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
            console.warn(
              `[lab-x402-scheduler] ${c} mid-tick treasury exhaustion (${funding.reason}); pausing`,
            );
            const result = await handleTreasuryUnderfunded({
              chain: c,
              assessment: {
                ...midAssessment,
                reason:
                  midAssessment.reason ||
                  (shouldHealAlgorandFundingReason(funding.reason)
                    ? 'payto_native_underfunded'
                    : funding.reason),
                hubHasFunds: midAssessment.hubHasFunds,
              },
              settings: midSettings,
              payerCount: payers.length,
              priceMultiplier: settings.priceMultiplier,
            });
            if (result.recovered) {
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
 * Runs a treasury heal per chain so prior chronic-disable dead-ends self-recover.
 */
export function startLabX402Scheduler() {
  startupVerbose('[lab-x402-scheduler] started (solana + base + algorand + xlayer)');
  for (const chain of LAB_X402_CHAINS) {
    void healChainTreasuryOnBoot(chain);
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
  healChainTreasuryOnBoot,
  logAggregatedTreasuryAlert,
  decideMidTickTreasurySkipAction,
  shouldAttemptAlgorandFeeHeal,
  shouldHealAlgorandFundingReason,
  algorandFeeHealTargets,
  tryAlgorandFeeHealBeforePause,
  maintainAlgorandPayToFeeBuffer,
  TREASURY_SKIP_REASONS,
  ALGORAND_FEE_HEAL_REASONS,
  computeRandomBatchDelay,
  AUTO_BATCH_DELAY_MIN_MS,
  AUTO_BATCH_DELAY_MAX_MS,
};
