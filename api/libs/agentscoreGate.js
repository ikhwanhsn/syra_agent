/**
 * AgentScore Gate middleware for Syra merchant routes (Express).
 * Uses conditionalAgentscoreGate so anonymous x402 discovery still works.
 */
import {
  buildAgentscoreGatePolicy,
  getAgentscoreApiKey,
  isAgentscoreCaptureEnabled,
  isAgentscoreGateEnabled,
} from './agentscoreConfig.js';

/** @type {Map<string, import('express').RequestHandler>} */
const gateByContext = new Map();

/**
 * @param {{ context?: string; productName?: string }} [sessionMeta]
 * @returns {import('express').RequestHandler}
 */
export function createConditionalAgentscoreGate(sessionMeta = {}) {
  if (!isAgentscoreGateEnabled()) {
    return (_req, _res, next) => next();
  }
  if (!getAgentscoreApiKey()) {
    console.warn('[agentscore] AgentScore gate enabled but AGENTSCORE_API_KEY missing — gate disabled');
    return (_req, _res, next) => next();
  }

  const cacheKey = `${sessionMeta.context || 'syra-api'}::${sessionMeta.productName || 'Syra paid API'}`;

  return async (req, res, next) => {
    try {
      let handler = gateByContext.get(cacheKey);
      if (!handler) {
        const { conditionalAgentscoreGate } = await import('@agent-score/commerce/identity/express');
        const policy = buildAgentscoreGatePolicy({
          createSessionOnMissing: {
            apiKey: getAgentscoreApiKey(),
            context: sessionMeta.context || 'syra-api',
            productName: sessionMeta.productName || 'Syra paid API',
          },
        });
        handler = conditionalAgentscoreGate(policy);
        gateByContext.set(cacheKey, handler);
      }
      return handler(req, res, next);
    } catch (e) {
      console.error('[agentscore] gate error:', e?.message || e);
      return next();
    }
  };
}

/**
 * Fire-and-forget wallet capture after successful x402 settle.
 * @param {import('express').Request} req
 * @param {{ success?: boolean; payer?: string; transaction?: string; signature?: string }} settle
 */
export async function captureAgentscoreWalletAfterSettle(req, settle) {
  if (!isAgentscoreCaptureEnabled() || !settle?.success) return;

  try {
    const { captureWallet } = await import('@agent-score/commerce/identity/express');
    const { extractPaymentSigner } = await import('@agent-score/commerce/payment');

    let walletAddress = typeof settle.payer === 'string' ? settle.payer.trim() : '';
    let network = 'solana';

    const paymentHeader =
      req.get('payment-signature') ||
      req.get('x-payment') ||
      req.get('Payment-Signature') ||
      req.get('X-Payment');

    if (paymentHeader) {
      try {
        const signer = extractPaymentSigner(paymentHeader);
        if (signer?.address) {
          walletAddress = signer.address;
          network = signer.network === 'evm' ? 'evm' : 'solana';
        }
      } catch {
        /* fall back to settle.payer */
      }
    }

    if (!walletAddress) return;

    const idempotencyKey =
      settle.transaction ||
      settle.signature ||
      req.get('x-idempotency-key') ||
      undefined;

    await captureWallet(req, {
      walletAddress,
      network,
      ...(idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : {}),
    });
  } catch (e) {
    console.warn('[agentscore] captureWallet failed:', e?.message || e);
  }
}
