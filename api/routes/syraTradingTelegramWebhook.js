/**
 * Syra Trading Telegram webhook — /spcx command for SpaceX IPO agent.
 * Env: SYRA_TRADING_TELEGRAM_BOT_TOKEN, SYRA_TRADING_TELEGRAM_WEBHOOK_SECRET (optional)
 */
import express from "express";
import { sendTelegramMessage } from "../libs/telegramBot.js";
import {
  tickSpcxAgent,
  formatSpcxTelegramMessage,
} from "../libs/spcxAgentService.js";

const BOT_TOKEN = (process.env.SYRA_TRADING_TELEGRAM_BOT_TOKEN || "").trim();
const WEBHOOK_SECRET = (process.env.SYRA_TRADING_TELEGRAM_WEBHOOK_SECRET || "").trim();

/**
 * @returns {boolean}
 */
export function isSyraTradingTelegramConfigured() {
  return Boolean(BOT_TOKEN);
}

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isWebhookAuthorized(req) {
  if (!WEBHOOK_SECRET) {
    return process.env.NODE_ENV !== "production";
  }
  const header = (req.get("x-telegram-bot-api-secret-token") || "").trim();
  if (header === WEBHOOK_SECRET) return true;
  const pathSecret = typeof req.params?.secret === "string" ? req.params.secret.trim() : "";
  return pathSecret === WEBHOOK_SECRET;
}

/**
 * Handle /spcx and /start commands.
 * @param {object} update - Telegram update object
 */
export async function handleSyraTradingTelegramUpdate(update) {
  const message = update?.message;
  if (!message?.text || !BOT_TOKEN) return;

  const text = String(message.text).trim();
  const chatId = message.chat?.id;
  if (!chatId) return;

  const lower = text.toLowerCase();

  if (lower.startsWith("/start")) {
    await sendTelegramMessage(BOT_TOKEN, chatId, {
      text:
        "🚀 *Syra Trading Bot*\n\n" +
        "Commands:\n" +
        "/spcx — Live SpaceX IPO spread intel (Nasdaq vs on-chain SPCX)\n" +
        "/signal <token> — Trading signal (via Syra API)\n\n" +
        "🔗 agent.syraa.fun/spcx",
      parseMode: "Markdown",
    });
    return;
  }

  if (lower.startsWith("/spcx") || lower.includes("$spcx") || lower.includes("spacex ipo")) {
    try {
      const report = await tickSpcxAgent({ force: true });
      const body = formatSpcxTelegramMessage(report);
      await sendTelegramMessage(BOT_TOKEN, chatId, {
        text: body,
        parseMode: "Markdown",
        disableWebPagePreview: true,
      });
    } catch (e) {
      await sendTelegramMessage(BOT_TOKEN, chatId, {
        text: `SPCX intel temporarily unavailable: ${e instanceof Error ? e.message : "error"}`,
      });
    }
    return;
  }
}

export function createSyraTradingTelegramWebhookRouter() {
  const router = express.Router();

  const handleWebhook = async (req, res) => {
    if (!isSyraTradingTelegramConfigured()) {
      return res.status(503).json({ ok: false, error: "syra_trading_telegram_disabled" });
    }
    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const update = req.body;
    if (!update || typeof update !== "object") {
      return res.status(400).json({ ok: false, error: "invalid_update" });
    }

    res.status(200).json({ ok: true });

    handleSyraTradingTelegramUpdate(update).catch((e) => {
      console.error(
        "[syra-trading-telegram]",
        e instanceof Error ? e.message : e,
      );
    });
  };

  router.post("/syra-trading-telegram/webhook", handleWebhook);
  router.post("/syra-trading-telegram/webhook/:secret", handleWebhook);

  return router;
}
