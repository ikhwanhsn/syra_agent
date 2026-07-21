/**
 * Injects API key for requests from trusted browser origins (syraa.fun, dashboard, playground).
 * Covers agent chat, Alpha /x-projects-analyze, X single-account analyzer, etc.
 *
 * Syra frontends use Authorization: Bearer <access JWT> for wallet sessions. We still inject
 * X-API-Key for trusted origins so requireApiKey passes without treating the JWT as the gateway key.
 */

import { authorizationBearerIsApiKey } from "./apiKeyAuth.js";

const RAW_KEYS = (process.env.API_KEYS || process.env.API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
const SERVER_KEY = RAW_KEYS[0] || null;

const TRUSTED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://api.syraa.fun",
  "https://syraa.fun",
  "https://www.syraa.fun",
  "https://dashboard.syraa.fun",
  "https://www.dashboard.syraa.fun",
  "https://playground.syraa.fun",
  "https://www.playground.syraa.fun",
  "https://stake.syraa.fun",
  "https://www.stake.syraa.fun",
  "https://dev-dashboard-syra.vercel.app",
  "https://dev-playground-syra.vercel.app",
  "https://dev-ai-agent-syra.vercel.app",
  "https://predict.syraa.fun",
  "https://www.predict.syraa.fun",
  ...(process.env.CORS_EXTRA_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

/**
 * Paths a Syra-owned browser frontend may call. When the request comes from a trusted Syra
 * origin, we inject X-API-Key so requireApiKey passes. Session routes read Authorization separately.
 */
export function isBrowserCallablePath(path) {
  if (!path || path === "/") return false;
  return (
    path.startsWith("/analytics") ||
    path.startsWith("/preview") ||
    path.startsWith("/dashboard-summary") ||
    path.startsWith("/binance-ticker") ||
    path.startsWith("/leaderboard") ||
    path.startsWith("/experiment") ||
    path.startsWith("/internal") ||
    path.startsWith("/agent") ||
    path.startsWith("/x-projects-analyze") ||
    path.startsWith("/x-analyzer") ||
    path.startsWith("/8004") ||
    path === "/api/playground-proxy" ||
    path.startsWith("/streamflow-locks") ||
    path.startsWith("/staking") ||
    path.startsWith("/wallet") ||
    path.startsWith("/post/studio") ||
    path.startsWith("/btc") ||
    path.startsWith("/jupiter/ui") ||
    path.startsWith("/labs")
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

/** Allow Syra local frontends on any localhost / 127.0.0.1 port (dev uses varying Vite ports). */
function isTrustedOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  if (TRUSTED_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    const host = (u.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * For trusted origins on browser-callable paths, inject server X-API-Key when missing.
 * Runs even when Authorization carries a Syra access JWT (see getKeyFromRequest priority).
 */
export function injectTrustedOriginApiKey(req, res, next) {
  if (!SERVER_KEY) return next();

  if (req.get("x-api-key") || req.get("api-key")) return next();
  if (authorizationBearerIsApiKey(req)) return next();

  const origin = getOriginFromRequest(req);
  if (!origin || !isTrustedOrigin(origin)) return next();
  if (!isBrowserCallablePath(req.path)) return next();

  req.headers["x-api-key"] = SERVER_KEY;
  next();
}
