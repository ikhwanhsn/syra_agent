/**
 * Binance Spot API client: public market data and signed account/order requests.
 * Base URL: https://api.binance.com/api/v3
 * Signed requests: timestamp + HMAC-SHA256 signature; X-MBX-APIKEY header.
 * @see https://developers.binance.com/docs/binance-spot-api-docs/rest-api/request-security
 */
import crypto from "crypto";

const BINANCE_SPOT_BASE = "https://api.binance.com/api/v3";
const CACHE_TTL_MS = 15 * 1000; // 15s for public endpoints

const publicCache = new Map(); // path+query -> { data, expiresAt }

/**
 * Build query string from object (keys sorted for deterministic signature).
 * @param {Record<string, string|number|undefined>} params
 * @returns {string}
 */
function buildQuery(params) {
  const entries = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

/**
 * Sign request for Binance SIGNED endpoints.
 * @param {string} secret - API secret key
 * @param {string} queryOrBody - query string or request body (e.g. "symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001&timestamp=1234567890")
 * @returns {string} hex HMAC-SHA256 signature
 */
export function signRequest(secret, queryOrBody) {
  return crypto.createHmac("sha256", secret).update(queryOrBody).digest("hex");
}

/**
 * Call Binance Spot public endpoint (no auth). Uses in-memory cache to reduce weight.
 * @param {string} path - e.g. "ticker/24hr" or "depth"
 * @param {Record<string, string>} [query]
 * @returns {Promise<unknown>}
 */
export async function fetchBinanceSpotPublic(path, query = {}) {
  const qs = buildQuery(query);
  const cacheKey = path + (qs ? `?${qs}` : "");
  const now = Date.now();
  const cached = publicCache.get(cacheKey);
  if (cached && now < cached.expiresAt) return cached.data;

  const url = qs ? `${BINANCE_SPOT_BASE}/${path}?${qs}` : `${BINANCE_SPOT_BASE}/${path}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data && typeof data.code === "number" && data.code !== 200) {
    throw new Error(data.msg || `Binance API error ${data.code}`);
  }
  if (!response.ok) {
    throw new Error(data.msg || `Binance ${response.status}`);
  }

  publicCache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
}

/**
 * Call Binance Spot SIGNED endpoint (account, order, etc.).
 * @param {string} apiKey
 * @param {string} secret
 * @param {string} method - GET, POST, DELETE
 * @param {string} path - e.g. "account" or "order"
 * @param {Record<string, string|number>} [query] - query params (GET) or empty for GET
 * @param {Record<string, string|number>} [body] - body params (POST/DELETE)
 * @returns {Promise<unknown>}
 */
export async function fetchBinanceSpotSigned(apiKey, secret, method, path, query = {}, body = {}) {
  const timestamp = Date.now();
  const params = { ...query, ...body, timestamp };
  const queryString = buildQuery(params);
  const signature = signRequest(secret, queryString);
  const fullQs = queryString + (queryString ? "&" : "") + "signature=" + signature;

  const url = `${BINANCE_SPOT_BASE}/${path}?${fullQs}`;
  const options = {
    method,
    headers: { "X-MBX-APIKEY": apiKey },
  };
  if ((method === "POST" || method === "DELETE") && Object.keys(body).length > 0) {
    // Binance signed POST/DELETE: params can be in query string (with signature) or in body; we put all in query for simplicity
  }
  const response = await fetch(url, options);
  const data = await response.json();

  if (data && typeof data.code !== "undefined" && data.code !== 200) {
    throw new Error(data.msg || `Binance API error ${data.code}`);
  }
  if (!response.ok) {
    throw new Error(data.msg || `Binance ${response.status}`);
  }
  return data;
}

/**
 * GET signed endpoint (e.g. account).
 */
export async function getBinanceSpotSigned(apiKey, secret, path, query = {}) {
  return fetchBinanceSpotSigned(apiKey, secret, "GET", path, query, {});
}

/**
 * POST signed endpoint (e.g. order).
 */
export async function postBinanceSpotSigned(apiKey, secret, path, body = {}) {
  const timestamp = Date.now();
  const params = { ...body, timestamp };
  const queryString = buildQuery(params);
  const signature = signRequest(secret, queryString);
  const fullQs = `${queryString}&signature=${signature}`;
  const url = `${BINANCE_SPOT_BASE}/${path}?${fullQs}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "X-MBX-APIKEY": apiKey },
  });
  const data = await response.json();
  if (data && typeof data.code !== "undefined" && data.code !== 200) {
    throw new Error(data.msg || `Binance API error ${data.code}`);
  }
  if (!response.ok) {
    throw new Error(data.msg || `Binance ${response.status}`);
  }
  return data;
}

/**
 * DELETE signed endpoint (e.g. cancel order).
 */
export async function deleteBinanceSpotSigned(apiKey, secret, path, body = {}) {
  const timestamp = Date.now();
  const params = { ...body, timestamp };
  const queryString = buildQuery(params);
  const signature = signRequest(secret, queryString);
  const fullQs = `${queryString}&signature=${signature}`;
  const url = `${BINANCE_SPOT_BASE}/${path}?${fullQs}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "X-MBX-APIKEY": apiKey },
  });
  const data = await response.json();
  if (data && typeof data.code !== "undefined" && data.code !== 200) {
    throw new Error(data.msg || `Binance API error ${data.code}`);
  }
  if (!response.ok) {
    throw new Error(data.msg || `Binance ${response.status}`);
  }
  return data;
}
