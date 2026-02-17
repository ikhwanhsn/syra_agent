/**
 * Security middleware for the API (non-x402 and general hardening).
 * - Helmet: security headers (X-Content-Type-Options, X-Frame-Options, etc.)
 * - Body size limit is applied in index.js via express.json({ limit }).
 */

import helmet from "helmet";

/**
 * Helmet with API-friendly defaults.
 * Sets secure headers; crossOriginResourcePolicy allows frontends to call this API.
 */
const securityHeaders = helmet({
  contentSecurityPolicy: false, // API returns JSON; strict CSP not needed for programmatic access
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export { securityHeaders };
