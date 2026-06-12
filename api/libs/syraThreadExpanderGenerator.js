import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalThreadExpand from "../models/InternalThreadExpand.js";
import {
  SYRA_THREAD_BRAND_CONTEXT,
  SYRA_THREAD_EXISTING_SAMPLE,
  SYRA_THREAD_MAX_RETRIES,
  SYRA_THREAD_SYSTEM_RULES,
} from "../config/syraThreadExpanderConfig.js";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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

function parseTweetsFromLlm(raw) {
  const trimmed = String(raw || "").trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed?.tweets)) {
        return parsed.tweets.map((t) => String(t || "").trim()).filter(Boolean);
      }
    }
  } catch {
    /* fall through */
  }
  return trimmed
    .split(/\n\s*\n/)
    .map((t) => t.replace(/^\d+\/\d+\s*/, "").trim())
    .filter(Boolean);
}

function formatThreadFullText(tweets) {
  const n = tweets.length;
  return tweets.map((t, i) => `${i + 1}/${n}\n${t}`).join("\n\n");
}

function mapDoc(d) {
  return {
    id: String(d._id),
    sourceText: d.sourceText,
    tweets: d.tweets,
    fullText: d.fullText,
    tweetCount: d.tweetCount ?? d.tweets?.length ?? 0,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingFullTexts(limit = SYRA_THREAD_EXISTING_SAMPLE) {
  const docs = await InternalThreadExpand.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("fullText")
    .lean();
  return docs.map((d) => String(d.fullText || "").trim()).filter(Boolean);
}

async function generateThreadDraft({ sourceText, tweetCount, existingTexts, attempt }) {
  const countHint =
    tweetCount && tweetCount >= 3 && tweetCount <= 5
      ? `Exactly ${tweetCount} tweets.`
      : "Use 4 or 5 tweets.";

  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nPRIOR THREADS — write a fresh structure and hooks:\n${existingTexts
          .slice(0, 15)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 180)}`)
          .join("\n")}`
      : "";

  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `${SYRA_THREAD_SYSTEM_RULES}\n\n${SYRA_THREAD_BRAND_CONTEXT}\nAttempt ${attempt}.`,
      },
      {
        role: "user",
        content: `Expand this hook into a Syra thread. ${countHint}

HOOK / SOURCE POST:
${sourceText.slice(0, 2000)}
${forbiddenBlock}

Return JSON { "tweets": [...] }:`,
      },
    ],
    { max_tokens: 900, temperature: 0.88, model: OPENROUTER_DEFAULT_MODEL },
  );

  return parseTweetsFromLlm(result.response);
}

export async function createUniqueThreadExpand({ sourceText, wallet, tweetCount }) {
  assertMongo();
  const trimmed = String(sourceText || "").trim();
  if (trimmed.length < 20) {
    const err = new Error("Paste a hook or post (at least 20 characters)");
    err.code = "invalid_source";
    throw err;
  }
  if (trimmed.length > 4000) {
    const err = new Error("Source text must be under 4000 characters");
    err.code = "invalid_source";
    throw err;
  }

  const count =
    typeof tweetCount === "number" && tweetCount >= 3 && tweetCount <= 5 ? tweetCount : null;
  const existingTexts = await fetchExistingFullTexts();

  for (let attempt = 1; attempt <= SYRA_THREAD_MAX_RETRIES; attempt++) {
    const tweets = await generateThreadDraft({
      sourceText: trimmed,
      tweetCount: count,
      existingTexts,
      attempt,
    });
    if (tweets.length < 3 || tweets.length > 6) continue;
    if (tweets.some((t) => t.length > 280)) continue;

    const fullText = formatThreadFullText(tweets);
    const hash = contentHash(fullText);
    if (await InternalThreadExpand.exists({ contentHash: hash })) {
      existingTexts.unshift(fullText);
      continue;
    }

    try {
      const doc = await InternalThreadExpand.create({
        contentHash: hash,
        sourceText: trimmed.slice(0, 4000),
        tweets,
        fullText,
        tweetCount: tweets.length,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(fullText);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique thread. Try again or edit the hook.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentThreadExpands(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const docs = await InternalThreadExpand.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteThreadExpand(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Thread not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalThreadExpand.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Thread not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
