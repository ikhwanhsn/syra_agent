/**
 * News provider adapters for Macro Intelligence Agent.
 */

import { createHash } from "node:crypto";
import { fetchRssSource } from "../newsSources/rssParser.js";
import { BTC3_NEWS_PROVIDERS, BTC3_MACRO_RSS_TIMEOUT_MS } from "../../config/btc3MacroConfig.js";
import { newsSourceRepo } from "../../repositories/btc3/index.js";

/**
 * @typedef {{
 *   externalId: string;
 *   providerId: string;
 *   title: string;
 *   summary: string;
 *   body: string;
 *   url: string;
 *   publishedAt: Date;
 *   language: string;
 * }} NormalizedArticle
 */

/**
 * @typedef {{
 *   id: string;
 *   fetchArticles: () => Promise<{ articles: NormalizedArticle[]; status: string; error?: string }>;
 * }} NewsProviderAdapter
 */

function hashContent(title, summary) {
  return createHash("sha256")
    .update(`${title}|${summary}`)
    .digest("hex")
    .slice(0, 32);
}

/** @returns {NewsProviderAdapter} */
function createRssAdapter(provider) {
  return {
    id: provider.id,
    async fetchArticles() {
      if (!provider.url) {
        return { articles: [], status: "unavailable", error: "No RSS URL configured" };
      }
      try {
        const raw = await fetchRssSource(
          { id: provider.id, name: provider.name, url: provider.url },
          BTC3_MACRO_RSS_TIMEOUT_MS,
        );
        const articles = raw.map((a) => ({
          externalId: a.id || hashContent(a.title, a.description),
          providerId: provider.id,
          title: a.title,
          summary: a.description || "",
          body: a.description || "",
          url: a.url,
          publishedAt: new Date(a.publishedAt),
          language: "en",
        }));
        await newsSourceRepo.updateFetchStatus(provider.id, { articlesFetched: articles.length });
        return { articles, status: "active" };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await newsSourceRepo.updateFetchStatus(provider.id, { lastError: message });
        return { articles: [], status: "error", error: message };
      }
    },
  };
}

/** @returns {NewsProviderAdapter} */
function createPaidApiAdapter(provider) {
  return {
    id: provider.id,
    async fetchArticles() {
      // TODO: implement when API credentials are configured
      return {
        articles: [],
        status: "todo",
        error: `${provider.name} API integration pending — configure credentials in env`,
      };
    },
  };
}

/** @returns {NewsProviderAdapter[]} */
export function getNewsProviderAdapters() {
  return BTC3_NEWS_PROVIDERS.filter((p) => p.enabled).map((provider) => {
    if (provider.type === "rss") return createRssAdapter(provider);
    return createPaidApiAdapter(provider);
  });
}

export async function syncNewsSourceRegistry() {
  for (const p of BTC3_NEWS_PROVIDERS) {
    await newsSourceRepo.upsertProvider({
      providerId: p.id,
      name: p.name,
      type: p.type,
      category: p.category,
      url: p.url ?? null,
      enabled: p.enabled,
      status: p.status,
    });
  }
}

export async function collectNewsFromProviders() {
  await syncNewsSourceRegistry();
  const adapters = getNewsProviderAdapters();
  /** @type {NormalizedArticle[]} */
  const all = [];
  /** @type {Record<string, { status: string; count: number; error?: string }>} */
  const providerStats = {};

  for (const adapter of adapters) {
    const result = await adapter.fetchArticles();
    providerStats[adapter.id] = {
      status: result.status,
      count: result.articles.length,
      error: result.error,
    };
    all.push(...result.articles);
  }

  return { articles: all, providerStats };
}

export { hashContent };
