/**
 * Telegram brain helpers — smart tool routing for all x402 / agent tools.
 */
import { getAgentTool } from '../../config/agentTools.js';
import { selectToolsWithLlm } from '../../routes/agent/chat.js';
import { resolveHeuristicAgentTools } from './telegramHeuristicTools.js';
import { isTelegramToolCandidateQuestion } from './questionIntent.js';

const MAX_TOOLS = 3;
const TOOL_SELECT_TIMEOUT_MS = 14_000;
const TOOL_SELECT_MAX_TOKENS = 384;

/**
 * @param {Array<{ toolId: string; params?: Record<string, string> }>} heuristicTools
 * @param {Array<{ toolId: string; params?: Record<string, string> }>} llmTools
 * @returns {Array<{ toolId: string; params?: Record<string, string> }>}
 */
function mergeToolMatches(heuristicTools, llmTools) {
  /** @type {Array<{ toolId: string; params?: Record<string, string> }>} */
  const out = [];
  const seen = new Set();

  const add = (entry) => {
    const toolId = entry?.toolId;
    if (!toolId || seen.has(toolId) || !getAgentTool(toolId)) return;
    seen.add(toolId);
    out.push({
      toolId,
      params: entry.params && typeof entry.params === 'object' ? entry.params : {},
    });
  };

  for (const t of heuristicTools) {
    if (out.length >= MAX_TOOLS) break;
    add(t);
  }
  for (const t of llmTools) {
    if (out.length >= MAX_TOOLS) break;
    add(t);
  }

  return out;
}

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
 * Smart tool routing for Telegram — mirrors website agent coverage.
 *
 * 1. Heuristic (`matchToolFromUserMessage`) — instant, covers all patterned x402 tools.
 * 2. LLM tool-select — fallback for live-data / action questions without a heuristic hit.
 * 3. Merge heuristic + LLM when both apply (heuristic first).
 *
 * @param {string} userQuestion
 * @param {string} conversationSnippet
 * @returns {Promise<Array<{ toolId: string; params?: Record<string, string> }>>}
 */
export async function resolveTelegramMatchedTools(userQuestion, conversationSnippet) {
  const q = String(userQuestion || '').trim();
  if (!q) return [];

  const heuristicTools = resolveHeuristicAgentTools(q, MAX_TOOLS);

  // Fast path: patterned match → call tool(s) immediately (news, signal, stablecrypto, nansen, etc.)
  if (heuristicTools.length > 0) {
    return heuristicTools;
  }

  if (!isTelegramToolCandidateQuestion(q)) {
    return [];
  }

  let llmTools = [];
  try {
    const llm = await withTelegramTimeout(
      selectToolsWithLlm(q, conversationSnippet, { toolSelectMaxTokens: TOOL_SELECT_MAX_TOKENS }),
      TOOL_SELECT_TIMEOUT_MS,
      'Tool selection',
    );
    llmTools = Array.isArray(llm.tools) ? llm.tools : [];
  } catch (e) {
    console.warn('[syra-telegram] tool select failed:', e instanceof Error ? e.message : e);
  }

  const merged = mergeToolMatches(heuristicTools, llmTools).slice(0, MAX_TOOLS);
  if (merged.length > 0) return merged;

  // Last resort: re-check heuristic (e.g. after LLM timeout)
  return resolveHeuristicAgentTools(q, MAX_TOOLS);
}
