/**
 * Per-host circuit breaker for Binance REST IP bans (HTTP 418 / -1003).
 * data-api.binance.vision and api.binance.com use separate weight pools — do not
 * block one host because the other returned 418.
 */

/** @type {Map<string, number>} host -> banUntilMs */
const banUntilByHost = new Map();

/** @type {number} */
let lastWarnAt = 0;

const WARN_THROTTLE_MS = 30_000;
const DEFAULT_BAN_MS = 60_000;

/**
 * @param {string} [urlOrHost]
 * @returns {string}
 */
export function binanceHostKey(urlOrHost) {
  const s = String(urlOrHost || "").toLowerCase();
  try {
    if (s.includes("://")) return new URL(s).host;
  } catch {
    /* fall through */
  }
  if (s.includes("data-api.binance.vision") || s.includes("binance.vision")) {
    return "data-api.binance.vision";
  }
  if (s.includes("binance.com")) return "api.binance.com";
  return s || "api.binance.com";
}

/**
 * @param {string} [msg]
 * @returns {number}
 */
export function parseBinanceBanUntilMs(msg) {
  const m = String(msg || "").match(/banned until\s+(\d+)/i);
  if (!m) return Date.now() + DEFAULT_BAN_MS;
  const ts = Number(m[1]);
  if (!Number.isFinite(ts) || ts <= 0) return Date.now() + DEFAULT_BAN_MS;
  return ts < 1e12 ? ts * 1000 : ts;
}

/**
 * @param {string} [msg]
 * @param {string} [urlOrHost]
 */
export function recordBinanceIpBan(msg, urlOrHost) {
  const host = binanceHostKey(urlOrHost);
  const until = parseBinanceBanUntilMs(msg);
  const prev = banUntilByHost.get(host) ?? 0;
  if (until > prev) banUntilByHost.set(host, until);

  const now = Date.now();
  if (now - lastWarnAt >= WARN_THROTTLE_MS) {
    lastWarnAt = now;
    const secs = Math.max(0, Math.ceil((until - now) / 1000));
    console.warn(
      `[binanceIpBanCircuit] REST blocked on ${host} for ~${secs}s — try other hosts / WS / stale`,
    );
  }
}

/**
 * @param {string} [urlOrHost] — if omitted, true only when *all* known hosts are blocked
 * @returns {boolean}
 */
export function isBinanceRestBlocked(urlOrHost) {
  const now = Date.now();
  for (const [host, until] of banUntilByHost) {
    if (now >= until) banUntilByHost.delete(host);
  }

  if (urlOrHost == null || urlOrHost === "") {
    // Global: blocked only when we have at least one active ban and no unbanned host left to try.
    // Callers that iterate hosts should pass each host explicitly.
    return false;
  }

  const host = binanceHostKey(urlOrHost);
  const until = banUntilByHost.get(host);
  return until != null && now < until;
}

/**
 * @returns {boolean} true when every known Binance REST host is currently banned
 */
export function isAllBinanceRestBlocked() {
  const now = Date.now();
  for (const [host, until] of banUntilByHost) {
    if (now >= until) banUntilByHost.delete(host);
  }
  const hosts = ["data-api.binance.vision", "api.binance.com"];
  return hosts.every((h) => {
    const until = banUntilByHost.get(h);
    return until != null && now < until;
  });
}

/**
 * @param {string} [urlOrHost]
 * @returns {number} epoch ms, or 0 if not blocked
 */
export function getBinanceRestBanUntilMs(urlOrHost) {
  if (!isBinanceRestBlocked(urlOrHost)) return 0;
  return banUntilByHost.get(binanceHostKey(urlOrHost)) ?? 0;
}
