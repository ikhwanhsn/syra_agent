/**
 * Sliding-window rate limiter for BTC intelligence external API calls.
 */
import { getBtcProviderLimitsPerMinute } from "../config/btcIntelligenceConfig.js";

const WINDOW_MS = 60_000;

/** @type {Map<string, number[]>} */
const requestTimestamps = new Map();

/** @type {Map<string, Promise<void>>} */
const providerGates = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGate(provider) {
  if (!providerGates.has(provider)) {
    providerGates.set(provider, Promise.resolve());
  }
  return providerGates.get(provider);
}

/**
 * Wait until a request to `provider` may proceed without exceeding per-minute budget.
 * @param {string} provider — coingecko | binance | coinbase | other
 */
export async function acquireBtcProviderSlot(provider) {
  const key = String(provider || "other").toLowerCase();
  const limits = getBtcProviderLimitsPerMinute();
  const maxPerMin = limits[key] ?? limits.other ?? 60;

  const prev = getGate(key);
  let resolveNext;
  const next = new Promise((resolve) => {
    resolveNext = resolve;
  });
  providerGates.set(key, next);
  await prev;

  try {
    if (!requestTimestamps.has(key)) {
      requestTimestamps.set(key, []);
    }
    const stamps = requestTimestamps.get(key);

    for (;;) {
      const now = Date.now();
      while (stamps.length > 0 && stamps[0] <= now - WINDOW_MS) {
        stamps.shift();
      }
      if (stamps.length < maxPerMin) {
        stamps.push(now);
        return;
      }
      const waitMs = stamps[0] + WINDOW_MS - now + 5;
      await sleep(Math.max(10, Math.ceil(waitMs)));
    }
  } finally {
    resolveNext();
  }
}

/**
 * @param {string} url
 * @returns {string}
 */
export function providerForUrl(url) {
  const u = String(url).toLowerCase();
  if (u.includes("coingecko.com") || u.includes("pro-api.coingecko")) return "coingecko";
  // api.binance.com, data-api.binance.vision, fapi.binance.com share IP weight budgets.
  if (u.includes("binance.com") || u.includes("binance.vision")) return "binance";
  if (u.includes("coinbase.com")) return "coinbase";
  return "other";
}

/**
 * Rate-limited fetch for BTC intelligence pipelines.
 * @param {string} url
 * @param {RequestInit} [init]
 */
export async function btcRateLimitedFetch(url, init = {}) {
  const provider = providerForUrl(url);
  await acquireBtcProviderSlot(provider);
  return fetch(url, init);
}
