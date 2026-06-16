/**
 * S3Labs bot metadata (username for @mention detection, optional webhook registration).
 */

import {
  S3LABS_TELEGRAM_WEBHOOK_SECRET,
  S3LABS_TELEGRAM_WEBHOOK_URL,
} from "../../config/s3labsAgentsConfig.js";
import { getS3labsTelegramConfig } from "../s3labsTelegramNotifier.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {{ id: number; username: string } | null} */
let botMeta = null;

/**
 * @returns {Promise<{ id: number; username: string } | null>}
 */
export async function getS3labsBotMeta() {
  if (botMeta) return botMeta;

  const { token } = getS3labsTelegramConfig();
  if (!token) return null;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data?.result;
  const username = typeof result?.username === "string" ? result.username : "";
  const id = Number(result?.id);
  if (!username || !Number.isFinite(id)) return null;

  botMeta = { id, username };
  return botMeta;
}

/**
 * Telegram only accepts public HTTPS webhook URLs.
 * @param {string} webhookUrl
 * @returns {boolean}
 */
export function isPublicHttpsUrl(webhookUrl) {
  try {
    const parsed = new URL(webhookUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  } catch {
    return false;
  }
}

/**
 * Register Telegram webhook when S3LABS_TELEGRAM_WEBHOOK_URL is set.
 * @returns {Promise<boolean>}
 */
export async function registerS3labsTelegramWebhookIfConfigured() {
  const webhookUrl = S3LABS_TELEGRAM_WEBHOOK_URL.trim();
  if (!webhookUrl) return false;

  if (!isPublicHttpsUrl(webhookUrl)) {
    console.warn(
      "[s3labs-telegram] setWebhook skipped — S3LABS_TELEGRAM_WEBHOOK_URL must be a public HTTPS URL",
      "(got a localhost/non-HTTPS URL). Use S3LABS_TELEGRAM_POLLING_ENABLED=true for local dev.",
    );
    return false;
  }

  const { token } = getS3labsTelegramConfig();
  if (!token) return false;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/setWebhook`;
  const body = {
    url: webhookUrl,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: false,
  };
  if (S3LABS_TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = S3LABS_TELEGRAM_WEBHOOK_SECRET;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[s3labs-telegram] setWebhook failed:", res.status, t.slice(0, 200));
    return false;
  }

  startupVerbose("[s3labs-telegram] webhook registered:", webhookUrl);
  return true;
}

/**
 * @returns {Promise<{ url: string; pending_update_count?: number } | null>}
 */
export async function getS3labsTelegramWebhookInfo() {
  const { token } = getS3labsTelegramConfig();
  if (!token) return null;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/getWebhookInfo`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data?.result;
  if (!result || typeof result !== "object") return null;

  return {
    url: typeof result.url === "string" ? result.url : "",
    pending_update_count:
      typeof result.pending_update_count === "number"
        ? result.pending_update_count
        : undefined,
  };
}

/**
 * True when Telegram already delivers updates elsewhere (production webhook).
 * @returns {Promise<{ blocked: boolean; webhookUrl?: string }>}
 */
export async function getS3labsTelegramPollingBlockReason() {
  const info = await getS3labsTelegramWebhookInfo();
  const webhookUrl = info?.url?.trim() || "";
  if (!webhookUrl) return { blocked: false };

  if (!isPublicHttpsUrl(webhookUrl)) {
    return { blocked: false };
  }

  const configured = S3LABS_TELEGRAM_WEBHOOK_URL.trim();
  if (configured && webhookUrl === configured) {
    return {
      blocked: true,
      webhookUrl,
      reason: "configured_webhook_active",
    };
  }

  return {
    blocked: true,
    webhookUrl,
    reason: "remote_webhook_active",
  };
}

/**
 * Remove any registered webhook (required before getUpdates long-polling).
 * @returns {Promise<boolean>}
 */
export async function deleteS3labsTelegramWebhook() {
  const { token } = getS3labsTelegramConfig();
  if (!token) return false;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/deleteWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drop_pending_updates: false }),
  });

  return res.ok;
}

/** @internal */
export function _resetBotMetaCache() {
  botMeta = null;
}
