/**
 * On-demand Google News RSS for asset keyword search (equities, crypto, general).
 */
import { fetchRssUrl } from './rssParser.js';

const GOOGLE_NEWS_RSS_ENABLED =
  String(process.env.INTERNAL_NEWS_GOOGLE_RSS_ENABLED ?? 'true').toLowerCase() !== 'false';

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @returns {string | null}
 */
export function buildGoogleNewsRssUrl(keywordQuery) {
  const terms = (keywordQuery.primary?.length ? keywordQuery.primary : keywordQuery.all) || [];
  const cleaned = terms
    .map((t) => String(t || '').trim())
    .filter((t) => t.length >= 2)
    .slice(0, 4);
  if (cleaned.length === 0) return null;

  const q = cleaned
    .map((t) => (t.includes(' ') ? `"${t}"` : t))
    .join(' OR ');

  const params = new URLSearchParams({
    q,
    hl: process.env.INTERNAL_NEWS_GOOGLE_RSS_HL || 'en-US',
    gl: process.env.INTERNAL_NEWS_GOOGLE_RSS_GL || 'US',
    ceid: process.env.INTERNAL_NEWS_GOOGLE_RSS_CEID || 'US:en',
  });

  return `https://news.google.com/rss/search?${params.toString()}`;
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {number} [timeoutMs]
 * @returns {Promise<import('./rssParser.js').RawArticle[]>}
 */
export async function fetchGoogleNewsForAsset(keywordQuery, timeoutMs) {
  if (!GOOGLE_NEWS_RSS_ENABLED) return [];
  const url = buildGoogleNewsRssUrl(keywordQuery);
  if (!url) return [];

  try {
    return await fetchRssUrl(
      url,
      { sourceId: 'google-news', sourceName: 'Google News' },
      timeoutMs,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[internal-news] Google News RSS failed:', msg);
    return [];
  }
}
