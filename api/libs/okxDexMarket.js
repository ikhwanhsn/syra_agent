/**
 * OKX DEX / On-chain Market API (web3.okx.com API v6).
 * Requires OKX API key auth: OKX_API_KEY (or OKX_ACCESS_KEY), OKX_SECRET_KEY, OKX_PASSPHRASE.
 * Used for on-chain token price, candlesticks, trades, index price by token contract address + chain.
 * See: https://web3.okx.com/onchainos/dev-docs-v5/dex-api/dex-market-price
 */
import crypto from "crypto";

const OKX_DEX_BASE = process.env.OKX_WEB3_API_BASE_URL || "https://web3.okx.com";
const OKX_TIMEOUT_MS = 20_000;

const CHAIN_NAME_TO_INDEX = {
  ethereum: "1",
  solana: "501",
  base: "8453",
  bsc: "56",
  arbitrum: "42161",
  xlayer: "196",
  tron: "195",
};

/**
 * Resolve chain name or numeric string to chainIndex.
 * @param {string} chain - e.g. "ethereum", "solana", "501", "1"
 * @returns {string} chainIndex
 */
function resolveChainIndex(chain) {
  if (!chain || typeof chain !== "string") return "1";
  const c = chain.trim().toLowerCase();
  if (CHAIN_NAME_TO_INDEX[c] != null) return CHAIN_NAME_TO_INDEX[c];
  if (/^\d+$/.test(c)) return c;
  return "1";
}

/**
 * Build OKX request signature (HMAC SHA256 + Base64).
 * Prehash = timestamp + method + requestPath + (body for POST).
 * @param {string} timestamp - ISO string
 * @param {string} method - GET or POST
 * @param {string} requestPath - e.g. /api/v6/dex/market/price
 * @param {string} [body] - JSON string for POST
 * @returns {{ signature: string; timestamp: string }}
 */
function signRequest(method, requestPath, body = "") {
  const timestamp = new Date().toISOString();
  const prehash = timestamp + method + requestPath + body;
  const signature = crypto.createHmac("sha256", getSecretKey()).update(prehash).digest("base64");
  return { signature, timestamp };
}

function getApiKey() {
  const key = process.env.OKX_API_KEY || process.env.OKX_ACCESS_KEY;
  if (!key || !key.trim()) throw new Error("OKX DEX API requires OKX_API_KEY or OKX_ACCESS_KEY");
  return key.trim();
}

function getSecretKey() {
  const key = process.env.OKX_SECRET_KEY;
  if (!key || !key.trim()) throw new Error("OKX DEX API requires OKX_SECRET_KEY");
  return key.trim();
}

function getPassphrase() {
  const p = process.env.OKX_PASSPHRASE;
  if (!p || !String(p).trim()) throw new Error("OKX DEX API requires OKX_PASSPHRASE");
  return String(p).trim();
}

/**
 * Make authenticated request to OKX web3 API.
 * @param {string} method - GET or POST
 * @param {string} path - e.g. /api/v6/dex/market/price
 * @param {Record<string, string>} [queryParams] - for GET
 * @param {object|object[]} [body] - for POST
 * @returns {Promise<{ code: string; data?: any; msg?: string }>}
 */
