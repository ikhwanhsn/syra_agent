import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import InternalNarrativePost from "../models/InternalNarrativePost.js";
import { isMongooseConnected } from "../config/mongoose.js";
import {
  SYRA_NARRATIVE_CONTEXT,
  SYRA_NARRATIVE_EXISTING_SAMPLE,
  SYRA_NARRATIVE_MAX_RETRIES,
  SYRA_NARRATIVE_THEMES,
} from "../config/syraNarrativeConfig.js";
import { buildTrendingNarrativeContext } from "./syraNarrativeTrendContext.js";

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeNarrativeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, "'")
    .trim();
}

/**
 * @param {string} text
 * @returns {string}
 */
export function narrativeContentHash(text) {
  return crypto.createHash("sha256").update(normalizeNarrativeText(text)).digest("hex");
}

/**
 * @param {number} [limit]
 * @returns {Promise<string[]>}
 */
export async function fetchExistingNarrativeTexts(limit = SYRA_NARRATIVE_EXISTING_SAMPLE) {
  const docs = await InternalNarrativePost.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text")
    .lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

function pickRandomTheme() {
  const idx = Math.floor(Math.random() * SYRA_NARRATIVE_THEMES.length);
  return SYRA_NARRATIVE_THEMES[idx];
}

/**
 * @param {{ theme: typeof SYRA_NARRATIVE_THEMES[number]; existingTexts: string[]; attempt: number }}
 * @returns {Promise<string>}
 */
async function generateNarrativeDraft({ theme, existingTexts, attempt }) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nPOSTS ALREADY USED — do NOT repeat, paraphrase closely, or reuse the same hook/opening:\n${existingTexts
          .slice(0, 30)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 220)}`)
          .join("\n")}`
      : "";

  const systemPrompt = `You write viral X (Twitter) posts for Syra — a Solana agent infrastructure project with a $SYRA token.

${SYRA_NARRATIVE_CONTEXT}

Rules:
- Output ONLY the post text. No quotes, labels, or markdown fences.
- Must be unique vs the forbidden list below.
- Hype energy: bold, early, inevitable, shipping — not cringe or spammy.
- Include syraa.fun or $SYRA when natural (not forced every time).
- No financial advice, no price targets, no "guaranteed returns".
- Vary structure: sometimes question hook, sometimes stat drop, sometimes manifesto, sometimes bullet arrows.
- Attempt ${attempt}: push a fresh angle.`;

  const userPrompt = `Write one X post.

Theme: ${theme.label}
Angle: ${theme.angle}
${forbiddenBlock}

Post:`;

  const result = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      max_tokens: 600,
      temperature: 0.95,
      model: OPENROUTER_DEFAULT_MODEL,
    },
  );

  const raw = String(result.response || "").trim();
  return raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Post:\s*/i, "")
    .trim();
}

/**
 * @param {{ trendingContext: Awaited<ReturnType<typeof buildTrendingNarrativeContext>>; existingTexts: string[]; attempt: number }}
 * @returns {Promise<string>}
 */
async function generateTrendingNarrativeDraft({ trendingContext, existingTexts, attempt }) {
  const { headlines, trendTopics, marketSummary, pickedHook } = trendingContext;
  if (!pickedHook) return "";

  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nPOSTS ALREADY USED — do NOT repeat, paraphrase closely, or reuse the same hook/opening:\n${existingTexts
          .slice(0, 30)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 220)}`)
          .join("\n")}`
      : "";

  const headlinesBlock = headlines
    .slice(0, 8)
    .map((h, i) => {
      const snippet = String(h.text || "").slice(0, 140);
      return `${i + 1}. ${h.headline}${snippet ? ` — ${snippet}` : ""}`;
    })
    .join("\n");

  const topicsBlock =
    trendTopics.length > 0 ? trendTopics.slice(0, 6).map((t, i) => `${i + 1}. ${t}`).join("\n") : "None";

  const systemPrompt = `You write timely, viral X (Twitter) posts for Syra — a Solana agent infrastructure project with a $SYRA token.

${SYRA_NARRATIVE_CONTEXT}

You are newsjacking: start from a REAL trending headline or topic, then connect it naturally to Syra's thesis (agent economy, x402 micropayments, machine money on Solana, $SYRA utility).

Rules:
- Output ONLY the post text. No quotes, labels, or markdown fences.
- Must be unique vs the forbidden list below.
- Open with the news angle or a sharp tie-in — not a generic Syra pitch.
- The Syra connection must feel smart and timely, not forced.
- Hype energy: bold, early, inevitable — not cringe or spammy.
- Include syraa.fun or $SYRA when natural.
- No financial advice, no price targets, no "guaranteed returns".
- Attempt ${attempt}: fresh hook and connection.`;

  const userPrompt = `PRIMARY TRENDING HOOK (build the post around this):
${pickedHook.text}
${pickedHook.detail ? `Context: ${pickedHook.detail}` : ""}
Source: ${pickedHook.source}

OTHER TRENDING HEADLINES (48h):
${headlinesBlock || "None"}

TREND SCOUT TOPICS:
${topicsBlock}

${marketSummary ? `MARKET SUMMARY:\n${marketSummary.slice(0, 400)}\n` : ""}
Write one X post that rides this news wave and connects it to Syra / $SYRA.
${forbiddenBlock}

Post:`;

  const result = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      max_tokens: 650,
      temperature: 0.9,
      model: OPENROUTER_DEFAULT_MODEL,
    },
  );

  const raw = String(result.response || "").trim();
  return raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Post:\s*/i, "")
    .trim();
}

