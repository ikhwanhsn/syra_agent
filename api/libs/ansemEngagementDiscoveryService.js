/**
 * Background harvest of recent $ANSEM posts → leaderboard entries without wallet scans.
 * One advancedSearch per tick; scores authors from tweet payloads (no per-user API calls).
 */
import { ANSEM_MINT } from '../config/multiWalletRecovery.js';
import AnsemEngagementRecord from '../models/agent/AnsemEngagementRecord.js';
import {
  discoveredRecordId,
  upsertDiscoveredAnsemRecord,
} from './ansemEngagementService.js';
import { advancedSearch, isTwitterApiIoConfigured } from './twitterApiIoClient.js';

const ANSEM_SYMBOL = 'ANSEM';
const ANSEM_NAME = 'Black Bull';

const DEFAULT_CRON_MS = 3 * 60 * 60 * 1000;
const DEFAULT_MIN_INTERVAL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_REFRESH_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_AUTHORS = 8;
const DEFAULT_MIN_FOLLOWERS = 5;

/** @type {number} */
let lastDiscoveryAt = 0;

/** @type {boolean} */
let tickInFlight = false;

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getMinIntervalMs() {
  return parsePositiveInt(process.env.ANSEM_DISCOVERY_MIN_INTERVAL_MS, DEFAULT_MIN_INTERVAL_MS);
}

function getRefreshMs() {
  return parsePositiveInt(process.env.ANSEM_DISCOVERY_REFRESH_MS, DEFAULT_REFRESH_MS);
}

function getMaxAuthorsPerTick() {
  return parsePositiveInt(process.env.ANSEM_DISCOVERY_MAX_AUTHORS_PER_TICK, DEFAULT_MAX_AUTHORS);
}

function getMinFollowers() {
  return parsePositiveInt(process.env.ANSEM_DISCOVERY_MIN_FOLLOWERS, DEFAULT_MIN_FOLLOWERS);
}

/**
 * @param {string} text
 */
function mentionsAnsem(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return false;
  if (t.includes('$ansem') || /\bansem\b/.test(t)) return true;
  if (t.includes('black bull')) return true;
  if (t.includes(ANSEM_MINT.toLowerCase())) return true;
  return false;
}

/**
 * @param {unknown} tweet
 */
function ioTweetToXLite(tweet) {
  if (!tweet || typeof tweet !== 'object') return null;
  const t = /** @type {Record<string, unknown>} */ (tweet);
  const metrics =
    t.metrics && typeof t.metrics === 'object'
      ? /** @type {Record<string, unknown>} */ (t.metrics)
      : {};
  const text = String(t.text || '').trim();
  const id = String(t.id || '').trim();
  if (!id && !text) return null;
  return {
    id,
    text,
    created_at: t.createdAt ?? t.created_at ?? null,
    public_metrics: {
      like_count: Number(metrics.likeCount) || 0,
      retweet_count: Number(metrics.retweetCount) || 0,
      reply_count: Number(metrics.replyCount) || 0,
      quote_count: Number(metrics.quoteCount) || 0,
      impression_count: Number(metrics.viewCount) || 0,
    },
  };
}

/**
 * @param {import('./twitterApiIoClient.js').advancedSearch extends Function ? Awaited<ReturnType<typeof advancedSearch>>['tweets'][number]['author'] : never} author
 */
function authorToScoreUser(author, username) {
  return {
    id: username,
    username,
    name: author?.name || username,
    profile_image_url: author?.profilePicture ?? null,
    public_metrics: {
      followers_count: Math.max(Number(author?.followers) || 0, 0),
    },
  };
}

/**
 * @param {unknown[]} tweets
 */
