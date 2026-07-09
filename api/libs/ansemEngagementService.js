/**
 * $ANSEM X engagement scoring — wallet-gated checks + public leaderboard.
 */
import { ANSEM_MINT } from '../config/multiWalletRecovery.js';
import AnsemEngagementRecord from '../models/agent/AnsemEngagementRecord.js';
import {
  advancedSearch,
  getUserInfo,
  getUserLastTweets,
  isTwitterApiIoConfigured,
} from './twitterApiIoClient.js';
import { scoreToGrade } from './xProjectScoring.js';
import {
  buildAnsemEngagementDailyLimitMessage,
  getAnsemEngagementDailyQuota,
  refundAnsemEngagementDaily,
  tryConsumeAnsemEngagementDaily,
} from './ansemEngagementDailyLimit.js';

const ANSEM_SYMBOL = 'ANSEM';
const ANSEM_NAME = 'Black Bull';
const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;

export function isEngagementLookupConfigured() {
  return isTwitterApiIoConfigured();
}

/**
 * @param {string} raw
 */
export function parseXHandleInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;

  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./i, '');
    if (host === 'x.com' || host === 'twitter.com' || host === 'mobile.twitter.com') {
      const screenName = url.searchParams.get('screen_name');
      if (screenName && USERNAME_RE.test(screenName.replace(/^@/, ''))) {
        return screenName.replace(/^@/, '').toLowerCase();
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0 && parts[0] !== 'i' && parts[0] !== 'intent') {
        const candidate = parts[0].replace(/^@/, '');
        if (USERNAME_RE.test(candidate)) return candidate.toLowerCase();
      }
    }
  } catch {
    // not a URL — fall through to @handle
  }

  const urlMatch = s.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})(?:\/|$|\?)/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  const handle = s.replace(/^@/, '').trim().toLowerCase();
  if (!USERNAME_RE.test(handle)) return null;
  return handle;
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
 * @param {unknown} tweet
 */
