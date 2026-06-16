/**
 * Asset-filtered events from CoinMarketCal RSS.
 */
import { COINMARKETCAL_RSS_URL } from '../config/internalNewsConfig.js';
import { fetchRssUrl } from './newsSources/rssParser.js';
import { filterArticlesByAssetKeywords } from './newsAggregator.js';

/**
 * @param {import('./newsSources/rssParser.js').RawArticle} raw
 */
function articleToEventRow(raw) {
  return {
    event_name: raw.title.slice(0, 200),
    event_text: raw.description.slice(0, 500) || raw.title,
    ticker: raw.tickers[0] || '',
    source: raw.source,
  };
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @returns {Promise<Array<{ date: string; ticker: object[] }>>}
 */
export async function fetchCoinMarketCalEventsFiltered(keywordQuery) {
  try {
    const items = await fetchRssUrl(COINMARKETCAL_RSS_URL, {
      sourceId: 'coinmarketcal',
      sourceName: 'CoinMarketCal',
    });
    const filtered = filterArticlesByAssetKeywords(items, keywordQuery);
    /** @type {Record<string, object[]>} */
    const byDate = {};
    for (const item of filtered) {
      const date = item.publishedAt.slice(0, 10);
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(articleToEventRow(item));
    }
    return Object.keys(byDate)
      .sort()
      .map((date) => ({ date, ticker: byDate[date] }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[asset-events] CoinMarketCal filter failed:', msg);
    return [];
  }
}
