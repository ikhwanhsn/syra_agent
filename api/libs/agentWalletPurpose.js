/**
 * Agent wallet purpose — five pillar treasuries + internal LP.
 */

/** @typedef {'spend' | 'earn' | 'treasury' | 'invest' | 'grow' | 'lp' | 'chat'} AgentWalletPurpose */

export const PILLAR_WALLET_PURPOSES = Object.freeze(['spend', 'earn', 'treasury', 'invest', 'grow']);

export const AGENT_WALLET_PURPOSES = Object.freeze([...PILLAR_WALLET_PURPOSES, 'lp']);

/** Suffixes stripped when resolving base anonymousId. */
const SIBLING_SUFFIXES = Object.freeze([...PILLAR_WALLET_PURPOSES.filter((p) => p !== 'spend'), 'lp', 'chat']);

/**
 * @param {unknown} value
 * @returns {AgentWalletPurpose}
 */
export function normalizeAgentWalletPurpose(value) {
  if (typeof value !== 'string') return 'spend';
  const v = value.trim().toLowerCase();
  if (v === 'chat') return 'spend';
  if (AGENT_WALLET_PURPOSES.includes(/** @type {AgentWalletPurpose} */ (v))) {
    return /** @type {AgentWalletPurpose} */ (v);
  }
  return 'spend';
}

/**
 * @param {string | null | undefined} id
 * @returns {string | null}
 */
export function baseAnonymousIdFrom(id) {
  if (!id || typeof id !== 'string') return null;
  let base = id.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of SIBLING_SUFFIXES) {
      const token = `:${suffix}`;
      if (base.endsWith(token)) {
        base = base.slice(0, -token.length);
        changed = true;
        break;
      }
    }
  }
  return base || null;
}

/**
 * @param {string | null | undefined} id
 * @returns {boolean}
 */
export function isLpAnonymousId(id) {
  return typeof id === 'string' && id.endsWith(':lp');
}

/**
 * Strip sibling suffix when present (legacy alias for spend base id).
 * @param {string | null | undefined} id
 * @returns {string | null | undefined}
 */
export function chatAnonymousIdFrom(id) {
  return baseAnonymousIdFrom(id) ?? id;
}

/**
 * @param {string | null | undefined} baseAnonymousId
 * @param {AgentWalletPurpose} purpose
 * @returns {string | null}
 */
export function siblingAnonymousId(baseAnonymousId, purpose) {
  const base = baseAnonymousIdFrom(baseAnonymousId);
  if (!base) return null;
  const p = normalizeAgentWalletPurpose(purpose);
  if (p === 'spend' || p === 'chat') return base;
  return `${base}:${p}`;
}

/**
 * Derive LP wallet anonymousId from spend (primary) wallet id.
 * @param {string | null | undefined} chatAnonymousId
 * @returns {string | null}
 */
export function lpAnonymousIdFromChat(chatAnonymousId) {
  const base = baseAnonymousIdFrom(chatAnonymousId);
  if (!base) return null;
  return `${base}:lp`;
}

/**
 * Resolve LP viewer id from session + optional explicit request.
 * @param {{ anonymousId?: string | null }} user
 * @param {string | null | undefined} requested
 * @returns {string | null}
 */
export function resolveLpViewerAnonymousId(user, requested) {
  const explicit = typeof requested === 'string' && requested.trim() ? requested.trim() : null;
  if (explicit) return lpAnonymousIdFromChat(explicit);
  if (user?.anonymousId) return lpAnonymousIdFromChat(user.anonymousId);
  return null;
}

/**
 * Whether `requested` belongs to the authenticated session (primary id or any pillar sibling).
 * @param {string} sessionSpendAid
 * @param {string | null | undefined} requested
 * @returns {boolean}
 */
export function ownsAgentWalletSibling(sessionSpendAid, requested) {
  if (!sessionSpendAid || !requested) return false;
  const sessionBase = baseAnonymousIdFrom(sessionSpendAid);
  const requestedBase = baseAnonymousIdFrom(requested);
  if (!sessionBase || !requestedBase) return false;
  return sessionBase === requestedBase;
}

/**
 * Mongo filter for purpose (legacy rows without purpose or chat count as spend).
 * @param {AgentWalletPurpose} purpose
 */
export function purposeQuery(purpose) {
  const p = normalizeAgentWalletPurpose(purpose);
  if (p === 'spend') {
    return { $or: [{ purpose: 'spend' }, { purpose: 'chat' }, { purpose: { $exists: false } }, { purpose: null }] };
  }
  return { purpose: p };
}

/**
 * @param {AgentWalletPurpose} purpose
 * @returns {boolean}
 */
export function isPillarWalletPurpose(purpose) {
  return PILLAR_WALLET_PURPOSES.includes(normalizeAgentWalletPurpose(purpose));
}
