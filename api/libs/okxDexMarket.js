/**
 * OKX DEX / On-chain Market API (web3.okx.com API v6).
 * Requires OKX API key auth: OKX_API_KEY (or OKX_ACCESS_KEY), OKX_SECRET_KEY, OKX_PASSPHRASE.
 * Used for on-chain token price, candlesticks, trades, index price by token contract address + chain.
 * See: https://web3.okx.com/build/dev-docs-v5/dex-api/dex-market-price
 *
 * Create API keys: https://web3.okx.com/onchain-os/dev-docs/home/developer-portal
 * Env (all optional except credentials):
 *   OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE — from Developer Portal (API keys page)
 *   OKX_WEB3_API_BASE_URL — default https://web3.okx.com
 *   OKX_DEX_TIMEOUT_MS    — request timeout (default 60000)
 *   OKX_DEX_RETRIES       — retries on timeout/connection errors (default 2)
 *   OKX_DEX_RETRY_DELAY_MS — delay between retries (default 2000)
 *   OKX_DEX_SECURE_SSL    — set to 1 to verify SSL (default: allow self-signed for proxy)
 *   OKX_DEX_DNS_BYPASS    — set to 0 to disable custom DNS resolution (default: enabled)
 *   OKX_DEX_DNS_SERVERS   — comma-separated DNS servers for bypass (default: 8.8.8.8,1.1.1.1)
 *   OKX_DEX_DNS_TTL_MS    — DNS cache TTL in ms (default: 300000 = 5 min)
 */
import crypto from "crypto";
import https from "https";
import dns from "dns";
import axios from "axios";

const OKX_DEX_BASE = process.env.OKX_WEB3_API_BASE_URL || "https://web3.okx.com";
const OKX_TIMEOUT_MS = Math.max(15_000, Number(process.env.OKX_DEX_TIMEOUT_MS) || 60_000);
const OKX_DEX_RETRIES = Math.min(3, Math.max(0, parseInt(process.env.OKX_DEX_RETRIES, 10) || 2));
const OKX_DEX_RETRY_DELAY_MS = Number(process.env.OKX_DEX_RETRY_DELAY_MS) || 2_000;

// --- DNS bypass for ISP-level domain blocking (e.g. web3.okx.com blocked in some regions) ---

