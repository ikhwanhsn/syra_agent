/**
 * @deprecated Use libs/s3labs/s3labsNewsAggregator.js
 */
export {
  fetchS3labsNewsCandidates as fetchS3labsNewsArticles,
} from "./s3labs/s3labsNewsAggregator.js";
export {
  normalizeArticleUrl,
  compactArticlesForAgent,
} from "./s3labs/s3labsScoring.js";
