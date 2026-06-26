/**
 * Macro Impact Agent — BTC expected return estimates across horizons.
 */

import { callOpenRouter } from "../openrouter.js";
import { parseJsonObjectFromLlm } from "../llmJsonObjectParse.js";
import { resolveBtc3MacroLlmModel } from "../../config/btc3MacroConfig.js";
import { predictionRepo } from "../../repositories/btc3/index.js";

function isLlmConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || "").trim());
}

/**
 * @param {{
 *   macroEvent: { _id: import('mongoose').Types.ObjectId; headline: string; summary?: string };
 *   reasoning: { summary?: string; confidence?: number; bullishFactors?: string[]; bearishFactors?: string[] };
 *   similarEvents?: Array<{ historicalReturn: number | null; confidence: number }>;
 * }} input
 */
export async function estimateMacroImpact(input) {
  const { macroEvent, reasoning, similarEvents = [] } = input;

  if (!isLlmConfigured()) {
    return predictionRepo.create({
      macroEventId: macroEvent._id,
      reasoningId: reasoning._id ?? null,
      horizons: {
        h24: { expectedReturn: null, expectedDownside: null, expectedVolatility: null, confidence: null },
        d7: { expectedReturn: null, expectedDownside: null, expectedVolatility: null, confidence: null },
        d30: { expectedReturn: null, expectedDownside: null, expectedVolatility: null, confidence: null },
      },
      status: "unavailable",
    });
  }

  const avgHistReturn =
    similarEvents.length > 0
      ? similarEvents.reduce((s, e) => s + (e.historicalReturn ?? 0), 0) / similarEvents.length
      : 0;

  const model = resolveBtc3MacroLlmModel();
  const prompt = `Estimate Bitcoin SPOT impact probabilities for this macro event.

Return ONLY valid JSON:
{
  "h24": { "expectedReturn": number, "expectedDownside": number, "expectedVolatility": number, "confidence": number },
  "d7": { "expectedReturn": number, "expectedDownside": number, "expectedVolatility": number, "confidence": number },
  "d30": { "expectedReturn": number, "expectedDownside": number, "expectedVolatility": number, "confidence": number }
}

All returns as decimals (e.g. 0.05 = +5%). Downside is negative. Confidence 0-1.
Never predict certainty — provide probabilistic estimates.

Event: ${macroEvent.headline}
Reasoning: ${reasoning.summary || "N/A"}
Avg historical similar return (7d): ${avgHistReturn.toFixed(4)}
Reasoning confidence: ${reasoning.confidence ?? 0}`;

  try {
    const { response } = await callOpenRouter(
      [
        { role: "system", content: "You estimate probabilistic Bitcoin macro impact. Output JSON only." },
        { role: "user", content: prompt },
      ],
      { model, max_tokens: 1024, temperature: 0.2 },
    );

    const parsed = /** @type {Record<string, Record<string, number>>} */ (
      parseJsonObjectFromLlm(response)
    );

    return predictionRepo.create({
      macroEventId: macroEvent._id,
      reasoningId: reasoning._id ?? null,
      horizons: {
        h24: parsed.h24 || {},
        d7: parsed.d7 || {},
        d30: parsed.d30 || {},
      },
      model,
      status: "complete",
    });
  } catch {
    return predictionRepo.create({
      macroEventId: macroEvent._id,
      reasoningId: reasoning._id ?? null,
      status: "failed",
    });
  }
}
