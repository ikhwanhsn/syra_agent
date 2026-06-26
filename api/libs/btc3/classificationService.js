/**
 * Article classification into macro categories — LLM JSON output.
 */

import { callOpenRouter } from "../openrouter.js";
import { parseJsonObjectFromLlm } from "../llmJsonObjectParse.js";
import { BTC3_CLASSIFICATION_CATEGORIES, resolveBtc3MacroLlmModel } from "../../config/btc3MacroConfig.js";

function isLlmConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || "").trim());
}

/**
 * @param {{ headline: string; summary?: string }} event
 * @returns {Promise<{ categories: string[]; status: string; error?: string }>}
 */
export async function classifyMacroEvent(event) {
  if (!isLlmConfigured()) {
    return { categories: [], status: "unavailable" };
  }

  const model = resolveBtc3MacroLlmModel();
  const allowed = BTC3_CLASSIFICATION_CATEGORIES.join(", ");

  const prompt = `Classify this macro news event into one or more categories from this list ONLY:
${allowed}

Return ONLY valid JSON: { "categories": string[] }

Headline: ${event.headline}
Summary: ${event.summary || "N/A"}`;

  try {
    const { response } = await callOpenRouter(
      [
        { role: "system", content: "You classify macro financial news. Output JSON only." },
        { role: "user", content: prompt },
      ],
      { model, max_tokens: 512, temperature: 0.1 },
    );

    const parsed = /** @type {{ categories?: string[] }} */ (parseJsonObjectFromLlm(response));
    const categories = (parsed.categories || []).filter((c) =>
      BTC3_CLASSIFICATION_CATEGORIES.includes(c),
    );

    return { categories, status: "complete" };
  } catch (err) {
    return {
      categories: [],
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
