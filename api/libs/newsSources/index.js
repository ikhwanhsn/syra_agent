/**
 * Aggregate all RSS news sources in parallel (allSettled — one failure won't break the feed).
 */

import { getInternalNewsRssSources } from "../../config/internalNewsConfig.js";
import { fetchRssSource } from "./rssParser.js";

/**
 * @typedef {import("./rssParser.js").RawArticle} RawArticle
 */

/**
 * @returns {Promise<RawArticle[]>}
 */
export async function fetchAllSources() {
  const sources = getInternalNewsRssSources();
  const results = await Promise.allSettled(
    sources.map((source) => fetchRssSource(source)),
  );

  /** @type {RawArticle[]} */
  const articles = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const source = sources[i];
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn(`[internal-news] RSS source ${source.id} failed:`, msg);
    }
  }
  return articles;
}

/**
 * @returns {number}
 */
export function getRssSourceCount() {
  return getInternalNewsRssSources().length;
}
