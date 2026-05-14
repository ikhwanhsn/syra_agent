const RISE_DEFAULT_BASE_URL = "https://public.rise.rich";
const RISE_PROGRAM_DEFAULT_BASE_URL = "https://api.rise.rich";

/** Rise vendor limit: max HTTP requests started per rolling second (single Node process). */
const RISE_MAX_RPS = (() => {
  const raw = Number(process.env.RISE_MAX_REQUESTS_PER_SECOND);
  if (Number.isFinite(raw) && raw > 0) return Math.min(100, Math.floor(raw));
  return 100;
})();
const RISE_RATE_WINDOW_MS = 1000;

const riseRequestTimestamps = [];
/** Serialized gate so concurrent callers cannot slip past the sliding-window check. */
let riseRateGate = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until a new Rise HTTP request may start without exceeding RISE_MAX_RPS
 * over the previous rolling second (sliding window). Applies per Node process;
 * scale horizontally only if total instances × RISE_MAX_RPS ≤ vendor cap.
 */
async function acquireRiseRateSlot() {
  const prev = riseRateGate;
  let resolveNext;
  riseRateGate = new Promise((resolve) => {
    resolveNext = resolve;
  });
  await prev;
  try {
    for (;;) {
      const now = Date.now();
      while (riseRequestTimestamps.length > 0 && riseRequestTimestamps[0] <= now - RISE_RATE_WINDOW_MS) {
        riseRequestTimestamps.shift();
      }
      if (riseRequestTimestamps.length < RISE_MAX_RPS) {
        riseRequestTimestamps.push(now);
        return;
      }
      const waitMs = riseRequestTimestamps[0] + RISE_RATE_WINDOW_MS - now + 1;
      await sleep(Math.max(1, Math.ceil(waitMs)));
    }
  } finally {
    resolveNext();
  }
}

function getRiseConfig() {
  const apiKey = String(process.env.RISE_API_KEY || "").trim();
  const baseUrl = String(process.env.RISE_API_BASE_URL || RISE_DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  return {
    apiKey,
    baseUrl,
    configured: Boolean(apiKey),
  };
}

function getRiseProgramApiBaseUrl() {
  return String(process.env.RISE_PROGRAM_API_BASE_URL || RISE_PROGRAM_DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, "");
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && String(value).trim() !== ""
  );
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

/**
 * @param {string} path
 * @param {{ method?: string, query?: Record<string, unknown>, body?: unknown, baseUrl?: string }} [options]
 */
async function riseRequest(path, options = {}) {
  const cfg = getRiseConfig();
  if (!cfg.configured) {
    return { ok: false, error: "RISE API is not configured. Set RISE_API_KEY in server env.", status: 503 };
  }

  await acquireRiseRateSlot();

  const method = options.method || "GET";
  const query = buildQuery(options.query);
  const base = typeof options.baseUrl === "string" && options.baseUrl.trim() ? options.baseUrl.trim().replace(/\/+$/, "") : cfg.baseUrl;
  const url = `${base}${path}${query}`;
  const headers = {
    "x-api-key": cfg.apiKey,
    ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: json?.error || `RISE request failed (${response.status})`,
      };
    }
    return { ok: true, data: json };
  } catch (error) {
    return { ok: false, status: 502, error: error?.message || "RISE request failed" };
  }
}

export function hasRiseConfig() {
  return getRiseConfig().configured;
}

export function riseGetMarkets(params = {}) {
  return riseRequest("/markets", { method: "GET", query: params });
}

export function riseGetMarketByAddress(address) {
  return riseRequest(`/markets/${encodeURIComponent(address)}`, { method: "GET" });
}

export function riseGetMarketTransactions(address, params = {}) {
  return riseRequest(`/markets/${encodeURIComponent(address)}/transactions`, { method: "GET", query: params });
}

export function riseGetMarketOhlc(address, timeframe, params = {}) {
  return riseRequest(`/markets/${encodeURIComponent(address)}/ohlc/${encodeURIComponent(timeframe)}`, {
    method: "GET",
    query: params,
  });
}

export function risePostMarketQuote(address, body) {
  return riseRequest(`/markets/${encodeURIComponent(address)}/quote`, { method: "POST", body });
}

export function risePostBuyToken(body) {
  return riseRequest("/program/buyToken", { method: "POST", body });
}

export function risePostSellToken(body) {
  return riseRequest("/program/sellToken", { method: "POST", body });
}

export function riseGetPortfolioSummary(wallet) {
  return riseRequest(`/users/${encodeURIComponent(wallet)}/portfolio/summary`, { method: "GET" });
}

export function riseGetPortfolioPositions(wallet, params = {}) {
  return riseRequest(`/users/${encodeURIComponent(wallet)}/portfolio/positions`, { method: "GET", query: params });
}

export function risePostBorrowQuote(address, body) {
  return riseRequest(`/markets/${encodeURIComponent(address)}/borrow/quote`, { method: "POST", body });
}

export function risePostDepositAndBorrow(body) {
  return riseRequest("/program/deposit-and-borrow", { method: "POST", body });
}

export function risePostRepayAndWithdraw(body) {
  return riseRequest("/program/repay-and-withdraw", { method: "POST", body });
}

/** Token creation lives on api.rise.rich (not public.rise.rich). */
export function risePostCreateToken(body) {
  return riseRequest("/program/create", {
    method: "POST",
    body,
    baseUrl: getRiseProgramApiBaseUrl(),
  });
}

export function riseGetMarketsStreamNewNote() {
  return {
    ok: true,
    data: {
      success: true,
      message:
        "SSE stream endpoint is GET /markets/stream/new. Use EventSource on the client or a dedicated stream worker.",
    },
  };
}
