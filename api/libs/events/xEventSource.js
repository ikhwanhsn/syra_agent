/**
 * X / Twitter search source — find lu.ma event links in recent tweets.
 */

import { advancedSearch, isTwitterApiIoConfigured } from "../twitterApiIoClient.js";
import { X_EVENT_MAX_TWEETS_PER_QUERY, X_EVENT_SEARCH_QUERIES } from "../../config/eventScoutConfig.js";
import { extractLumaUrls } from "../internalScoutDedupe.js";
import { looksEventRelevant } from "./eventUtils.js";

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
 * @returns {Promise<{ hits: EventSearchHit[]; meta: { xConfigured: boolean; queriesRun: number; tweetsSampled: number; hitsSampled: number } }>}
 */
export async function fetchXEventHits() {
  if (!isTwitterApiIoConfigured()) {
    return {
      hits: [],
      meta: { xConfigured: false, queriesRun: 0, tweetsSampled: 0, hitsSampled: 0 },
    };
  }

  /** @type {Map<string, EventSearchHit>} */
  const hitMap = new Map();
  let queriesRun = 0;
  let tweetsSampled = 0;

  for (const query of X_EVENT_SEARCH_QUERIES) {
    try {
      const result = await advancedSearch({ query, queryType: "Latest" });
      queriesRun += 1;
      const tweets = Array.isArray(result?.tweets) ? result.tweets.slice(0, X_EVENT_MAX_TWEETS_PER_QUERY) : [];
      tweetsSampled += tweets.length;

      for (const tweet of tweets) {
        const text = String(tweet?.text || "").trim();
        if (!text) continue;
        const lumaUrls = extractLumaUrls(text);
        if (lumaUrls.length === 0) continue;
        if (!looksEventRelevant(text) && !/lu\.ma/i.test(text)) continue;

        for (const lumaUrl of lumaUrls) {
          if (hitMap.has(lumaUrl)) continue;
          hitMap.set(lumaUrl, {
            id: String(tweet.id || lumaUrl),
            title: text.slice(0, 200),
            url: lumaUrl,
            text: text.slice(0, 2000),
            query,
            lumaUrls: [lumaUrl],
            source: "x",
          });
        }
      }
    } catch (e) {
      console.warn(
        `[event-scout] X query failed (${query}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const hits = [...hitMap.values()];
  return {
    hits,
    meta: { xConfigured: true, queriesRun, tweetsSampled, hitsSampled: hits.length },
  };
}
