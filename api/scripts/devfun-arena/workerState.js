import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_STATE = join(__dirname, "../../../.arena-worker-state.json");

const MAX_IDS = 250;
const MAX_RECENT_CHATS = 6;

/**
 * @typedef {{
 *   version: number;
 *   submittedChallengeIds: string[];
 *   recentChatMessages: string[];
 * }} ArenaWorkerState
 */

function defaultState() {
  return {
    version: 1,
    submittedChallengeIds: [],
    recentChatMessages: [],
  };
}

export function resolveStatePath() {
  return process.env.ARENA_STATE_PATH?.trim() || DEFAULT_STATE;
}

/**
 * @returns {Promise<ArenaWorkerState>}
 */
export async function loadWorkerState() {
  const p = resolveStatePath();
  try {
    const raw = await readFile(p, "utf8");
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return defaultState();
    return {
      version: 1,
      submittedChallengeIds: Array.isArray(o.submittedChallengeIds)
        ? o.submittedChallengeIds.filter((x) => typeof x === "string")
        : [],
      recentChatMessages: Array.isArray(o.recentChatMessages)
        ? o.recentChatMessages.filter((x) => typeof x === "string")
        : [],
    };
  } catch {
    return defaultState();
  }
}

/**
 * @param {ArenaWorkerState} state
 */
export async function saveWorkerState(state) {
  const p = resolveStatePath();
  const trimmed = {
    version: 1,
    submittedChallengeIds: state.submittedChallengeIds.slice(-MAX_IDS),
    recentChatMessages: state.recentChatMessages.slice(-MAX_RECENT_CHATS),
  };
  await writeFile(p, `${JSON.stringify(trimmed, null, 0)}\n`, "utf8");
}

/**
 * @param {string} challengeId
 * @param {string} chatMessage
 * @param {ArenaWorkerState} state
 */
export function recordSuccessfulSubmission(challengeId, chatMessage, state) {
  if (!state.submittedChallengeIds.includes(challengeId)) {
    state.submittedChallengeIds.push(challengeId);
  }
  const msg = chatMessage.trim().slice(0, 500);
  if (msg) state.recentChatMessages.push(msg);
  state.submittedChallengeIds = state.submittedChallengeIds.slice(-MAX_IDS);
  state.recentChatMessages = state.recentChatMessages.slice(-MAX_RECENT_CHATS);
}
