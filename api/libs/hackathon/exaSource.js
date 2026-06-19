/**
 * Exa web search source — Indonesia + global technology hackathons not on Devpost.
 */

import Exa from "exa-js";
import {
  EXA_HACKATHON_NUM_RESULTS,
  EXA_HACKATHON_QUERIES,
} from "../../config/hackathonScoutConfig.js";
import { runHackathonExtractAgent } from "../../agents/hackathon-extract-agent.js";

/**
 * @typedef {import("./devpostSource.js").HackathonRecord} HackathonRecord
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
  numResults: EXA_HACKATHON_NUM_RESULTS,
  type: "auto",
  contents: { highlights: { maxCharacters: 3000 } },
};

/**
 * @param {import("exa-js").SearchResult<{}>} result
 * @param {string} query
 * @returns {{ id: string; title: string; url: string; text: string; query: string } | null}
 */
function normalizeExaHit(result, query) {
  const url = String(result.url || "").trim();
  if (!url) return null;
  const title = String(result.title || url).trim();
  const highlights = Array.isArray(result.highlights) ? result.highlights.join("\n") : "";
  const text = highlights || String(result.text || "").trim();
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
 * @returns {Promise<{ records: HackathonRecord[]; meta: { exaConfigured: boolean; queriesRun: number; hitsSampled: number; extracted: number } }>}
 */
export async function fetchExaHackathons(opts = {}) {
  const exa = getExaClient();
  if (!exa) {
    return {
      records: [],
      meta: { exaConfigured: false, queriesRun: 0, hitsSampled: 0, extracted: 0 },
    };
  }

  /** @type {Map<string, { id: string; title: string; url: string; text: string; query: string }>} */
  const hitMap = new Map();

  let queriesRun = 0;
  for (const query of EXA_HACKATHON_QUERIES) {
    try {
      const result = await exa.search(query, EXA_SEARCH_OPTIONS);
      queriesRun += 1;
      const results = Array.isArray(result?.results) ? result.results : [];
      for (const r of results) {
        const hit = normalizeExaHit(r, query);
        if (!hit || hitMap.has(hit.url)) continue;
        hitMap.set(hit.url, hit);
      }
    } catch (e) {
      console.warn(
        `[hackathon-scout] Exa query failed (${query}):`,
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
      exaConfigured: true,
      queriesRun,
      hitsSampled: hits.length,
      extracted: extracted.length,
    },
  };
}
