/**
 * HR coach — one cheap OpenRouter pass over compact briefs from other internal agents.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
  resolveInternalPipelineModel,
} from "../config/internalPipelineAgents.js";

const SYSTEM = `You are HR for Syra's internal "agent team" (the 15-slot daily pipelines: crawl, research, strategy, growth, x402, and you).
Brands to align: Syra (agentic trading + paid APIs) and Up Only (community / distribution). The founders want world-class execution without hype or invented metrics.

Your job: suggest concrete skill improvements for tomorrow so the team produces clearer, safer, cheaper-to-run digests (fewer tokens wasted on repetition, tighter JSON, better grounding).

Rules:
- Plain English only. No JSON. No markdown headings.
- Output 5 to 8 lines; each line starts with "- ".
- Each line under 130 characters when possible.
- Focus on: sharper prompts, trimming redundant fields, missing-data checks, dismissing bot/noise patterns, clearer numeric labels, and one coordination tip between roles.
- Do not invent numbers, TVL, user counts, or URLs; only react to the brief text given.`;

/**
 * @param {{ model?: string | null; brief: string }} params
 * @returns {Promise<{ coaching: string; generatedAt: string }>}
 */
export async function runInternalHrCoachAgent({ model, brief }) {
  const modelId = resolveInternalPipelineModel(model);
  const trimmed = typeof brief === "string" ? brief.trim().slice(0, 6000) : "";
  if (!trimmed) {
    return {
      coaching:
        "- Add real brief text tomorrow (pipelines may not have finished yet).\n- Re-run HR after other agents complete.",
      generatedAt: new Date().toISOString(),
    };
  }

  const messages = [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `Here is today's one-line pack from other agents (may be partial):\n\n${trimmed}\n\nWrite today's HR coaching bullets.`,
    },
  ];

  const { response } = await callOpenRouter(withLlmIdentitySystemNote(messages, modelId), {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.hrTeamCoach,
    temperature: 0.26,
  });

  return {
    coaching: typeof response === "string" ? response.trim() : "",
    generatedAt: new Date().toISOString(),
  };
}
