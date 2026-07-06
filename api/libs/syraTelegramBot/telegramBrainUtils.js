/**
 * Telegram brain helpers — tool routing, timeouts.
 */
import { getAgentTool, matchToolFromUserMessage } from '../../config/agentTools.js';
import { selectToolsWithLlm } from '../../routes/agent/chat.js';
import { isTelegramLiveDataQuestion } from './questionIntent.js';

const HEURISTIC_FORCE_TOOLS = new Set([
  'news',
  'signal',
  'sentiment',
  'spcx-intelligence',
  'stablecrypto-coingecko-price',
]);
const MAX_TOOLS = 3;

/**
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
export function withTelegramTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Heuristic-first tool routing — skips slow LLM tool-select for news/signal/sentiment.
 * @param {string} userQuestion
 * @param {string} conversationSnippet
 * @returns {Promise<Array<{ toolId: string; params?: Record<string, string> }>>}
 */
export async function resolveTelegramMatchedTools(userQuestion, conversationSnippet) {
  const heuristic = matchToolFromUserMessage(userQuestion);
  if (
    heuristic?.toolId &&
    HEURISTIC_FORCE_TOOLS.has(heuristic.toolId) &&
    getAgentTool(heuristic.toolId)
  ) {
    return [
      {
        toolId: heuristic.toolId,
        params:
          heuristic.params && typeof heuristic.params === 'object' ? heuristic.params : {},
      },
    ];
  }

  if (!isTelegramLiveDataQuestion(userQuestion)) {
    return [];
  }

  let matched = [];
  try {
    const llm = await withTelegramTimeout(
      selectToolsWithLlm(userQuestion, conversationSnippet, { toolSelectMaxTokens: 256 }),
      12_000,
      'Tool selection',
    );
    matched = Array.isArray(llm.tools) ? llm.tools.slice(0, MAX_TOOLS) : [];
  } catch (e) {
    console.warn('[syra-telegram] tool select failed:', e instanceof Error ? e.message : e);
    matched = [];
  }

  if (heuristic?.toolId && getAgentTool(heuristic.toolId)) {
    const force = HEURISTIC_FORCE_TOOLS.has(heuristic.toolId);
    if (force || !matched.length) {
      matched = [
        {
          toolId: heuristic.toolId,
          params:
            heuristic.params && typeof heuristic.params === 'object' ? heuristic.params : {},
        },
      ];
    }
  }

  return matched;
}
