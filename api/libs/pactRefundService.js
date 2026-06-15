/**
 * Persist and log Pact SDK refund / failure events for agent wallet ledger.
 */
import PactRefund from '../models/PactRefund.js';

const USDC_DECIMALS = 1_000_000;

/**
 * @param {bigint | number | string | null | undefined} lamports
 */
function lamportsToUsd(lamports) {
  if (lamports == null) return null;
  const n = typeof lamports === 'bigint' ? Number(lamports) : Number(lamports);
  if (!Number.isFinite(n)) return null;
  return n / USDC_DECIMALS;
}

/**
 * @param {string} url
 */
function hostFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** @type {Map<string, { toolId?: string; providerHost?: string }>} */
const callContext = new Map();

/**
 * Attach tool context before an outbound paid call (best-effort).
 * @param {string} callKey
 * @param {{ toolId?: string; providerHost?: string }} ctx
 */
export function setPactCallContext(callKey, ctx) {
  if (!callKey) return;
  callContext.set(callKey, ctx);
  if (callContext.size > 500) {
    const first = callContext.keys().next().value;
    if (first) callContext.delete(first);
  }
}

/**
 * @param {import('@q3labs/pact-sdk').PactInstance} pact
 * @param {{ agentId: string; agentPubkey: string }} meta
 */
export function registerPactEventHandlers(pact, meta) {
  const { agentId, agentPubkey } = meta;

  pact.on('refund', async (event) => {
    const refundUsd = lamportsToUsd(event.refundLamports);
    const ctx = event.callId ? callContext.get(event.callId) : undefined;
    const providerHost = ctx?.providerHost ?? null;
    const toolId = ctx?.toolId ?? null;

    console.info(
      `[pact] refund agent=${agentId} callId=${event.callId} slug=${event.slug} usdc=${refundUsd ?? '?'} tx=${event.txSignature}`
    );

    try {
      await PactRefund.findOneAndUpdate(
        { callId: event.callId },
        {
          anonymousId: agentId,
          agentPubkey,
          callId: event.callId,
          slug: event.slug,
          providerHost,
          toolId,
          refundLamports: String(event.refundLamports),
          refundUsd,
          txSignature: event.txSignature,
          settledAt: event.settledAt,
          source: 'pact-sdk',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      console.warn('[pact] refund persist failed:', e?.message || e);
    }
  });

  pact.on('failure', (event) => {
    console.warn(
      `[pact] failure agent=${agentId} slug=${event.slug} outcome=${event.outcome} url=${event.url}`
    );
  });

  pact.on('billed', (event) => {
    const premiumUsd = lamportsToUsd(event.premiumLamports);
    console.info(
      `[pact] billed agent=${agentId} callId=${event.callId} premiumUsdc=${premiumUsd ?? '?'} tx=${event.txSignature}`
    );
  });

  pact.on('degraded', (event) => {
    console.warn(`[pact] degraded agent=${agentId} reason=${event.reason} url=${event.url}`);
  });

  pact.on('low-balance', (event) => {
    console.warn(
      `[pact] low-balance agent=${agentId} allowance=${event.allowanceLamports} ata=${event.ataBalanceLamports}`
    );
  });
}

export { hostFromUrl, lamportsToUsd };
