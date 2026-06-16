/**
 * Long-polling fallback for S3Labs Telegram Q&A (local dev without public webhook URL).
 */

import { S3LABS_TELEGRAM_POLLING_ENABLED, S3LABS_TELEGRAM_QA_ENABLED } from "../../config/s3labsAgentsConfig.js";
import { getS3labsTelegramConfig, isS3labsTelegramConfigured } from "../s3labsTelegramNotifier.js";
import {
  deleteS3labsTelegramWebhook,
  getS3labsTelegramPollingBlockReason,
} from "./s3labsTelegramBotMeta.js";
import { handleS3labsTelegramUpdate } from "./s3labsTelegramQa.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {number} */
let offset = 0;

/** @type {boolean} */
let polling = false;

/** @type {number} */
let conflictFailures = 0;

/** @type {number} */
let lastConflictLogAt = 0;

const MAX_CONFLICT_FAILURES = 3;
const CONFLICT_LOG_INTERVAL_MS = 60_000;

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    if (res.status === 409) {
      conflictFailures += 1;
      const now = Date.now();
      if (now - lastConflictLogAt >= CONFLICT_LOG_INTERVAL_MS) {
        lastConflictLogAt = now;
        console.warn(
          "[s3labs-telegram-poll] getUpdates conflict (409) — another instance or webhook is already receiving updates for this bot token",
        );
      }

      if (conflictFailures >= MAX_CONFLICT_FAILURES) {
        console.warn(
          "[s3labs-telegram-poll] stopping local polling after repeated conflicts.",
          "Set S3LABS_TELEGRAM_POLLING_ENABLED=false locally when production handles the bot,",
          "or use a separate dev bot token.",
        );
        stopS3labsTelegramPolling();
      }

      await sleep(Math.min(30_000, 1_000 * conflictFailures));
      return;
    }

    console.warn("[s3labs-telegram-poll] getUpdates failed:", res.status);
    return;
  }

  conflictFailures = 0;

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

  const block = await getS3labsTelegramPollingBlockReason();
  if (block.blocked) {
    console.warn(
      "[s3labs-telegram-poll] skipping local polling — webhook already active at",
      block.webhookUrl,
      block.reason === "configured_webhook_active"
        ? "(use webhook mode; set S3LABS_TELEGRAM_POLLING_ENABLED=false)"
        : "(production owns this bot; disable local polling or use a dev bot token)",
    );
    return;
  }

  // Safe to take over: no remote webhook registered.
  await deleteS3labsTelegramWebhook().catch(() => {});

  polling = true;
  conflictFailures = 0;
  startupVerbose("[s3labs-telegram] long-polling enabled (dev)");

  const loop = async () => {
    while (polling) {
      try {
        await pollOnce();
      } catch (e) {
        console.warn(
          "[s3labs-telegram-poll]",
          e instanceof Error ? e.message : e,
        );
        await sleep(3_000);
      }
    }
  };

  void loop();
}

export function stopS3labsTelegramPolling() {
  polling = false;
}
