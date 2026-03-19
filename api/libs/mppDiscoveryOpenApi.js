/**
 * OpenAPI 3.1 document for MPP / AgentCash discovery (GET /openapi.json).
 * @see https://www.mppscan.com/discovery — requires openapi, info.guidance, paths with x-payment-info + 402.
 */
import { X402_API_PRICE_CHECK_STATUS_USD } from '../config/x402Pricing.js';

const DEFAULT_SERVER = 'https://api.syraa.fun';

/**
 * @param {number} n
 * @returns {string} Non-scientific USD string for OpenAPI `price` (fixed mode).
 */
function usdPriceString(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return '0';
  const s = x.toFixed(10).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

/**
 * @returns {string[]}
 */
function discoveryOwnershipProofs() {
  const proofs = [];
  if (process.env.X402_OWNERSHIP_PROOF_EVM?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF_EVM.trim());
  }
  if (process.env.X402_OWNERSHIP_PROOF_SVM?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF_SVM.trim());
  }
  if (proofs.length === 0 && process.env.X402_OWNERSHIP_PROOF?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF.trim());
  }
  return proofs;
}

/**
 * Build the discovery document. Price matches live /mpp/v1/check-status (x402 tier).
 * @returns {Record<string, unknown>}
 */
export function buildMppDiscoveryOpenApi() {
  const serverUrl = (process.env.SYRA_PUBLIC_API_URL || DEFAULT_SERVER).replace(/\/$/, '');
  const price = usdPriceString(X402_API_PRICE_CHECK_STATUS_USD);
  const ownershipProofs = discoveryOwnershipProofs();

  const paymentInfo = {
    protocols: ['mpp'],
    pricingMode: 'fixed',
    price,
  };

  /** @type {Record<string, unknown>} */
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Syra API',
      version: '1.0.0',
      description:
        'Syra crypto intelligence and agent API. Documented paths are the MPP discovery lane; runtime payment challenges use x402 v2 (HTTP 402 + PAYMENT-SIGNATURE) compatible with AgentCash and x402 wallets.',
      guidance:
        'Call GET or POST /mpp/v1/check-status without payment to receive HTTP 402 with an x402 payment challenge. Complete payment, then retry with the proof header. This lane mirrors pricing and settlement of /check-status. Full x402 resource list: GET https://api.syraa.fun/.well-known/x402 — human docs: https://docs.syraa.fun',
    },
    servers: [{ url: serverUrl }],
    paths: {
      '/mpp/v1/check-status': {
        get: {
          description:
            'MPP discovery health check: JSON status when payment succeeds. Fixed-price; same x402 v2 facilitator flow as /check-status.',
          'x-payment-info': paymentInfo,
          responses: {
            '200': {
              description: 'OK — includes status, message, protocol, paymentCompatibility',
            },
            '402': { description: 'Payment Required' },
          },
        },
        post: {
          description:
            'Same as GET for clients that use POST (optional JSON body). Fixed-price x402 v2.',
          'x-payment-info': paymentInfo,
          responses: {
            '200': {
              description: 'OK — includes status, message, protocol, paymentCompatibility',
            },
            '402': { description: 'Payment Required' },
          },
        },
      },
    },
  };

  if (ownershipProofs.length > 0) {
    doc['x-discovery'] = { ownershipProofs };
  }

  return doc;
}
