/**
 * Find X accounts mentioning a token mint (KOL / shill detection).
 * Prefers twitterapi.io (TWITTER_API_KEY), falls back to official X API (X_BEARER_TOKEN).
 *
 * Service-level cache (~15 min success / ~5 min negative) so swap, memecoin analysis,
 * and any other caller share one billable result per mint.
 */
import { advancedSearch, isTwitterApiIoConfigured } from './twitterApiIoClient.js';
import { searchRecentTweets, isXApiBearerConfigured } from './xApiClient.js';
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

function parsePositiveIntEnv(raw, fallback) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const KOL_SHILL_CACHE_TTL_MS = parsePositiveIntEnv(
  process.env.KOL_SHILL_CACHE_MS,
  900_000,
);
const KOL_SHILL_NEGATIVE_CACHE_TTL_MS = parsePositiveIntEnv(
  process.env.KOL_SHILL_NEGATIVE_CACHE_MS,
  300_000,
);

const kolShillCache = createBoundedTtlCache({
  name: 'kol-shills',
  maxEntries: parsePositiveIntEnv(process.env.KOL_SHILL_CACHE_MAX_ENTRIES, 500),
  defaultTtlMs: KOL_SHILL_CACHE_TTL_MS,
});

/**
 * @param {{
 *   mint: string;
 *   symbol?: string | null;
 *   name?: string | null;
 *   twitter?: string | null;
 *   fast?: boolean;
 * }} params
 */
function kolShillCacheKey(params) {
  const mint = String(params.mint || '').trim().toLowerCase();
  const symbol = String(params.symbol || '').trim().toLowerCase();
  const name = String(params.name || '').trim().toLowerCase();
  const twitter = String(params.twitter || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
  const mode = params.fast ? 'fast' : 'full';
  return `${mode}|${mint}|${symbol}|${name}|${twitter}`;
}

const GENERIC_SYMBOLS = new Set([
  'sol', 'btc', 'eth', 'usdc', 'usdt', 'ai', 'meme', 'coin', 'token', 'pump', 'fun',
  'doge', 'pepe', 'cat', 'dog', 'moon', 'gem', 'new', 'the', 'and', 'xyz', 'ceo',
]);

const SHILL_KEYWORDS =
  /\b(ape|gem|alpha|call|buy|entry|moon|send|100x|10x|ca:|contract|don't miss|dont miss|early|launch|pump|shill|runner|bag|load|dip|breakout)\b/i;
const WARNING_KEYWORDS = /\b(rug|scam|avoid|warning|honeypot|dump|dev sold|exit liquidity|steer clear)\b/i;

/** @param {string} s */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string | null | undefined} raw */
function extractTwitterHandle(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  const fromUrl = t.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})/i);
  if (fromUrl?.[1]) return fromUrl[1].replace(/^@/, '');
  const handle = t.replace(/^@/, '').trim();
  if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) return handle;
  return null;
}

/** @param {string | null | undefined} symbol */
function normalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  const s = symbol.trim().replace(/^\$/, '').toUpperCase();
  if (s.length < 2 || s.length > 12) return null;
  if (GENERIC_SYMBOLS.has(s.toLowerCase())) return null;
  return s;
}

/** @param {string | null | undefined} name */
function normalizeTokenName(name) {
  if (!name || typeof name !== 'string') return null;
  const n = name.trim().replace(/\s+/g, ' ');
  if (n.length < 3 || n.length > 48) return null;
  if (/^(token|coin|meme|pump)$/i.test(n)) return null;
  return n;
}

/**
 * @param {{
 *   mint: string;
 *   symbol?: string | null;
 *   name?: string | null;
 *   twitter?: string | null;
 * }} input
 * @param {{ fast?: boolean }} [opts]
 * @returns {string[]}
 */
