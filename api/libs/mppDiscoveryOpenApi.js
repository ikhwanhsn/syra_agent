/**
 * OpenAPI 3.1 document for MPP / AgentCash discovery (GET /openapi.json).
 * @see https://www.mppscan.com/discovery — openapi, info.guidance, paths with x-payment-info + 402.
 *
 * Paths mirror **canonical x402 URLs** (same as GET /.well-known/x402). Settlement is x402 v2 (HTTP 402);
 * `protocols: ["mpp"]` is discovery metadata for MPPscan / AgentCash. `/mpp/v1/check-status` is included
 * as the MPP-branded health check (also listed under x402 discovery).
 */
import { buildMppOpenApiPaths } from './mppOpenApiPaths.js';

const DEFAULT_SERVER = 'https://api.syraa.fun';

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
 * @returns {Record<string, unknown>}
 */
export function buildMppDiscoveryOpenApi() {
  const serverUrl = (process.env.SYRA_PUBLIC_API_URL || DEFAULT_SERVER).replace(/\/$/, '');
  const ownershipProofs = discoveryOwnershipProofs();
  const paths = buildMppOpenApiPaths();

  /** @type {Record<string, unknown>} */
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Syra API',
      version: '1.0.0',
      description:
        'Syra is the intelligence layer for autonomous trading agents—real-time market data, on-chain signals, news, sentiment, and research',
    },
    servers: [{ url: serverUrl }],
    paths,
  };

  if (ownershipProofs.length > 0) {
    doc['x-discovery'] = { ownershipProofs };
  }

  return doc;
}
