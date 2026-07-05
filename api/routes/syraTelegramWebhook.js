/**
 * Syra Telegram AI bot webhook.
 * Env: SYRA_TELEGRAM_BOT_TOKEN, SYRA_TELEGRAM_WEBHOOK_SECRET (optional)
 */
import express from 'express';
import { getSyraTelegramWebhookSecret } from '../config/syraTelegramBotConfig.js';
import { handleSyraTelegramUpdate, isSyraTelegramBotReady } from '../libs/syraTelegramBot/handler.js';

function getWebhookSecret() {
  return getSyraTelegramWebhookSecret();
}

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isWebhookAuthorized(req) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    return process.env.NODE_ENV !== 'production';
  }
  const header = (req.get('x-telegram-bot-api-secret-token') || '').trim();
  if (header === webhookSecret) return true;
  const pathSecret = typeof req.params?.secret === 'string' ? req.params.secret.trim() : '';
  return pathSecret === webhookSecret;
}

export function createSyraTelegramWebhookRouter() {
  const router = express.Router();

  const handleWebhook = async (req, res) => {
    if (!isSyraTelegramBotReady()) {
      return res.status(503).json({ ok: false, error: 'syra_telegram_bot_disabled' });
    }
    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const update = req.body;
    if (!update || typeof update !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid_update' });
    }

    res.status(200).json({ ok: true });

    handleSyraTelegramUpdate(update).catch((e) => {
      console.error('[syra-telegram]', e instanceof Error ? e.message : e);
    });
  };

  router.post('/syra-telegram/webhook', handleWebhook);
  router.post('/syra-telegram/webhook/:secret', handleWebhook);

  return router;
}
