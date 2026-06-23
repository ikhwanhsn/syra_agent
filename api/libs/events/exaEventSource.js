/**
 * Exa web search source — tech/crypto/web3 events with lu.ma registration links.
 */

import Exa from "exa-js";
import { EXA_EVENT_NUM_RESULTS, EXA_EVENT_QUERIES } from "../../config/eventScoutConfig.js";
import { extractLumaUrls } from "../internalScoutDedupe.js";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   url: string;
 *   text: string;
 *   query: string;
 *   lumaUrls: string[];
 *   source?: "exa" | "x";
 * }} EventSearchHit
 */

/**
 * @returns {import("exa-js").Exa | null}
 */
function getExaClient() {
  const key = (process.env.EXA_API_KEY || "").trim();
  if (!key) return null;
  return new Exa(key);
}

const EXA_SEARCH_OPTIONS = {
  numResults: EXA_EVENT_NUM_RESULTS,
  type: "auto",
  contents: { highlights: { maxCharacters: 3000 } },
};

/**
 * @param {import("exa-js").SearchResult<{}>} result
 * @param {string} query
 * @returns {EventSearchHit | null}
 */
function normalizeExaHit(result, query) {
  const url = String(result.url || "").trim();
  if (!url) return null;
  const title = String(result.title || url).trim();
  const highlights = Array.isArray(result.highlights) ? result.highlights.join("\n") : "";
  const text = highlights || String(result.text || "").trim();
  const blob = `${title} ${text} ${url}`;
  const lumaUrls = extractLumaUrls(blob);
  if (lumaUrls.length === 0 && !/lu\.ma|luma\.com/i.test(url)) return null;

  return {
    id: String(result.id || url),
    title,
    url,
    text,
    query,
    lumaUrls: lumaUrls.length > 0 ? lumaUrls : extractLumaUrls(url),
    source: "exa",
  };
}

/**
 * @returns {Promise<{ hits: EventSearchHit[]; meta: { exaConfigured: boolean; queriesRun: number; hitsSampled: number } }>}
 */
export async function fetchExaEventHits() {
  const exa = getExaClient();
  if (!exa) {
    return {
      hits: [],
      meta: { exaConfigured: false, queriesRun: 0, hitsSampled: 0 },
    };
  }

  /** @type {Map<string, EventSearchHit>} */
  const hitMap = new Map();
  let queriesRun = 0;

  for (const query of EXA_EVENT_QUERIES) {
    try {
      const result = await exa.search(query, EXA_SEARCH_OPTIONS);
      queriesRun += 1;
      const results = Array.isArray(result?.results) ? result.results : [];
      for (const r of results) {
        const hit = normalizeExaHit(r, query);
        if (!hit) continue;
        const key = hit.lumaUrls[0] || hit.url;
        if (!hitMap.has(key)) hitMap.set(key, hit);
      }
    } catch (e) {
      console.warn(
        `[event-scout] Exa query failed (${query}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const hits = [...hitMap.values()];
  return {
    hits,
    meta: { exaConfigured: true, queriesRun, hitsSampled: hits.length },
  };
}
