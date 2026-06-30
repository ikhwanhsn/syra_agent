/**
 * OpenRouter credentials for x402 paid routes (chat / images / videos).
 * Separate from OPENROUTER_API_KEY used by internal Syra agents and /agent/chat.
 */
export const OPENROUTER_X402_API_KEY_ENV = 'OPENROUTER_API_KEY_x402';

/**
 * @returns {string}
 */
export function getOpenRouterX402ApiKey() {
  return String(process.env[OPENROUTER_X402_API_KEY_ENV] || '').trim();
}

/**
 * @returns {string}
 */
export function requireOpenRouterX402ApiKey() {
  const apiKey = getOpenRouterX402ApiKey();
  if (!apiKey) {
    throw new Error(`${OPENROUTER_X402_API_KEY_ENV} is not set`);
  }
  return apiKey;
}

/**
 * @returns {Record<string, string>}
 */
export function buildOpenRouterX402Headers() {
  const apiKey = requireOpenRouterX402ApiKey();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const referer = process.env.OPENROUTER_HTTP_REFERER;
  if (referer && typeof referer === 'string' && referer.trim()) {
    headers['HTTP-Referer'] = referer.trim();
  }
  const title = process.env.OPENROUTER_APP_TITLE || 'Syra';
  if (title) {
    headers['X-Title'] = title.slice(0, 128);
  }
  return headers;
}