function buildKolSearchQueries(input, opts = {}) {
  const mint = String(input.mint || '').trim();
  const symbol = normalizeSymbol(input.symbol);
  const name = normalizeTokenName(input.name);
  const twitter = extractTwitterHandle(input.twitter);

  /** @type {string[]} */
  const queries = [];
  const seen = new Set();

  const add = (q) => {
    const key = q.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    queries.push(q.trim());
  };

  if (mint) add(mint);

  if (symbol) {
    add(`$${symbol} (pump OR pumpfun OR solana OR ca:)`);
    if (symbol.length >= 4) {
      add(`"${symbol}" (pump OR pumpfun OR solana OR ca:)`);
    }
  }

  if (name && name.toLowerCase() !== symbol?.toLowerCase()) {
    const quoted = `"${name.replace(/"/g, '')}"`;
    add(`${quoted} (pump OR pumpfun OR solana OR ca:)`);
  }

  if (twitter) {
    add(`@${twitter} (pump OR pumpfun OR solana OR ca: OR gem OR alpha)`);
  }

  // Fast mode: mint only (1 billable search). Caller may fall back if empty.
  const maxQueries = opts.fast ? 1 : 4;
  return queries.slice(0, maxQueries);
}

/**
 * Secondary queries when fast mint-only search returns nothing.
 * @param {{
 *   mint: string;
 *   symbol?: string | null;
 *   name?: string | null;
 *   twitter?: string | null;
 * }} input
 * @returns {string[]}
 */
function buildKolFallbackQueries(input) {
  const all = buildKolSearchQueries(input, { fast: false });
  const mint = String(input.mint || '').trim().toLowerCase();
  return all.filter((q) => q.trim().toLowerCase() !== mint).slice(0, 1);
}

/**
 * @param {string} text
 * @param {{ mint: string; symbol?: string | null; name?: string | null; twitter?: string | null }} ctx
 */
function isRelevantKolTweet(text, ctx) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const mint = ctx.mint?.trim() || '';
  if (mint && lower.includes(mint.toLowerCase())) return true;
  if (mint.length >= 12 && lower.includes(mint.slice(0, 8).toLowerCase())) return true;

  const symbol = normalizeSymbol(ctx.symbol);
  if (symbol) {
    if (new RegExp(`\\$${escapeRegex(symbol)}\\b`, 'i').test(text)) return true;
    if (symbol.length >= 5 && new RegExp(`\\b${escapeRegex(symbol)}\\b`, 'i').test(text)) return true;
  }

  const name = normalizeTokenName(ctx.name);
  if (name && lower.includes(name.toLowerCase())) {
    if (/(pump|pumpfun|solana|ca:|contract|meme|coin|launch|gem|alpha|100x|10x)/i.test(text)) {
      return true;
    }
    if (name.length >= 8) return true;
  }

  const handle = extractTwitterHandle(ctx.twitter);
  if (handle && lower.includes(`@${handle.toLowerCase()}`)) return true;

  return false;
}

/** @param {string} text */
function classifyPromotion(text) {
  if (WARNING_KEYWORDS.test(text)) return 'warning';
  if (SHILL_KEYWORDS.test(text)) return 'direct';
  return 'neutral';
}

/** @param {Record<string, unknown>} metrics */
function engagementFromMetrics(metrics) {
  const likes = Number(metrics.like_count ?? metrics.likeCount) || 0;
  const rts = Number(metrics.retweet_count ?? metrics.retweetCount) || 0;
  const replies = Number(metrics.reply_count ?? metrics.replyCount) || 0;
  return likes + rts * 2 + replies;
}

/**
 * @typedef {{
 *   id: string;
 *   text: string;
 *   createdAt: string;
 *   authorKey: string;
 *   username: string;
 *   displayName: string;
 *   followers: number;
 *   verified: boolean;
 *   profileImageUrl: string | null;
 *   url: string;
 *   promotionType: string;
 *   engagement: number;
 * }} NormalizedKolTweet
 */

/**
 * @param {import('./twitterApiIoClient.js').advancedSearch extends Function ? Awaited<ReturnType<typeof advancedSearch>>['tweets'][number] : never} tweet
 * @returns {NormalizedKolTweet | null}
 */
