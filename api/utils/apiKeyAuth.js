/**
 * API key / Bearer token auth for non-x402 routes.
 * When API_KEY or API_KEYS is set in env, requests to protected routes must send a valid key.
 *
 * Accepted headers (priority for gateway auth):
 * - X-API-Key / api-key (preferred — allows Syra session JWT in Authorization alongside)
 * - Authorization: Bearer <api-key> (legacy / scripts)
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

export const VALID_KEYS = new Set(RAW_KEYS);
const AUTH_REQUIRED = VALID_KEYS.size > 0;

/** @param {import('express').Request} req */
export function getKeyFromRequest(req) {
  const xApiKey = req.get("x-api-key");
  if (xApiKey) return xApiKey.trim();
  const apiKey = req.get("api-key");
  if (apiKey) return apiKey.trim();
  const auth = req.get("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) {
    const bearer = auth.replace(/^Bearer\s+/i, "").trim();
    // Syra wallet sessions use Authorization: Bearer <JWT>. Only treat Bearer as gateway auth
    // when it matches a configured API key (trusted-origin injection sets X-API-Key instead).
    if (VALID_KEYS.has(bearer)) return bearer;
  }
  return null;
}

/** True when Authorization Bearer is already one of the configured API keys (not a Syra JWT). */
export function authorizationBearerIsApiKey(req) {
  const auth = req.get("authorization");
  if (!auth || !/^Bearer\s+/i.test(auth)) return false;
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  return VALID_KEYS.has(bearer);
}

/**
 * Middleware: require API key or Bearer token on non-x402 routes when API_KEY/API_KEYS is set.
 * @param {(req) => boolean} skip - Return true to skip auth (e.g. for x402 routes)
 */
export function requireApiKey(skip) {
  return (req, res, next) => {
    if (!AUTH_REQUIRED) return next();
    if (String(req.method || "").toUpperCase() === "OPTIONS") return next();
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

export { AUTH_REQUIRED };
