/**
 * Security middleware for the API.
 *
 * P0.8 — strengthens defaults:
 *  - HSTS: 6 months, includeSubDomains, preload (off by default until ops opts in).
 *  - Frame deny.
 *  - Strict Referrer-Policy.
 *  - Cross-Origin-Resource-Policy: cross-origin (the API serves frontends on different origins).
 *  - Content-Security-Policy: enforced when SYRA_API_ENFORCE_CSP=1 (off by default so x402
 *    discovery responses and OpenAPI HTML viewers aren't broken; ops should opt-in after smoke test).
 */
import helmet from "helmet";

const ENFORCE_CSP = String(process.env.SYRA_API_ENFORCE_CSP || "").trim() === "1";

const csp = ENFORCE_CSP
  ? {
      useDefaults: true,
      directives: {
        "default-src": ["'none'"],
        "base-uri": ["'none'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "form-action": ["'self'"],
        "connect-src": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    }
  : false;

const securityHeaders = helmet({
  contentSecurityPolicy: csp,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 60 * 60 * 24 * 180, // 180 days
    includeSubDomains: true,
    preload: false,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  xPoweredBy: false,
});

export { securityHeaders };
