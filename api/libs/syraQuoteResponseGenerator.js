import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalQuoteResponse from "../models/InternalQuoteResponse.js";
import {
  SYRA_QUOTE_BRAND_CONTEXT,
  SYRA_QUOTE_EXISTING_SAMPLE,
  SYRA_QUOTE_MAX_RETRIES,
  SYRA_QUOTE_SYSTEM_RULES,
  SYRA_QUOTE_TONES,
} from "../config/syraQuoteResponseConfig.js";

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

function pickRandomTone() {
  const idx = Math.floor(Math.random() * SYRA_QUOTE_TONES.length);
  return SYRA_QUOTE_TONES[idx];
}

function resolveTone(toneId) {
  if (!toneId) return pickRandomTone();
  return SYRA_QUOTE_TONES.find((t) => t.id === toneId) ?? pickRandomTone();
}

/**
 * @param {number} [limit]
 * @returns {Promise<string[]>}
 */
async function fetchExistingQuoteTexts(limit = SYRA_QUOTE_EXISTING_SAMPLE) {
  const docs = await InternalQuoteResponse.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text")
    .lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

function assertMongoConnected() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

function mapQuoteDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    sourcePost: d.sourcePost,
    tone: d.tone || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

/**
 * @param {{ sourcePost: string; tone: typeof SYRA_QUOTE_TONES[number]; existingTexts: string[]; attempt: number }}
 */
async function generateQuoteDraft({ sourcePost, tone, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nCAPTIONS ALREADY USED — write something fresh, different hook and structure:\n${existingTexts
          .slice(0, 25)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")}`
      : "";

  const systemPrompt = `${SYRA_QUOTE_SYSTEM_RULES}

${SYRA_QUOTE_BRAND_CONTEXT}

Attempt ${attempt}: push a distinct angle.`;

  const userPrompt = `ORIGINAL POST TO QUOTE (from another project — do not copy verbatim):
${sourcePost.slice(0, 2000)}

TONE: ${tone.label}
ANGLE: ${tone.angle}
${forbiddenBlock}

Write Syra's quote-tweet caption:`;

  const result = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      max_tokens: 550,
      temperature: 0.92,
      model: OPENROUTER_DEFAULT_MODEL,
    },
  );

  const raw = String(result.response || "").trim();
  return raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Write Syra's quote-tweet caption:\s*/i, "")
    .trim();
}

/**
 * @param {{ sourcePost: string; wallet?: string | null; toneId?: string | null }}
 */
export async function createUniqueQuoteResponse({ sourcePost, wallet, toneId }) {
  assertMongoConnected();

  const trimmedSource = String(sourcePost || "").trim();
  if (trimmedSource.length < 20) {
    const err = new Error("Paste the full post text (at least 20 characters)");
    err.code = "invalid_source";
    throw err;
  }
  if (trimmedSource.length > 4000) {
    const err = new Error("Source post must be under 4000 characters");
    err.code = "invalid_source";
    throw err;
  }

  const tone = resolveTone(toneId);
  const existingTexts = await fetchExistingQuoteTexts();
  const sourcePostHash = contentHash(trimmedSource);

  const priorForSource = await InternalQuoteResponse.findOne({ sourcePostHash })
    .sort({ createdAt: -1 })
    .select("text")
    .lean();
  if (priorForSource?.text) {
    existingTexts.unshift(String(priorForSource.text));
  }

  for (let attempt = 1; attempt <= SYRA_QUOTE_MAX_RETRIES; attempt++) {
    const text = await generateQuoteDraft({
      sourcePost: trimmedSource,
      tone,
      existingTexts,
      attempt,
    });
    if (!text || text.length < 30) continue;

    const hash = contentHash(text);
    const exists = await InternalQuoteResponse.exists({ contentHash: hash });
    if (exists) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalQuoteResponse.create({
        contentHash: hash,
        sourcePostHash,
        sourcePost: trimmedSource.slice(0, 4000),
        text,
        tone: tone.id,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });

      return { success: true, data: mapQuoteDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique quote caption. Try again or tweak the source post.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentQuoteResponses(opts = {}) {
  assertMongoConnected();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const docs = await InternalQuoteResponse.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text sourcePost tone createdAt createdByWallet")
    .lean();

  return {
    success: true,
    data: docs.map(mapQuoteDoc),
    total: docs.length,
  };
}

export async function deleteQuoteResponse(id) {
  assertMongoConnected();
  if (!isValidId(id)) {
    const err = new Error("Quote response not found");
    err.code = "not_found";
    throw err;
  }

  const doc = await InternalQuoteResponse.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Quote response not found");
    err.code = "not_found";
    throw err;
  }

  return { success: true, deletedId: String(doc._id) };
}
