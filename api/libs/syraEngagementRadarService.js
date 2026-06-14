import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalEngagementReply from "../models/InternalEngagementReply.js";
import {
  SYRA_ENGAGEMENT_BRAND_CONTEXT,
  SYRA_ENGAGEMENT_DEFAULT_MIN_FAVES,
  SYRA_ENGAGEMENT_DEFAULT_QUERY_TYPE,
  SYRA_ENGAGEMENT_DEFAULT_TOPIC_IDS,
  SYRA_ENGAGEMENT_DEFAULT_WINDOW,
  SYRA_ENGAGEMENT_EXCLUDED_HANDLES,
  SYRA_ENGAGEMENT_EXISTING_SAMPLE,
  SYRA_ENGAGEMENT_MAX_RESULTS,
  SYRA_ENGAGEMENT_MAX_RETRIES,
  SYRA_ENGAGEMENT_MAX_SEARCH_TOPICS,
  SYRA_ENGAGEMENT_MIN_FAVES,
  SYRA_ENGAGEMENT_REPLY_SYSTEM_RULES,
  SYRA_ENGAGEMENT_REPLY_TONES,
  SYRA_ENGAGEMENT_TOPICS,
  SYRA_ENGAGEMENT_WINDOWS,
} from "../config/syraEngagementRadarConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";
import { advancedSearch, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, "'")
    .trim();
}

function contentHash(text) {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

function assertMongoConnected() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function assertTwitterApiConfigured() {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured on the API server");
    err.code = "twitterapi_unavailable";
    throw err;
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeTopicIds(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...SYRA_ENGAGEMENT_DEFAULT_TOPIC_IDS];
  }
  const allowed = new Set(SYRA_ENGAGEMENT_TOPICS.map((t) => t.id));
  const ids = raw
    .map((v) => String(v || "").trim())
    .filter((id) => allowed.has(id));
  return ids.length > 0 ? ids.slice(0, SYRA_ENGAGEMENT_MAX_SEARCH_TOPICS) : [...SYRA_ENGAGEMENT_DEFAULT_TOPIC_IDS];
}

/**
 * @param {unknown} raw
 */
function resolveWindow(windowId) {
  const id = String(windowId || SYRA_ENGAGEMENT_DEFAULT_WINDOW).trim();
  return SYRA_ENGAGEMENT_WINDOWS.find((w) => w.id === id) ?? SYRA_ENGAGEMENT_WINDOWS.find((w) => w.id === SYRA_ENGAGEMENT_DEFAULT_WINDOW);
}

/**
 * @param {unknown} raw
 */
function resolveMinFaves(raw) {
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.min(500, Math.max(1, Math.floor(n)));
  const preset = SYRA_ENGAGEMENT_MIN_FAVES.find((p) => p.id === String(raw)) ?? SYRA_ENGAGEMENT_MIN_FAVES.find((p) => p.value === SYRA_ENGAGEMENT_DEFAULT_MIN_FAVES);
  return preset?.value ?? SYRA_ENGAGEMENT_DEFAULT_MIN_FAVES;
}

function pickRandomTone() {
  const idx = Math.floor(Math.random() * SYRA_ENGAGEMENT_REPLY_TONES.length);
  return SYRA_ENGAGEMENT_REPLY_TONES[idx];
}

/**
 * @param {string | null | undefined} toneId
 */
function resolveTone(toneId) {
  if (!toneId) return pickRandomTone();
  return SYRA_ENGAGEMENT_REPLY_TONES.find((t) => t.id === toneId) ?? pickRandomTone();
}

/**
 * @param {{ topicIds: string[]; keyword?: string; minFaves: number; withinTime: string }}
 */
function buildSearchQuery({ topicIds, keyword, minFaves, withinTime }) {
  const topicQueries = SYRA_ENGAGEMENT_TOPICS.filter((t) => topicIds.includes(t.id)).map((t) => t.query);
  const topicPart = topicQueries.length === 1 ? topicQueries[0] : `(${topicQueries.join(" OR ")})`;

  const keywordTrim = String(keyword || "").trim();
  const keywordPart = keywordTrim ? ` ${keywordTrim}` : "";

  return `${topicPart}${keywordPart} lang:en -is:retweet -filter:replies min_faves:${minFaves} within_time:${withinTime}`;
}

