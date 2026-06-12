import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalCopyPolish from "../models/InternalCopyPolish.js";
import {
  SYRA_COPY_POLISH_BRAND_CONTEXT,
  SYRA_COPY_POLISH_EXISTING_SAMPLE,
  SYRA_COPY_POLISH_MAX_RETRIES,
  SYRA_COPY_POLISH_SYSTEM_RULES,
  SYRA_COPY_POLISH_TONES,
} from "../config/syraCopyPolisherConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";

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

function resolveTone(toneId) {
  if (!toneId) {
    const idx = Math.floor(Math.random() * SYRA_COPY_POLISH_TONES.length);
    return SYRA_COPY_POLISH_TONES[idx];
  }
  return SYRA_COPY_POLISH_TONES.find((t) => t.id === toneId) ?? SYRA_COPY_POLISH_TONES[0];
}

function mapDoc(d) {
  return {
    id: String(d._id),
    originalText: d.originalText,
    polishedText: d.polishedText,
    tone: d.tone || "",
    direction: d.direction || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingPolished(limit = SYRA_COPY_POLISH_EXISTING_SAMPLE) {
  const docs = await InternalCopyPolish.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("polishedText")
    .lean();
  return docs.map((d) => String(d.polishedText || "").trim()).filter(Boolean);
}

async function generatePolishDraft({ originalText, tone, direction, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nALREADY USED OUTPUTS — write fresh wording:\n${existingTexts
          .slice(0, 20)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")}`
      : "";

  const directionBlock =
    direction && direction.trim()
      ? `\n\nEXTRA DIRECTION FROM AUTHOR:\n${direction.trim().slice(0, 400)}`
      : "";

  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `${SYRA_COPY_POLISH_SYSTEM_RULES}\n\n${SYRA_COPY_POLISH_BRAND_CONTEXT}\nAttempt ${attempt}.`,
      },
      {
        role: "user",
        content: `Improve this X post draft.

TONE: ${tone.label}
STYLE: ${tone.angle}
${directionBlock}

ORIGINAL DRAFT (keep same context and meaning):
${originalText.slice(0, 2500)}
${forbiddenBlock}

Improved post:`,
      },
    ],
    { max_tokens: 600, temperature: 0.82, model: OPENROUTER_DEFAULT_MODEL },
  );

  return String(result.response || "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Improved post:\s*/i, "")
    .trim();
}

export async function createUniqueCopyPolish({ originalText, wallet, toneId, direction }) {
  assertMongo();

  const trimmed = String(originalText || "").trim();
  if (trimmed.length < 10) {
    const err = new Error("Paste your draft (at least 10 characters)");
    err.code = "invalid_source";
    throw err;
  }
  if (trimmed.length > 4000) {
    const err = new Error("Draft must be under 4000 characters");
    err.code = "invalid_source";
    throw err;
  }

  const trimmedDirection = String(direction || "").trim().slice(0, 500);
  const tone = resolveTone(toneId);
  const existingTexts = await fetchExistingPolished();

  for (let attempt = 1; attempt <= SYRA_COPY_POLISH_MAX_RETRIES; attempt++) {
    const polished = await generatePolishDraft({
      originalText: trimmed,
      tone,
      direction: trimmedDirection,
      existingTexts,
      attempt,
    });
    if (!polished || polished.length < 10) continue;
    if (normalizeText(polished) === normalizeText(trimmed)) continue;

    const hash = contentHash(polished);
    if (await InternalCopyPolish.exists({ contentHash: hash })) {
      existingTexts.unshift(polished);
      continue;
    }

    try {
      const doc = await InternalCopyPolish.create({
        contentHash: hash,
        originalText: trimmed.slice(0, 4000),
        polishedText: polished,
        tone: tone.id,
        direction: trimmedDirection,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalCopyPolish);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(polished);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not produce a unique polish. Try a different tone or add direction.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentCopyPolishes(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalCopyPolish.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteCopyPolish(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Polish not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalCopyPolish.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Polish not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
