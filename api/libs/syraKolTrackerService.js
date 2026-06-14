import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalKolEngagement from "../models/InternalKolEngagement.js";
import {
  SYRA_KOL_DEFAULT_HANDLES,
  SYRA_KOL_DRAFT_SYSTEM_RULES,
  SYRA_KOL_ENGAGEMENT_MODES,
  SYRA_KOL_EXISTING_SAMPLE,
  SYRA_KOL_MAX_HANDLES,
  SYRA_KOL_MAX_RESULTS,
  SYRA_KOL_MAX_RETRIES,
  SYRA_KOL_TRACKER_BRAND_CONTEXT,
  SYRA_KOL_TWEETS_PER_HANDLE,
} from "../config/syraKolTrackerConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";
import { getUserLastTweets, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

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

function normalizeHandles(raw) {
  const list = Array.isArray(raw) && raw.length > 0
    ? raw
    : [...SYRA_KOL_DEFAULT_HANDLES];

  const handles = list
    .map((h) => String(h || "").trim().replace(/^@/, ""))
    .filter(Boolean)
    .slice(0, SYRA_KOL_MAX_HANDLES);

  if (handles.length === 0) {
    const err = new Error("At least one KOL handle is required");
    err.code = "invalid_handle";
    throw err;
  }
  return handles;
}

function kolEngagement(metrics) {
  return (
    (metrics?.likeCount ?? 0) * 1.0 +
    (metrics?.retweetCount ?? 0) * 2.5 +
    (metrics?.replyCount ?? 0) * 1.5 +
    (metrics?.quoteCount ?? 0) * 2.0 +
    Math.min(metrics?.viewCount ?? 0, 50_000) * 0.001
  );
}

export async function trackKols({ handles }) {
  assertTwitter();
  const cleanHandles = normalizeHandles(handles);

  const results = await Promise.all(
    cleanHandles.map(async (handle) => {
      try {
        const { tweets } = await getUserLastTweets({ userName: handle });
        return { handle, tweets: tweets.slice(0, SYRA_KOL_TWEETS_PER_HANDLE), error: null };
      } catch (e) {
        return { handle, tweets: [], error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );

  const opportunities = [];
  for (const row of results) {
    for (const t of row.tweets) {
      opportunities.push({
        id: t.id,
        text: t.text,
        url: t.url,
        createdAt: t.createdAt,
        author: t.author,
        metrics: t.metrics,
        kolHandle: row.handle,
        score: Math.round(kolEngagement(t.metrics) * 10) / 10,
      });
    }
  }

  opportunities.sort((a, b) => b.score - a.score);
  const top = opportunities.slice(0, SYRA_KOL_MAX_RESULTS);

  return {
    success: true,
    data: {
      opportunities: top,
      meta: {
        handles: cleanHandles,
        handlesTracked: results.filter((r) => !r.error).length,
        handlesFailed: results.filter((r) => r.error).map((r) => ({ handle: r.handle, error: r.error })),
        returnedCount: top.length,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function resolveMode(modeId) {
  if (!modeId) return SYRA_KOL_ENGAGEMENT_MODES[0];
  return SYRA_KOL_ENGAGEMENT_MODES.find((m) => m.id === modeId) ?? SYRA_KOL_ENGAGEMENT_MODES[0];
}

function mapDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    sourceTweetId: d.sourceTweetId,
    sourceTweetText: d.sourceTweetText,
    authorHandle: d.authorHandle,
    mode: d.mode || "reply",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingTexts(limit = SYRA_KOL_EXISTING_SAMPLE) {
  assertMongo();
  const docs = await InternalKolEngagement.find({}).sort({ createdAt: -1 }).limit(limit).select("text").lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

export async function draftKolEngagement({ tweetId, tweetText, authorHandle, modeId, wallet }) {
  assertMongo();
  const trimmedId = String(tweetId || "").trim();
  const trimmedText = String(tweetText || "").trim();
  const trimmedHandle = String(authorHandle || "").trim().replace(/^@/, "");

  if (!trimmedId || trimmedText.length < 10 || !trimmedHandle) {
    const err = new Error("Valid KOL tweet data is required");
    err.code = "invalid_source";
    throw err;
  }

  const mode = resolveMode(modeId);
  const existingTexts = await fetchExistingTexts();

  for (let attempt = 1; attempt <= SYRA_KOL_MAX_RETRIES; attempt++) {
    const result = await callOpenRouter(
      [
        { role: "system", content: `${SYRA_KOL_DRAFT_SYSTEM_RULES}\n\n${SYRA_KOL_TRACKER_BRAND_CONTEXT}\nAttempt ${attempt}.` },
        {
          role: "user",
          content: `KOL TWEET from @${trimmedHandle}:\n${trimmedText.slice(0, 2000)}\n\nMODE: ${mode.label}\nANGLE: ${mode.angle}\n${existingTexts.length ? `\nAVOID:\n${existingTexts.slice(0, 15).join("\n")}` : ""}\n\nDraft:`,
        },
      ],
      { max_tokens: 400, temperature: 0.92, model: OPENROUTER_DEFAULT_MODEL },
    );

    const text = String(result.response || "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/^Draft:\s*/i, "").trim();
    if (!text || text.length < 20) continue;

    const hash = contentHash(text);
    if (await InternalKolEngagement.exists({ contentHash: hash })) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalKolEngagement.create({
        contentHash: hash,
        sourceTweetId: trimmedId,
        sourceTweetText: trimmedText.slice(0, 4000),
        authorHandle: trimmedHandle,
        mode: mode.id,
        text,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalKolEngagement);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique KOL engagement draft. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentKolEngagements(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalKolEngagement.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteKolEngagement(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("KOL engagement not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalKolEngagement.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("KOL engagement not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
