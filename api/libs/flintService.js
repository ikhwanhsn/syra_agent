/**
 * Flint market-data service — cached public MD for x402 Spend tools.
 * Not a maker/taker execution layer (see docs/flint-integration.md).
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";
import {
  flintExternalTape,
  flintGetBook,
  flintGetCandles,
  flintGetFills,
  flintGetSummary,
  flintListPairs,
  normalizePairInput,
} from "./flintClient.js";

const PAIRS_TTL_MS = 60_000;
const BOOK_TTL_MS = 5_000;
const STATS_TTL_MS = 30_000;
const CANDLES_TTL_MS = 60_000;
const TAPE_TTL_MS = 5_000;

const pairsCache = createBoundedTtlCache({
  name: "flint-pairs",
  maxEntries: 8,
  defaultTtlMs: PAIRS_TTL_MS,
});
const bookCache = createBoundedTtlCache({
  name: "flint-book",
  maxEntries: 200,
  defaultTtlMs: BOOK_TTL_MS,
});
const statsCache = createBoundedTtlCache({
  name: "flint-stats",
  maxEntries: 8,
  defaultTtlMs: STATS_TTL_MS,
});
const candlesCache = createBoundedTtlCache({
  name: "flint-candles",
  maxEntries: 200,
  defaultTtlMs: CANDLES_TTL_MS,
});
const tapeCache = createBoundedTtlCache({
  name: "flint-external-tape",
  maxEntries: 100,
  defaultTtlMs: TAPE_TTL_MS,
});

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
function sourceParams(req) {
  return req.method === "POST" ? req.body ?? {} : req.query ?? {};
}

/**
 * Resolve pair from query/body. Prefer baseId/quoteId; else base/quote symbols.
 * @param {Record<string, unknown>} source
 */
export function resolveFlintPair(source) {
  const pair = normalizePairInput({
    base: source.base ?? source.baseSymbol,
    quote: source.quote ?? source.quoteSymbol ?? "USDC",
    baseId: source.baseId ?? source.base_id,
    quoteId: source.quoteId ?? source.quote_id,
    label: source.label ?? source.pair,
  });

  if (typeof source.pair === "string" && source.pair.includes("/")) {
    const [b, q] = source.pair.split("/").map((s) => s.trim());
    if (b && !pair.base) pair.base = b.toUpperCase();
    if (q && (!source.quote && !source.quoteSymbol)) pair.quote = q.toUpperCase();
    if (!pair.label) pair.label = `${pair.base}/${pair.quote}`;
  }

  if (!pair.base && pair.baseId == null) {
    throw new Error("Provide base (e.g. SOL) or baseId, optionally quote (default USDC)");
  }
  return pair;
}

/**
 * Enrich pair with ids from ListPairs catalog when only symbols given.
 * @param {Record<string, unknown>} pair
 */
async function enrichPairIds(pair) {
  if (pair.baseId != null && pair.quoteId != null) return pair;
  const catalog = await fetchFlintPairs();
  const base = String(pair.base || "").toUpperCase();
  const quote = String(pair.quote || "USDC").toUpperCase();
  const match = (catalog.pairs || []).find((row) => {
    const p = row.pair || {};
    return (
      String(p.base || "").toUpperCase() === base &&
      String(p.quote || "").toUpperCase() === quote
    );
  });
  if (!match?.pair) return pair;
  return {
    ...pair,
    baseId: match.pair.baseId ?? pair.baseId,
    quoteId: match.pair.quoteId ?? pair.quoteId,
    base: match.pair.base || pair.base,
    quote: match.pair.quote || pair.quote,
    label: match.pair.label || pair.label,
  };
}

