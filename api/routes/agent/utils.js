/**
 * Resolve base URL for internal agent tool calls (server-to-self).
 *
 * Prefers INTERNAL_BASE_URL (bypasses CDN/proxy) → loopback on PORT → public BASE_URL.
 * Loopback avoids Cloudflare bot checks on server-to-server calls. When loopback is
 * unavailable (some PaaS / reverse-proxy setups), fall back to BASE_URL with X-API-Key
 * (see agentX402Client.addInternalApiKeyIfOwnUrl).
 */
function trimBase(raw) {
  return String(raw || '').trim().replace(/\/$/, '');
}

/**
 * Ordered list of base URLs to try for server-to-self x402 tool calls.
 * @param {import('express').Request | null} [_req]
 * @returns {string[]}
 */
export function resolveAgentBaseUrlCandidates(_req) {
  const seen = new Set();
  /** @type {string[]} */
  const out = [];

  const add = (raw) => {
    const u = trimBase(raw);
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  add(process.env.INTERNAL_BASE_URL);
  add(process.env.SYRA_INTERNAL_API_URL);

  const port = process.env.PORT || '3000';
  add(`http://127.0.0.1:${port}`);
  add(`http://localhost:${port}`);

  const base = trimBase(process.env.BASE_URL);
  if (base.startsWith('http://') || base.startsWith('https://')) {
    add(base);
  }

  return out.length > 0 ? out : [`http://127.0.0.1:${port}`];
}

/**
 * Primary self-call base URL (first candidate).
 * @param {import('express').Request | null} [_req]
 * @returns {string}
 */
export function resolveAgentBaseUrl(_req) {
  return resolveAgentBaseUrlCandidates(_req)[0];
}

/**
 * True when an x402 self-call failure looks like connectivity / proxy — safe to retry another base.
 * @param {string | null | undefined} err
 * @returns {boolean}
 */
export function isSelfApiTransportError(err) {
  const s = String(err || '').toLowerCase();
  if (!s) return false;
  if (
    /agent wallet not found|privy_not_configured|missing_privy_wallet_id|insufficient|budget exceeded|sentinelbudget/i.test(
      s,
    )
  ) {
    return false;
  }
  return (
    /econnrefused|enotfound|econnreset|etimedout|fetch failed|network|socket hang up|und_err_connect|aborterror|timed out|unable to connect/i.test(
      s,
    ) || /status code 403|blocked|cloudflare|bad gateway|502|503|504/i.test(s)
  );
}
