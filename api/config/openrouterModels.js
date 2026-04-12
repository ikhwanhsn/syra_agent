/**
 * OpenRouter model catalog for Syra (curated allowlist).
 * IDs are OpenRouter `provider/model` slugs. Override default with env OPENROUTER_DEFAULT_MODEL.
 */
export const OPENROUTER_DEFAULT_MODEL =
  (typeof process.env.OPENROUTER_DEFAULT_MODEL === 'string' && process.env.OPENROUTER_DEFAULT_MODEL.trim()) ||
  'google/gemini-2.5-flash-lite';

export const OPENROUTER_MODELS = [
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    contextWindow: '1M',
    capabilities: ['reasoning', 'general', 'fast'],
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash (preview)',
    contextWindow: '1M',
    capabilities: ['reasoning', 'general', 'fast'],
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    contextWindow: '200K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    contextWindow: '200K',
    capabilities: ['reasoning', 'coding', 'agentic', 'creative'],
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    contextWindow: '400K',
    capabilities: ['reasoning', 'general', 'fast'],
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    contextWindow: '400K',
    capabilities: ['reasoning', 'coding', 'general'],
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    contextWindow: '128K',
    capabilities: ['reasoning', 'creative', 'general'],
  },
  {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    contextWindow: '256K',
    capabilities: ['reasoning', 'coding', 'agentic'],
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct-2506',
    name: 'Mistral Small 3.2 24B',
    contextWindow: '128K',
    capabilities: ['reasoning', 'coding', 'general'],
  },
];
