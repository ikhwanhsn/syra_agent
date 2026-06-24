/**
 * AIP-04 did:aip identity adapter — wraps @aipagents/did-resolver.
 */
import { AipDidResolver } from "@aipagents/did-resolver";
import {
  AIP_REGISTRY_PROGRAM_ID,
  AIP_DEFAULT_AGENT_ID,
  getAipCluster,
  getAipNetworkLabel,
  getAipRpcUrl,
  getSyraAipWallet,
  isAipConfigured,
} from "../config/aipConfig.js";

let _resolver = null;

/**
 * @returns {AipDidResolver}
 */
export function getAipDidResolver() {
  if (!_resolver) {
    _resolver = new AipDidResolver({
      rpcEndpoint: getAipRpcUrl(),
      programId: AIP_REGISTRY_PROGRAM_ID,
      network: getAipNetworkLabel(),
      commitment: "confirmed",
    });
  }
  return _resolver;
}

/**
 * @param {string} wallet - owner pubkey base58
 * @param {string} [agentId]
 * @returns {string}
 */
export function buildDidAip(wallet, agentId = AIP_DEFAULT_AGENT_ID) {
  return `did:aip:${wallet}:${agentId}`;
}

/**
 * @returns {string | null}
 */
export function getSyraDidAip() {
  const wallet = getSyraAipWallet();
  if (!wallet) return null;
  const agentId = process.env.SYRA_AIP_AGENT_ID?.trim() || AIP_DEFAULT_AGENT_ID;
  return buildDidAip(wallet, agentId);
}

export { isAipConfigured, getSyraAipWallet };

/**
 * Resolve any did:aip identifier.
 * @param {string} did
 */
export async function resolveDidAip(did) {
  const resolver = getAipDidResolver();
  return resolver.resolve(String(did).trim());
}

/**
 * Verify counterparty agent before A2A / payment.
 * @param {string} did
 * @returns {Promise<{ ok: true; record: import('@aipagents/did-resolver').AgentRecord; didDocument: import('@aipagents/did-resolver').DidDocument } | { ok: false; error: string; code?: string }>}
 */
export async function verifyAipCounterparty(did) {
  try {
    const result = await resolveDidAip(did);
    if ("error" in result.didResolutionMetadata) {
      const code = result.didResolutionMetadata.error;
      return {
        ok: false,
        error: `DID resolution failed: ${code}`,
        code: String(code),
      };
    }
    if (!result.agentRecord || !result.didDocument) {
      return { ok: false, error: "Agent not found on-chain", code: "notFound" };
    }
    if (result.didDocumentMetadata?.deactivated) {
      return { ok: false, error: "Agent deactivated", code: "deactivated" };
    }
    return {
      ok: true,
      record: result.agentRecord,
      didDocument: result.didDocument,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      code: "internalError",
    };
  }
}

/**
 * Syra's own on-chain AIP identity status.
 */
export async function getSyraAipStatus() {
  const did = getSyraDidAip();
  if (!did) {
    return {
      configured: false,
      wallet: null,
      did: null,
      cluster: getAipCluster(),
    };
  }
  const resolution = await resolveDidAip(did);
  const registered = Boolean(resolution.agentRecord);
  return {
    configured: true,
    wallet: getSyraAipWallet(),
    did,
    cluster: getAipCluster(),
    registered,
    agentRecord: resolution.agentRecord,
    didDocument: resolution.didDocument,
    resolutionError:
      "error" in resolution.didResolutionMetadata
        ? resolution.didResolutionMetadata.error
        : null,
  };
}
