/**
 * Decides when Telegram answer messages should show follow-up buttons and/or Main Menu.
 * Heuristic + fallback only — no extra LLM round-trip on the reply path.
 */
import { pickTelegramShortExamples } from '../../config/telegramExampleQuestions.js';

const FOLLOW_UP_TTL_MS = 24 * 60 * 60 * 1000;
const FOLLOW_UP_MAX_CHARS = 58;
const FOLLOW_UP_MIN_CHARS = 16;

const GREETING_OR_ACK =
  /^(hi|hello|hey|hiya|yo|sup|thanks|thank you|thx|ty|ok|okay|k|yes|no|bye|goodbye|see you|cya|cool|nice|got it|sure|great|perfect|awesome|👍|🙏)[\s!.?]*$/iu;

const TOOL_FOLLOW_UP_POOL = Object.freeze([
  "What's SOL trading at now?",
  'Any trending tokens on Solana?',
  "What's the latest crypto news?",
  'Smart money signals on BTC?',
  "How's ETH performing today?",
  'Hot Solana memecoins today?',
]);

/**
 * @typedef {{
 *   showFollowUps: boolean;
 *   followUpQuestions: string[];
 *   showMainMenu: boolean;
 *   followUpExpiresAt?: Date;
 * }} TelegramAnswerButtonPlan
 */

/**
 * @template T
 * @param {readonly T[]} items
 * @returns {T[]}
 */
function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalizeFollowUpQuestion(text) {
  let t = String(text || '').trim().replace(/\s+/g, ' ');
  if (!t.endsWith('?')) t = `${t}?`;
  if (t.length > FOLLOW_UP_MAX_CHARS) {
    t = t.slice(0, FOLLOW_UP_MAX_CHARS - 1).replace(/\s+\S*$/, '');
    if (!t.endsWith('?')) t = `${t}?`;
  }
  return t;
}

/**
 * @param {string} userQuestion
 * @returns {string}
 */
function pickToolFollowUpFallback(userQuestion) {
  const q = String(userQuestion || '').toLowerCase();
  if (/\b(solana|sol|meme|pump)\b/.test(q)) return 'Any trending tokens on Solana?';
  if (/\b(eth|ethereum)\b/.test(q)) return "How's ETH performing today?";
  if (/\b(btc|bitcoin)\b/.test(q)) return 'Smart money signals on BTC?';
  if (/\b(news|headline|event)\b/.test(q)) return "What's the latest crypto news?";
  if (/\b(price|trading|market)\b/.test(q)) return "What's SOL trading at now?";
  return shuffle(TOOL_FOLLOW_UP_POOL)[0];
}

/**
 * @param {string} userQuestion
 * @returns {string[]}
 */
export function buildFallbackFollowUps(userQuestion) {
  const free = pickTelegramShortExamples(2);
  return shuffle([...free, pickToolFollowUpFallback(userQuestion)]).map(normalizeFollowUpQuestion);
}

/**
 * @param {string} userQuestion
 * @param {string} assistantAnswer
 * @param {string[]} [toolsUsed]
 * @returns {TelegramAnswerButtonPlan | null}
 */
function heuristicButtonPlan(userQuestion, assistantAnswer, toolsUsed = []) {
  const q = String(userQuestion || '').trim();
  const qLower = q.toLowerCase();
  const a = String(assistantAnswer || '').trim();
  const aLower = a.toLowerCase();

  if (!q || !a) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: true };
  }

  if (GREETING_OR_ACK.test(q)) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: false };
  }

  if (
    a.length < 72 &&
    !a.includes('?') &&
    /^(you're welcome|no problem|anytime|glad to help|sure thing|happy to help|of course)/i.test(aLower)
  ) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: false };
  }

  if (
    /deposit usdc|insufficient usdc|no usdc|fund your|agent wallet has no|use \/wallet|wallet to your syra/i.test(
      aLower,
    )
  ) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: true };
  }

  if (
    /couldn't generate|please try again|something went wrong|not supported in telegram/i.test(aLower) &&
    a.length < 220
  ) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: true };
  }

  if (a.length < 48 && !q.includes('?') && !toolsUsed.length) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: false };
  }

  if (
    /^(what can you do|who are you|help me|how do i use|what is syra)\??$/i.test(qLower) &&
    a.length < 320
  ) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: true };
  }

  return null;
}

/**
 * @returns {Date}
 */
export function followUpSuggestionsExpiry() {
  return new Date(Date.now() + FOLLOW_UP_TTL_MS);
}

/**
 * @param {{
 *   userQuestion: string;
 *   assistantAnswer: string;
 *   toolsUsed?: string[];
 * }} input
 * @returns {Promise<TelegramAnswerButtonPlan>}
 */
export async function planTelegramAnswerButtons({ userQuestion, assistantAnswer, toolsUsed = [] }) {
  const question = String(userQuestion || '').trim();
  const answer = String(assistantAnswer || '').trim();
  const tools = Array.isArray(toolsUsed) ? toolsUsed : [];

  const heuristic = heuristicButtonPlan(question, answer, tools);
  if (heuristic) {
    return heuristic;
  }

  if (tools.length > 0) {
    return {
      showFollowUps: true,
      followUpQuestions: buildFallbackFollowUps(question),
      showMainMenu: false,
      followUpExpiresAt: followUpSuggestionsExpiry(),
    };
  }

  const substantive = question.includes('?') || answer.length > 180 || tools.length > 0;
  if (!substantive) {
    return { showFollowUps: false, followUpQuestions: [], showMainMenu: false };
  }

  return {
    showFollowUps: true,
    followUpQuestions: buildFallbackFollowUps(question),
    showMainMenu: false,
    followUpExpiresAt: followUpSuggestionsExpiry(),
  };
}
