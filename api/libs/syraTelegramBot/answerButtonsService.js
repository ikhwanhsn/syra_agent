/**
 * Decides when Telegram answer messages should show follow-up buttons and/or Main Menu.
 */
import { callOpenRouter } from '../openrouter.js';
import { parseJsonObjectFromLlm } from '../llmJsonObjectParse.js';
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
 * @returns {string[]}
 */
function buildFallbackFollowUps(userQuestion) {
  const free = pickTelegramShortExamples(2);
  return shuffle([...free, pickToolFollowUpFallback(userQuestion)]).map(normalizeFollowUpQuestion);
}

/**
 * @param {unknown} value
 * @returns {string[] | null}
 */
function normalizeQuestions(value) {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray(value.questions)
      ? value.questions
      : null;
  if (!list) return null;

  const cleaned = list
    .map((item) => normalizeFollowUpQuestion(item))
    .filter((item) => item.length >= FOLLOW_UP_MIN_CHARS && item.length <= FOLLOW_UP_MAX_CHARS);

  return cleaned.length > 0 ? cleaned.slice(0, 3) : null;
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

  try {
    const { response } = await callOpenRouter(
      [
        {
          role: 'system',
          content: [
            'You decide whether a Telegram crypto bot reply should show inline buttons below the message.',
            'Return ONLY valid JSON:',
            '{"showFollowUps":boolean,"showMainMenu":boolean,"questions":["q1","q2","q3"]}',
            '',
            'showFollowUps = false when:',
            '- User sent a greeting, thanks, goodbye, or simple ack',
            '- Answer fully closes the topic with nothing useful to explore next',
            '- Answer is a short confirmation or off-topic chitchat',
            '- Answer is mostly an error/instruction with no educational follow-up',
            '',
            'showFollowUps = true when:',
            '- Substantive crypto Q&A where 3 natural next questions help',
            '- Educational or market answers where digging deeper makes sense',
            '',
            'showMainMenu = true when:',
            '- User may need navigation (errors, wallet hints, vague meta questions, dead ends)',
            '- showFollowUps is false but user might feel stuck',
            '',
            'showMainMenu = false when:',
            '- showFollowUps is true and conversation flow is enough',
            '- No buttons at all (both false) for casual hi/thanks/bye',
            '',
            `If showFollowUps is true, provide exactly 3 questions (${FOLLOW_UP_MIN_CHARS}-${FOLLOW_UP_MAX_CHARS} chars each, end with "?").`,
            '2 general-knowledge + 1 that naturally needs current market data — same tone, no tool/payment mentions.',
            'If showFollowUps is false, questions must be [].',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `User asked:\n${question}`,
            '',
            `Assistant answered:\n${answer.slice(0, 1400)}`,
            tools.length ? `\nTools used: ${tools.join(', ')}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      { max_tokens: 280, temperature: 0.4 },
    );

    const parsed = /** @type {Record<string, unknown>} */ (parseJsonObjectFromLlm(response));
    const showFollowUps = parsed.showFollowUps === true;
    const showMainMenu = parsed.showMainMenu === true;
    let followUpQuestions = showFollowUps ? normalizeQuestions(parsed.questions) : [];

    if (showFollowUps && (!followUpQuestions || followUpQuestions.length < 3)) {
      followUpQuestions = buildFallbackFollowUps(question);
    }

    if (!showFollowUps && !showMainMenu) {
      return { showFollowUps: false, followUpQuestions: [], showMainMenu: false };
    }

    return {
      showFollowUps: showFollowUps && followUpQuestions.length > 0,
      followUpQuestions: showFollowUps ? followUpQuestions.slice(0, 3) : [],
      showMainMenu,
      followUpExpiresAt: showFollowUps ? followUpSuggestionsExpiry() : undefined,
    };
  } catch (err) {
    console.warn(
      '[syra-telegram] answer button plan failed:',
      err instanceof Error ? err.message : err,
    );
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
