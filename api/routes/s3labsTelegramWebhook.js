/**
 * S3Labs Telegram webhook — @mention Q&A restricted to the configured group.
 */

import express from "express";
import {
  S3LABS_TELEGRAM_QA_ENABLED,
  S3LABS_TELEGRAM_WEBHOOK_SECRET,
} from "../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured } from "../libs/s3labsTelegramNotifier.js";
import { handleS3labsTelegramUpdate } from "../libs/s3labs/s3labsTelegramQa.js";

/**
 * @param {import("express").Request} req
 * @returns {boolean}
 */
function isWebhookAuthorized(req) {
  const secret = S3LABS_TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const header = (req.get("x-telegram-bot-api-secret-token") || "").trim();
  if (header === secret) return true;

  const pathSecret = typeof req.params?.secret === "string" ? req.params.secret.trim() : "";
  return pathSecret === secret;
}

export function createS3labsTelegramWebhookRouter() {
  const router = express.Router();

  const handleWebhook = async (req, res) => {
    if (!S3LABS_TELEGRAM_QA_ENABLED || !isS3labsTelegramConfigured()) {
      return res.status(503).json({ ok: false, error: "s3labs_telegram_qa_disabled" });
    }
    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const update = req.body;
    if (!update || typeof update !== "object") {
      return res.status(400).json({ ok: false, error: "invalid_update" });
    }

    res.status(200).json({ ok: true });

    handleS3labsTelegramUpdate(update).catch((e) => {
      console.error(
        "[s3labs-telegram-webhook]",
        e instanceof Error ? e.message : e,
      );
    });
  };

  router.post("/s3labs-telegram/webhook", handleWebhook);
  router.post("/s3labs-telegram/webhook/:secret", handleWebhook);

  return router;
}
