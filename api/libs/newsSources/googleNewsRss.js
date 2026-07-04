/**
 * On-demand Google News RSS for asset keyword search (equities, crypto, general).
 */
import { fetchRssUrl } from './rssParser.js';

const GOOGLE_NEWS_RSS_ENABLED =
  String(process.env.INTERNAL_NEWS_GOOGLE_RSS_ENABLED ?? 'true').toLowerCase() !== 'false';

/**
 * Prefer specific primary phrases, then fill with remaining asset keywords.
 * Longer / $ticker terms rank higher so Google News stays on-asset.
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @returns {string[]}
 */
function rankSearchTerms(keywordQuery) {
  const primary = (keywordQuery.primary || []).map((t) => String(t || '').trim()).filter((t) => t.length >= 2);
  const all = (keywordQuery.all || []).map((t) => String(t || '').trim()).filter((t) => t.length >= 2);
  const seen = new Set();
  /** @type {string[]} */
  const ranked = [];

  const push = (term) => {
    const key = term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ranked.push(term);
  };

  // Longer phrases and $tickers first within each bucket.
  const bySpecificity = (a, b) => {
    const aCash = a.startsWith('$') ? 1 : 0;
    const bCash = b.startsWith('$') ? 1 : 0;
    if (bCash !== aCash) return bCash - aCash;
    return b.length - a.length;
  };

  for (const term of [...primary].sort(bySpecificity)) push(term);
  for (const term of [...all].sort(bySpecificity)) push(term);
  return ranked;
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {{ cryptoBias?: boolean }} [opts]
 * @returns {string | null}
 */
export function buildGoogleNewsRssUrl(keywordQuery, opts = {}) {
  const cleaned = rankSearchTerms(keywordQuery).slice(0, 5);
  if (cleaned.length === 0) return null;

  const orClause = cleaned
    .map((t) => (t.includes(' ') ? `"${t}"` : t))
    .join(' OR ');

  // Optional crypto bias for swap/token panels — keep off for equities.
  const q = opts.cryptoBias
    ? `(${orClause}) (crypto OR cryptocurrency OR token OR coin OR blockchain)`
    : orClause;

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
 * @param {{ cryptoBias?: boolean }} [opts]
 * @returns {Promise<import('./rssParser.js').RawArticle[]>}
 */
export async function fetchGoogleNewsForAsset(keywordQuery, timeoutMs, opts = {}) {
  if (!GOOGLE_NEWS_RSS_ENABLED) return [];
  const url = buildGoogleNewsRssUrl(keywordQuery, opts);
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
