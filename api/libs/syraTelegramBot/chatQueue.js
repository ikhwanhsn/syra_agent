/**
 * Per-chat mutex + soft brain rate limit for Syra Telegram bot.
 * In-memory only — serializes work per chatId without global blocking.
 */

const BRAIN_COOLDOWN_MS = 4_000;

/** @type {Map<string, Promise<unknown>>} */
const chatTails = new Map();

/** @type {Map<string, number>} */
const lastBrainStartedAt = new Map();

/**
 * @param {string | number} chatId
 * @returns {string}
 */
function keyFor(chatId) {
  return String(chatId);
}

/**
 * Run work exclusively for a chat. Concurrent callers for the same chat wait in a FIFO chain.
 * @template T
 * @param {string | number} chatId
 * @param {() => Promise<T>} work
 * @returns {Promise<T>}
 */
export function runExclusiveForChat(chatId, work) {
  const key = keyFor(chatId);
  const prev = chatTails.get(key) || Promise.resolve();

  const next = prev
    .catch(() => {})
    .then(() => work())
    .finally(() => {
      if (chatTails.get(key) === next) {
        chatTails.delete(key);
      }
    });

  chatTails.set(key, next);
  return /** @type {Promise<T>} */ (next);
}

/**
 * Start exclusive work only if the chat is free. Does not queue behind an in-flight job.
 * Claims the slot synchronously before any await to avoid TOCTOU races.
 * @template T
 * @param {string | number} chatId
 * @param {() => Promise<T>} work
 * @returns {Promise<{ started: false } | { started: true; result: T }>}
 */
export async function tryRunExclusiveForChat(chatId, work) {
  const key = keyFor(chatId);
  if (chatTails.has(key)) {
    return { started: false };
  }

  /** @type {() => void} */
  let settleDone = () => {};
  const done = new Promise((resolve) => {
    settleDone = resolve;
  });
  chatTails.set(key, done);

  try {
    const result = await work();
    return { started: true, result };
  } finally {
    settleDone();
    if (chatTails.get(key) === done) {
      chatTails.delete(key);
    }
  }
}

/**
 * @param {string | number} chatId
 * @returns {boolean}
 */
export function isChatBusy(chatId) {
  return chatTails.has(keyFor(chatId));
}

/**
 * Soft rate limit for brain Q&A. Returns false if another brain job started recently.
 * @param {string | number} chatId
 * @param {number} [cooldownMs]
 * @returns {boolean}
 */
export function tryAcquireBrainSlot(chatId, cooldownMs = BRAIN_COOLDOWN_MS) {
  const key = keyFor(chatId);
  const now = Date.now();
  const last = lastBrainStartedAt.get(key) || 0;
  if (now - last < cooldownMs) {
    return false;
  }
  lastBrainStartedAt.set(key, now);
  return true;
}

/**
 * Test helper — clear in-memory state.
 */
export function resetChatQueueForTests() {
  chatTails.clear();
  lastBrainStartedAt.clear();
}

export { BRAIN_COOLDOWN_MS };
