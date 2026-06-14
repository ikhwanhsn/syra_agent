/**
 * Agent wallet purpose — separates chat treasury from LP (and future per-agent wallets).
 */

/** @typedef {'chat' | 'lp'} AgentWalletPurpose */

export const AGENT_WALLET_PURPOSES = Object.freeze(['chat', 'lp']);

/**
 * @param {unknown} value
 * @returns {AgentWalletPurpose}
 */
export function normalizeAgentWalletPurpose(value) {
  return value === 'lp' ? 'lp' : 'chat';
}

/**
 * @param {string | null | undefined} id
 * @returns {boolean}
 */
export function isLpAnonymousId(id) {
  return typeof id === 'string' && id.endsWith(':lp');
}

/**
 * Strip `:lp` suffix when present.
 * @param {string | null | undefined} id
 * @returns {string | null | undefined}
 */
export function chatAnonymousIdFrom(id) {
  if (!id || typeof id !== 'string') return id;
  return id.endsWith(':lp') ? id.slice(0, -3) : id;
}

/**
 * Derive LP wallet anonymousId from chat wallet id.
 * @param {string | null | undefined} chatAnonymousId
 * @returns {string | null}
 */
export function lpAnonymousIdFromChat(chatAnonymousId) {
  let chat = chatAnonymousIdFrom(chatAnonymousId);
  if (!chat || typeof chat !== 'string') return null;
  while (chat.endsWith(':lp')) chat = chat.slice(0, -3);
  return `${chat}:lp`;
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
 * Whether `requested` belongs to the authenticated chat session (chat id or its LP sibling).
 * @param {string} sessionChatAid
 * @param {string | null | undefined} requested
 * @returns {boolean}
 */
export function ownsAgentWalletSibling(sessionChatAid, requested) {
  if (!sessionChatAid || !requested) return false;
  if (requested === sessionChatAid) return true;
  return requested === lpAnonymousIdFromChat(sessionChatAid);
}

/**
 * Mongo filter for purpose (legacy rows without purpose count as chat).
 * @param {AgentWalletPurpose} purpose
 */
export function purposeQuery(purpose) {
  const p = normalizeAgentWalletPurpose(purpose);
  if (p === 'lp') return { purpose: 'lp' };
  return { $or: [{ purpose: 'chat' }, { purpose: { $exists: false } }, { purpose: null }] };
}
