import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalImagePrompt from "../models/InternalImagePrompt.js";
import {
  SYRA_IMAGE_PROMPT_BRAND_CONTEXT,
  SYRA_IMAGE_PROMPT_EXISTING_SAMPLE,
  SYRA_IMAGE_PROMPT_MAX_RETRIES,
  SYRA_IMAGE_PROMPT_STYLES,
  SYRA_IMAGE_PROMPT_SYSTEM_RULES,
  SYRA_IMAGE_VISUAL_THEME,
} from "../config/syraImagePromptConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, "'")
    .trim();
}

function contentHash(imagePrompt, caption) {
  return crypto
    .createHash("sha256")
    .update(normalizeText(`${imagePrompt}|${caption}`))
    .digest("hex");
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

function resolveStyle(styleId) {
  if (!styleId) {
    const idx = Math.floor(Math.random() * SYRA_IMAGE_PROMPT_STYLES.length);
    return SYRA_IMAGE_PROMPT_STYLES[idx];
  }
  return SYRA_IMAGE_PROMPT_STYLES.find((s) => s.id === styleId) ?? SYRA_IMAGE_PROMPT_STYLES[0];
}

function mapDoc(d) {
  return {
    id: String(d._id),
    sourcePrompt: d.sourcePrompt,
    imagePrompt: d.imagePrompt,
    caption: d.caption,
    style: d.style || "",
    direction: d.direction || "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

function parseJsonOutput(raw) {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text;

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed.imagePrompt === "string" && typeof parsed.caption === "string") {
      return {
        imagePrompt: parsed.imagePrompt.trim(),
        caption: parsed.caption.trim(),
      };
    }
  } catch {
    // fall through
  }

  const imageMatch = candidate.match(/"imagePrompt"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  const captionMatch = candidate.match(/"caption"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (imageMatch && captionMatch) {
    return {
      imagePrompt: JSON.parse(`"${imageMatch[1]}"`).trim(),
      caption: JSON.parse(`"${captionMatch[1]}"`).trim(),
    };
  }

  return null;
}

async function fetchExistingOutputs(limit = SYRA_IMAGE_PROMPT_EXISTING_SAMPLE) {
  const docs = await InternalImagePrompt.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("imagePrompt caption")
    .lean();
  return docs
    .map((d) => ({
      imagePrompt: String(d.imagePrompt || "").trim(),
      caption: String(d.caption || "").trim(),
    }))
    .filter((d) => d.imagePrompt && d.caption);
}

async function generatePromptDraft({ sourcePrompt, style, direction, existingOutputs, attempt }) {
  const forbiddenBlock =
    existingOutputs.length > 0
      ? `\n\nALREADY USED — create a fresh visual concept:\n${existingOutputs
          .slice(0, 12)
          .map(
            (o, i) =>
              `${i + 1}. CAPTION: ${o.caption.slice(0, 120)} | PROMPT: ${o.imagePrompt.replace(/\n/g, " ").slice(0, 160)}`,
          )
          .join("\n")}`
      : "";

  const directionBlock =
    direction && direction.trim()
      ? `\n\nEXTRA DIRECTION FROM AUTHOR:\n${direction.trim().slice(0, 500)}`
      : "";

  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `${SYRA_IMAGE_PROMPT_SYSTEM_RULES}\n\n${SYRA_IMAGE_VISUAL_THEME}\n\n${SYRA_IMAGE_PROMPT_BRAND_CONTEXT}\nAttempt ${attempt}.`,
      },
      {
        role: "user",
        content: `Enhance this image idea for Syra-branded X graphics.

VISUAL STYLE: ${style.label}
STYLE NOTES: ${style.angle}
${directionBlock}

USER'S ROUGH PROMPT / IDEA (preserve core intent):
${sourcePrompt.slice(0, 3000)}
${forbiddenBlock}

Return JSON only:`,
      },
    ],
    { max_tokens: 1200, temperature: 0.88, model: OPENROUTER_DEFAULT_MODEL },
  );

  return parseJsonOutput(result.response);
}

export async function createUniqueImagePrompt({ sourcePrompt, wallet, styleId, direction }) {
  assertMongo();

  const trimmed = String(sourcePrompt || "").trim();
  if (trimmed.length < 8) {
    const err = new Error("Describe your image idea (at least 8 characters)");
    err.code = "invalid_source";
    throw err;
  }
  if (trimmed.length > 4000) {
    const err = new Error("Source prompt must be under 4000 characters");
    err.code = "invalid_source";
    throw err;
  }

  const trimmedDirection = String(direction || "").trim().slice(0, 500);
  const style = resolveStyle(styleId);
  const existingOutputs = await fetchExistingOutputs();

  for (let attempt = 1; attempt <= SYRA_IMAGE_PROMPT_MAX_RETRIES; attempt++) {
    const draft = await generatePromptDraft({
      sourcePrompt: trimmed,
      style,
      direction: trimmedDirection,
      existingOutputs,
      attempt,
    });
    if (!draft?.imagePrompt || draft.imagePrompt.length < 40) continue;
    if (!draft.caption || draft.caption.length < 10) continue;

    const hash = contentHash(draft.imagePrompt, draft.caption);
    if (await InternalImagePrompt.exists({ contentHash: hash })) {
      existingOutputs.unshift(draft);
      continue;
    }

    try {
      const doc = await InternalImagePrompt.create({
        contentHash: hash,
        sourcePrompt: trimmed.slice(0, 4000),
        imagePrompt: draft.imagePrompt.slice(0, 8000),
        caption: draft.caption.slice(0, 600),
        style: style.id,
        direction: trimmedDirection,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalImagePrompt);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingOutputs.unshift(draft);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique prompt. Try a different style or add direction.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentImagePrompts(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalImagePrompt.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteImagePrompt(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Prompt not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalImagePrompt.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Prompt not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