/**
 * @param {{ wallet?: string | null; mode?: "syra" | "trending" }} [opts]
 * @returns {Promise<{ success: true; data: ReturnType<typeof mapNarrativeDoc> }>}
 */
export async function createUniqueNarrativePost(opts = {}) {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }

  const mode = opts.mode === "trending" ? "trending" : "syra";
  const existingTexts = await fetchExistingNarrativeTexts();
  const theme = pickRandomTheme();

  let trendingContext = null;
  if (mode === "trending") {
    trendingContext = await buildTrendingNarrativeContext();
    if (!trendingContext.headlines.length && !trendingContext.trendTopics.length) {
      const err = new Error("No trending news available right now. Try Syra mode or refresh later.");
      err.code = "trending_unavailable";
      throw err;
    }
    if (!trendingContext.pickedHook) {
      const err = new Error("Could not pick a trending hook. Try again shortly.");
      err.code = "trending_unavailable";
      throw err;
    }
  }

  for (let attempt = 1; attempt <= SYRA_NARRATIVE_MAX_RETRIES; attempt++) {
    const text =
      mode === "trending"
        ? await generateTrendingNarrativeDraft({ trendingContext, existingTexts, attempt })
        : await generateNarrativeDraft({ theme, existingTexts, attempt });
    if (!text || text.length < 40) continue;

    const contentHash = narrativeContentHash(text);
    const exists = await InternalNarrativePost.exists({ contentHash });
    if (exists) {
      existingTexts.unshift(text);
      continue;
    }

    const meta =
      mode === "trending"
        ? {
            theme: "trending-news",
            angle: trendingContext.pickedHook.text.slice(0, 280),
            sourceMode: "trending",
            newsHook: trendingContext.pickedHook.text,
          }
        : {
            theme: theme.id,
            angle: theme.angle,
            sourceMode: "syra",
            newsHook: "",
          };

    try {
      const doc = await InternalNarrativePost.create({
        contentHash,
        text,
        ...meta,
        createdByWallet: opts.wallet ? String(opts.wallet).trim() : null,
      });

      return {
        success: true,
        data: mapNarrativeDoc(doc),
      };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique narrative after several attempts. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

/**
 * @param {{ limit?: number }} [opts]
 */
function mapNarrativeDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    theme: d.theme,
    angle: d.angle,
    sourceMode: d.sourceMode === "trending" ? "trending" : "syra",
    newsHook: d.newsHook ? String(d.newsHook) : null,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

function assertMongoConnected() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

/**
 * @param {string} id
 * @returns {boolean}
 */
function isValidNarrativeId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

export async function listRecentNarrativePosts(opts = {}) {
  assertMongoConnected();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const docs = await InternalNarrativePost.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("text theme angle sourceMode newsHook createdAt createdByWallet")
    .lean();

  return {
    success: true,
    data: docs.map(mapNarrativeDoc),
    total: docs.length,
  };
}

/**
 * @param {{ originalText: string; theme: string; angle: string; instruction: string; existingTexts: string[]; attempt: number }}
 * @returns {Promise<string>}
 */
async function rewriteNarrativeDraft({
  originalText,
  theme,
  angle,
  instruction,
  existingTexts,
  attempt,
}) {
  const forbiddenBlock =
    existingTexts.length > 0
      ? `\n\nOTHER SAVED POSTS — revised text must not match or closely paraphrase any of these:\n${existingTexts
          .slice(0, 25)
          .map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")}`
      : "";

  const systemPrompt = `You revise X (Twitter) posts for Syra — a Solana agent infrastructure project with a $SYRA token.

${SYRA_NARRATIVE_CONTEXT}

Rules:
- Apply the user's edit instruction to the ORIGINAL post.
- Output ONLY the revised post text. No quotes, labels, or markdown fences.
- Keep Syra / $SYRA hype energy unless the instruction says otherwise.
- No financial advice, no price targets, no guaranteed returns.
- The revision must be meaningfully different from the original when an edit is requested.
- Attempt ${attempt}: follow the instruction precisely while staying post-ready for X.`;

  const userPrompt = `ORIGINAL POST:
${originalText}

THEME: ${theme || "general"}
ANGLE: ${angle || ""}

EDIT INSTRUCTION:
${instruction}
${forbiddenBlock}

Revised post:`;

  const result = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      max_tokens: 700,
      temperature: 0.85,
      model: OPENROUTER_DEFAULT_MODEL,
    },
  );

  const raw = String(result.response || "").trim();
  return raw
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Revised post:\s*/i, "")
    .trim();
}

