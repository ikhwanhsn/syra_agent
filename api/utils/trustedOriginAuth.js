/**
 * Injects API key for requests from trusted browser origins (syraa.fun, dashboard, agent, playground).
 * This allows frontends to call the API without embedding the key in client bundles.
 *
 * When Origin (or Referer) is in the allowlist and the path is browser-callable,
 * we set X-API-Key from env so requireApiKey passes. The client must not send the key.
 */

const RAW_KEYS = (process.env.API_KEYS || process.env.API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
const SERVER_KEY = RAW_KEYS[0] || null;

const TRUSTED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://api.syraa.fun",
  "https://syraa.fun",
  "https://www.syraa.fun",
  "https://agent.syraa.fun",
  "https://www.agent.syraa.fun",
  "https://dashboard.syraa.fun",
  "https://www.dashboard.syraa.fun",
  "https://playground.syraa.fun",
  "https://www.playground.syraa.fun",
  ...(process.env.CORS_EXTRA_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

function isBrowserCallablePath(path) {
  if (!path || path === "/") return false;
  return (
    path.startsWith("/analytics") ||
    path.startsWith("/v1/regular") ||
    path.startsWith("/leaderboard") ||
    path.startsWith("/internal") ||
    path.startsWith("/agent") ||
    path.startsWith("/8004")
  );
}

function getOriginFromRequest(req) {
  const origin = req.get("origin");
  if (origin && typeof origin === "string") return origin.trim();
  const referer = req.get("referer");
  if (referer && typeof referer === "string") {
    try {
      const u = new URL(referer);
      return u.origin;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Middleware: for requests from trusted origins to browser-callable paths,
 * if no API key is sent, inject the server's API key so requireApiKey passes.
 */
export function injectTrustedOriginApiKey(req, res, next) {
  if (!SERVER_KEY) return next();

  const existing = req.get("authorization") || req.get("x-api-key") || req.get("api-key");
  if (existing) return next();

  const origin = getOriginFromRequest(req);
  if (!origin || !TRUSTED_ORIGINS.includes(origin)) return next();
  if (!isBrowserCallablePath(req.path)) return next();

  req.headers["x-api-key"] = SERVER_KEY;
  next();
}
