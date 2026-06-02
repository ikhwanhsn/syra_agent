/**
 * S3Labs News agent — crypto / web3 RSS only.
 */

import { getArticlesWithinHours } from "../newsAggregator.js";
import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";
import {
  compactArticlesForAgent,
  dedupeArticles,
  filterAlreadySentArticles,
  scoreArticlesByHotness,
} from "./s3labsScoring.js";

/**
 * @typedef {import("../newsSources/rssParser.js").RawArticle} RawArticle
 */

/**
 * @param {{ excludes?: import("./s3labsScoring.js").ContentExcludes }} [opts]
 */
export async function fetchS3labsNewsCandidates(opts = {}) {
  const def = getS3labsAgentDefinition("news");
  const excludes = opts.excludes ?? { urls: new Set(), titleKeys: new Set() };

  const raw = await getArticlesWithinHours(def.lookbackHours);
  const fresh = filterAlreadySentArticles(dedupeArticles(raw), excludes);
  const scored = scoreArticlesByHotness(fresh, { recencyHalfLifeHours: 8 });
  const hotCandidates = scored.slice(0, def.candidateLimit).map((s) => s.article);

  return {
    hotCandidates,
    stats: {
      articleCount: fresh.length,
      candidateCount: hotCandidates.length,
      cryptoCount: fresh.length,
      devCount: 0,
    },
    compactArticles: compactArticlesForAgent(hotCandidates),
  };
}