/**
 * @param {string} id
 * @param {string} instruction
 * @returns {Promise<{ success: true; data: ReturnType<typeof mapNarrativeDoc> }>}
 */
export async function rewriteNarrativePost(id, instruction) {
  assertMongoConnected();
  if (!isValidNarrativeId(id)) {
    const err = new Error("Narrative not found");
    err.code = "not_found";
    throw err;
  }

  const trimmedInstruction = String(instruction || "").trim();
  if (trimmedInstruction.length < 3) {
    const err = new Error("Edit instruction must be at least 3 characters");
    err.code = "invalid_instruction";
    throw err;
  }
  if (trimmedInstruction.length > 500) {
    const err = new Error("Edit instruction must be under 500 characters");
    err.code = "invalid_instruction";
    throw err;
  }

  const existing = await InternalNarrativePost.findById(id).lean();
  if (!existing) {
    const err = new Error("Narrative not found");
    err.code = "not_found";
    throw err;
  }

  const otherTexts = (await fetchExistingNarrativeTexts()).filter(
    (t) => normalizeNarrativeText(t) !== normalizeNarrativeText(existing.text),
  );

  for (let attempt = 1; attempt <= SYRA_NARRATIVE_MAX_RETRIES; attempt++) {
    const revised = await rewriteNarrativeDraft({
      originalText: existing.text,
      theme: existing.theme,
      angle: existing.angle,
      instruction: trimmedInstruction,
      existingTexts: otherTexts,
      attempt,
    });

    if (!revised || revised.length < 20) continue;
    if (normalizeNarrativeText(revised) === normalizeNarrativeText(existing.text)) continue;

    try {
      return await updateNarrativePost(id, revised);
    } catch (e) {
      if (e?.code === "duplicate_text") {
        otherTexts.unshift(revised);
        continue;
      }
      throw e;
    }
  }

  const err = new Error(
    "Could not produce a unique revision. Try a different instruction or generate a new post.",
  );
  err.code = "rewrite_failed";
  throw err;
}

/**
 * @param {string} id
 * @param {string} text
 * @returns {Promise<{ success: true; data: ReturnType<typeof mapNarrativeDoc> }>}
 */
export async function updateNarrativePost(id, text) {
  assertMongoConnected();
  if (!isValidNarrativeId(id)) {
    const err = new Error("Invalid narrative id");
    err.code = "not_found";
    throw err;
  }

  const trimmed = String(text || "").trim();
  if (trimmed.length < 20) {
    const err = new Error("Post text must be at least 20 characters");
    err.code = "invalid_text";
    throw err;
  }
  if (trimmed.length > 2000) {
    const err = new Error("Post text must be under 2000 characters");
    err.code = "invalid_text";
    throw err;
  }

  const contentHash = narrativeContentHash(trimmed);
  const duplicate = await InternalNarrativePost.findOne({
    contentHash,
    _id: { $ne: id },
  })
    .select("_id")
    .lean();
  if (duplicate) {
    const err = new Error("This text already exists in another saved narrative");
    err.code = "duplicate_text";
    throw err;
  }

  try {
    const doc = await InternalNarrativePost.findByIdAndUpdate(
      id,
      { text: trimmed, contentHash },
      { new: true, runValidators: true },
    ).lean();

    if (!doc) {
      const err = new Error("Narrative not found");
      err.code = "not_found";
      throw err;
    }

    return { success: true, data: mapNarrativeDoc(doc) };
  } catch (e) {
    if (e?.code === 11000) {
      const err = new Error("This text already exists in another saved narrative");
      err.code = "duplicate_text";
      throw err;
    }
    throw e;
  }
}

/**
 * @param {string} id
 * @returns {Promise<{ success: true; deletedId: string }>}
 */
export async function deleteNarrativePost(id) {
  assertMongoConnected();
  if (!isValidNarrativeId(id)) {
    const err = new Error("Narrative not found");
    err.code = "not_found";
    throw err;
  }

  const doc = await InternalNarrativePost.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Narrative not found");
    err.code = "not_found";
    throw err;
  }

  return { success: true, deletedId: String(doc._id) };
}
