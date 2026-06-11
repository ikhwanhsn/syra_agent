/**
 * Long-polling fallback for S3Labs Telegram Q&A (local dev without public webhook URL).
 */

import { S3LABS_TELEGRAM_POLLING_ENABLED, S3LABS_TELEGRAM_QA_ENABLED } from "../../config/s3labsAgentsConfig.js";
import { getS3labsTelegramConfig, isS3labsTelegramConfigured } from "../s3labsTelegramNotifier.js";
import { deleteS3labsTelegramWebhook } from "./s3labsTelegramBotMeta.js";
import { handleS3labsTelegramUpdate } from "./s3labsTelegramQa.js";

/** @type {number} */
let offset = 0;

/** @type {boolean} */
let polling = false;

/**
 * @returns {Promise<void>}
 */
async function pollOnce() {
  const { token } = getS3labsTelegramConfig();
  if (!token) return;

  const url = new URL(`https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("timeout", "25");
  url.searchParams.set("allowed_updates", JSON.stringify(["message", "edited_message"]));

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn("[s3labs-telegram-poll] getUpdates failed:", res.status);
    return;
  }

  const data = await res.json();
  const updates = Array.isArray(data?.result) ? data.result : [];

  for (const update of updates) {
    if (typeof update?.update_id === "number") {
      offset = update.update_id + 1;
    }
    await handleS3labsTelegramUpdate(update);
  }
}

/**
 * Start long-polling loop when enabled.
 * @param {{ force?: boolean }} [options] force bypasses the env flag (bootstrap fallback)
 */
export async function startS3labsTelegramPolling(options = {}) {
  if (!S3LABS_TELEGRAM_QA_ENABLED) return;
  if (!S3LABS_TELEGRAM_POLLING_ENABLED && !options.force) return;
  if (!isS3labsTelegramConfigured()) return;
  if (polling) return;

  // getUpdates conflicts (409) with a registered webhook — clear it first.
  await deleteS3labsTelegramWebhook().catch(() => {});

  polling = true;
  console.log("[s3labs-telegram] long-polling enabled (dev)");

  const loop = async () => {
    while (polling) {
      try {
        await pollOnce();
      } catch (e) {
        console.warn(
          "[s3labs-telegram-poll]",
          e instanceof Error ? e.message : e,
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  };

  void loop();
}

export function stopS3labsTelegramPolling() {
  polling = false;
}