/**
 * @param {{ likeCount: number; retweetCount: number; replyCount: number; quoteCount: number; viewCount: number }} metrics
 * @param {string | null} createdAt
 */
function scoreOpportunity(metrics, createdAt) {
  const engagement =
    metrics.likeCount * 1.0 +
    metrics.retweetCount * 2.5 +
    metrics.replyCount * 1.5 +
    metrics.quoteCount * 2.0 +
    Math.min(metrics.viewCount, 50_000) * 0.001;

  let freshnessBoost = 0;
  if (createdAt) {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (Number.isFinite(ageHours) && ageHours >= 0) {
      freshnessBoost = Math.max(0, 24 - ageHours) * 2;
    }
  }

  return engagement + freshnessBoost;
}

/**
 * @param {import("./twitterApiIoClient.js").advancedSearch extends Function ? Awaited<ReturnType<typeof advancedSearch>>["tweets"][number] : never} tweet
 */
function mapOpportunity(tweet, score) {
  return {
    id: tweet.id,
    text: tweet.text,
    url: tweet.url,
    createdAt: tweet.createdAt,
    author: tweet.author,
    metrics: tweet.metrics,
    score: Math.round(score * 10) / 10,
  };
}

function mapReplyDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    sourceTweetId: d.sourceTweetId,
    sourceTweetText: d.sourceTweetText,
    authorHandle: d.authorHandle,
    tone: d.tone || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

/**
 * @param {number} [limit]
 * @returns {Promise<string[]>}
 */