const OKX_DNS_BYPASS = !/^(0|false|no)$/i.test(String(process.env.OKX_DEX_DNS_BYPASS ?? "").trim());
const OKX_DNS_SERVERS = (process.env.OKX_DEX_DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const OKX_DNS_TTL_MS = Math.max(10_000, Number(process.env.OKX_DEX_DNS_TTL_MS) || 300_000);

const _dnsCache = new Map();
let _dnsResolver = null;

function getDnsResolver() {
  if (_dnsResolver) return _dnsResolver;
  _dnsResolver = new dns.Resolver();
  _dnsResolver.setServers(OKX_DNS_SERVERS);
  return _dnsResolver;
}

/**
 * Resolve hostname to IP using custom DNS servers (bypasses ISP DNS hijacking).
 * Caches results for OKX_DNS_TTL_MS.
 */
async function resolveHostBypass(hostname) {
  const cached = _dnsCache.get(hostname);
  if (cached && Date.now() - cached.ts < OKX_DNS_TTL_MS) return cached.addresses;

  const resolver = getDnsResolver();
  const addresses = await new Promise((resolve, reject) => {
    resolver.resolve4(hostname, (err, addrs) => {
      if (err) return reject(err);
      resolve(addrs);
    });
  });
  _dnsCache.set(hostname, { addresses, ts: Date.now() });
  return addresses;
}

/** Cached agents; created lazily so process.env is read after dotenv has loaded. */
let _httpsAgent = null;
let _bypassAgent = null;
let _bypassServername = null;

function getHttpsAgent(servername) {
  if (servername) {
    if (_bypassAgent && _bypassServername === servername) return _bypassAgent;
    _bypassServername = servername;
    _bypassAgent = new https.Agent({ rejectUnauthorized: true, servername });
    return _bypassAgent;
  }
  if (_httpsAgent !== null) return _httpsAgent;
  const secureOnly = /^(1|true|yes)$/i.test(String(process.env.OKX_DEX_SECURE_SSL ?? "").trim());
  _httpsAgent = secureOnly ? undefined : new https.Agent({ rejectUnauthorized: false });
  return _httpsAgent;
}

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

/** Solana chain index; Solana addresses are base58 and must not be lowercased. */
const SOLANA_CHAIN_INDEX = "501";

/**
 * Normalize token contract address for the given chain.
 * EVM chains use lowercase addresses; Solana (501) uses case-sensitive base58 — do not lowercase.
 * @param {string} address - Token contract address
 * @param {string} chainIndex - e.g. "1", "501", "196"
 * @returns {string}
 */
function normalizeTokenAddress(address, chainIndex) {
  const addr = typeof address === "string" ? address.trim() : "";
  if (!addr) return addr;
  if (chainIndex === SOLANA_CHAIN_INDEX) return addr;
  return addr.toLowerCase();
}

/**
 * Build OKX request signature (HMAC SHA256 + Base64).
 * Prehash = timestamp + method + requestPath + (body for POST).
 * Timestamp format must match OKX docs: ISO 8601 without fractional seconds (e.g. 2020-12-08T09:08:57Z).
 * @see https://web3.okx.com/build/dev-docs-v5/dex-api/dex-api-access-and-usage
 */
function signRequest(method, requestPath, body = "") {
  const timestamp = new Date().toISOString().slice(0, -5) + "Z";
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
 * Uses axios (not fetch) to avoid Node/undici 10s connect timeout; timeout is configurable via OKX_DEX_TIMEOUT_MS.
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

  // DNS bypass: resolve hostname via custom DNS to circumvent ISP-level blocking
  let requestUrl = url.toString();
  let agent;
  if (OKX_DNS_BYPASS && url.hostname) {
    try {
      const ips = await resolveHostBypass(url.hostname);
      if (ips && ips.length > 0) {
        const ip = ips[Math.floor(Math.random() * ips.length)];
        requestUrl = url.toString().replace(url.hostname, ip);
        headers["Host"] = url.hostname;
        agent = getHttpsAgent(url.hostname);
      }
    } catch (_dnsErr) {
      // DNS bypass failed — fall through to normal resolution
      agent = getHttpsAgent();
    }
  } else {
    agent = getHttpsAgent();
  }

  const isRetryable = (e) => {
    const code = e?.code || e?.cause?.code;
    return (
      code === "ETIMEDOUT" ||
      code === "ECONNABORTED" ||
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      code === "EAI_AGAIN" ||
      (axios.isAxiosError(e) && (e.code === "ECONNABORTED" || e.message?.includes("timeout")))
    );
  };

  let lastErr;
  for (let attempt = 0; attempt <= OKX_DEX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, OKX_DEX_RETRY_DELAY_MS));
        // Re-sign on retry (timestamp must be fresh)
        const { signature: sig2, timestamp: ts2 } = signRequest(method, requestPath, bodyStr);
        headers["OK-ACCESS-SIGN"] = sig2;
        headers["OK-ACCESS-TIMESTAMP"] = ts2;
      }
      const res = await axios({
        method,
        url: requestUrl,
        headers,
        data: method === "POST" ? bodyStr : undefined,
        timeout: OKX_TIMEOUT_MS,
        validateStatus: () => true,
        ...(agent && { httpsAgent: agent }),
      });
      const data = res.data && typeof res.data === "object" ? res.data : {};
      if (res.status !== 200) {
        const msg = data?.msg || data?.message || data?.error || res.statusText || `HTTP ${res.status}`;
        const authHint =
          res.status === 401 || res.status === 403
            ? " Create or copy API key, secret key, and passphrase from https://web3.okx.com/build/dev-portal (API keys page)."
            : "";
        throw new Error(`OKX DEX API error: ${msg}${authHint}`);
      }
      if (data.code !== undefined && data.code !== "0" && Number(data.code) !== 0) {
        const code = String(data.code);
        if (code === "50125" || code === "80001") {
          throw new Error(
            "Service is not available in your region. Please switch to a supported region and try again."
          );
        }
        const authHint =
          code === "50111" || code === "50112" || code === "50113"
            ? " Check OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE in api/.env. Create keys at https://web3.okx.com/build/dev-portal."
            : "";
        throw new Error((data.msg || `OKX DEX API error ${data.code}`) + authHint);
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < OKX_DEX_RETRIES && isRetryable(err)) continue;
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          throw new Error(
            `OKX DEX API timeout (${OKX_TIMEOUT_MS}ms). Increase OKX_DEX_TIMEOUT_MS in api/.env (e.g. 90000) or check firewall/proxy for web3.okx.com.`
          );
        }
        const isCertError =
          err.code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
          err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
          err.message?.includes("self-signed") ||
          err.message?.includes("certificate");
        const causeMsg = err.message || String(err);
        const code = err.code ? ` (${err.code})` : "";
        const certHint = isCertError
          ? " If behind a corporate proxy, ensure OKX_DEX_SECURE_SSL is not set."
          : "";
        const timeoutHint =
          code === " (ETIMEDOUT)" || causeMsg.includes("timeout")
            ? ` Increase OKX_DEX_TIMEOUT_MS (current ${OKX_TIMEOUT_MS}ms) or OKX_DEX_RETRIES in api/.env.`
            : "";
        throw new Error(
          `OKX DEX API unreachable${code}: ${causeMsg}. Check network/firewall and OKX credentials (OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE in api/.env).${certHint}${timeoutHint}`
        );
      }
      if (err.message === "fetch failed" && err.cause) {
        const cause = err.cause;
        const causeMsg = cause?.message || String(cause);
        const code = cause?.code ? ` (${cause.code})` : "";
        throw new Error(
          `OKX DEX API unreachable${code}: ${causeMsg}. Check network, firewall, and OKX_API_KEY/OKX_SECRET_KEY/OKX_PASSPHRASE in api/.env.`
        );
      }
      if (err.message === "fetch failed") {
        throw new Error("OKX DEX API unreachable: fetch failed. Check network and OKX credentials.");
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Single token price by contract address and chain.
 * POST /api/v6/dex/market/price
 * @param {string} address - Token contract address (EVM lowercase)
 * @param {string} [chain] - Chain name or index (default ethereum)
 */
export async function getDexPrice(address, chain = "ethereum") {
  const chainIndex = resolveChainIndex(chain);
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
  if (!tokenContractAddress) throw new Error("token address is required");
  const body = [{ chainIndex, tokenContractAddress }];
  const out = await okxDexRequest("POST", "/api/v6/dex/market/price", {}, body);
  // OKX returns data: [] when it has no price for this token/chain; normalize to null for single-token endpoint
  const raw = out.data;
  if (Array.isArray(raw) && raw.length === 0) return { result: null };
  return { result: raw?.[0] ?? raw ?? null };
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
      const chainIndex = ci || defaultChainIndex;
      return { chainIndex, tokenContractAddress: normalizeTokenAddress(addr, chainIndex) };
    }
    return {
      chainIndex: defaultChainIndex,
      tokenContractAddress: normalizeTokenAddress(p, defaultChainIndex),
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
    address == null || String(address).trim() === ""
      ? ""
      : normalizeTokenAddress(String(address).trim(), chainIndex);
  const body = [{ chainIndex, tokenContractAddress }];
  const out = await okxDexRequest("POST", "/api/v6/dex/index/current-price", {}, body);
  return { result: out.data?.[0] ?? out.data ?? null };
}

/**
 * Batch index prices. body array of { chainIndex, tokenContractAddress }.
 */
export async function getDexIndexPrices(requests) {
  const body = Array.isArray(requests)
    ? requests.map((r) => {
        const chainIndex = resolveChainIndex(r.chain);
        const tokenContractAddress =
          r.address == null || String(r.address).trim() === ""
            ? ""
            : normalizeTokenAddress(String(r.address).trim(), chainIndex);
        return { chainIndex, tokenContractAddress };
      })
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
  const body = { chainIndex, walletType: opts.walletType ?? "1,2,3" };
  if (opts.minAmountUsd) body.minAmountUsd = opts.minAmountUsd;
  if (opts.maxAmountUsd) body.maxAmountUsd = opts.maxAmountUsd;
  if (opts.minAddressCount) body.minAddressCount = opts.minAddressCount;
  if (opts.maxAddressCount) body.maxAddressCount = opts.maxAddressCount;
  if (opts.tokenAddress) body.tokenAddress = opts.tokenAddress;
  if (opts.minMarketCapUsd) body.minMarketCapUsd = opts.minMarketCapUsd;
  if (opts.maxMarketCapUsd) body.maxMarketCapUsd = opts.maxMarketCapUsd;
  if (opts.minLiquidityUsd) body.minLiquidityUsd = opts.minLiquidityUsd;
  if (opts.maxLiquidityUsd) body.maxLiquidityUsd = opts.maxLiquidityUsd;
  const out = await okxDexRequest("POST", "/api/v6/dex/market/signal/list", {}, body);
  const data = out.data;
  return { result: Array.isArray(data) ? data : data?.list ?? data ?? [] };
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
  const tokenContractAddress = normalizeTokenAddress(address, chainIndex);
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
