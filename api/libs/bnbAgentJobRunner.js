/**
 * Execute ERC-8183 job work using Syra's OpenRouter stack (called from Python bnb-agent sidecar).
 */
import { callOpenRouter } from './openrouter.js';

const DEFAULT_SYSTEM = `You are Syra — machine money for AI trading agents (ERC-8183 provider on BNB Chain).
Complete the client's funded job from the description. Be factual, concise, and structured.
Return markdown with sections: Summary, Analysis, Action items (if any).
Do not invent prices or on-chain data you were not given.`;

/**
 * @param {{
 *   jobId: string;
 *   description: string;
 *   budget?: string;
 *   client?: string;
 *   metadata?: Record<string, unknown>;
 * }} input
 * @returns {Promise<{ deliverable: string; model: string }>}
 */
export async function executeBnb8183Job(input) {
  const jobId = String(input.jobId || '').trim();
  const description = String(input.description || '').trim();
  if (!jobId) throw new Error('jobId is required');
  if (!description) throw new Error('description is required');

  const userLines = [
    `Job ID: ${jobId}`,
    `Description:\n${description}`,
  ];
  if (input.budget) userLines.push(`Budget (raw units): ${input.budget}`);
  if (input.client) userLines.push(`Client: ${input.client}`);
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    userLines.push(`Metadata:\n${JSON.stringify(input.metadata, null, 2)}`);
  }

  const system =
    (process.env.BNB8183_JOB_SYSTEM_PROMPT || '').trim() || DEFAULT_SYSTEM;

  const { response, raw } = await callOpenRouter(
    [
      { role: 'system', content: system },
      { role: 'user', content: userLines.join('\n\n') },
    ],
    {
      max_tokens: Number(process.env.BNB8183_JOB_MAX_TOKENS) || 4096,
      temperature: Number(process.env.BNB8183_JOB_TEMPERATURE) || 0.4,
      model: process.env.BNB8183_JOB_MODEL,
    },
  );

  const text = (response || '').trim();
  if (!text) {
    throw new Error('empty_deliverable');
  }

  const payload = {
    syra: true,
    chain: 'bsc',
    protocol: 'erc-8183',
    jobId,
    completedAt: new Date().toISOString(),
    content: text,
  };

  return {
    deliverable: JSON.stringify(payload, null, 2),
    model: raw?.model || process.env.BNB8183_JOB_MODEL || 'default',
  };
}
