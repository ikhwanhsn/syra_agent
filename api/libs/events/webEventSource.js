/**
 * Web search source — tech/crypto/web3 events with lu.ma registration links.
 */

import { WEB_EVENT_NUM_RESULTS, WEB_EVENT_QUERIES } from "../../config/eventScoutConfig.js";
import { extractLumaUrls } from "../internalScoutDedupe.js";
import { searchWeb } from "../research/webSearchService.js";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   url: string;
 *   text: string;
 *   query: string;
 *   lumaUrls: string[];
 *   source?: "web" | "x";
 * }} EventSearchHit
 */

/**
 * @param {{ id: string; url: string; title: string; text: string }} result
 * @param {string} query
 * @returns {EventSearchHit | null}
 */
function normalizeWebHit(result, query) {
  const url = String(result.url || "").trim();
  if (!url) return null;
  const title = String(result.title || url).trim();
  const text = String(result.text || "").trim();
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
    source: "web",
  };
}

/**
 * @returns {Promise<{ hits: EventSearchHit[]; meta: { webConfigured: boolean; queriesRun: number; hitsSampled: number } }>}
 */
export async function fetchWebEventHits() {
  /** @type {Map<string, EventSearchHit>} */
  const hitMap = new Map();
  let queriesRun = 0;

  for (const query of WEB_EVENT_QUERIES) {
    try {
      const result = await searchWeb(query, { numResults: WEB_EVENT_NUM_RESULTS });
      queriesRun += 1;
      const results = Array.isArray(result?.results) ? result.results : [];
      for (const r of results) {
        const hit = normalizeWebHit(r, query);
        if (!hit) continue;
        const key = hit.lumaUrls[0] || hit.url;
        if (!hitMap.has(key)) hitMap.set(key, hit);
      }
    } catch (e) {
      console.warn(
        `[event-scout] Web search query failed (${query}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const hits = [...hitMap.values()];
  return {
    hits,
    meta: { webConfigured: true, queriesRun, hitsSampled: hits.length },
  };
}
