/**
 * OpenRouter model catalog for Syra (curated allowlist).
 * IDs are OpenRouter `provider/model` slugs — top 15 agentic text models.
 * @see https://openrouter.ai/models?output_modalities=text&order=agentic-high-to-low
 */
export const OPENROUTER_DEFAULT_MODEL = 'google/gemini-2.5-flash-lite';

/** @typedef {{ id: string; name: string; contextWindow: string; capabilities: string[] }} OpenRouterModelConfig */

/** @type {OpenRouterModelConfig[]} */
export const OPENROUTER_MODELS = [
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    contextWindow: '200K',
    capabilities: ['reasoning', 'coding', 'agentic', 'tools'],
  },
  {
    id: 'anthropic/claude-opus-4.1',
    name: 'Claude Opus 4.1',
    contextWindow: '200K',
    capabilities: ['reasoning', 'coding', 'agentic', 'tools'],
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    contextWindow: '200K',
    capabilities: ['reasoning', 'coding', 'agentic', 'fast'],
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    contextWindow: '400K',
    capabilities: ['reasoning', 'coding', 'agentic', 'tools'],
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    contextWindow: '400K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'openai/gpt-5-codex',
    name: 'GPT-5 Codex',
    contextWindow: '400K',
    capabilities: ['coding', 'agentic', 'tools'],
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro (preview)',
    contextWindow: '1M',
    capabilities: ['reasoning', 'coding', 'agentic', 'tools'],
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: '1M',
    capabilities: ['reasoning', 'coding', 'agentic', 'fast'],
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    contextWindow: '1M',
    capabilities: ['reasoning', 'general', 'fast', 'agentic'],
  },
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    contextWindow: '256K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    contextWindow: '256K',
    capabilities: ['reasoning', 'coding', 'agentic', 'tools'],
  },
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    contextWindow: '128K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder',
    contextWindow: '256K',
    capabilities: ['coding', 'agentic', 'tools'],
  },
  {
    id: 'z-ai/glm-4.6',
    name: 'GLM 4.6',
    contextWindow: '128K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    contextWindow: '128K',
    capabilities: ['reasoning', 'coding', 'agentic', 'open-source'],
  },
];

/** Set of allowed model ids for fast lookup. */
export const OPENROUTER_MODEL_IDS = new Set(OPENROUTER_MODELS.map((m) => m.id));

/**
 * @param {string | undefined} modelId
 * @returns {boolean}
 */
export function isAllowedOpenRouterModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  return OPENROUTER_MODEL_IDS.has(modelId.trim());
}
