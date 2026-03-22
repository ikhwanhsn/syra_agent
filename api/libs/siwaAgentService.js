/**
 * SIWA nonce + verify for agent-only calls (no public /siwa HTTP routes).
 * Uses the same env and nonce store as the former siwa router.
 */
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const RECEIPT_SECRET = (process.env.RECEIPT_SECRET || "").trim();
const SIWA_RPC_URL = (process.env.SIWA_RPC_URL || process.env.ETH_RPC_URL || "").trim();
const SIWA_DOMAIN = (process.env.SIWA_DOMAIN || "api.syraa.fun").trim();

const nonceStore = new Map();

let siwaModule = null;
try {
  siwaModule = await import("@buildersgarden/siwa");
} catch {
  // optional
}

function getClient() {
  if (!SIWA_RPC_URL) return null;
  return createPublicClient({
    chain: mainnet,
    transport: http(SIWA_RPC_URL),
  });
}

function siwaUnavailable() {
  return { ok: false, error: "SIWA not configured. Set RECEIPT_SECRET (min 32 chars) and SIWA_RPC_URL (or ETH_RPC_URL). Install @buildersgarden/siwa.", status: 503 };
}

/**
 * @param {Record<string, string>} body
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: string, status?: number }>}
 */
export async function runSiwaNonce(body) {
  if (!siwaModule?.createSIWANonce || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable();
  const client = getClient();
  if (!client) return siwaUnavailable();
  const { address, agentId, agentRegistry } = body || {};
  if (!address || agentId == null) {
    return { ok: false, error: "address and agentId required", status: 400 };
  }
  try {
    const result = await siwaModule.createSIWANonce(
      { address, agentId: Number(agentId), agentRegistry: agentRegistry || undefined },
      client
    );
    nonceStore.set(result.nonce, Date.now());
    return {
      ok: true,
      data: {
        nonce: result.nonce,
        issuedAt: result.issuedAt,
        expirationTime: result.expirationTime,
      },
    };
  } catch (err) {
    return { ok: false, error: err?.message || "SIWA nonce failed", status: 500 };
  }
}

/**
 * @param {Record<string, string>} body
 * @param {string | undefined} hostHeader
 */
export async function runSiwaVerify(body, hostHeader) {
  if (!siwaModule?.verifySIWA || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable();
  const client = getClient();
  if (!client) return siwaUnavailable();
  const { message, signature } = body || {};
  if (!message || !signature) {
    return { ok: false, error: "message and signature required", status: 400 };
  }
  const domain = hostHeader || SIWA_DOMAIN;
  const checkNonce = (nonce) => {
    if (!nonceStore.has(nonce)) return false;
    nonceStore.delete(nonce);
    return true;
  };
  try {
    const result = await siwaModule.verifySIWA(message, signature, domain, checkNonce, client);
    if (!result.valid) {
      return { ok: false, error: result.error || "verify failed", status: 401, data: { valid: false, error: result.error } };
    }
    let receipt = null;
    try {
      const { createReceipt } = await import("@buildersgarden/siwa/receipt");
      const created = createReceipt(
        {
          address: result.address,
          agentId: result.agentId,
          agentRegistry: result.agentRegistry,
          chainId: result.chainId,
          signerType: result.signerType,
        },
        { secret: RECEIPT_SECRET }
      );
      receipt = created?.receipt;
    } catch {
      /* optional */
    }
    return {
      ok: true,
      data: { valid: true, agentId: result.agentId, address: result.address, receipt },
    };
  } catch (err) {
    return { ok: false, error: err?.message || "SIWA verify failed", status: 500 };
  }
}
