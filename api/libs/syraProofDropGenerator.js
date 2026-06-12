import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalProofDrop from "../models/InternalProofDrop.js";
import {
  SYRA_PROOF_ANGLES,
  SYRA_PROOF_BRAND_CONTEXT,
  SYRA_PROOF_EXISTING_SAMPLE,
  SYRA_PROOF_MAX_RETRIES,
  SYRA_PROOF_SYSTEM_RULES,
} from "../config/syraProofDropConfig.js";
import { formatMetricsForLlm, gatherProofDropMetrics } from "./syraProofDropMetrics.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";

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

function resolveAngle(angleId) {
  if (!angleId) {
    const idx = Math.floor(Math.random() * SYRA_PROOF_ANGLES.length);
    return SYRA_PROOF_ANGLES[idx];
  }
  return SYRA_PROOF_ANGLES.find((a) => a.id === angleId) ?? SYRA_PROOF_ANGLES[0];
}

function mapDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    angle: d.angle,
    shareSectionId: d.shareSectionId || "headline",
    metricsSnapshot: d.metricsSnapshot ?? {},
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingTexts(limit = SYRA_PROOF_EXISTING_SAMPLE) {
  const docs = await InternalProofDrop.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text")
    .lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

async function generateProofDraft({ angle, metrics, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nPOSTS ALREADY USED:\n${existingTexts
          .slice(0, 20)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")}`
      : "";

  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `${SYRA_PROOF_SYSTEM_RULES}\n\n${SYRA_PROOF_BRAND_CONTEXT}\nAttempt ${attempt}.`,
      },
      {
        role: "user",
        content: `Write one proof-drop X post.

ANGLE: ${angle.label}
FOCUS: ${angle.focus}

${formatMetricsForLlm(metrics)}
${forbiddenBlock}

Post:`,
      },
    ],
    { max_tokens: 550, temperature: 0.85, model: OPENROUTER_DEFAULT_MODEL },
  );

  return String(result.response || "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Post:\s*/i, "")
    .trim();
}

export async function createUniqueProofDrop({ wallet, angleId }) {
  assertMongo();
  const angle = resolveAngle(angleId);
  const metrics = await gatherProofDropMetrics();
  const existingTexts = await fetchExistingTexts();

  for (let attempt = 1; attempt <= SYRA_PROOF_MAX_RETRIES; attempt++) {
    const text = await generateProofDraft({ angle, metrics, existingTexts, attempt });
    if (!text || text.length < 40) continue;

    const hash = contentHash(text);
    if (await InternalProofDrop.exists({ contentHash: hash })) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalProofDrop.create({
        contentHash: hash,
        text,
        angle: angle.id,
        shareSectionId: angle.shareSectionId,
        metricsSnapshot: metrics,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalProofDrop);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique proof drop. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function getProofDropMetricsPreview() {
  const metrics = await gatherProofDropMetrics();
  return { success: true, data: metrics };
}

export async function listRecentProofDrops(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalProofDrop.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteProofDrop(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Proof drop not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalProofDrop.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Proof drop not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
