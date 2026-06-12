/**
 * S3Labs Telegram @mention Q&A — answers only in the configured S3Labs group.
 */

import { S3LABS_TELEGRAM_QA_ENABLED, S3LABS_TELEGRAM_QA_MAX_PER_USER_PER_HOUR } from "../../config/s3labsAgentsConfig.js";
import { resolveInternalPipelineModel, INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS } from "../../config/internalPipelineAgents.js";
import { callOpenRouter } from "../openrouter.js";
import { sanitizeUserMessage } from "../promptSanitizer.js";
import {
  sendS3labsTelegramReply,
  sendS3labsTelegramTyping,
} from "../s3labsTelegramNotifier.js";
import { markdownToTelegramHtml } from "../telegramFormat.js";
import { isAllowedS3labsChat } from "./s3labsTelegramAllowlist.js";
import { getS3labsBotMeta } from "./s3labsTelegramBotMeta.js";
import { buildS3labsQaSystemPrompt } from "./s3labsQaKnowledge.js";
import { buildS3labsQaContext } from "./s3labsQaContext.js";

/** @type {Map<string, number[]>} */
const userRequestTimestamps = new Map();

/** Telegram typing indicator expires after ~5s — refresh while waiting on LLM. */
const S3LABS_QA_TYPING_REFRESH_MS = 4200;

/**
 * Keep typing indicator alive until `work` completes.
 * @template T
 * @param {{ messageThreadId?: number }} replyOpts
 * @param {() => Promise<T>} work
 * @returns {Promise<T>}
 */
async function withS3labsTypingIndicator(replyOpts, work) {
  let active = true;
  const pump = (async () => {
    while (active) {
      await sendS3labsTelegramTyping(replyOpts).catch(() => {});
      if (!active) break;
      await new Promise((resolve) => setTimeout(resolve, S3LABS_QA_TYPING_REFRESH_MS));
    }
  })();

  try {
    return await work();
  } finally {
    active = false;
    await pump.catch(() => {});
  }
}

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
 * @param {number} [botId]
 * @returns {boolean}
 */
export function isBotMentionedInMessage(message, botUsername, botId) {
  if (!message?.text && !message?.caption) return false;
  const text = String(message.text || message.caption || "");
  const entities = message.entities || message.caption_entities || [];
  const needle = `@${botUsername}`.toLowerCase();

  for (const e of entities) {
    if (e.type === "text_mention" && botId != null && e.user?.id === botId) {
      return true;
    }
    if (e.type !== "mention") continue;
    const slice = text.slice(e.offset, e.offset + e.length).toLowerCase();
    if (slice === needle) return true;
  }

  return text.toLowerCase().includes(needle);
}

/**
 * Remove @username and text_mention segments that reference the bot.
 * @param {string} text
 * @param {import("./s3labsTelegramTypes.js").TelegramMessageEntity[]} entities
 * @param {string} botUsername
 * @param {number} [botId]
 * @returns {string}
 */
export function stripBotMentionFromText(text, entities, botUsername, botId) {
  const needle = `@${botUsername}`.toLowerCase();
  /** @type {Array<[number, number]>} */
  const spans = [];

  for (const e of entities) {
    if (e.type === "text_mention" && botId != null && e.user?.id === botId) {
      spans.push([e.offset, e.offset + e.length]);
      continue;
    }
    if (e.type !== "mention") continue;
    const slice = text.slice(e.offset, e.offset + e.length).toLowerCase();
    if (slice === needle) {
      spans.push([e.offset, e.offset + e.length]);
    }
  }

  if (spans.length === 0) {
    const re = new RegExp(`@${botUsername}\\b`, "gi");
    return text.replace(re, "").replace(/\s+/g, " ").trim();
  }

  let out = text;
  for (const [start, end] of spans.sort((a, b) => b[0] - a[0])) {
    out = out.slice(0, start) + out.slice(end);
  }
  return out.replace(/\s+/g, " ").trim();
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
 * @param {number} [botId]
 * @returns {string}
 */
export function extractQuestion(message, botUsername, botId) {
  const raw = String(message.text || message.caption || "").trim();
  const entities = message.entities || message.caption_entities || [];
  return stripBotMentionFromText(raw, entities, botUsername, botId);
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

  const { intent, contextBlock } = await buildS3labsQaContext(text);

  const model = resolveInternalPipelineModel(null);
  const messages = [
    {
      role: "system",
      content: buildS3labsQaSystemPrompt({ contextBlock, intent }),
    },
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

  const replyOpts = {
    replyToMessageId: message.message_id,
    messageThreadId: message.message_thread_id,
  };

  try {
    const allowed = await isAllowedS3labsChat(message.chat.id, message.chat.username);
    if (!allowed) {
      console.warn(
        "[s3labs-telegram-qa] chat not allowed:",
        message.chat.id,
        message.chat.username ?? "(no username)",
      );
      return;
    }

    const bot = await getS3labsBotMeta();
    if (!bot?.username) {
      console.warn("[s3labs-telegram-qa] bot username unknown (getMe failed)");
      return;
    }

    if (!isBotMentionedInMessage(message, bot.username, bot.id)) return;

    const question = extractQuestion(message, bot.username, bot.id);
    if (!question) {
      await sendS3labsTelegramReply(
        "Tag bot lalu tulis pertanyaanmu — contoh: `@s3labs_bot apa itu Claude Fable 5?`",
        replyOpts,
      );
      return;
    }

    if (isUserRateLimited(message.from.id)) {
      await sendS3labsTelegramReply(
        "⏳ Kamu sudah banyak bertanya dalam satu jam. Coba lagi nanti ya.",
        replyOpts,
      );
      return;
    }

    let replyText;
    try {
      replyText = await withS3labsTypingIndicator(replyOpts, () =>
        answerS3labsQuestion(question),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[s3labs-telegram-qa] LLM failed:", msg);
      replyText = "Maaf, ada gangguan sementara. Coba lagi beberapa menit lagi.";
    }

    const sent = await sendS3labsTelegramReply(markdownToTelegramHtml(replyText), {
      ...replyOpts,
      parseMode: "HTML",
      plainTextFallback: replyText,
    });
    if (!sent.ok) {
      console.warn("[s3labs-telegram-qa] failed to send reply");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[s3labs-telegram-qa] handler failed:", msg);
    await sendS3labsTelegramReply(
      "Maaf, ada gangguan sementara. Coba lagi beberapa menit lagi.",
      replyOpts,
    ).catch(() => {});
  }
}
