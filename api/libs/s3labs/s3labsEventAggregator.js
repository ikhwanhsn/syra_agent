/**
 * S3Labs Event agent — CoinMarketCal + crypto event-like headlines.
 */

import { fetchEventsForTicker } from "../eventsScraper.js";
import { getArticlesWithinHours } from "../newsAggregator.js";
import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";
import {
  compactArticlesForAgent,
  dedupeArticles,
  filterAlreadySentArticles,
  normalizeArticleUrl,
  scoreArticlesByHotness,
} from "./s3labsScoring.js";

/**
 * @typedef {import("../newsSources/rssParser.js").RawArticle} RawArticle
 */

/**
 * Flatten events map → pseudo-articles for scoring/LLM.
 * @param {Record<string, import("../eventsScraper.js").EventRow[]>} eventsByDate
 * @returns {RawArticle[]}
 */
function eventsMapToArticles(eventsByDate) {
  /** @type {RawArticle[]} */
  const out = [];
  const now = Date.now();
  const maxFuture = now + 21 * 24 * 60 * 60 * 1000;

  for (const [date, rows] of Object.entries(eventsByDate)) {
    const eventTime = new Date(`${date}T12:00:00Z`).getTime();
    if (eventTime < now - 24 * 60 * 60 * 1000 || eventTime > maxFuture) continue;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const slug = `${date}-${normalizeArticleUrl(row.event_name).slice(0, 60)}-${i}`;
      const tickers = row.ticker ? [row.ticker] : [];
      out.push({
        id: `event:${slug}`,
        title: row.event_name,
        description: row.event_text || row.event_name,
        url: `https://coinmarketcal.com/en/event/${encodeURIComponent(slug)}`,
        source: row.source || "CoinMarketCal",
        sourceId: "event",
        publishedAt: `${date}T09:00:00.000Z`,
        tickers,
      });
    }
  }
  return out;
}

/**
 * Event-like headlines from crypto news.
 * @param {RawArticle[]} articles
 * @returns {RawArticle[]}
 */
function filterEventLikeNews(articles) {
  return articles.filter((a) =>
    /launch|listing|upgrade|fork|mainnet|testnet|conference|summit|halving|unlock|airdrop|vote|hearing|etf|partnership|integrat|hackathon|meetup|ama|token generation|tge/i.test(
      `${a.title} ${a.description}`,
    ),
  );
}

/**
 * @param {{ excludes?: import("./s3labsScoring.js").ContentExcludes }} [opts]
 */
export async function fetchS3labsEventCandidates(opts = {}) {
  const def = getS3labsAgentDefinition("event");
  const excludes = opts.excludes ?? { urls: new Set(), titleKeys: new Set() };

  const [eventsByDate, recentNews] = await Promise.all([
    fetchEventsForTicker("general"),
    getArticlesWithinHours(def.lookbackHours),
  ]);

  const fromCal = eventsMapToArticles(eventsByDate);
  const fromNews = filterEventLikeNews(recentNews);
  const merged = dedupeArticles([...fromCal, ...fromNews]);
  const fresh = filterAlreadySentArticles(merged, excludes);
  const scored = scoreArticlesByHotness(fresh, { recencyHalfLifeHours: 48 });
  const hotCandidates = scored.slice(0, def.candidateLimit).map((s) => s.article);

  return {
    hotCandidates,
    stats: {
      articleCount: fresh.length,
      candidateCount: hotCandidates.length,
      eventCount: fromCal.length,
      newsEventCount: fromNews.length,
    },
    compactArticles: compactArticlesForAgent(hotCandidates),
  };
}
