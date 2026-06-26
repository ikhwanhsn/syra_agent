/**
 * Deduplication — content hash + near-duplicate clustering into MacroEvents.
 */

import { createHash } from "node:crypto";
import { macroEventRepo } from "../../repositories/btc3/index.js";

/**
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitleKey(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * @param {string} title
 * @param {string} summary
 * @returns {string}
 */
export function computeContentHash(title, summary) {
  return createHash("sha256")
    .update(`${normalizeTitleKey(title)}|${String(summary || "").slice(0, 500)}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Simple 3-word shingle set for Jaccard similarity.
 * @param {string} text
 * @returns {Set<string>}
 */
function shingleSet(text) {
  const words = normalizeTitleKey(text).split(/\s+/).filter(Boolean);
  const shingles = new Set();
  for (let i = 0; i < words.length - 2; i++) {
    shingles.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  if (shingles.size === 0 && words.length > 0) {
    shingles.add(words.join(" "));
  }
  return shingles;
}

/**
 * @param {Set<string>} a
 * @param {Set<string>} b
 * @returns {number}
 */
function jaccardSimilarity(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const s of a) {
    if (b.has(s)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.45;

/**
 * @param {Array<{ _id?: import('mongoose').Types.ObjectId; title: string; summary?: string; contentHash: string; publishedAt: Date | string }>} articles
 */
export async function deduplicateAndCluster(articles) {
  const seenHashes = new Set();
  /** @type {typeof articles} */
  const unique = [];

  for (const article of articles) {
    if (seenHashes.has(article.contentHash)) continue;
    seenHashes.add(article.contentHash);
    unique.push(article);
  }

  /** @type {Array<{ clusterKey: string; headline: string; summary: string; articleIds: import('mongoose').Types.ObjectId[]; publishedAt: Date }>} */
  const clusters = [];

  for (const article of unique) {
    const titleKey = normalizeTitleKey(article.title);
    const articleShingles = shingleSet(`${article.title} ${article.summary || ""}`);
    let matched = null;

    for (const cluster of clusters) {
      const clusterShingles = shingleSet(`${cluster.headline} ${cluster.summary}`);
      const sim = jaccardSimilarity(articleShingles, clusterShingles);
      if (sim >= SIMILARITY_THRESHOLD) {
        matched = cluster;
        break;
      }
    }

    if (matched) {
      if (article._id) matched.articleIds.push(article._id);
      if (new Date(article.publishedAt) < matched.publishedAt) {
        matched.publishedAt = new Date(article.publishedAt);
      }
      matched.summary = matched.summary || article.summary || "";
    } else {
      clusters.push({
        clusterKey: titleKey || article.contentHash,
        headline: article.title,
        summary: article.summary || "",
        articleIds: article._id ? [article._id] : [],
        publishedAt: new Date(article.publishedAt),
      });
    }
  }

  const events = [];
  for (const cluster of clusters) {
    const event = await macroEventRepo.upsertEvent({
      clusterKey: cluster.clusterKey,
      headline: cluster.headline,
      summary: cluster.summary,
      articleIds: cluster.articleIds,
      articleCount: cluster.articleIds.length,
      publishedAt: cluster.publishedAt,
      status: "clustered",
    });
    events.push(event);
  }

  return { uniqueArticles: unique, macroEvents: events };
}

export { jaccardSimilarity, shingleSet };
