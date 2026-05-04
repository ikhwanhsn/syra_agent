/**
 * GET/POST /signal only accepts a fixed set of fields. The LLM may add extras (e.g. `signal`
 * meaning recommendation) which pollute x402 URLs or confuse gateways — strip to allowed keys only.
 */
const SIGNAL_QUERY_KEYS = ['token', 'source', 'instId', 'bar', 'limit'];

/**
 * @param {Record<string, unknown>} params
 * @returns {Record<string, string>}
 */
export function pickSignalToolQueryParams(params) {
  const p = params && typeof params === 'object' ? params : {};
  return Object.fromEntries(
    SIGNAL_QUERY_KEYS.flatMap((k) => {
      const v = p[k];
      if (v == null || v === '') return [];
      return [[k, typeof v === 'string' ? v : String(v)]];
    })
  );
}
