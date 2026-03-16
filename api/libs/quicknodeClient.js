/**
 * Quicknode RPC client – JSON-RPC to Quicknode endpoints (API key mode).
 * Set QUICKNODE_SOLANA_RPC_URL and/or QUICKNODE_BASE_RPC_URL in .env.
 * Used by /quicknode routes; supports balance, transaction status, and raw RPC.
 */

const SOLANA_RPC = (process.env.QUICKNODE_SOLANA_RPC_URL || "").trim();
const BASE_RPC = (process.env.QUICKNODE_BASE_RPC_URL || "").trim();

const RPC_TIMEOUT_MS = Number(process.env.QUICKNODE_RPC_TIMEOUT_MS) || 15_000;

/** @param {string} url - RPC URL
 *  @param {object} body - JSON-RPC request body
 *  @returns {Promise<{ result?: unknown; error?: { code: number; message: string }; id?: number }>}
 */
async function rpc(url, body) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(to);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: { code: res.status, message: res.statusText || "RPC request failed" }, id: body.id };
    }
    return data;
  } catch (err) {
    clearTimeout(to);
    const message = err.name === "AbortError" ? "RPC timeout" : (err.message || String(err));
    return { error: { code: -1, message }, id: body.id };
  }
}

/**
 * Solana: get balance (lamports) for a wallet.
 * @param {string} address - Base58 wallet public key
 * @returns {Promise<{ balance?: number; error?: string }>}
 */
export async function getSolanaBalance(address) {
  if (!SOLANA_RPC) {
    return { error: "QUICKNODE_SOLANA_RPC_URL not configured" };
  }
  const id = 1;
  const data = await rpc(SOLANA_RPC, {
    jsonrpc: "2.0",
    id,
    method: "getBalance",
    params: [address],
  });
  if (data.error) {
    return { error: data.error.message || "getBalance failed" };
  }
  const lamports = data.result?.value ?? data.result;
  return { balance: typeof lamports === "number" ? lamports : 0 };
}

/**
 * Solana: get transaction status (signature status).
 * @param {string} signature - Transaction signature
 * @returns {Promise<{ slot?: number; confirmations?: number; err?: unknown; status?: string }>}
 */
export async function getSolanaTransactionStatus(signature) {
  if (!SOLANA_RPC) {
    return { error: "QUICKNODE_SOLANA_RPC_URL not configured" };
  }
  const id = 1;
  const data = await rpc(SOLANA_RPC, {
    jsonrpc: "2.0",
    id,
    method: "getSignatureStatuses",
    params: [[signature]],
  });
  if (data.error) {
    return { error: data.error.message || "getSignatureStatuses failed" };
  }
  const value = data.result?.value?.[0] ?? data.result?.[0];
  if (value == null) {
    return { status: "unknown", confirmations: 0 };
  }
  const err = value.err;
  const confirmations = value.confirmations ?? (err == null ? "finalized" : 0);
  let status = "unknown";
  if (err != null) status = "failed";
  else if (confirmations === "finalized" || (typeof confirmations === "number" && confirmations > 0)) status = "confirmed";
  return {
    slot: value.slot,
    confirmations: typeof confirmations === "number" ? confirmations : (confirmations === "finalized" ? 32 : 0),
    err: err ?? undefined,
    status,
  };
}

/**
 * EVM (Base): get native balance in wei.
 * @param {string} address - 0x address
 * @returns {Promise<{ balance?: string; error?: string }>}
 */
export async function getEvmBalance(address) {
  if (!BASE_RPC) {
    return { error: "QUICKNODE_BASE_RPC_URL not configured" };
  }
  const id = 1;
  const data = await rpc(BASE_RPC, {
    jsonrpc: "2.0",
    id,
    method: "eth_getBalance",
    params: [address, "latest"],
  });
  if (data.error) {
    return { error: data.error.message || "eth_getBalance failed" };
  }
  const hex = data.result;
  return { balance: typeof hex === "string" ? hex : "0x0" };
}

/**
 * EVM: get transaction receipt (status).
 * @param {string} txHash - 0x transaction hash
 * @returns {Promise<{ status?: string; blockNumber?: string; gasUsed?: string; error?: string }>}
 */
export async function getEvmTransactionStatus(txHash) {
  if (!BASE_RPC) {
    return { error: "QUICKNODE_BASE_RPC_URL not configured" };
  }
  const id = 1;
  const data = await rpc(BASE_RPC, {
    jsonrpc: "2.0",
    id,
    method: "eth_getTransactionReceipt",
    params: [txHash],
  });
  if (data.error) {
    return { error: data.error.message || "eth_getTransactionReceipt failed" };
  }
  const receipt = data.result;
  if (receipt == null) {
    return { status: "pending" };
  }
  const status = receipt.status === "0x1" ? "success" : "failed";
  return {
    status,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
  };
}

/**
 * Raw JSON-RPC forward. Chain must be "solana" or "base".
 * @param {string} chain - "solana" | "base"
 * @param {object} body - Full JSON-RPC request (method, params, id)
 * @returns {Promise<{ result?: unknown; error?: { code: number; message: string }; id?: number }>}
 */
export async function rawRpc(chain, body) {
  const url = chain === "base" ? BASE_RPC : SOLANA_RPC;
  if (!url) {
    return { error: { code: -32603, message: `Quicknode RPC not configured for chain: ${chain}` }, id: body.id };
  }
  return rpc(url, body);
}

export const quicknodeConfig = {
  solana: !!SOLANA_RPC,
  base: !!BASE_RPC,
};
