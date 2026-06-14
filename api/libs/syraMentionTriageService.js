import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalMentionReply from "../models/InternalMentionReply.js";
import {
  SYRA_MENTION_CATEGORIES,
  SYRA_MENTION_DEFAULT_HANDLE,
  SYRA_MENTION_EXISTING_SAMPLE,
  SYRA_MENTION_MAX_ITEMS,
  SYRA_MENTION_MAX_RETRIES,
  SYRA_MENTION_REPLY_SYSTEM_RULES,
  SYRA_MENTION_REPLY_TONES,
  SYRA_MENTION_TRIAGE_BRAND_CONTEXT,
} from "../config/syraMentionTriageConfig.js";
import { SYRA_ENGAGEMENT_EXCLUDED_HANDLES } from "../config/syraEngagementRadarConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";
import { advancedSearch, getUserMentions, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function contentHash(text) {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

function assertTwitter() {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }
}

function normalizeHandle(raw) {
  const h = String(raw || SYRA_MENTION_DEFAULT_HANDLE || "").trim().replace(/^@/, "");
  if (!h) {
    const err = new Error("Founder X handle is required");
    err.code = "invalid_handle";
    throw err;
  }
  return h;
}

function mentionEngagement(metrics) {
  return (
    (metrics?.likeCount ?? 0) +
    (metrics?.retweetCount ?? 0) * 2 +
    (metrics?.replyCount ?? 0) * 1.5
  );
}

function mapMention(tweet, classification) {
  return {
    id: tweet.id,
    text: tweet.text,
    url: tweet.url,
    createdAt: tweet.createdAt,
    author: tweet.author,
    metrics: tweet.metrics,
    category: classification?.category ?? "question",
    priority: classification?.priority ?? "medium",
    summary: classification?.summary ?? "",
    engagement: mentionEngagement(tweet.metrics),
  };
}

async function classifyMentions(mentions, handle) {
  if (mentions.length === 0) return [];

  const list = mentions
    .slice(0, SYRA_MENTION_MAX_ITEMS)
    .map((m, i) => `${i + 1}. @${m.author.userName}: ${m.text.replace(/\n/g, " ").slice(0, 200)}`)
    .join("\n");

  try {
    const result = await callOpenRouter(
      [
        {
          role: "system",
          content: `Classify X mentions for @${handle} (Syra founder).
Categories: ${SYRA_MENTION_CATEGORIES.join(", ")}
Priority: high | medium | low
Return ONLY JSON array: [{"index":1,"category":"question","priority":"high","summary":"one line"}]`,
        },
        { role: "user", content: `MENTIONS:\n${list}\n\nClassify:` },
      ],
      { max_tokens: 1500, temperature: 0.3, model: OPENROUTER_DEFAULT_MODEL },
    );

    const raw = String(result.response || "").trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("no json");
    const parsed = JSON.parse(jsonMatch[0]);

    return mentions.slice(0, SYRA_MENTION_MAX_ITEMS).map((m, idx) => {
      const row = parsed.find((p) => Number(p.index) === idx + 1) ?? parsed[idx] ?? {};
      const cat = SYRA_MENTION_CATEGORIES.includes(row.category) ? row.category : "question";
      const priority = ["high", "medium", "low"].includes(row.priority) ? row.priority : "medium";
      return mapMention(m, { category: cat, priority, summary: String(row.summary || "").trim() });
    });
  } catch (e) {
    console.warn("[mention-triage] classify fallback:", e?.message || e);
    return mentions.slice(0, SYRA_MENTION_MAX_ITEMS).map((m) =>
      mapMention(m, { category: "question", priority: "medium", summary: "" }),
    );
  }
}

export async function triageMentions({ handle }) {
  assertTwitter();
  const clean = normalizeHandle(handle);
  const excluded = new Set(SYRA_ENGAGEMENT_EXCLUDED_HANDLES.map((h) => h.toLowerCase()));

  const sinceTime = Math.floor(Date.now() / 1000) - 48 * 3600;

  const [mentionsResult, syraSearch] = await Promise.all([
    getUserMentions({ userName: clean, sinceTime }).catch(() => ({ tweets: [] })),
    advancedSearch({
      query: '($SYRA OR "syra agent" OR syraa.fun) lang:en -is:retweet within_time:48h',
      queryType: "Latest",
    }).catch(() => ({ tweets: [] })),
  ]);

  const seen = new Set();
  const combined = [];

  for (const t of [...mentionsResult.tweets, ...syraSearch.tweets]) {
    if (seen.has(t.id)) continue;
    if (excluded.has(t.author.userName.toLowerCase())) continue;
    seen.add(t.id);
    combined.push(t);
  }

  combined.sort((a, b) => mentionEngagement(b.metrics) - mentionEngagement(a.metrics));

  const classified = await classifyMentions(combined, clean);
  classified.sort((a, b) => {
    const prio = { high: 3, medium: 2, low: 1 };
    const pd = (prio[b.priority] ?? 0) - (prio[a.priority] ?? 0);
    if (pd !== 0) return pd;
    return b.engagement - a.engagement;
  });

  return {
    success: true,
    data: {
      mentions: classified,
      meta: {
        handle: clean,
        rawMentions: mentionsResult.tweets.length,
        syraSearchHits: syraSearch.tweets.length,
        returnedCount: classified.length,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function resolveTone(toneId) {
  if (!toneId) return SYRA_MENTION_REPLY_TONES[0];
  return SYRA_MENTION_REPLY_TONES.find((t) => t.id === toneId) ?? SYRA_MENTION_REPLY_TONES[0];
}

function mapReplyDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    sourceTweetId: d.sourceTweetId,
    sourceTweetText: d.sourceTweetText,
    authorHandle: d.authorHandle,
    category: d.category || "",
    tone: d.tone || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingTexts(limit = SYRA_MENTION_EXISTING_SAMPLE) {
  assertMongo();
  const docs = await InternalMentionReply.find({}).sort({ createdAt: -1 }).limit(limit).select("text").lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

export async function draftMentionReply({ tweetId, tweetText, authorHandle, category, toneId, wallet }) {
  assertMongo();
  const trimmedId = String(tweetId || "").trim();
  const trimmedText = String(tweetText || "").trim();
  const trimmedHandle = String(authorHandle || "").trim().replace(/^@/, "");
  const cat = String(category || "question").trim();

  if (!trimmedId || trimmedText.length < 5 || !trimmedHandle) {
    const err = new Error("Valid mention tweet data is required");
    err.code = "invalid_source";
    throw err;
  }

  const tone = resolveTone(toneId);
  const existingTexts = await fetchExistingTexts();

  for (let attempt = 1; attempt <= SYRA_MENTION_MAX_RETRIES; attempt++) {
    const result = await callOpenRouter(
      [
        { role: "system", content: `${SYRA_MENTION_REPLY_SYSTEM_RULES}\n\n${SYRA_MENTION_TRIAGE_BRAND_CONTEXT}\nAttempt ${attempt}.` },
        {
          role: "user",
          content: `MENTION from @${trimmedHandle} (category: ${cat}):\n${trimmedText.slice(0, 2000)}\n\nTONE: ${tone.label}\nANGLE: ${tone.angle}\n${existingTexts.length ? `\nAVOID:\n${existingTexts.slice(0, 15).join("\n")}` : ""}\n\nReply:`,
        },
      ],
      { max_tokens: 400, temperature: 0.9, model: OPENROUTER_DEFAULT_MODEL },
    );

    const text = String(result.response || "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/^Reply:\s*/i, "").trim();
    if (!text || text.length < 15) continue;

    const hash = contentHash(text);
    if (await InternalMentionReply.exists({ contentHash: hash })) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalMentionReply.create({
        contentHash: hash,
        sourceTweetId: trimmedId,
        sourceTweetText: trimmedText.slice(0, 4000),
        authorHandle: trimmedHandle,
        category: cat,
        text,
        tone: tone.id,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalMentionReply);
      return { success: true, data: mapReplyDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique mention reply. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentMentionReplies(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalMentionReply.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return { success: true, data: docs.map(mapReplyDoc), total: docs.length };
}

export async function deleteMentionReply(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Mention reply not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalMentionReply.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Mention reply not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
