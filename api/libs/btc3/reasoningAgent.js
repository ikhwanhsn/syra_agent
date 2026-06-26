/**
 * Reasoning Agent — structured JSON macro reasoning for BTC allocation.
 */

import { createHash } from "node:crypto";
import { callOpenRouter } from "../openrouter.js";
import { parseJsonObjectFromLlm } from "../llmJsonObjectParse.js";
import { resolveBtc3MacroLlmModel } from "../../config/btc3MacroConfig.js";
import { reasoningRepo } from "../../repositories/btc3/index.js";

function isLlmConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || "").trim());
}

/**
 * @param {{
 *   macroEvent: { _id: import('mongoose').Types.ObjectId; headline: string; summary?: string; categories?: string[] };
 *   similarEvents?: Array<{ event: { title: string }; similarityScore: number; historicalReturn: number | null; duration: number | null; confidence: number }>;
 * }} input
 */
export async function generateReasoning(input) {
  const { macroEvent, similarEvents = [] } = input;

  if (!isLlmConfigured()) {
    const doc = await reasoningRepo.create({
      macroEventId: macroEvent._id,
      summary: "LLM unavailable — configure OPENROUTER_API_KEY to enable reasoning.",
      bullishFactors: [],
      bearishFactors: [],
      historicalEvidence: [],
      confidence: 0,
      recommendedAllocation: { btcPct: 40, usdcPct: 60 },
      timeHorizon: "7d",
      status: "unavailable",
    });
    return doc;
  }

  const historicalContext = similarEvents
    .slice(0, 5)
    .map(
      (s) =>
        `- ${s.event.title}: similarity=${s.similarityScore.toFixed(2)}, BTC 7d return=${s.historicalReturn ?? "N/A"}`,
    )
    .join("\n");

  const model = resolveBtc3MacroLlmModel();
  const prompt = `Analyze this macro event for Bitcoin SPOT allocation (no leverage, no shorting).

Return ONLY valid JSON:
{
  "summary": string,
  "bullishFactors": string[],
  "bearishFactors": string[],
  "historicalEvidence": [{ "eventTitle": string, "similarityScore": number, "btcReturn": number, "durationDays": number }],
  "confidence": number (0-1),
  "recommendedAllocation": { "btcPct": number, "usdcPct": number },
  "timeHorizon": "24h" | "7d" | "30d"
}

Rules:
- Never output BUY/SELL — only target allocation percentages summing to 100
- Base reasoning on evidence, not sentiment
- btcPct must be between 0 and 100

Event: ${macroEvent.headline}
Summary: ${macroEvent.summary || "N/A"}
Categories: ${(macroEvent.categories || []).join(", ") || "none"}

Historical similar events:
${historicalContext || "None available"}`;

  try {
    const { response } = await callOpenRouter(
      [
        { role: "system", content: "You are a macro intelligence agent for Bitcoin spot allocation. Output JSON only." },
        { role: "user", content: prompt },
      ],
      { model, max_tokens: 2048, temperature: 0.2 },
    );

    const parsed = /** @type {Record<string, unknown>} */ (parseJsonObjectFromLlm(response));
    const btcPct = Math.min(100, Math.max(0, Number(parsed.recommendedAllocation?.btcPct ?? 40)));
    const usdcPct = 100 - btcPct;

    const doc = await reasoningRepo.create({
      macroEventId: macroEvent._id,
      summary: String(parsed.summary || ""),
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors.map(String) : [],
      bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors.map(String) : [],
      historicalEvidence: Array.isArray(parsed.historicalEvidence) ? parsed.historicalEvidence : [],
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0))),
      recommendedAllocation: { btcPct, usdcPct },
      timeHorizon: String(parsed.timeHorizon || "7d"),
      model,
      status: "complete",
    });

    return doc;
  } catch (err) {
    return reasoningRepo.create({
      macroEventId: macroEvent._id,
      summary: "Reasoning generation failed.",
      bullishFactors: [],
      bearishFactors: [],
      confidence: 0,
      recommendedAllocation: { btcPct: 40, usdcPct: 60 },
      timeHorizon: "7d",
      status: "failed",
    });
  }
}

export function hashReasoning(doc) {
  const payload = JSON.stringify({
    summary: doc.summary,
    confidence: doc.confidence,
    allocation: doc.recommendedAllocation,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

export function hashHeadline(headline) {
  return createHash("sha256").update(String(headline || "")).digest("hex").slice(0, 32);
}