function normalizeTwitterApiIoTweet(tweet) {
  if (!tweet?.id || !tweet.text || !tweet.author?.userName) return null;
  const username = String(tweet.author.userName).replace(/^@/, '');
  return {
    id: tweet.id,
    text: tweet.text,
    createdAt: tweet.createdAt || '',
    authorKey: username.toLowerCase(),
    username,
    displayName: tweet.author.name || username,
    followers: tweet.author.followers || 0,
    verified: Boolean(tweet.author.verified),
    profileImageUrl: null,
    url: tweet.url || `https://x.com/${username}/status/${tweet.id}`,
    promotionType: classifyPromotion(tweet.text),
    engagement: engagementFromMetrics({
      likeCount: tweet.metrics?.likeCount,
      retweetCount: tweet.metrics?.retweetCount,
      replyCount: tweet.metrics?.replyCount,
    }),
  };
}

/**
 * @param {unknown} body
 * @returns {NormalizedKolTweet[]}
 */
function normalizeOfficialXSearchBody(body) {
  const tweets = Array.isArray(body?.data) ? body.data : [];
  const users = Array.isArray(body?.includes?.users) ? body.includes.users : [];
  /** @type {Map<string, Record<string, unknown>>} */
  const usersById = new Map();
  for (const u of users) {
    if (!u || typeof u !== 'object') continue;
    const x = /** @type {Record<string, unknown>} */ (u);
    const id = String(x.id || '');
    if (id) usersById.set(id, x);
  }

  /** @type {NormalizedKolTweet[]} */
  const out = [];
  for (const t of tweets) {
    if (!t || typeof t !== 'object') continue;
    const tw = /** @type {Record<string, unknown>} */ (t);
    const id = String(tw.id || '').trim();
    const text = String(tw.text || '').trim();
    if (!id || !text) continue;
    const authorId = String(tw.author_id || '');
    const user = usersById.get(authorId);
    const username = user ? String(user.username || '') : '';
    if (!username) continue;
    const metrics =
      tw.public_metrics && typeof tw.public_metrics === 'object'
        ? /** @type {Record<string, unknown>} */ (tw.public_metrics)
        : {};
    out.push({
      id,
      text,
      createdAt: String(tw.created_at || ''),
      authorKey: username.toLowerCase(),
      username,
      displayName: user ? String(user.name || username) : username,
      followers: (() => {
        const pm =
          user?.public_metrics && typeof user.public_metrics === 'object'
            ? /** @type {Record<string, unknown>} */ (user.public_metrics)
            : null;
        const n = pm ? Number(pm.followers_count) : NaN;
        return Number.isFinite(n) ? n : 0;
      })(),
      verified: Boolean(user?.verified),
      profileImageUrl: user?.profile_image_url ? String(user.profile_image_url) : null,
      url: `https://x.com/${username}/status/${id}`,
      promotionType: classifyPromotion(text),
      engagement: engagementFromMetrics(metrics),
    });
  }
  return out;
}

/**
 * @param {string} msg
 */
function isCreditsOrQuotaError(msg) {
  return /does not have any credits|insufficient credits|out of credits|payment required|402|quota|billing/i.test(
    msg,
  );
}

/**
 * @param {string} query
 * @returns {Promise<{ tweets: NormalizedKolTweet[]; source: string }>}
 */
async function searchKolTweets(query) {
  const errors = [];

  if (isTwitterApiIoConfigured()) {
    try {
      const result = await advancedSearch({ query, queryType: 'Latest' });
      const tweets = result.tweets
        .map((t) => normalizeTwitterApiIoTweet(t))
        .filter(Boolean);
      return { tweets, source: 'twitterapi.io' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`twitterapi.io: ${msg}`);
      if (!isXApiBearerConfigured()) {
        throw new Error(formatKolSearchError(errors));
      }
    }
  }

  if (isXApiBearerConfigured()) {
    const body = await searchRecentTweets(query, {
      max_results: 100,
      tweetFields: 'created_at,public_metrics,author_id,text',
      expansions: 'author_id',
      userFields: 'username,name,verified,public_metrics,profile_image_url',
    });

    if (body.errors?.length) {
      const msg = body.errors.map((e) => e.message).join('; ');
      errors.push(`X API: ${msg}`);
      throw new Error(formatKolSearchError(errors));
    }

    return { tweets: normalizeOfficialXSearchBody(body), source: 'x_api' };
  }

  if (errors.length > 0) {
    throw new Error(formatKolSearchError(errors));
  }

  throw new Error(
    'X search not configured — set TWITTER_API_KEY (twitterapi.io) or X_BEARER_TOKEN in api/.env',
  );
}