async function okxDexRequest(method, path, queryParams = {}, body = undefined) {
  const url = new URL(path, OKX_DEX_BASE);
  for (const [k, v] of Object.entries(queryParams)) {
    if (v != null && String(v).trim() !== "") url.searchParams.set(k, String(v).trim());
  }
  const requestPath = url.pathname + (url.search || "");
  const bodyStr = body !== undefined ? JSON.stringify(body) : "";
  const { signature, timestamp } = signRequest(method, requestPath, bodyStr);

  const headers = {
    "OK-ACCESS-KEY": getApiKey(),
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": getPassphrase(),
    Accept: "application/json",
  };
  if (method === "POST") headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OKX_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: method === "POST" ? bodyStr : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    clearTimeout(timeout);
    if (data.code !== undefined && data.code !== "0" && Number(data.code) !== 0) {
      throw new Error(data.msg || `OKX DEX API error ${data.code}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("OKX DEX API timeout");
    throw err;
  }
}

/**
 * Single token price by contract address and chain.
 * POST /api/v6/dex/market/price
 * @param {string} address - Token contract address (EVM lowercase)
 * @param {string} [chain] - Chain name or index (default ethereum)
 */
export async function getDexPrice(address, chain = "ethereum") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const body = [{ chainIndex, tokenContractAddress: tokenContractAddress.toLowerCase() }];
  const out = await okxDexRequest("POST", "/api/v6/dex/market/price", {}, body);
  return { result: out.data?.[0] ?? out.data ?? null };
}

/**
 * Batch token prices. tokens: comma-separated "chainIndex:address" or use address + chain for single chain.
 * Uses POST /api/v6/dex/market/price (array body) for multiple tokens.
 * @param {string} tokens - e.g. "1:0x...,501:So111..." or single address with chain in opts
 * @param {string} [chain] - Default chain when tokens are plain addresses
 */
export async function getDexPrices(tokens, chain = "ethereum") {
  const defaultChainIndex = resolveChainIndex(chain);
  const parts = String(tokens || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new Error("tokens is required (e.g. chainIndex:address or address with chain param)");

  const body = parts.map((p) => {
    if (p.includes(":")) {
      const [ci, addr] = p.split(":").map((s) => s.trim());
      return { chainIndex: ci || defaultChainIndex, tokenContractAddress: addr.toLowerCase() };
    }
    return {
      chainIndex: defaultChainIndex,
      tokenContractAddress: p.toLowerCase(),
    };
  });
  const out = await okxDexRequest("POST", "/api/v6/dex/market/price", {}, body);
  return { result: out.data ?? [] };
}

/**
 * Candlesticks (K-line) by token address and chain.
 * GET /api/v6/dex/market/candles
 */
export async function getDexKline(address, chain = "ethereum", opts = {}) {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim().toLowerCase() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const params = {
    chainIndex,
    tokenContractAddress,
    bar: opts.bar || "1H",
    limit: String(Math.min(Math.max(1, parseInt(opts.limit, 10) || 100), 299)),
  };
  if (opts.after) params.after = opts.after;
  if (opts.before) params.before = opts.before;
  const out = await okxDexRequest("GET", "/api/v6/dex/market/candles", params);
  return { result: out.data ?? [] };
}

/**
 * Recent trades by token address and chain.
 * GET /api/v6/dex/market/trades
 */
export async function getDexTrades(address, chain = "ethereum", opts = {}) {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim().toLowerCase() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const params = {
    chainIndex,
    tokenContractAddress,
    limit: String(Math.min(Math.max(1, parseInt(opts.limit, 10) || 100), 500)),
  };
  if (opts.after) params.after = opts.after;
  const out = await okxDexRequest("GET", "/api/v6/dex/market/trades", params);
  return { result: out.data ?? [] };
}

/**
 * Index price (aggregated from multiple sources). Empty string for native token.
 * POST /api/v6/dex/index/current-price
 */
export async function getDexIndexPrice(address, chain = "ethereum") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress =
    address == null || String(address).trim() === "" ? "" : String(address).trim().toLowerCase();
  const body = [{ chainIndex, tokenContractAddress }];
  const out = await okxDexRequest("POST", "/api/v6/dex/index/current-price", {}, body);
  return { result: out.data?.[0] ?? out.data ?? null };
}

/**
 * Batch index prices. body array of { chainIndex, tokenContractAddress }.
 */
export async function getDexIndexPrices(requests) {
  const body = Array.isArray(requests)
    ? requests.map((r) => ({
        chainIndex: resolveChainIndex(r.chain),
        tokenContractAddress:
          r.address == null || String(r.address).trim() === "" ? "" : String(r.address).trim().toLowerCase(),
      }))
    : [];
  if (body.length === 0) throw new Error("requests array is required");
  const out = await okxDexRequest("POST", "/api/v6/dex/index/current-price", {}, body);
  return { result: out.data ?? [] };
}

// ---- Signal API (REST, same auth as price/kline/trades) ----

/** GET signal supported chains. */
export async function getDexSignalChains() {
  const out = await okxDexRequest("GET", "/api/v6/dex/market/signal/supported/chain");
  return { result: out.data ?? [] };
}

/**
 * POST signal list: latest buy-direction signals on a chain.
 * @param {string} chain - e.g. solana, ethereum
 * @param {object} [opts] - walletType (1,2,3 comma), minAmountUsd, maxAmountUsd, minAddressCount, maxAddressCount, tokenAddress, minMarketCapUsd, maxMarketCapUsd, minLiquidityUsd, maxLiquidityUsd
 */
export async function getDexSignalList(chain = "solana", opts = {}) {
  const chainIndex = resolveChainIndex(chain);
  const body = [
    {
      chainIndex,
      walletType: opts.walletType ?? "1,2,3",
      minAmountUsd: opts.minAmountUsd ?? "",
      maxAmountUsd: opts.maxAmountUsd ?? "",
      minAddressCount: opts.minAddressCount ?? "",
      maxAddressCount: opts.maxAddressCount ?? "",
      tokenAddress: opts.tokenAddress ?? "",
      minMarketCapUsd: opts.minMarketCapUsd ?? "",
      maxMarketCapUsd: opts.maxMarketCapUsd ?? "",
      minLiquidityUsd: opts.minLiquidityUsd ?? "",
      maxLiquidityUsd: opts.maxLiquidityUsd ?? "",
    },
  ];
  const out = await okxDexRequest("POST", "/api/v6/dex/market/signal/list", {}, body);
  return { result: out.data ?? [] };
}

// ---- Memepump API (REST) ----

/** GET memepump supported chains and protocols. */
export async function getDexMemepumpChains() {
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/supported/chainsProtocol");
  return { result: out.data ?? [] };
}

/**
 * GET memepump token list. stage: NEW | MIGRATING | MIGRATED.
 * @param {string} [chain] - default solana
 * @param {string} [stage] - default NEW
 * @param {object} [opts] - optional filters (walletAddress, protocolIdList, minMarketCapUsd, etc.)
 */
export async function getDexMemepumpTokenList(chain = "solana", stage = "NEW", opts = {}) {
  const chainIndex = resolveChainIndex(chain);
  const params = { chainIndex, stage };
  if (opts.walletAddress != null && String(opts.walletAddress).trim() !== "")
    params.walletAddress = String(opts.walletAddress).trim();
  if (opts.protocolIdList != null && String(opts.protocolIdList).trim() !== "")
    params.protocolIdList = String(opts.protocolIdList).trim();
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/tokenList", params);
  const data = out.data;
  return { result: data?.items ?? data ?? [] };
}

/**
 * GET memepump token details.
 * @param {string} address - token contract address
 * @param {string} [chain] - default solana
 * @param {string} [walletAddress] - optional, for user position data
 */
export async function getDexMemepumpTokenDetails(address, chain = "solana", walletAddress = "") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const params = { chainIndex, tokenContractAddress };
  if (walletAddress != null && String(walletAddress).trim() !== "")
    params.walletAddress = String(walletAddress).trim();
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/tokenDetails", params);
  return { result: out.data ?? null };
}

/**
 * GET memepump token developer info.
 * @param {string} address - token contract address
 * @param {string} [chain] - default solana
 */
export async function getDexMemepumpTokenDevInfo(address, chain = "solana") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/tokenDevInfo", {
    chainIndex,
    tokenContractAddress,
  });
  return { result: out.data ?? null };
}

/**
 * GET memepump similar tokens (same creator).
 * @param {string} address - token contract address
 * @param {string} [chain] - default solana
 */
export async function getDexMemepumpSimilarTokens(address, chain = "solana") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/similarToken", {
    chainIndex,
    tokenContractAddress,
  });
  const data = out.data;
  return { result: data?.similarToken ?? data ?? [] };
}

/**
 * GET memepump token bundle (sniper) info.
 * @param {string} address - token contract address
 * @param {string} [chain] - default solana
 */
export async function getDexMemepumpTokenBundleInfo(address, chain = "solana") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/tokenBundleInfo", {
    chainIndex,
    tokenContractAddress,
  });
  return { result: out.data ?? null };
}

/**
 * GET memepump aped (co-invested) wallet list.
 * @param {string} address - token contract address
 * @param {string} [chain] - default solana
 * @param {string} [walletAddress] - optional, to highlight in response
 */
export async function getDexMemepumpApedWallet(address, chain = "solana", walletAddress = "") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = typeof address === "string" ? address.trim() : "";
  if (!tokenContractAddress) throw new Error("token address is required");
  const params = { chainIndex, tokenContractAddress };
  if (walletAddress != null && String(walletAddress).trim() !== "")
    params.walletAddress = String(walletAddress).trim();
  const out = await okxDexRequest("GET", "/api/v6/dex/market/memepump/apedWallet", params);
  const data = out.data;
  return { result: data?.apedWalletList ?? data ?? [] };
}

/** Check if OKX DEX credentials are configured (for optional routes). */
export function hasOkxDexCredentials() {
  try {
    getApiKey();
    getSecretKey();
    getPassphrase();
    return true;
  } catch {
    return false;
  }
}