export async function fetchFlintPairs() {
  const cached = pairsCache.get("all");
  if (cached) return /** @type {any} */ (cached);
  const data = await flintListPairs();
  const out = {
    ...data,
    source: "flint",
    venue: "flint",
    computedAt: new Date().toISOString(),
  };
  pairsCache.set("all", out);
  return out;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseFlintPairsRequest(_req) {
  return {};
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseFlintBookRequest(req) {
  const source = sourceParams(req);
  const pair = resolveFlintPair(source);
  const level =
    typeof source.level === "string" && source.level.trim()
      ? source.level.trim()
      : "L2";
  return { pair, level };
}

/**
 * @param {{ pair: Record<string, unknown>; level?: string }} params
 */
export async function fetchFlintBook(params) {
  const pair = await enrichPairIds(params.pair);
  const level = params.level || "L2";
  const cacheKey = `book:${pair.baseId ?? pair.base}:${pair.quoteId ?? pair.quote}:${level}`;
  const cached = bookCache.get(cacheKey);
  if (cached) return /** @type {any} */ (cached);

  const book = await flintGetBook({ pair, level });
  const out = {
    ...book,
    source: "flint",
    venue: "flint",
    computedAt: new Date().toISOString(),
  };
  bookCache.set(cacheKey, out);
  return out;
}

export function parseFlintStatsRequest(_req) {
  return {};
}

export async function fetchFlintStats() {
  const cached = statsCache.get("summary");
  if (cached) return /** @type {any} */ (cached);
  const summary = await flintGetSummary();
  const out = {
    ...summary,
    source: "flint",
    venue: "flint",
    computedAt: new Date().toISOString(),
  };
  statsCache.set("summary", out);
  return out;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseFlintCandlesRequest(req) {
  const source = sourceParams(req);
  const pair = resolveFlintPair(source);
  const kind =
    typeof source.kind === "string" && source.kind.trim().toLowerCase() === "fills"
      ? "fills"
      : "candles";
  const interval =
    typeof source.interval === "string" && source.interval.trim()
      ? source.interval.trim()
      : "5M";
  const limit = Math.min(1000, Math.max(1, Number(source.limit) || 50));
  const startMicros =
    source.startMicros != null
      ? String(source.startMicros)
      : source.start != null
        ? String(source.start)
        : undefined;
  const endMicros =
    source.endMicros != null
      ? String(source.endMicros)
      : source.end != null
        ? String(source.end)
        : undefined;

  // Default: last 24h for candles when start omitted
  let resolvedStart = startMicros;
  if (kind === "candles" && !resolvedStart) {
    resolvedStart = String((Date.now() - 24 * 60 * 60 * 1000) * 1000);
  }

  return {
    kind,
    pair,
    interval,
    limit,
    startMicros: resolvedStart,
    endMicros,
  };
}

/**
 * @param {ReturnType<typeof parseFlintCandlesRequest>} params
 */
export async function fetchFlintCandles(params) {
  const pair = await enrichPairIds(params.pair);
  const cacheKey = [
    params.kind,
    pair.baseId ?? pair.base,
    pair.quoteId ?? pair.quote,
    params.interval,
    params.limit,
    params.startMicros || "",
    params.endMicros || "",
  ].join(":");
  const cached = candlesCache.get(cacheKey);
  if (cached) return /** @type {any} */ (cached);

  let out;
  if (params.kind === "fills") {
    const data = await flintGetFills({
      pair,
      limit: params.limit,
      startMicros: params.startMicros,
      endMicros: params.endMicros,
    });
    out = {
      kind: "fills",
      pair: data.fills[0]?.pair || {
        base: pair.base,
        quote: pair.quote,
        baseId: pair.baseId ?? null,
        quoteId: pair.quoteId ?? null,
        label: pair.label || null,
      },
      fills: data.fills,
      count: data.count,
      source: "flint",
      venue: "flint",
      computedAt: new Date().toISOString(),
    };
  } else {
    const data = await flintGetCandles({
      pair,
      interval: params.interval,
      startMicros: params.startMicros,
      endMicros: params.endMicros,
    });
    out = {
      kind: "candles",
      pair: {
        base: pair.base ?? null,
        quote: pair.quote ?? null,
        baseId: pair.baseId != null ? String(pair.baseId) : null,
        quoteId: pair.quoteId != null ? String(pair.quoteId) : null,
        label: pair.label || null,
      },
      interval: params.interval,
      candles: data.candles,
      count: data.count,
      source: "flint",
      venue: "flint",
      computedAt: new Date().toISOString(),
    };
  }

  candlesCache.set(cacheKey, out);
  return out;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseFlintExternalTapeRequest(req) {
  const source = sourceParams(req);
  const pair = resolveFlintPair(source);
  const timeoutMs = Math.min(
    8_000,
    Math.max(500, Number(source.timeoutMs) || 2500),
  );
  const maxEvents = Math.min(50, Math.max(1, Number(source.maxEvents) || 25));
  return { pair, timeoutMs, maxEvents };
}

/**
 * @param {ReturnType<typeof parseFlintExternalTapeRequest>} params
 */
export async function fetchFlintExternalTape(params) {
  const pair = await enrichPairIds(params.pair);
  const cacheKey = `tape:${pair.baseId ?? pair.base}:${pair.quoteId ?? pair.quote}:${params.timeoutMs}:${params.maxEvents}`;
  const cached = tapeCache.get(cacheKey);
  if (cached) return /** @type {any} */ (cached);

  const data = await flintExternalTape({
    pair,
    timeoutMs: params.timeoutMs,
    maxEvents: params.maxEvents,
  });
  const out = {
    ...data,
    source: "flint",
    venue: "flint",
    computedAt: new Date().toISOString(),
  };
  tapeCache.set(cacheKey, out);
  return out;
}

/**
 * Map upstream errors to HTTP-ish status hints.
 * @param {unknown} err
 */
export function flintErrorStatus(err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/provide|required|invalid/i.test(msg)) return 400;
  if (/** @type {any} */ (err)?.flintResourceExhausted || /status 8|RESOURCE_EXHAUSTED/i.test(msg)) {
    return 429;
  }
  return 502;
}
