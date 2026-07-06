/**
 * Heuristic agent-tool matching for Telegram (wraps matchToolFromUserMessage).
 */
import {
  getAgentTool,
  matchAllToolsFromUserMessage,
  matchToolFromUserMessage,
} from '../../config/agentTools.js';

const MAX_HEURISTIC_TOOLS = 3;
const CLAUSE_SPLIT = /\s+(?:and|&|plus|also)\s+|,\s*(?=\S)/i;

/**
 * @param {{ toolId: string; params?: Record<string, string> }} entry
 * @returns {{ toolId: string; params: Record<string, string> } | null}
 */
function normalizeHeuristicEntry(entry) {
  if (!entry?.toolId || !getAgentTool(entry.toolId)) return null;
  return {
    toolId: entry.toolId,
    params: entry.params && typeof entry.params === 'object' ? entry.params : {},
  };
}

/**
 * @param {string} userQuestion
 * @returns {{ toolId: string; params: Record<string, string> } | null}
 */
export function resolveHeuristicAgentTool(userQuestion) {
  const tools = resolveHeuristicAgentTools(userQuestion, 1);
  return tools[0] ?? null;
}

/**
 * Resolve one or more tools from heuristics — clause splits first ("signal and news"), then full message.
 * @param {string} userQuestion
 * @param {number} [max=3]
 * @returns {Array<{ toolId: string; params: Record<string, string> }>}
 */
export function resolveHeuristicAgentTools(userQuestion, max = MAX_HEURISTIC_TOOLS) {
  const q = String(userQuestion || '').trim();
  if (!q) return [];

  /** @type {Array<{ toolId: string; params: Record<string, string> }>} */
  const out = [];
  const seen = new Set();

  const add = (entry, replace = false) => {
    const normalized = normalizeHeuristicEntry(entry);
    if (!normalized) return;

    if (seen.has(normalized.toolId)) {
      if (replace) {
        const idx = out.findIndex((t) => t.toolId === normalized.toolId);
        if (idx >= 0) out[idx] = normalized;
      }
      return;
    }

    seen.add(normalized.toolId);
    out.push(normalized);
  };

  const fragments = q
    .split(CLAUSE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
  const specificClauses = fragments.length > 1 ? fragments : [];

  for (const clause of specificClauses) {
    if (out.length >= max) break;
    add(matchToolFromUserMessage(clause), true);
  }

  for (const hit of matchAllToolsFromUserMessage(q, max)) {
    if (out.length >= max) break;
    add(hit, false);
  }

  return out.slice(0, max);
}

/**
 * @param {string} question
 * @returns {boolean}
 */
export function hasHeuristicAgentTool(question) {
  return resolveHeuristicAgentTools(question).length > 0;
}
