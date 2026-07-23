/**
 * Scheduler for x402 Labs auto-caller — periodically runs paid / insights/* calls from payer wallets.
 * Runs independently per chain (solana | base | algorand).
 */
import { listActivePayerWallets } from './labWalletService.js';
import { runLabX402Payment, getLabX402Settings } from './labX402Payer.js';
import { checkLabDailyCallBudget, logLabX402Call } from './labX402CallLog.js';
import { formatFundingSkipError } from './labFundingSkipMessage.js';
import { ensurePayerFundedForNextCall } from './labX402Refund.js';
import { LAB_X402_CHAINS, normalizeLabChain } from '../../models/labs/LabX402Settings.js';
import { startupVerbose } from '../../utils/startupLog.js';

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const timerByChain = new Map();
/** @type {Set<string>} */
const runningByChain = new Set();

function computeJitteredDelay(baseMs, jitterPct) {
  const jitter = (jitterPct / 100) * baseMs;
  const offset = (Math.random() * 2 - 1) * jitter;
  return Math.max(60_000, Math.round(baseMs + offset));
}

/**
 * @param {'solana' | 'base' | 'algorand'} chain
 */
async function tick(chain) {
  const c = normalizeLabChain(chain);
  if (runningByChain.has(c)) return;
  runningByChain.add(c);
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
    scheduleNext(c);
  }
}

/**
 * @param {'solana' | 'base' | 'algorand'} chain
 */
async function scheduleNext(chain) {
  const c = normalizeLabChain(chain);
  const existing = timerByChain.get(c);
  if (existing) {
    clearTimeout(existing);
    timerByChain.delete(c);
  }
  try {
    const settings = await getLabX402Settings(c);
    if (!settings.autoCallEnabled) return;
    const delay = computeJitteredDelay(settings.intervalMs, settings.jitterPct);
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
 * Start the lab x402 scheduler for all chains. Safe to call once at boot.
 */
export function startLabX402Scheduler() {
  startupVerbose('[lab-x402-scheduler] started (solana + base + algorand)');
  for (const chain of LAB_X402_CHAINS) {
    scheduleNext(chain);
  }
}

/**
 * Restart scheduler after settings change (e.g. interval updated).
 * @param {'solana' | 'base' | 'algorand'} [chain] - when omitted, restart all chains
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
