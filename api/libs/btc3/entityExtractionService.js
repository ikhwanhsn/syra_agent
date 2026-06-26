/**
 * Entity extraction via LLM — structured JSON output.
 */

import { callOpenRouter } from "../openrouter.js";
import { parseJsonObjectFromLlm } from "../llmJsonObjectParse.js";
import { BTC3_ENTITY_TYPES, resolveBtc3MacroLlmModel } from "../../config/btc3MacroConfig.js";
import { entityRepo } from "../../repositories/btc3/index.js";

function isLlmConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || "").trim());
}

/**
 * @param {{ headline: string; summary: string; categories?: string[] }} event
 * @returns {Promise<{ entities: Array<{ name: string; type: string }>; status: string }>}
 */
export async function extractEntitiesFromEvent(event) {
  if (!isLlmConfigured()) {
    return { entities: [], status: "unavailable" };
  }

  const model = resolveBtc3MacroLlmModel();
  const prompt = `Extract named entities from this macro news event. Return ONLY valid JSON:
{
  "entities": [{ "name": string, "type": "${BTC3_ENTITY_TYPES.join('" | "')}" }]
}

Event headline: ${event.headline}
Summary: ${event.summary || "N/A"}
Categories: ${(event.categories || []).join(", ") || "none"}`;

  try {
    const { response } = await callOpenRouter(
      [
        { role: "system", content: "You are a macro financial entity extractor. Output JSON only." },
        { role: "user", content: prompt },
      ],
      { model, max_tokens: 1024, temperature: 0.1 },
    );

    const parsed = /** @type {{ entities?: Array<{ name?: string; type?: string }> }} */ (
      parseJsonObjectFromLlm(response)
    );
    const entities = (parsed.entities || [])
      .filter((e) => e.name && e.type && BTC3_ENTITY_TYPES.includes(e.type))
      .map((e) => ({ name: String(e.name).trim(), type: String(e.type) }));

    return { entities, status: "complete" };
  } catch (err) {
    return {
      entities: [],
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {{ _id: import('mongoose').Types.ObjectId; headline: string; summary?: string; categories?: string[] }} macroEvent
 */
export async function persistEntitiesForEvent(macroEvent) {
  const { entities, status, error } = await extractEntitiesFromEvent(macroEvent);
  const saved = [];
  for (const ent of entities) {
    const doc = await entityRepo.upsertEntity({
      name: ent.name,
      type: ent.type,
      macroEventId: macroEvent._id,
    });
    if (doc) saved.push(doc);
  }
  return { entities: saved, status, error };
}
