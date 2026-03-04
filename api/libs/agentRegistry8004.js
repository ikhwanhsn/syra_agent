/**
 * Read-only wrapper around 8004-solana SDK for the Trustless Agent Registry on Solana.
 * Used by the /8004 API routes. No signer required.
 * @see https://8004.qnt.sh/skill.md
 */
import { PublicKey } from "@solana/web3.js";
import { SolanaSDK } from "8004-solana";

let sdkInstance = null;

const IPFS_GATEWAY_TIMEOUT_MS = 10000;
const IPFS_GATEWAY_MAX_BYTES = 512 * 1024; // 512 KB

/**
 * Minimal IPFS read-only client that resolves ipfs:// URIs via public HTTP gateway.
 * Used so liveness (and other read paths) can load agent metadata without a full IPFS node.
 * Only getJson(uri) is used by the SDK for liveness; addJson/upload are not needed for read-only.
 */
const gatewayIpfsReader = {
  async getJson(uri) {
    const trimmed = String(uri).trim();
    let cid = trimmed;
    if (cid.startsWith("ipfs://")) cid = cid.slice(7).replace(/^\/+/, "");
    else if (cid.startsWith("/ipfs/")) cid = cid.slice(6).replace(/^\/+/, "");
    else throw new Error("Gateway IPFS reader only supports ipfs:// or /ipfs/ URIs");
    const cidOnly = cid.split("/")[0];
    const url = `https://ipfs.io/ipfs/${encodeURIComponent(cidOnly)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(IPFS_GATEWAY_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`IPFS gateway error: HTTP ${res.status}`);
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > IPFS_GATEWAY_MAX_BYTES) {
      throw new Error(`IPFS content too large: ${contentLength} bytes`);
    }
    const text = await res.text();
    if (text.length > IPFS_GATEWAY_MAX_BYTES) throw new Error("IPFS response too large");
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Invalid JSON payload: expected object");
    }
    return data;
  },
};

/**
 * Get a read-only SolanaSDK instance (no signer). Uses SOLANA_CLUSTER and SOLANA_RPC_URL from env.
 * Includes a gateway-based IPFS reader so liveness can load ipfs:// agent metadata.
 * @returns {SolanaSDK}
 */
function getReadOnlySDK() {
  if (!sdkInstance) {
    const cluster = process.env.SOLANA_CLUSTER || "mainnet-beta";
    const rpcUrl =
      process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_FALLBACK_URL;
    sdkInstance = new SolanaSDK({
      cluster,
      ...(rpcUrl && { rpcUrl }),
      ipfsClient: gatewayIpfsReader,
      // no signer = read-only
    });
  }
  return sdkInstance;
}

/**
 * Parse base58 string to PublicKey; throw if invalid.
 * @param {string} base58
 * @returns {PublicKey}
 */
function toPublicKey(base58) {
  if (!base58 || typeof base58 !== "string") {
    throw new Error("Invalid public key: expected base58 string");
  }
  try {
    return new PublicKey(base58.trim());
  } catch (e) {
    throw new Error(`Invalid public key: ${e.message}`);
  }
}

/**
 * Serialize object for JSON: PublicKey -> base58, BigInt -> string.
 * @param {unknown} obj
 * @returns {unknown}
 */
function toJsonSafe(obj) {
  if (obj == null) return obj;
  if (typeof obj === "bigint") return String(obj);
  if (obj && typeof obj === "object" && typeof obj.toBase58 === "function") {
    return obj.toBase58();
  }
  if (Array.isArray(obj)) return obj.map(toJsonSafe);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = toJsonSafe(v);
    }
    return out;
  }
  return obj;
}

// --- Liveness & integrity ---

export async function getLiveness(assetBase58, options = {}) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const report = await sdk.isItAlive(asset, options);
  return toJsonSafe(report);
}

export async function getIntegrity(assetBase58) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const result = await sdk.verifyIntegrity(asset);
  return toJsonSafe(result);
}

export async function getIntegrityDeep(assetBase58, options = {}) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const result = await sdk.verifyIntegrityDeep(asset, options);
  return toJsonSafe(result);
}

export async function getIntegrityFull(assetBase58, options = {}) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const result = await sdk.verifyIntegrityFull(asset, options);
  return toJsonSafe(result);
}

// --- Discovery & search ---

export async function searchAgents(params = {}) {
  const sdk = getReadOnlySDK();
  const result = await sdk.searchAgents(params);
  return toJsonSafe(result);
}

export async function getLeaderboard(options = {}) {
  const sdk = getReadOnlySDK();
  const result = await sdk.getLeaderboard(options);
  return toJsonSafe(result);
}

export async function getGlobalStats() {
  const sdk = getReadOnlySDK();
  const result = await sdk.getGlobalStats();
  return toJsonSafe(result);
}

export async function getAgentByWallet(walletBase58) {
  const sdk = getReadOnlySDK();
  const wallet = walletBase58?.trim?.() || walletBase58;
  const result = await sdk.getAgentByWallet(wallet);
  return toJsonSafe(result);
}

// --- Read-only / introspection ---

export async function loadAgent(assetBase58) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const agent = await sdk.loadAgent(asset);
  if (!agent) return null;
  // AgentAccount-like: expose common fields as base58
  const owner = agent.getOwnerPublicKey?.();
  const agentWallet = agent.getAgentWalletPublicKey?.();
  const assetPk = agent.getAssetPublicKey?.();
  return {
    asset: assetPk ? assetPk.toBase58() : assetBase58,
    owner: owner ? owner.toBase58() : null,
    agentWallet: agentWallet ? agentWallet.toBase58() : null,
    agent_uri: agent.agent_uri ?? null,
    col_locked: agent.col_locked ?? null,
    parent_locked: agent.parent_locked ?? null,
  };
}

export async function agentExists(assetBase58) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  return sdk.agentExists(asset);
}

export async function getAgentOwner(assetBase58) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  const owner = await sdk.getAgentOwner(asset);
  return owner ? owner.toBase58() : null;
}

export async function getMetadata(assetBase58, key) {
  const sdk = getReadOnlySDK();
  const asset = toPublicKey(assetBase58);
  return sdk.getMetadata(asset, key);
}

export async function getAgentsByOwner(ownerBase58, options = {}) {
  const sdk = getReadOnlySDK();
  const owner = toPublicKey(ownerBase58);
  const agents = await sdk.getAgentsByOwner(owner, options);
  return toJsonSafe(agents);
}

// --- SDK introspection ---

export async function getChainId() {
  const sdk = getReadOnlySDK();
  return sdk.chainId();
}

export async function getProgramIds() {
  const sdk = getReadOnlySDK();
  const ids = sdk.getProgramIds();
  return toJsonSafe(ids);
}

export async function getBaseCollection() {
  const sdk = getReadOnlySDK();
  const pk = await sdk.getBaseCollection();
  return pk ? pk.toBase58() : null;
}

/** Resolve agent registration JSON (name, description, image) from agent_uri. For marketplace cards. */
export async function getAgentRegistrationMetadata(assetBase58) {
  const agent = await loadAgent(assetBase58);
  if (!agent?.agent_uri) return null;
  const uri = String(agent.agent_uri).trim();
  let url = uri;
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice(7).replace(/^\/+/, "");
    url = `https://ipfs.io/ipfs/${cid}`;
  } else if (uri.startsWith("/ipfs/")) {
    url = `https://ipfs.io${uri}`;
  }
  if (!url.startsWith("http")) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json || typeof json !== "object") return null;

  let image = json.image ?? null;
  if (image && typeof image === "string") {
    image = image.trim();
    if (image.startsWith("ipfs://")) {
      const cid = image.slice(7).replace(/^\/+/, "");
      image = `https://ipfs.io/ipfs/${cid}`;
    } else if (image.startsWith("/ipfs/")) {
      image = `https://ipfs.io${image}`;
    }
  }

  return {
    name: json.name ?? null,
    description: json.description ?? null,
    image: image || null,
  };
}