/**
 * @param {string[]} errors
 */
function formatKolSearchError(errors) {
  const combined = errors.join(' · ');
  if (isCreditsOrQuotaError(combined)) {
    return `X search unavailable — API credits exhausted. Top up your twitterapi.io balance or X API credits. (${combined})`;
  }
  return `X search failed: ${combined}`;
}

/**
 * @param {string[]} queries
 * @param {{ parallel?: boolean }} [opts]
 * @returns {Promise<{ tweets: NormalizedKolTweet[]; source: string; errors: string[] }>}
 */
async function searchKolTweetsMulti(queries, opts = {}) {
  /** @type {Map<string, NormalizedKolTweet>} */
  const byId = new Map();
  /** @type {string[]} */
  const errors = [];
  let source = 'twitterapi.io';

  const runQuery = async (query) => {
    const result = await searchKolTweets(query);
    source = result.source;
    for (const tw of result.tweets) {
      if (!byId.has(tw.id)) byId.set(tw.id, tw);
    }
  };

  if (opts.parallel !== false && queries.length > 1) {
    const settled = await Promise.allSettled(queries.map((query) => runQuery(query)));
    for (const item of settled) {
      if (item.status === 'rejected') {
        const msg = item.reason instanceof Error ? item.reason.message : String(item.reason);
        errors.push(msg);
        if (isCreditsOrQuotaError(msg)) break;
      }
    }
  } else {
    for (const query of queries) {
      try {
        await runQuery(query);
        if (byId.size >= 80) break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        if (isCreditsOrQuotaError(msg)) break;
      }
    }
  }

  if (byId.size === 0 && errors.length > 0) {
    throw new Error(formatKolSearchError(errors));
  }

  return { tweets: [...byId.values()], source, errors };
}

/**
 * @param {NormalizedKolTweet[]} tweets
 * @param {string} mint
 * @param {string[]} queries
 * @param {string} source
 * @param {{ symbol?: string | null; name?: string | null; twitter?: string | null }} terms
 */
function buildKolPayload(tweets, mint, queries, source, terms = {}) {
  /** @type {Map<string, {
   *   authorKey: string;
   *   username: string;
   *   displayName: string;
   *   followers: number;
   *   verified: boolean;
   *   profileImageUrl: string | null;
   *   tweets: NormalizedKolTweet[];
   *   promotionTypes: Set<string>;
   * }>} */
  const byAuthor = new Map();

  for (const tw of tweets) {
    let row = byAuthor.get(tw.authorKey);
    if (!row) {
      row = {
        authorKey: tw.authorKey,
        username: tw.username,
        displayName: tw.displayName,
        followers: tw.followers,
        verified: tw.verified,
        profileImageUrl: tw.profileImageUrl,
        tweets: [],
        promotionTypes: new Set(),
      };
      byAuthor.set(tw.authorKey, row);
    }
    row.tweets.push(tw);
    row.promotionTypes.add(tw.promotionType);
    if (tw.followers > row.followers) row.followers = tw.followers;
  }

  const accounts = [...byAuthor.values()].map((row) => {
    const sortedTweets = [...row.tweets].sort((a, b) => b.engagement - a.engagement);
    const bestTweet = sortedTweets[0] ?? null;
    const dates = row.tweets.map((t) => t.createdAt).filter(Boolean).sort();
    const avgEngagement =
      row.tweets.length > 0
        ? row.tweets.reduce((s, t) => s + t.engagement, 0) / row.tweets.length
        : 0;

    let promotionType = 'neutral';
    if (row.promotionTypes.has('warning')) promotionType = 'warning';
    else if (row.promotionTypes.has('direct')) promotionType = 'direct';

    return {
      username: row.username,
      displayName: row.displayName,
      followers: row.followers,
      verified: row.verified,
      profileImageUrl: row.profileImageUrl,
      tweetsAboutToken: row.tweets.length,
      firstMention: dates[0] ?? null,
      lastMention: dates[dates.length - 1] ?? null,
      avgEngagement: Math.round(avgEngagement * 10) / 10,
      promotionType,
      sampleTweet: bestTweet
        ? {
            id: bestTweet.id,
            text: bestTweet.text.slice(0, 280),
            url: bestTweet.url,
            createdAt: bestTweet.createdAt,
            engagement: bestTweet.engagement,
          }
        : null,
    };
  });

  accounts.sort((a, b) => b.followers - a.followers || b.avgEngagement - a.avgEngagement);

  const topKols = accounts.slice(0, 10).map((row, idx) => ({ rank: idx + 1, ...row }));
  const combinedReach = accounts.reduce((s, a) => s + a.followers, 0);
  const directShills = accounts.filter((a) => a.promotionType === 'direct').length;
  const warnings = accounts.filter((a) => a.promotionType === 'warning').length;

  let overallSentiment = 'neutral';
  if (directShills > warnings * 2) overallSentiment = 'bullish';
  else if (warnings > directShills) overallSentiment = 'bearish';

  return {
    mint,
    query: queries.join(' · '),
    queries,
    searchTerms: {
      symbol: normalizeSymbol(terms.symbol) ?? null,
      name: normalizeTokenName(terms.name) ?? null,
      twitter: extractTwitterHandle(terms.twitter) ?? null,
    },
    source,
    summary: {
      totalAccountsFound: accounts.length,
      topKolsCount: topKols.length,
      combinedReach,
      directShills,
      warnings,
      overallSentiment,
      searchWindowDays: source === 'x_api' ? 7 : null,
    },
    topKols,
  };
}

