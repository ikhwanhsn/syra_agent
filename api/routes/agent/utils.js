/**
 * Resolve base URL for internal agent tool calls (server-to-self).
 * Prefers INTERNAL_BASE_URL (bypasses CDN/proxy) → falls back to localhost:PORT.
 * Uses localhost by default so self-calls never route through Cloudflare/CDN,
 * which blocks server-to-server requests with 403 (no browser fingerprint).
 * BASE_URL is intentionally NOT used here — it points to the public URL
 * (e.g. https://api.syraa.fun) which goes through CDN and gets blocked.
 */
export function resolveAgentBaseUrl(_req) {
  const internal = (process.env.INTERNAL_BASE_URL || '').trim();
  if (internal) return internal.replace(/\/$/, '');

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
