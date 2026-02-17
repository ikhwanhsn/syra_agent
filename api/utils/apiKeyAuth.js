/**
 * API key / Bearer token auth for non-x402 routes.
 * When API_KEY or API_KEYS is set in env, requests to protected routes must send a valid key.
 *
 * Accepted headers (case-insensitive):
 * - Authorization: Bearer <token>
 * - X-API-Key: <key>
 * - api-key: <key>
 *
 * Env:
 * - API_KEY: single secret (e.g. "your-secret-key")
 * - API_KEYS: comma-separated list (e.g. "key1,key2") for multiple keys
 * If neither is set, the check is skipped (optional auth).
 */

const RAW_KEYS = (process.env.API_KEYS || process.env.API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const VALID_KEYS = new Set(RAW_KEYS);
const AUTH_REQUIRED = VALID_KEYS.size > 0;

function getKeyFromRequest(req) {
  const auth = req.get("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }
  const xApiKey = req.get("x-api-key");
  if (xApiKey) return xApiKey.trim();
  const apiKey = req.get("api-key");
  if (apiKey) return apiKey.trim();
  return null;
}

/**
 * Middleware: require API key or Bearer token on non-x402 routes when API_KEY/API_KEYS is set.
 * @param {(req) => boolean} skip - Return true to skip auth (e.g. for x402 routes)
 */
export function requireApiKey(skip) {
  return (req, res, next) => {
    if (!AUTH_REQUIRED) return next();
    if (skip && skip(req)) return next();

    const key = getKeyFromRequest(req);
    if (!key) {
      return res.status(401).json({
        success: false,
        error: "Missing API key or Bearer token",
        hint: "Send Authorization: Bearer <key> or X-API-Key: <key> or api-key: <key>",
      });
    }
    if (!VALID_KEYS.has(key)) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key or Bearer token",
      });
    }
    next();
  };
}

export { AUTH_REQUIRED, VALID_KEYS };
