/**
 * Boot S3Labs Telegram Q&A (webhook registration + optional polling).
 */

import { S3LABS_TELEGRAM_POLLING_ENABLED, S3LABS_TELEGRAM_QA_ENABLED } from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured } from "../s3labsTelegramNotifier.js";
import { registerS3labsTelegramWebhookIfConfigured } from "./s3labsTelegramBotMeta.js";
import { startS3labsTelegramPolling } from "./s3labsTelegramPolling.js";

export async function startS3labsTelegramQa() {
  if (!S3LABS_TELEGRAM_QA_ENABLED || !isS3labsTelegramConfigured()) {
    console.log(
      "[s3labs-telegram-qa] off (QA disabled or missing S3LABS_TELEGRAM_BOT_TOKEN / CHAT_ID)",
    );
    return;
  }

  await registerS3labsTelegramWebhookIfConfigured();

  if (S3LABS_TELEGRAM_POLLING_ENABLED) {
    startS3labsTelegramPolling();
  } else {
    console.log(
      "[s3labs-telegram-qa] on — set S3LABS_TELEGRAM_WEBHOOK_URL (+ secret) or S3LABS_TELEGRAM_POLLING_ENABLED=true for dev",
    );
  }
}
