/**
 * Retry transient network failures (undici "fetch failed", DNS, timeouts, etc.).
 */

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isTransientNetworkError(err) {
  const msg = String(
    err instanceof Error
      ? `${err.message}${err.cause instanceof Error ? ` ${err.cause.message}` : ""}`
      : err,
  );
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|socket hang up|UND_ERR_|network|DNS|certificate|TLS|cert|timed out|ConnectTimeoutError|AbortError/i.test(
    msg,
  );
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string | URL | Request} url
 * @param {RequestInit} [options]
 * @param {{ retries?: number; retryDelayMs?: number }} [config]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const retries = config.retries ?? 3;
  const retryDelayMs = config.retryDelayMs ?? 1500;
  /** @type {Error | null} */
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries && isTransientNetworkError(lastError)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("fetch failed");
}
