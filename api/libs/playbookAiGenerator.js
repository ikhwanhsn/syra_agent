import { callOpenRouter } from './openrouter.js';
import { OPENROUTER_DEFAULT_MODEL } from '../config/openrouterModels.js';
import { parseJsonObjectFromLlm } from './llmJsonObjectParse.js';
import { VALID_CATEGORIES } from '../models/agent/UserPrompt.js';

const SYSTEM_PROMPT = `You write agent playbooks for Syra Earn marketplace.

A playbook is a reusable instruction set that autonomous crypto agents follow.
Users earn USDC when other agents use their playbook.

Return ONLY a JSON object with these keys:
- title: string, max 60 chars, punchy and specific
- description: string, max 120 chars, one-line benefit for agents
- category: one of ${VALID_CATEGORIES.join(', ')}
- prompt: string, 4–10 clear imperative steps an agent can execute (use newlines between steps)

Rules:
- Focus on Solana / crypto / DeFi / research / trading / live data / tools
- Be concrete and actionable — no fluff, no disclaimers, no markdown fences
- Do not invent private keys, seed phrases, or ask users to send funds
- Prefer deterministic steps agents can run with tools (scan, compare, summarize, alert)
- If the user gives an idea, honor it; otherwise invent a useful original playbook`;

/**
 * @param {unknown} value
 * @param {number} max
 */
function cleanText(value, max) {
  const text = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trim() : text;
}

/**
 * @param {unknown} category
 */
function normalizeCategory(category) {
  const c = String(category ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  return VALID_CATEGORIES.includes(c) ? c : 'general';
}

/**
 * @param {{ idea?: string }} opts
 * @returns {Promise<{ title: string; description: string; category: string; prompt: string }>}
 */
export async function generatePlaybookDraft({ idea } = {}) {
  const ideaText = cleanText(idea, 500);
  const userContent = ideaText
    ? `User idea for the playbook:\n${ideaText}\n\nFill title, description, category, and full agent instructions.`
    : 'Invent a high-quality original playbook agents would pay to use. Vary the topic — do not always pick the same strategy.';

  const { response } = await callOpenRouter(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    {
      max_tokens: 900,
      temperature: ideaText ? 0.55 : 0.85,
      model: OPENROUTER_DEFAULT_MODEL,
    }
  );

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(response);
  } catch {
    const err = new Error('AI returned an invalid playbook draft. Try again.');
    err.code = 'invalid_ai_output';
    throw err;
  }

  const title = cleanText(parsed?.title, 80);
  const description = cleanText(parsed?.description, 200);
  const prompt = cleanText(parsed?.prompt, 4000);
  const category = normalizeCategory(parsed?.category);

  if (!title || !prompt) {
    const err = new Error('AI draft was incomplete. Try again.');
    err.code = 'invalid_ai_output';
    throw err;
  }

  return { title, description, category, prompt };
}