async function fetchExistingReplyTexts(limit = SYRA_ENGAGEMENT_EXISTING_SAMPLE) {
  const docs = await InternalEngagementReply.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text")
    .lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

/**
 * @param {{ sourceTweetText: string; authorHandle: string; tone: typeof SYRA_ENGAGEMENT_REPLY_TONES[number]; existingTexts: string[]; attempt: number }}
 */
async function generateReplyDraft({ sourceTweetText, authorHandle, tone, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nREPLIES ALREADY USED — write something fresh, different hook and structure:\n${existingTexts
          .slice(0, 25)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")}`
      : "";

  const systemPrompt = `${SYRA_ENGAGEMENT_REPLY_SYSTEM_RULES}

${SYRA_ENGAGEMENT_BRAND_CONTEXT}

Attempt ${attempt}: push a distinct angle.`;

  const userPrompt = `TWEET TO REPLY TO (from @${authorHandle.replace(/^@/, "")}):
${sourceTweetText.slice(0, 2000)}

TONE: ${tone.label}
ANGLE: ${tone.angle}
${forbiddenBlock}

Write the founder's reply tweet:`;

  const result = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      max_tokens: 400,
      temperature: 0.92,
      model: OPENROUTER_DEFAULT_MODEL,
    },
  );

  const raw = String(result.response || "").trim();
  return raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Write the founder's reply tweet:\s*/i, "")
    .trim();
}

/**
 * @param {{ topics?: string[]; keyword?: string; minFaves?: number; window?: string; queryType?: "Latest" | "Top" }}
 */
export async function findOpportunities(opts = {}) {
  assertTwitterApiConfigured();

  const topicIds = normalizeTopicIds(opts.topics);
  const windowRow = resolveWindow(opts.window);
  const minFaves = resolveMinFaves(opts.minFaves);
  const queryType = opts.queryType === "Top" ? "Top" : SYRA_ENGAGEMENT_DEFAULT_QUERY_TYPE;

  const query = buildSearchQuery({
    topicIds,
    keyword: opts.keyword,
    minFaves,
    withinTime: windowRow?.withinTime ?? "24h",
  });

  console.info("[engagement-radar] search", {
    topicIds,
    minFaves,
    window: windowRow?.id,
    queryType,
    query: query.slice(0, 200),
  });

  const result = await advancedSearch({ query, queryType });
  const excluded = new Set(SYRA_ENGAGEMENT_EXCLUDED_HANDLES.map((h) => h.toLowerCase()));

  const scored = result.tweets
    .filter((t) => !excluded.has(t.author.userName.toLowerCase()))
    .map((t) => ({
      tweet: t,
      score: scoreOpportunity(t.metrics, t.createdAt),
    }))
    .sort((a, b) => b.score - a.score);

  const seenIds = new Set();
  const opportunities = [];
  for (const row of scored) {
    if (seenIds.has(row.tweet.id)) continue;
    seenIds.add(row.tweet.id);
    opportunities.push(mapOpportunity(row.tweet, row.score));
    if (opportunities.length >= SYRA_ENGAGEMENT_MAX_RESULTS) break;
  }

  return {
    success: true,
    data: {
      opportunities,
      meta: {
        query,
        topicIds,
        window: windowRow?.id ?? SYRA_ENGAGEMENT_DEFAULT_WINDOW,
        minFaves,
        queryType,
        rawCount: result.rawCount,
        validatedCount: result.validatedCount,
        returnedCount: opportunities.length,
      },
    },
  };
}

/**
 * @param {{ tweetId: string; tweetText: string; authorHandle: string; wallet?: string | null; toneId?: string | null }}
 */
export async function draftEngagementReply({ tweetId, tweetText, authorHandle, wallet, toneId }) {
  assertMongoConnected();

  const trimmedTweetId = String(tweetId || "").trim();
  const trimmedText = String(tweetText || "").trim();
  const trimmedHandle = String(authorHandle || "").trim().replace(/^@/, "");

  if (!trimmedTweetId || trimmedTweetId.length < 5) {
    const err = new Error("Valid tweet ID is required");
    err.code = "invalid_source";
    throw err;
  }
  if (trimmedText.length < 10) {
    const err = new Error("Tweet text is required (at least 10 characters)");
    err.code = "invalid_source";
    throw err;
  }
  if (!trimmedHandle) {
    const err = new Error("Author handle is required");
    err.code = "invalid_source";
    throw err;
  }

  const tone = resolveTone(toneId);
  const existingTexts = await fetchExistingReplyTexts();

  const priorForTweet = await InternalEngagementReply.findOne({ sourceTweetId: trimmedTweetId })
    .sort({ createdAt: -1 })
    .select("text")
    .lean();
  if (priorForTweet?.text) {
    existingTexts.unshift(String(priorForTweet.text));
  }

  for (let attempt = 1; attempt <= SYRA_ENGAGEMENT_MAX_RETRIES; attempt++) {
    const text = await generateReplyDraft({
      sourceTweetText: trimmedText,
      authorHandle: trimmedHandle,
      tone,
      existingTexts,
      attempt,
    });
    if (!text || text.length < 20) continue;

    const hash = contentHash(text);
    const exists = await InternalEngagementReply.exists({ contentHash: hash });
    if (exists) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalEngagementReply.create({
        contentHash: hash,
        sourceTweetId: trimmedTweetId,
        sourceTweetText: trimmedText.slice(0, 4000),
        authorHandle: trimmedHandle,
        text,
        tone: tone.id,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });

      await trimInternalToolHistory(InternalEngagementReply);

      return { success: true, data: mapReplyDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique reply. Try again or pick a different tone.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentEngagementReplies(opts = {}) {
  assertMongoConnected();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalEngagementReply.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text sourceTweetId sourceTweetText authorHandle tone createdAt createdByWallet")
    .lean();

  return {
    success: true,
    data: docs.map(mapReplyDoc),
    total: docs.length,
  };
}

export async function deleteEngagementReply(id) {
  assertMongoConnected();
  if (!isValidId(id)) {
    const err = new Error("Engagement reply not found");
    err.code = "not_found";
    throw err;
  }

  const doc = await InternalEngagementReply.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Engagement reply not found");
    err.code = "not_found";
    throw err;
  }

  return { success: true, deletedId: String(doc._id) };
}
