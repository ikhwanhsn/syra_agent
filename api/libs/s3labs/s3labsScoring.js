/**
 * Shared hotness scoring and URL normalization for S3Labs agents.
 */

/**
 * @typedef {import("../newsSources/rssParser.js").RawArticle} RawArticle
 */

/**
 * @param {string} url
 * @returns {string}
 */
export function normalizeArticleUrl(url) {
  return String(url || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
}

/**
 * @param {string} s
 * @returns {string}
 */
export function normalizeTitleKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * @param {RawArticle[]} articles
 * @returns {RawArticle[]}
 */
export function dedupeArticles(articles) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  /** @type {RawArticle[]} */
  const out = [];

  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  for (const a of sorted) {
    const urlKey = normalizeArticleUrl(a.url);
    if (!urlKey) continue;
    if (seenUrl.has(urlKey)) continue;
    const titleKey = normalizeTitleKey(a.title);
    if (titleKey && seenTitle.has(titleKey)) continue;
    seenUrl.add(urlKey);
    if (titleKey) seenTitle.add(titleKey);
    out.push(a);
  }
  return out;
}

/**
 * @param {RawArticle[]} articles
 * @param {{ recencyHalfLifeHours?: number }} [opts]
 * @returns {Array<{ article: RawArticle; hotScore: number }>}
 */
export function scoreArticlesByHotness(articles, opts = {}) {
  const halfLife = opts.recencyHalfLifeHours ?? 12;
  if (articles.length === 0) return [];

  const titleCounts = new Map();
  for (const a of articles) {
    const key = normalizeTitleKey(a.title).slice(0, 80);
    titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
  }

  const now = Date.now();
  return articles
    .map((article) => {
      const ageH = (now - new Date(article.publishedAt).getTime()) / (60 * 60 * 1000);
      const recency = Math.max(0, 1 - ageH / halfLife);
      const titleKey = normalizeTitleKey(article.title).slice(0, 80);
      const crossSource = titleCounts.get(titleKey) || 1;
      const buzz = Math.min(crossSource, 4) * 0.15;
      const tickerBoost = article.tickers.length > 0 ? 0.1 : 0;
      const descLen = article.description.length;
      const substance = descLen > 80 ? 0.08 : descLen > 20 ? 0.04 : 0;
      const hotScore = recency * 0.55 + buzz + tickerBoost + substance;
      return { article, hotScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore);
}

/**
 * @typedef {{ urls?: Set<string>; titleKeys?: Set<string> }} ContentExcludes
 */

/**
 * @param {RawArticle[]} articles
 * @param {ContentExcludes} excludes
 * @returns {RawArticle[]}
 */
export function filterAlreadySentArticles(articles, excludes) {
  const urls = excludes.urls ?? new Set();
  const titleKeys = excludes.titleKeys ?? new Set();
  if (urls.size === 0 && titleKeys.size === 0) return articles;

  return articles.filter((a) => {
    const urlKey = normalizeArticleUrl(a.url);
    if (urlKey && urls.has(urlKey)) return false;
    const titleKey = normalizeTitleKey(a.title);
    if (titleKey && titleKeys.has(titleKey)) return false;
    return true;
  });
}

/**
 * @param {RawArticle[]} articles
 * @param {number} hours
 * @returns {RawArticle[]}
 */
export function filterWithinHours(articles, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return articles.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
}

/**
 * @param {RawArticle[]} articles
 * @returns {Array<{ id: string; title: string; description: string; url: string; source: string; publishedAt: string; eventDate?: string }>}
 */
export function compactArticlesForAgent(articles) {
  return articles.map((a) => ({
    id: a.id,
    title: String(a.title || "").slice(0, 200),
    description: String(a.description || "").slice(0, 400),
    url: String(a.url || ""),
    source: String(a.source || "unknown").slice(0, 80),
    publishedAt: String(a.publishedAt || ""),
    eventDate: a.publishedAt ? a.publishedAt.slice(0, 10) : undefined,
  }));
}
