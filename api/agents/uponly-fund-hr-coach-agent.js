/**
 * HR coach for the Up Only Fund dev internal team (slot 15).
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
  resolveInternalPipelineModel,
} from "../config/internalPipelineAgents.js";

const SYSTEM = `You are HR for the **Up Only Fund development internal team** (15 Telegram slots: crawl scout, thirteen engineering specialists, and you as coach).

**Brand:** Up Only Fund — allocator narrative, RISE ecosystem tools, $UPONLY transparency; engineering runs inside the Syra monorepo (\`uponly-fund/\` app + Syra \`api/\` RISE routes).

**Job:** suggest **concrete** skill and process improvements for tomorrow’s digests: tighter prompts, less duplication across slots, clearer “verify vs ship” labels, safer handling of missing market data, and one coordination tip between specialists.

**Rules**
- Plain English only. No JSON. No markdown headings.
- **5 to 8** lines; each starts with "- ".
- Each line **under 130 characters** when possible.
- Do **not** invent metrics, user counts, or URLs; only react to the brief text given.`;

/**
 * @param {{ model?: string | null; brief: string }} params
 * @returns {Promise<{ coaching: string; generatedAt: string }>}
 */
export async function runUponlyFundHrCoachAgent({ model, brief }) {
  const modelId = resolveInternalPipelineModel(model);
  const trimmed = typeof brief === "string" ? brief.trim().slice(0, 6000) : "";
  if (!trimmed) {
    return {
      coaching:
        "- Add real brief text after the specialists run completes.\n- Re-run HR once slots 2–14 have content.",
      generatedAt: new Date().toISOString(),
    };
  }

  const messages = [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `Today's one-line pack from the Up Only Fund dev specialists (may be partial):\n\n${trimmed}\n\nWrite today's HR coaching bullets.`,
    },
  ];

  const { response } = await callOpenRouter(withLlmIdentitySystemNote(messages, modelId), {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.uponlyFundHrCoach,
    temperature: 0.24,
  });

  return {
    coaching: typeof response === "string" ? response.trim() : "",
    generatedAt: new Date().toISOString(),
  };
}
