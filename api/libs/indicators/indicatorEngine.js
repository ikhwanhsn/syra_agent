/**
 * Parse indicator API requests and run combined indicator computations.
 */
import { fetchCandles } from "./candleSource.js";
import { getIndicatorDefinition, listIndicatorIds } from "./registry.js";
import { resolveParams } from "./utils.js";

/** @typedef {import('./utils.js').CandleSeries} CandleSeries */

const DISCLAIMER =
  "Indicators are descriptive analytics only, not financial advice. Signals reflect historical price patterns and may not predict future outcomes.";

/**
 * @typedef {Object} IndicatorRequest
 * @property {string} id
 * @property {Record<string, unknown>} params
 */

/**
 * @typedef {Object} ParsedIndicatorApiRequest
 * @property {string} symbol
 * @property {string} source
 * @property {string} interval
 * @property {number} limit
 * @property {boolean} series
 * @property {IndicatorRequest[]} indicators
 */

/**
 * @param {string | string[] | undefined} raw
 * @returns {string[]}
 */
function parseIndicatorIdList(raw) {
  if (raw == null) return ["rsi"];
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => String(v).split(",")).map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Extract per-indicator params from dotted query keys like rsi.period=21
 * @param {Record<string, unknown>} query
 * @param {string[]} indicatorIds
 * @returns {Record<string, Record<string, unknown>>}
 */
function extractDottedParams(query, indicatorIds) {
  /** @type {Record<string, Record<string, unknown>>} */
  const out = {};
  for (const id of indicatorIds) out[id] = {};

  for (const [key, value] of Object.entries(query)) {
    const dot = key.indexOf(".");
    if (dot <= 0) continue;
    const prefix = key.slice(0, dot).trim().toLowerCase();
    const paramKey = key.slice(dot + 1).trim();
    if (!indicatorIds.includes(prefix) || !paramKey) continue;
    out[prefix][paramKey] = value;
  }
  return out;
}

/**
 * @param {unknown} bodyIndicators
 * @returns {IndicatorRequest[]}
 */
function parsePostIndicators(bodyIndicators) {
  if (!Array.isArray(bodyIndicators) || bodyIndicators.length === 0) {
    return [{ id: "rsi", params: {} }];
  }
  return bodyIndicators.map((item) => {
    if (typeof item === "string") {
      return { id: item.trim().toLowerCase(), params: {} };
    }
    if (item && typeof item === "object") {
      const obj = /** @type {Record<string, unknown>} */ (item);
      const id = String(obj.id ?? obj.name ?? "").trim().toLowerCase();
      const { id: _id, name: _name, ...rest } = obj;
      return { id, params: rest };
    }
    throw new Error("Invalid indicator entry in POST body");
  });
}

/**
 * @param {{ query?: Record<string, unknown>; body?: Record<string, unknown>; method?: string }} reqLike
 * @returns {ParsedIndicatorApiRequest}
 */
export function parseIndicatorRequest(reqLike) {
  const query = reqLike.query ?? {};
  const body = reqLike.body ?? {};
  const isPost = String(reqLike.method || "GET").toUpperCase() === "POST" && Object.keys(body).length > 0;

  const symbol = String(isPost ? body.symbol ?? query.symbol ?? "BTCUSDT" : query.symbol ?? "BTCUSDT").trim();
  const source = String(isPost ? body.source ?? query.source ?? "binance" : query.source ?? "binance")
    .trim()
    .toLowerCase();
  const interval = String(
    isPost ? body.interval ?? body.bar ?? query.interval ?? query.bar ?? "1h" : query.interval ?? query.bar ?? "1h",
  ).trim();
  const limit = Number(isPost ? body.limit ?? query.limit : query.limit) || 200;
  const seriesRaw = isPost ? body.series ?? query.series : query.series;
  const series = seriesRaw === true || seriesRaw === "true" || seriesRaw === "1";

  /** @type {IndicatorRequest[]} */
  let indicators;
  if (isPost && body.indicators != null) {
    indicators = parsePostIndicators(body.indicators);
  } else {
    const ids = parseIndicatorIdList(
      /** @type {string | string[] | undefined} */ (query.indicators ?? body.indicators),
    );
    const dotted = extractDottedParams(query, ids);
    indicators = ids.map((id) => ({ id, params: dotted[id] ?? {} }));
  }

  if (indicators.length === 0) {
    indicators = [{ id: "rsi", params: {} }];
  }

  return { symbol, source, interval, limit, series, indicators };
}

/**
 * @param {IndicatorRequest[]} requests
 */
function validateIndicatorRequests(requests) {
  const known = new Set(listIndicatorIds());
  for (const req of requests) {
    const id = String(req.id || "").trim().toLowerCase();
    if (!known.has(id)) {
      throw new Error(`Unknown indicator: ${id}. Use GET /indicator/catalog for supported ids.`);
    }
  }
}

/**
 * @param {CandleSeries} series
 * @param {IndicatorRequest[]} requests
 * @param {{ withSeries: boolean }} opts
 * @returns {Record<string, unknown>}
 */
export function runIndicators(series, requests, opts) {
  validateIndicatorRequests(requests);
  /** @type {Record<string, unknown>} */
  const out = {};

  for (const req of requests) {
    const id = req.id.trim().toLowerCase();
    const def = getIndicatorDefinition(id);
    if (!def) continue;
    const params = resolveParams(def.params, req.params);
    const result = def.compute(series, params, { withSeries: opts.withSeries });
    out[id] = {
      id: def.id,
      name: def.name,
      category: def.category,
      params,
      ...result,
    };
  }
  return out;
}

/**
 * @param {ParsedIndicatorApiRequest} parsed
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function buildIndicatorResponse(parsed, opts = {}) {
  const candleData = await fetchCandles({
    symbol: parsed.symbol,
    source: parsed.source,
    interval: parsed.interval,
    limit: parsed.limit,
    signal: opts.signal,
  });

  const indicators = runIndicators(candleData.series, parsed.indicators, {
    withSeries: parsed.series,
  });

  return {
    symbol: candleData.symbol,
    source: candleData.source,
    interval: candleData.interval,
    limit: candleData.limit,
    candleCount: candleData.series.close.length,
    lastClose: candleData.lastClose,
    asOf: candleData.asOf,
    indicators,
    disclaimer: DISCLAIMER,
  };
}

export { DISCLAIMER };
