/**
 * Web search source — Indonesia + global technology hackathons not on Devpost.
 */

import {
  WEB_HACKATHON_NUM_RESULTS,
  WEB_HACKATHON_QUERIES,
} from "../../config/hackathonScoutConfig.js";
import { runHackathonExtractAgent } from "../../agents/hackathon-extract-agent.js";
import { searchWeb } from "../research/webSearchService.js";

/**
 * @typedef {import("./devpostSource.js").HackathonRecord} HackathonRecord
 */

/**
 * @param {{ id: string; url: string; title: string; text: string }} result
 * @param {string} query
 * @returns {{ id: string; title: string; url: string; text: string; query: string } | null}
 */
function normalizeWebHit(result, query) {
  const url = String(result.url || "").trim();
  if (!url) return null;
  const title = String(result.title || url).trim();
  const text = String(result.text || "").trim();
  return {
    id: String(result.id || url),
    title,
    url,
    text,
    query,
  };
}

/**
 * @param {{ knownHackathons?: { title: string; organizer?: string }[] }} [opts]
 * @returns {Promise<{ records: HackathonRecord[]; meta: { webConfigured: boolean; queriesRun: number; hitsSampled: number; extracted: number } }>}
 */
export async function fetchWebHackathons(opts = {}) {
  /** @type {Map<string, { id: string; title: string; url: string; text: string; query: string }>} */
  const hitMap = new Map();

  let queriesRun = 0;
  for (const query of WEB_HACKATHON_QUERIES) {
    try {
      const result = await searchWeb(query, { numResults: WEB_HACKATHON_NUM_RESULTS });
      queriesRun += 1;
      const results = Array.isArray(result?.results) ? result.results : [];
      for (const r of results) {
        const hit = normalizeWebHit(r, query);
        if (!hit || hitMap.has(hit.url)) continue;
        hitMap.set(hit.url, hit);
      }
    } catch (e) {
      console.warn(
        `[hackathon-scout] Web search query failed (${query}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const hits = [...hitMap.values()];
  const extracted = await runHackathonExtractAgent({
    hits,
    knownHackathons: opts.knownHackathons,
  });

  return {
    records: extracted,
    meta: {
      webConfigured: true,
      queriesRun,
      hitsSampled: hits.length,
      extracted: extracted.length,
    },
  };
}
