/**
 * Per-request session middleware.
 *
 * P0.2 — replaces the historical `anonymousId`-only authorization. Every state-changing wallet
 * route now requires either:
 *  - A valid Authorization: Bearer <access_token> issued by /agent/auth (connected users), OR
 *  - An explicit guest session that targets ONLY read-only or read-only-spend (x402) endpoints.
 *
 * The middleware writes the verified identity into `req.user`:
 *   { walletAddress, chain, anonymousId, sessionId, guest }
 *
 * Routes downstream MUST check `req.user.anonymousId === paramOrBodyAnonymousId` to prevent
 * cross-user access.
 */
import { verifyToken } from './jwt.js';
import { ownsAgentWalletSibling } from '../libs/agentWalletPurpose.js';

const BEARER_RE = /^Bearer\s+/i;

function extractBearer(req) {
  const auth = req.get('authorization');
  if (auth && BEARER_RE.test(auth)) {
    return auth.replace(BEARER_RE, '').trim();
  }
  return null;
}

function extractCookie(req, name) {
  const raw = req.headers?.cookie;
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.split(';').map((s) => s.trim());
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    if (p.slice(0, eq) === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return null;
}

/**
 * @param {Object} options
 * @param {boolean=} options.allowGuest  When true, an unauthenticated request with `anonymousId`
 *   in body/query is admitted as a guest. Guests are restricted by the policy engine to read-only
 *   tools (no signing). Default false.
 * @param {boolean=} options.requireOwnership  When true, validates that the `anonymousId` in the
 *   request body/query/params matches the session's anonymousId. Default true.
 */
export function requireSession({ allowGuest = false, requireOwnership = true } = {}) {
  return async (req, res, next) => {
    const token = extractBearer(req) || extractCookie(req, 'syra_access');
    if (token) {
      try {
        const claims = await verifyToken(token, 'access');
        req.user = {
          walletAddress: claims.sub,
          chain: claims.chain,
          anonymousId: claims.aid,
          sessionId: claims.sid,
          familyId: claims.fid,
          guest: false,
        };
        if (requireOwnership && !ownsAnonymousId(req, claims.aid)) {
          return res.status(403).json({ success: false, error: 'anonymous_id_mismatch' });
        }
        return next();
      } catch (err) {
        return res.status(401).json({ success: false, error: 'invalid_session', detail: err?.message?.slice?.(0, 80) });
      }
    }

    if (!allowGuest) {
      return res.status(401).json({ success: false, error: 'auth_required' });
    }

    const aid = pickAnonymousId(req);
    if (!aid) return res.status(401).json({ success: false, error: 'auth_required' });

    // Guest sessions never sign or move funds. Mark guest=true so the broker / chat can refuse.
    req.user = {
      walletAddress: null,
      chain: null,
      anonymousId: aid,
      sessionId: null,
      familyId: null,
      guest: true,
    };
    return next();
  };
}

export function optionalWalletSession() {
  return async (req, res, next) => {
    const token = extractBearer(req) || extractCookie(req, 'syra_access');
    if (!token) {
      req.user = null;
      return next();
    }
    try {
      const claims = await verifyToken(token, 'access');
      req.user = {
        walletAddress: claims.sub,
        chain: claims.chain,
        anonymousId: claims.aid,
        sessionId: claims.sid,
        familyId: claims.fid,
        guest: false,
      };
      return next();
    } catch {
      req.user = null;
      return next();
    }
  };
}

function pickAnonymousId(req) {
  const fromBody =
    typeof req.body?.anonymousId === 'string' && req.body.anonymousId.trim()
      ? req.body.anonymousId.trim()
      : null;
  if (fromBody) return fromBody;
  const fromQuery =
    typeof req.query?.anonymousId === 'string' && req.query.anonymousId.trim()
      ? req.query.anonymousId.trim()
      : null;
  if (fromQuery) return fromQuery;
  const fromParams =
    typeof req.params?.anonymousId === 'string' && req.params.anonymousId.trim()
      ? safeDecode(req.params.anonymousId)
      : null;
  return fromParams;
}

function safeDecode(s) {
  try {
    return decodeURIComponent(String(s));
  } catch {
    return String(s);
  }
}

function ownsAnonymousId(req, claimAid) {
  if (!claimAid) return false;
  const requested = pickAnonymousId(req);
  if (!requested) return true; // route doesn't carry an aid; ownership inferred from session
  if (requested === claimAid) return true;
  return ownsAgentWalletSibling(claimAid, requested);
}

export { extractBearer, extractCookie };