function tweetMetrics(tweet) {
  if (!tweet || typeof tweet !== 'object') {
    return { like: 0, rt: 0, reply: 0, quote: 0, weighted: 0 };
  }
  const t = /** @type {Record<string, unknown>} */ (tweet);
  if (t.metrics && typeof t.metrics === 'object') {
    const m = /** @type {Record<string, unknown>} */ (t.metrics);
    const like = Number(m.likeCount) || 0;
    const rt = Number(m.retweetCount) || 0;
    const reply = Number(m.replyCount) || 0;
    const quote = Number(m.quoteCount) || 0;
    const imp = Number(m.viewCount);
    const weighted = like + rt * 2 + reply * 1.5 + quote * 2;
    const withImpressions =
      Number.isFinite(imp) && imp > 0 ? weighted + imp * 0.001 : weighted;
    return { like, rt, reply, quote, weighted: withImpressions };
  }
  const m =
    t.public_metrics && typeof t.public_metrics === 'object'
      ? /** @type {Record<string, unknown>} */ (t.public_metrics)
      : {};
  const like = Number(m.like_count) || 0;
  const rt = Number(m.retweet_count) || 0;
  const reply = Number(m.reply_count) || 0;
  const quote = Number(m.quote_count) || 0;
  const imp = Number(m.impression_count);
  const weighted = like + rt * 2 + reply * 1.5 + quote * 2;
  const withImpressions =
    Number.isFinite(imp) && imp > 0 ? weighted + imp * 0.001 : weighted;
  return { like, rt, reply, quote, weighted: withImpressions };
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
 * @param {unknown[]} tweets
 */
function filterAnsemTweets(tweets) {
  if (!Array.isArray(tweets)) return [];
  return tweets.filter((t) => {
    if (!t || typeof t !== 'object') return false;
    const text = /** @type {{ text?: string }} */ (t).text;
    return mentionsAnsem(text);
  });
}

/**
 * @param {number} avgRatePct
 */
function engagementPointsFromRate(avgRatePct) {
  const x = Math.min(Math.max(avgRatePct, 0), 100);
  if (x <= 0) return 0;
  if (x <= 1) return (x / 1) * 28;
  if (x <= 5) return 28 + ((x - 1) / 4) * 12;
  return 40;
}

/**
 * @param {{ user: Record<string, unknown>; ansemTweets: unknown[] }} input
 */
export function computeAnsemEngagementScore({ user, ansemTweets }) {
  const pm =
    user?.public_metrics && typeof user.public_metrics === 'object'
      ? user.public_metrics
      : {};
  const followers = Math.max(Number(pm.followers_count) || 0, 0);

  let ansemEngagementTotal = 0;
  for (const t of ansemTweets) {
    ansemEngagementTotal += tweetMetrics(t).weighted;
  }

  const mentionCount = ansemTweets.length;
  const mentionPts = Math.min(35, mentionCount * 12);

  const avgEngagementRatePct =
    mentionCount > 0 && followers > 0
      ? (ansemEngagementTotal / mentionCount / followers) * 100
      : 0;
  const engagementPts = engagementPointsFromRate(avgEngagementRatePct);

  const reachPts = Math.min(25, Math.log10(followers + 1) * 5);

  const score = Math.round(Math.min(100, mentionPts + engagementPts + reachPts));
  const grade = scoreToGrade(score);

  return {
    score,
    grade,
    ansemMentionCount: mentionCount,
    ansemEngagementTotal: Math.round(ansemEngagementTotal),
    avgEngagementRatePct: Number(avgEngagementRatePct.toFixed(4)),
    breakdown: {
      mentions: { score: Number(mentionPts.toFixed(2)), max: 35, count: mentionCount },
      engagement: {
        score: Number(engagementPts.toFixed(2)),
        max: 40,
        avgEngagementRatePct: Number(avgEngagementRatePct.toFixed(4)),
      },
      reach: { score: Number(reachPts.toFixed(2)), max: 25, followersCount: followers },
    },
  };
}

/**
 * @param {string} username
 */
async function fetchAnsemTweetsForUser(username) {
  if (!isTwitterApiIoConfigured()) return [];

  const ioQuery = `from:${username} (${ANSEM_SYMBOL} OR "$${ANSEM_SYMBOL}" OR "${ANSEM_NAME}" OR ${ANSEM_MINT}) -filter:retweets`;

  try {
    const { tweets } = await advancedSearch({ query: ioQuery, queryType: 'Latest' });
    const normalized = tweets.map((t) => ioTweetToXLite(t)).filter(Boolean);
    const ansem = normalized.filter((t) => mentionsAnsem(t?.text));
    if (ansem.length > 0) return ansem;
  } catch (e) {
    console.warn('[ansemEngagement] twitterapi.io search failed:', e?.message || e);
  }

  try {
    const { tweets } = await getUserLastTweets({ userName: username });
    const normalized = tweets.map((t) => ioTweetToXLite(t)).filter(Boolean);
    return filterAnsemTweets(normalized);
  } catch (e) {
    console.warn('[ansemEngagement] twitterapi.io timeline failed:', e?.message || e);
  }

  return [];
}

/**
 * @param {{ userName: string; name: string; followers: number; following: number; tweetCount: number; verified: boolean; profilePicture: string | null; createdAt: string | null; description?: string }} user
 */
function twitterIoUserToScoreUser(user) {
  return {
    id: user.userName,
    username: user.userName,
    name: user.name,
    profile_image_url: user.profilePicture,
    verified: user.verified,
    created_at: user.createdAt,
    public_metrics: {
      followers_count: user.followers,
      following_count: user.following,
      tweet_count: user.tweetCount,
    },
  };
}

/**
 * @param {string} username
 */
async function resolveXUserForEngagement(username) {
  if (!isTwitterApiIoConfigured()) {
    return { ok: false, error: 'twitterapi_not_configured' };
  }

  try {
    const { user } = await getUserInfo(username);
    const xLite = twitterIoUserToScoreUser(user);
    return {
      ok: true,
      user: xLite,
      xUserId: String(xLite.id),
      profileImageUrl: user.profilePicture,
      source: 'twitterapi_io',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
    if (code === 'invalid_handle') {
      return { ok: false, error: 'invalid_x_handle', detail: msg };
    }
    if (/not found|does not exist|404/i.test(msg)) {
      return { ok: false, error: 'x_user_not_found', detail: msg };
    }
    return { ok: false, error: 'x_user_lookup_failed', detail: msg };
  }
}

/**
 * @param {unknown[]} tweets
 * @param {string} username
 */
function serializeTopTweets(tweets, username) {
  return tweets
    .slice()
    .sort((a, b) => tweetMetrics(b).weighted - tweetMetrics(a).weighted)
    .slice(0, 3)
    .map((t) => {
      const row = /** @type {{ id?: string; text?: string; created_at?: string; createdAt?: string }} */ (
        t
      );
      const m = tweetMetrics(t);
      const id = String(row.id || '');
      const text = String(row.text || '').trim();
      return {
        id,
        text: text.length > 180 ? `${text.slice(0, 177)}…` : text,
        likes: m.like,
        retweets: m.rt,
        replies: m.reply,
        createdAt: row.created_at ?? row.createdAt ?? null,
        url: id ? `https://x.com/${username}/status/${id}` : null,
      };
    });
}

/**
 * @param {string} anonymousId
 */
export async function getAnsemEngagementStatus(anonymousId) {
  const quota = await getAnsemEngagementDailyQuota(anonymousId);
  let record = null;
  if (anonymousId) {
    const doc = await AnsemEngagementRecord.findById(anonymousId).lean().exec();
    if (doc) record = serializeRecord(doc);
  }
  return {
    quota,
    record,
    twitterApiConfigured: isEngagementLookupConfigured(),
  };
}

/**
 * @param {import('mongoose').LeanDocument<import('../models/agent/AnsemEngagementRecord.js').default>} doc
 */
export function discoveredRecordId(username) {
  const u = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
  return u ? `discovered:${u}` : '';
}

/**
 * @param {string} username
 */
export async function removeDiscoveredRecordsForUsername(username) {
  const xUsername = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
  if (!xUsername) return;
  const id = discoveredRecordId(xUsername);
  try {
    await AnsemEngagementRecord.deleteMany({
      $or: [{ _id: id }, { xUsername, source: 'discovered' }],
    }).exec();
  } catch (e) {
    console.warn('[ansemEngagement] removeDiscovered failed:', e?.message || e);
  }
}

function serializeRecord(doc) {
  const source = doc.source === 'discovered' ? 'discovered' : 'wallet';
  const walletAddress = String(doc.walletAddress || '').trim();
  return {
    anonymousId: doc.anonymousId,
    source,
    walletAddress,
    walletShort: walletAddress ? shortenWallet(walletAddress) : 'Not linked',
    xUsername: doc.xUsername,
    displayName: doc.displayName,
    profileImageUrl: doc.profileImageUrl,
    followersCount: doc.followersCount,
    engagementScore: doc.engagementScore,
    grade: doc.grade,
    ansemMentionCount: doc.ansemMentionCount,
    ansemEngagementTotal: doc.ansemEngagementTotal,
    avgEngagementRatePct: doc.avgEngagementRatePct,
    breakdown: doc.breakdown,
    topTweets: doc.topTweets ?? [],
    checkedAt: doc.checkedAt,
    dayUtc: doc.dayUtc,
  };
}

/**
 * @param {string} address
 */
function shortenWallet(address) {
  const a = String(address || '').trim();
  if (a.length <= 12) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/**
 * @param {{ anonymousId: string; walletAddress: string; xHandle: string }} params
 */
export async function runAnsemEngagementCheck({ anonymousId, walletAddress, xHandle }) {
  if (!isEngagementLookupConfigured()) {
    return { ok: false, error: 'twitterapi_not_configured' };
  }

  const username = parseXHandleInput(xHandle);
  if (!username) {
    return { ok: false, error: 'invalid_x_handle' };
  }

  const quota = await tryConsumeAnsemEngagementDaily(anonymousId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: 'daily_limit_reached',
      message: buildAnsemEngagementDailyLimitMessage(quota.limit),
      quota,
    };
  }

  try {
    const resolved = await resolveXUserForEngagement(username);
    if (!resolved.ok || !resolved.user) {
      await refundAnsemEngagementDaily(anonymousId);
      return {
        ok: false,
        error: resolved.error || 'x_user_lookup_failed',
        detail: resolved.detail,
      };
    }

    const user = resolved.user;
    const ansemTweets = await fetchAnsemTweetsForUser(username);
    const scored = computeAnsemEngagementScore({ user, ansemTweets });
    const dayUtc = new Date().toISOString().slice(0, 10);
    const u = /** @type {Record<string, unknown>} */ (user);
    const pm =
      u.public_metrics && typeof u.public_metrics === 'object'
        ? /** @type {Record<string, unknown>} */ (u.public_metrics)
        : {};

    const xUsername = String(u.username || username).toLowerCase();
    await removeDiscoveredRecordsForUsername(xUsername);

    const record = {
      _id: anonymousId,
      anonymousId,
      source: 'wallet',
      walletAddress,
      xUsername,
      xUserId: String(resolved.xUserId || u.id || ''),
      displayName: String(u.name || u.username || username),
      profileImageUrl:
        resolved.profileImageUrl ??
        (typeof u.profile_image_url === 'string' ? u.profile_image_url : null),
      followersCount: Math.max(Number(pm.followers_count) || 0, 0),
      engagementScore: scored.score,
      grade: scored.grade,
      ansemMentionCount: scored.ansemMentionCount,
      ansemEngagementTotal: scored.ansemEngagementTotal,
      avgEngagementRatePct: scored.avgEngagementRatePct,
      breakdown: scored.breakdown,
      topTweets: serializeTopTweets(ansemTweets, username),
      checkedAt: new Date(),
      dayUtc,
    };

    await AnsemEngagementRecord.findOneAndUpdate({ _id: anonymousId }, record, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }).exec();

    const freshQuota = await getAnsemEngagementDailyQuota(anonymousId);
    return {
      ok: true,
      data: serializeRecord(record),
      quota: freshQuota,
    };
  } catch (e) {
    await refundAnsemEngagementDaily(anonymousId);
    return {
      ok: false,
      error: 'engagement_check_failed',
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Prefer wallet-linked rows when the same X handle appears twice.
 * @param {import('mongoose').LeanDocument<import('../models/agent/AnsemEngagementRecord.js').default>[]} rows
 */
function dedupeLeaderboardRows(rows) {
  /** @type {Map<string, import('mongoose').LeanDocument<import('../models/agent/AnsemEngagementRecord.js').default>>} */
  const byUsername = new Map();
  for (const doc of rows) {
    const key = String(doc.xUsername || '')
      .trim()
      .toLowerCase();
    if (!key) continue;
    const existing = byUsername.get(key);
    if (!existing) {
      byUsername.set(key, doc);
      continue;
    }
    const docWallet = doc.source !== 'discovered';
    const existingWallet = existing.source !== 'discovered';
    const docScore = Number(doc.engagementScore) || 0;
    const existingScore = Number(existing.engagementScore) || 0;
    const preferDoc =
      (docWallet && !existingWallet) ||
      (docWallet === existingWallet &&
        (docScore > existingScore ||
          (docScore === existingScore &&
            new Date(doc.checkedAt).getTime() > new Date(existing.checkedAt).getTime())));
    if (preferDoc) byUsername.set(key, doc);
  }
  return [...byUsername.values()].sort((a, b) => {
    const scoreDiff = (Number(b.engagementScore) || 0) - (Number(a.engagementScore) || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime();
  });
}

/**
 * @param {{
 *   username: string;
 *   user: Record<string, unknown>;
 *   ansemTweets: unknown[];
 *   xUserId?: string;
 *   profileImageUrl?: string | null;
 * }} params
 */
export async function upsertDiscoveredAnsemRecord({
  username,
  user,
  ansemTweets,
  xUserId,
  profileImageUrl,
}) {
  const xUsername = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
  if (!xUsername) return null;

  const walletLinked = await AnsemEngagementRecord.findOne({
    xUsername,
    source: { $ne: 'discovered' },
    walletAddress: { $ne: '' },
  })
    .select('_id')
    .lean()
    .exec();
  if (walletLinked) return null;

  const scored = computeAnsemEngagementScore({ user, ansemTweets });
  const dayUtc = new Date().toISOString().slice(0, 10);
  const u = user;
  const pm =
    u.public_metrics && typeof u.public_metrics === 'object'
      ? /** @type {Record<string, unknown>} */ (u.public_metrics)
      : {};
  const recordId = discoveredRecordId(xUsername);

  const record = {
    _id: recordId,
    anonymousId: recordId,
    source: 'discovered',
    walletAddress: '',
    xUsername,
    xUserId: String(xUserId || u.id || ''),
    displayName: String(u.name || u.username || xUsername),
    profileImageUrl:
      profileImageUrl ??
      (typeof u.profile_image_url === 'string' ? u.profile_image_url : null),
    followersCount: Math.max(Number(pm.followers_count) || 0, 0),
    engagementScore: scored.score,
    grade: scored.grade,
    ansemMentionCount: scored.ansemMentionCount,
    ansemEngagementTotal: scored.ansemEngagementTotal,
    avgEngagementRatePct: scored.avgEngagementRatePct,
    breakdown: scored.breakdown,
    topTweets: serializeTopTweets(ansemTweets, xUsername),
    checkedAt: new Date(),
    dayUtc,
  };

  await AnsemEngagementRecord.findOneAndUpdate({ _id: recordId }, record, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).exec();

  return serializeRecord(record);
}

/**
 * @param {{ limit?: number }} [opts]
 */
export async function getAnsemEngagementLeaderboard(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const rows = await AnsemEngagementRecord.find({})
    .sort({ engagementScore: -1, checkedAt: -1 })
    .limit(Math.min(limit * 4, 400))
    .lean()
    .exec();

  const deduped = dedupeLeaderboardRows(rows).slice(0, limit);

  return {
    entries: deduped.map((doc, idx) => ({
      rank: idx + 1,
      ...serializeRecord(doc),
      profileUrl: `https://x.com/${doc.xUsername}`,
    })),
    total: deduped.length,
    updatedAt: new Date().toISOString(),
  };
}
