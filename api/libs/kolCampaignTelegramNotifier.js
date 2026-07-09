/**
 * Post new KOL campaign alerts to the S3Labs Telegram group via @s3labs bot.
 *
 * Env: S3LABS_TELEGRAM_BOT_TOKEN, S3LABS_TELEGRAM_CHAT_ID
 * Optional: S3LABS_KOL_TELEGRAM_THREAD_ID — forum topic id (omit for main chat)
 */
import { S3LABS_SITE_URL } from "../config/emailConfig.js";
import {
  getS3labsTelegramConfig,
  isS3labsTelegramConfigured,
} from "./s3labsTelegramNotifier.js";
import {
  normalizeTelegramForumThreadId,
  sendTelegramMessage,
} from "./telegramBot.js";

/**
 * @returns {number | undefined}
 */
function getKolCampaignThreadId() {
  const raw = String(process.env.S3LABS_KOL_TELEGRAM_THREAD_ID || "").trim();
  if (!raw) return undefined;
  const id = Number.parseInt(raw, 10);
  return normalizeTelegramForumThreadId(Number.isFinite(id) ? id : undefined);
}

/**
 * @param {string | null | undefined} iso
 * @returns {string}
 */
function formatEndDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

/**
 * @param {Record<string, unknown>} campaign Serialized campaign
 * @returns {string}
 */
export function formatKolCampaignTelegramMessage(campaign) {
  const title = String(campaign.title || "New KOL campaign");
  const description = String(campaign.description || "").trim();
  const kolPoolSol = Number(
    campaign.kolRewardPoolSol ?? campaign.rewardSol ?? 0,
  );
  const durationDays = campaign.durationDays ?? null;
  const handle = campaign.sourceAuthorHandle
    ? `@${String(campaign.sourceAuthorHandle).replace(/^@/, "")}`
    : null;
  const campaignId = String(campaign.id || "");
  const campaignUrl = `${S3LABS_SITE_URL}/kol?campaign=${encodeURIComponent(campaignId)}`;
  const threadId = getKolCampaignThreadId();

  const lines = [
    "🎯 New KOL Campaign · S3Labs",
    "",
    title,
  ];

  if (description) {
    lines.push("", description);
  }

  lines.push(
    "",
    `💰 KOL reward pool: ${kolPoolSol.toFixed(2)} SOL`,
  );

  if (durationDays != null) {
    lines.push(
      `📅 Duration: ${durationDays} day${durationDays === 1 ? "" : "s"}`,
    );
  }

  if (campaign.endAt) {
    lines.push(`⏱ Ends: ${formatEndDate(String(campaign.endAt))}`);
  }

  if (handle) {
    lines.push(`👤 Project: ${handle}`);
  }

  lines.push(
    "",
    "Reply or quote the source post on X — we auto-detect engagement and pay your share when the campaign ends.",
    "",
    `🔗 ${campaignUrl}`,
    "",
    threadId
      ? `— KOL · t.me/s3labs/${threadId}`
      : "— KOL · t.me/s3labs",
  );

  return lines.join("\n").trim();
}

/**
 * @param {Record<string, unknown>} campaign Serialized campaign
 * @param {{ test?: boolean }} [opts]
 * @returns {Promise<{ sent: boolean; reason?: string }>}
 */
export async function notifyNewCampaignTelegram(campaign, opts = {}) {
  if (!isS3labsTelegramConfigured()) {
    console.warn(
      "[kol-telegram] Skipped campaign notify — S3LABS_TELEGRAM_BOT_TOKEN or S3LABS_TELEGRAM_CHAT_ID not set",
    );
    return { sent: false, reason: "telegram_not_configured" };
  }

  const { token, chatId } = getS3labsTelegramConfig();
  const text = formatKolCampaignTelegramMessage(campaign);
  const prefix = opts.test ? "[TEST] " : "";

  const result = await sendTelegramMessage({
    token,
    chatId,
    text: prefix + text,
    disableWebPagePreview: false,
    messageThreadId: getKolCampaignThreadId(),
  });

  if (!result.ok) {
    console.warn(
      `[kol-telegram] Campaign notify failed campaign=${campaign.id}:`,
      result.error ?? "unknown",
    );
    return { sent: false, reason: result.error ?? "send_failed" };
  }

  console.log(
    `[kol-telegram] Campaign notify sent campaign=${campaign.id} messageId=${result.messageId ?? "?"}`,
  );

  return { sent: true, messageId: result.messageId };
}

/**
 * Send a test KOL campaign Telegram alert.
 * @returns {Promise<{ sent: boolean; reason?: string }>}
 */
export async function sendTestKolCampaignTelegram() {
  const mockCampaign = {
    id: "test-kol-campaign",
    title: "Test KOL Campaign — S3Labs Alert",
    description:
      "This is a test post to confirm KOL campaign Telegram notifications are working.",
    rewardSol: 0.015,
    kolRewardPoolSol: 0.01,
    durationDays: 7,
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    sourceAuthorHandle: "s3labs_",
  };

  return notifyNewCampaignTelegram(mockCampaign, { test: true });
}