/**
 * @param {{
 *   mint: string;
 *   symbol?: string | null;
 *   name?: string | null;
 *   twitter?: string | null;
 * }} input
 * @param {{ fast?: boolean }} [opts]
 */
export async function fetchTokenKolShills(input, opts = {}) {
  const mint = String(input.mint || '').trim();
  if (!mint) {
    return { ok: false, error: 'mint is required', status: 400 };
  }

  if (!isTwitterApiIoConfigured() && !isXApiBearerConfigured()) {
    return {
      ok: false,
      error: 'X search not configured — set TWITTER_API_KEY or X_BEARER_TOKEN in api/.env',
      status: 503,
    };
  }

  const fast = opts.fast === true;
  const cacheKey = kolShillCacheKey({
    mint,
    symbol: input.symbol,
    name: input.name,
    twitter: input.twitter,
    fast,
  });
  const cached = kolShillCache.get(cacheKey);
  if (cached && typeof cached === 'object' && 'ok' in /** @type {object} */ (cached)) {
    return /** @type {{ ok: boolean; data?: unknown; error?: string; status?: number }} */ (
      cached
    );
  }

  const queries = buildKolSearchQueries(input, { fast });
  const relevanceCtx = {
    mint,
    symbol: input.symbol,
    name: input.name,
    twitter: input.twitter,
  };

  try {
    // Fast mode: sequential mint-only first; one fallback query only if empty.
    const { tweets: rawTweets, source } = await searchKolTweetsMulti(queries, {
      parallel: !fast,
    });
    let tweets = rawTweets.filter((tw) => isRelevantKolTweet(tw.text, relevanceCtx));
    let usedQueries = queries;
    let usedSource = source;

    if (fast && tweets.length === 0) {
      const fallback = buildKolFallbackQueries(input);
      if (fallback.length > 0) {
        const more = await searchKolTweetsMulti(fallback, { parallel: false });
        tweets = more.tweets.filter((tw) => isRelevantKolTweet(tw.text, relevanceCtx));
        usedQueries = [...queries, ...fallback];
        usedSource = more.source;
      }
    }

    const result = {
      ok: true,
      data: buildKolPayload(tweets, mint, usedQueries, usedSource, {
        symbol: input.symbol,
        name: input.name,
        twitter: input.twitter,
      }),
    };
    kolShillCache.set(cacheKey, result, KOL_SHILL_CACHE_TTL_MS);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'KOL shill fetch failed';
    const status = isCreditsOrQuotaError(message) ? 503 : 502;
    const result = { ok: false, error: message, status };
    kolShillCache.set(cacheKey, result, KOL_SHILL_NEGATIVE_CACHE_TTL_MS);
    return result;
  }
}
