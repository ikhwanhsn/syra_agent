/**
 * S3Labs Developer agent — dev / engineering RSS only.
 */

import { fetchRssSource } from "../newsSources/rssParser.js";
import { S3LABS_DEV_RSS_SOURCES, getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";
import {
  compactArticlesForAgent,
  dedupeArticles,
  filterAlreadySentArticles,
  filterWithinHours,
  scoreArticlesByHotness,
} from "./s3labsScoring.js";

/**
 * @typedef {import("../newsSources/rssParser.js").RawArticle} RawArticle
 */

async function fetchDevFeeds() {
  const results = await Promise.allSettled(
    S3LABS_DEV_RSS_SOURCES.map((source) => fetchRssSource(source)),
  );
  /** @type {RawArticle[]} */
  const articles = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const source = S3LABS_DEV_RSS_SOURCES[i];
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn(`[s3labs-developer] RSS ${source.id} failed:`, msg);
    }
  }
  return articles;
}

/**
 * @param {{ excludes?: import("./s3labsScoring.js").ContentExcludes }} [opts]
 */
export async function fetchS3labsDeveloperCandidates(opts = {}) {
  const def = getS3labsAgentDefinition("developer");
  const excludes = opts.excludes ?? { urls: new Set(), titleKeys: new Set() };

  const devRaw = await fetchDevFeeds();
  const inWindow = filterWithinHours(devRaw, def.lookbackHours);
  const fresh = filterAlreadySentArticles(dedupeArticles(inWindow), excludes);
  const scored = scoreArticlesByHotness(fresh, { recencyHalfLifeHours: 18 });
  const hotCandidates = scored.slice(0, def.candidateLimit).map((s) => s.article);

  return {
    hotCandidates,
    stats: {
      articleCount: fresh.length,
      candidateCount: hotCandidates.length,
      devCount: fresh.length,
    },
    compactArticles: compactArticlesForAgent(hotCandidates),
  };
}
