/**
 * Boot S3Labs Telegram Q&A (webhook registration + optional polling).
 */

import { S3LABS_TELEGRAM_POLLING_ENABLED, S3LABS_TELEGRAM_QA_ENABLED } from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured } from "../s3labsTelegramNotifier.js";
import { registerS3labsTelegramWebhookIfConfigured, getS3labsTelegramPollingBlockReason } from "./s3labsTelegramBotMeta.js";
import { startS3labsTelegramPolling } from "./s3labsTelegramPolling.js";
import { startupVerbose } from "../../utils/startupLog.js";

export async function startS3labsTelegramQa() {
  if (!S3LABS_TELEGRAM_QA_ENABLED || !isS3labsTelegramConfigured()) {
    startupVerbose(
      "[s3labs-telegram-qa] off (QA disabled or missing S3LABS_TELEGRAM_BOT_TOKEN / CHAT_ID)",
    );
    return;
  }

  const webhookRegistered = await registerS3labsTelegramWebhookIfConfigured();

  if (S3LABS_TELEGRAM_POLLING_ENABLED) {
    await startS3labsTelegramPolling();
    return;
  }

  if (webhookRegistered) {
    startupVerbose("[s3labs-telegram-qa] on — webhook mode");
    return;
  }

  // Without a registered webhook the bot would silently receive nothing —
  // fall back to long-polling in dev unless polling was explicitly disabled.
  const pollingExplicitlyDisabled =
    typeof process.env.S3LABS_TELEGRAM_POLLING_ENABLED === "string" &&
    process.env.S3LABS_TELEGRAM_POLLING_ENABLED.trim().toLowerCase() === "false";

  if (process.env.NODE_ENV !== "production" && !pollingExplicitlyDisabled) {
    const block = await getS3labsTelegramPollingBlockReason();
    if (block.blocked) {
      startupVerbose(
        "[s3labs-telegram-qa] on — remote webhook active at",
        block.webhookUrl,
        "(local polling skipped)",
      );
      return;
    }

    console.warn(
      "[s3labs-telegram-qa] webhook not registered — falling back to long-polling (dev)",
    );
    await startS3labsTelegramPolling({ force: true });
    return;
  }

  if (process.env.NODE_ENV !== "production" && pollingExplicitlyDisabled) {
    startupVerbose(
      "[s3labs-telegram-qa] local polling disabled — production or webhook handles Telegram Q&A",
    );
    return;
  }

  console.warn(
    "[s3labs-telegram-qa] webhook not registered and polling disabled — bot will NOT receive messages.",
    "Set a public HTTPS S3LABS_TELEGRAM_WEBHOOK_URL (+ secret) or S3LABS_TELEGRAM_POLLING_ENABLED=true.",
  );
}
