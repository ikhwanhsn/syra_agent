/**
 * S3Labs Telegram @mention Q&A — answers only in the configured S3Labs group.
 */

import { S3LABS_TELEGRAM_QA_ENABLED, S3LABS_TELEGRAM_QA_MAX_PER_USER_PER_HOUR } from "../../config/s3labsAgentsConfig.js";
import { resolveInternalPipelineModel, INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS } from "../../config/internalPipelineAgents.js";
import { callOpenRouter } from "../openrouter.js";
import { sanitizeUserMessage } from "../promptSanitizer.js";
import { sendS3labsTelegramReply } from "../s3labsTelegramNotifier.js";
import { isAllowedS3labsChat } from "./s3labsTelegramAllowlist.js";
import { getS3labsBotMeta } from "./s3labsTelegramBotMeta.js";
import { buildS3labsQaSystemPrompt } from "./s3labsQaKnowledge.js";

/** @type {Map<string, number[]>} */
const userRequestTimestamps = new Map();

/**
 * @param {number | string} userId
 * @returns {boolean}
 */
function isUserRateLimited(userId) {
  const key = String(userId);
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const prev = userRequestTimestamps.get(key) || [];
  const recent = prev.filter((t) => t > hourAgo);
  if (recent.length >= S3LABS_TELEGRAM_QA_MAX_PER_USER_PER_HOUR) {
    userRequestTimestamps.set(key, recent);
    return true;
  }
  recent.push(now);
  userRequestTimestamps.set(key, recent);
  return false;
}

/**
 * @param {import("./s3labsTelegramTypes.js").TelegramMessage | undefined} message
 * @param {string} botUsername
 * @returns {boolean}
 */
export function isBotMentionedInMessage(message, botUsername) {
  if (!message?.text && !message?.caption) return false;
  const text = String(message.text || message.caption || "");
  const entities = message.entities || message.caption_entities || [];
  const needle = `@${botUsername}`.toLowerCase();

  for (const e of entities) {
    if (e.type !== "mention") continue;
    const slice = text.slice(e.offset, e.offset + e.length).toLowerCase();
    if (slice === needle) return true;
  }

  return text.toLowerCase().includes(needle);
}

/**
 * @param {string} text
 * @param {string} botUsername
 * @returns {string}
 */
export function stripBotMention(text, botUsername) {
  const re = new RegExp(`@${botUsername}\\b`, "gi");
  return text.replace(re, "").replace(/\s+/g, " ").trim();
}

/**
 * @param {import("./s3labsTelegramTypes.js").TelegramMessage} message
 * @param {string} botUsername
 * @returns {string}
 */
function extractQuestion(message, botUsername) {
  const raw = String(message.text || message.caption || "").trim();
  return stripBotMention(raw, botUsername);
}

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
async function answerS3labsQuestion(question) {
  const { text, flagged } = sanitizeUserMessage(question);
  if (!text.trim()) {
    return "Pertanyaannya kosong — tag bot lalu tulis pertanyaanmu.";
  }
  if (flagged.length > 0) {
    console.warn("[s3labs-telegram-qa] sanitization flags:", flagged.join(", "));
  }

  const model = resolveInternalPipelineModel(null);
  const messages = [
    { role: "system", content: buildS3labsQaSystemPrompt() },
    { role: "user", content: text.slice(0, 4000) },
  ];

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: Math.min(1536, INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.internalResearch),
    temperature: 0.55,
  });

  const reply = (result.response || "").trim();
  if (!reply) {
    return "Maaf, aku belum bisa menjawab itu sekarang. Coba lagi sebentar ya.";
  }
  return reply.length > 3900 ? `${reply.slice(0, 3900)}…` : reply;
}

/**
 * @param {import("./s3labsTelegramTypes.js").TelegramUpdate} update
 * @returns {Promise<void>}
 */
export async function handleS3labsTelegramUpdate(update) {
  if (!S3LABS_TELEGRAM_QA_ENABLED) return;

  const message = update.message || update.edited_message;
  if (!message?.chat?.id || !message.from) return;

  const chatType = message.chat.type;
  if (chatType !== "group" && chatType !== "supergroup") return;

  const allowed = await isAllowedS3labsChat(message.chat.id);
  if (!allowed) {
    return;
  }

  const bot = await getS3labsBotMeta();
  if (!bot?.username) {
    console.warn("[s3labs-telegram-qa] bot username unknown (getMe failed)");
    return;
  }

  if (!isBotMentionedInMessage(message, bot.username)) return;

  const question = extractQuestion(message, bot.username);
  if (!question) return;

  if (isUserRateLimited(message.from.id)) {
    await sendS3labsTelegramReply(
      "⏳ Kamu sudah banyak bertanya dalam satu jam. Coba lagi nanti ya.",
      {
        replyToMessageId: message.message_id,
        messageThreadId: message.message_thread_id,
      },
    );
    return;
  }

  let replyText;
  try {
    replyText = await answerS3labsQuestion(question);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[s3labs-telegram-qa] LLM failed:", msg);
    replyText = "Maaf, ada gangguan sementara. Coba lagi beberapa menit lagi.";
  }

  const sent = await sendS3labsTelegramReply(replyText, {
    replyToMessageId: message.message_id,
    messageThreadId: message.message_thread_id,
  });
  if (!sent) {
    console.warn("[s3labs-telegram-qa] failed to send reply");
  }
}
