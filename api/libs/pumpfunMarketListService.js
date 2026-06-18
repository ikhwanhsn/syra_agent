/**
 * pump.fun frontend-api-v3 market list proxy (trending / movers).
 */
const FRONTEND_API_BASE = (
  process.env.PUMP_FUN_FRONTEND_API_URL ||
  process.env.PUMP_FUN_FRONTEND_API_BASE_V3 ||
  "https://frontend-api-v3.pump.fun"
).replace(/\/$/, "");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const PRIMARY_UPSTREAM = Object.freeze({
  trending: "/coins/trending",
  movers: "/coins/movers",
});

/** When primary list endpoints return an empty body (common without JWT), use these. */
const FALLBACK_UPSTREAM = Object.freeze({
  trending: "/coins/top-runners",
  movers: "/coins/currently-live",
});

function pumpfunHeaders() {
  const headers = {
    Accept: "application/json",
    Origin: "https://pump.fun",
    Referer: "https://pump.fun/",
  };
  const token = (process.env.PUMP_FUN_FRONTEND_API_TOKEN || "").trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * @param {unknown} raw
 * @param {number} fallbackLimit
 */
export function parseListQuery(raw, fallbackLimit = DEFAULT_LIMIT) {
  const src = raw && typeof raw === "object" ? raw : {};
  let limit = fallbackLimit;
  if (src.limit != null && String(src.limit).trim() !== "") {
    const n = Number(src.limit);
    if (!Number.isFinite(n) || n < 1) throw new Error("limit must be a positive integer");
    limit = Math.min(MAX_LIMIT, Math.floor(n));
  }

  let offset = 0;
  if (src.offset != null && String(src.offset).trim() !== "") {
    const n = Number(src.offset);
    if (!Number.isFinite(n) || n < 0) throw new Error("offset must be a non-negative integer");
    offset = Math.floor(n);
  }

  let includeNsfw = false;
  if (src.includeNsfw != null && String(src.includeNsfw).trim() !== "") {
    const v = String(src.includeNsfw).trim().toLowerCase();
    includeNsfw = v === "true" || v === "1";
  }

  return { limit, offset, includeNsfw };
}

/**
 * @param {unknown} item
 */
function normalizeListItem(item) {
  if (!item || typeof item !== "object") return item;
  const row = /** @type {Record<string, unknown>} */ (item);
  if (row.coin && typeof row.coin === "object") {
    const coin = /** @type {Record<string, unknown>} */ (row.coin);
    return {
      ...coin,
      listDescription: typeof row.description === "string" ? row.description : null,
    };
  }
  return item;
}

/**
 * @param {unknown} raw
 */
function normalizeListBody(raw) {
  if (Array.isArray(raw)) {
    return raw.map(normalizeListItem);
  }
  if (raw && typeof raw === "object") {
    const o = /** @type {Record<string, unknown>} */ (raw);
    if (Array.isArray(o.coins)) return o.coins.map(normalizeListItem);
    if (Array.isArray(o.items)) return o.items.map(normalizeListItem);
    if (Array.isArray(o.data)) return o.data.map(normalizeListItem);
  }
  return [];
}

/**
 * @param {string} upstreamPath
 * @param {{ limit: number; offset: number; includeNsfw: boolean }} query
 */
async function fetchUpstreamList(upstreamPath, query) {
  const url = new URL(`${FRONTEND_API_BASE}${upstreamPath}`);
  url.searchParams.set("limit", String(query.limit));
  url.searchParams.set("offset", String(query.offset));
  url.searchParams.set("includeNsfw", String(query.includeNsfw));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: pumpfunHeaders(),
    signal: AbortSignal.timeout(25_000),
  });

  const text = await res.text();
  if (!res.ok) {
    let message = `pump.fun HTTP ${res.status}`;
    if (text) {
      try {
        const errJson = JSON.parse(text);
        if (errJson?.message) message = String(errJson.message);
      } catch {
        message = text.slice(0, 200);
      }
    }
    throw new Error(message);
  }

  if (!text || !text.trim()) {
    return { coins: [], empty: true };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("pump.fun returned invalid JSON");
  }

  return { coins: normalizeListBody(parsed), empty: false };
}

/**
 * @param {"trending" | "movers"} kind
 * @param {{ method?: string; query?: Record<string, unknown>; body?: unknown }} input
 */
export async function fetchPumpfunMarketList(kind, input = {}) {
  if (kind !== "trending" && kind !== "movers") {
    throw new Error("kind must be trending or movers");
  }

  const method = String(input.method || "GET").toUpperCase();
  const src =
    method === "POST" && input.body && typeof input.body === "object" && !Array.isArray(input.body)
      ? input.body
      : input.query;
  const query = parseListQuery(src);

  const primaryPath = PRIMARY_UPSTREAM[kind];
  let upstreamPath = primaryPath;
  let fallbackUsed = false;

  let { coins, empty } = await fetchUpstreamList(primaryPath, query);
  if (empty || coins.length === 0) {
    const fallbackPath = FALLBACK_UPSTREAM[kind];
    const fallback = await fetchUpstreamList(fallbackPath, query);
    if (!fallback.empty && fallback.coins.length > 0) {
      coins = fallback.coins;
      upstreamPath = fallbackPath;
      fallbackUsed = true;
    }
  }

  if (coins.length === 0) {
    throw new Error(
      "pump.fun returned no coins — set PUMP_FUN_FRONTEND_API_TOKEN if your deployment requires JWT auth",
    );
  }

  return {
    kind,
    coins,
    count: coins.length,
    limit: query.limit,
    offset: query.offset,
    includeNsfw: query.includeNsfw,
    upstream: {
      path: upstreamPath,
      primaryPath,
      fallbackUsed,
    },
    computedAt: new Date().toISOString(),
  };
}