function groupAnsemTweetsByAuthor(tweets) {
  /** @type {Map<string, { username: string; author: Record<string, unknown> | null; tweets: unknown[] }>} */
  const groups = new Map();

  for (const raw of tweets) {
    if (!raw || typeof raw !== 'object') continue;
    const tweet = /** @type {Record<string, unknown>} */ (raw);
    const text = String(tweet.text || '');
    if (!mentionsAnsem(text)) continue;

    const author =
      tweet.author && typeof tweet.author === 'object'
        ? /** @type {Record<string, unknown>} */ (tweet.author)
        : null;
    const username = String(author?.userName || '')
      .trim()
      .replace(/^@/, '')
      .toLowerCase();
    if (!username) continue;

    const normalized = ioTweetToXLite(tweet);
    if (!normalized) continue;

    let row = groups.get(username);
    if (!row) {
      row = { username, author, tweets: [] };
      groups.set(username, row);
    }
    row.tweets.push(normalized);
  }

  return groups;
}

/**
 * @param {string} username
 * @param {Date} cutoff
 */
async function shouldRefreshDiscoveredAuthor(username, cutoff) {
  const id = discoveredRecordId(username);
  const doc = await AnsemEngagementRecord.findById(id).select('checkedAt source').lean().exec();
  if (!doc) return true;
  if (doc.source !== 'discovered') return false;
  const checkedAt = doc.checkedAt ? new Date(doc.checkedAt).getTime() : 0;
  return checkedAt < cutoff.getTime();
}

/**
 * @returns {Promise<{ success: boolean; skipped?: string; authors?: number; upserted?: number; error?: string }>}
 */
export async function runAnsemEngagementDiscoveryTick() {
  if (!isTwitterApiIoConfigured()) {
    return { success: false, error: 'twitterapi_not_configured' };
  }

  const now = Date.now();
  const minInterval = getMinIntervalMs();
  if (now - lastDiscoveryAt < minInterval) {
    return { success: true, skipped: 'min_interval' };
  }

  if (tickInFlight) {
    return { success: false, error: 'tick_already_in_flight' };
  }

  tickInFlight = true;
  try {
    const query = `("$${ANSEM_SYMBOL}" OR ${ANSEM_SYMBOL} OR "${ANSEM_NAME}" OR ${ANSEM_MINT}) -filter:retweets`;
    const { tweets } = await advancedSearch({ query, queryType: 'Latest' });
    lastDiscoveryAt = Date.now();

    const groups = groupAnsemTweetsByAuthor(tweets);
    if (groups.size === 0) {
      return { success: true, authors: 0, upserted: 0 };
    }

    const refreshCutoff = new Date(Date.now() - getRefreshMs());
    const minFollowers = getMinFollowers();
    const maxAuthors = getMaxAuthorsPerTick();

    /** @type {string[]} */
    const candidates = [];
    for (const [username, group] of groups) {
      const followers = Math.max(Number(group.author?.followers) || 0, 0);
      if (followers < minFollowers) continue;
      if (group.tweets.length === 0) continue;
      // eslint-disable-next-line no-await-in-loop
      const refresh = await shouldRefreshDiscoveredAuthor(username, refreshCutoff);
      if (!refresh) continue;
      candidates.push(username);
    }

    candidates.sort((a, b) => {
      const aTweets = groups.get(a)?.tweets.length ?? 0;
      const bTweets = groups.get(b)?.tweets.length ?? 0;
      return bTweets - aTweets;
    });

    let upserted = 0;
    for (const username of candidates.slice(0, maxAuthors)) {
      const group = groups.get(username);
      if (!group) continue;
      const user = authorToScoreUser(group.author, username);
      // eslint-disable-next-line no-await-in-loop
      const row = await upsertDiscoveredAnsemRecord({
        username,
        user,
        ansemTweets: group.tweets,
        xUserId: String(group.author?.id || username),
        profileImageUrl:
          typeof group.author?.profilePicture === 'string' ? group.author.profilePicture : null,
      });
      if (row) upserted += 1;
    }

    return { success: true, authors: groups.size, upserted };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    tickInFlight = false;
  }
}

export function getAnsemDiscoveryCronMs() {
  const raw = process.env.ANSEM_DISCOVERY_CRON_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 60_000 ? n : DEFAULT_CRON_MS;
}
