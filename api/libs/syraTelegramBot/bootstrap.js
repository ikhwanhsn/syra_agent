/**
 * Boot Syra Telegram AI bot (webhook registration + optional polling).
 *
 * Product policy: secondary consumer surface — maintenance only until settlement
 * + weekly unique payers ungate. See docs/TELEGRAM_MAINTENANCE_POLICY.md.
 * Do not add acquisition / viral features here without Product sign-off.
 */
import {
  isSyraTelegramBotEnabled,
  isSyraTelegramBotConfigured,
  isSyraTelegramPollingEnabled,
  getSyraTelegramWebhookUrl,
} from '../../config/syraTelegramBotConfig.js';
import {
  registerSyraTelegramWebhookIfConfigured,
  registerSyraTelegramCommands,
  deleteSyraTelegramWebhook,
  isPublicHttpsUrl,
} from './syraTelegramBotMeta.js';
import { startSyraTelegramPolling } from './syraTelegramPolling.js';
import { startupInfo, startupWarn } from '../../utils/startupLog.js';
import { resolveAgentBaseUrlCandidates } from '../../routes/agent/utils.js';
import { getDefaultCustodyMode, isPrivyConfigured } from '../../services/privyServerWallet.js';

export async function startSyraTelegramBot() {
  if (!isSyraTelegramBotEnabled()) {
    startupInfo('[syra-telegram] disabled (SYRA_TELEGRAM_BOT_ENABLED=false)');
    return;
  }

  if (!isSyraTelegramBotConfigured()) {
    startupWarn('[syra-telegram] not started — missing SYRA_TELEGRAM_BOT_TOKEN in api/.env');
    return;
  }

  const selfCallBases = resolveAgentBaseUrlCandidates();
  startupInfo('[syra-telegram] x402 self-call bases:', selfCallBases.join(' → '));

  const custody = getDefaultCustodyMode();
  if (custody === 'privy' && !isPrivyConfigured()) {
    startupWarn(
      '[syra-telegram] PRIVY_APP_ID / PRIVY_APP_SECRET missing — Telegram Privy wallets cannot sign x402 payments',
    );
  }

  await registerSyraTelegramCommands().catch((e) => {
    startupWarn('[syra-telegram] setMyCommands failed:', e instanceof Error ? e.message : e);
  });

  const webhookUrl = getSyraTelegramWebhookUrl();
  const useWebhook = Boolean(webhookUrl && isPublicHttpsUrl(webhookUrl));

  if (useWebhook) {
    const webhookRegistered = await registerSyraTelegramWebhookIfConfigured();
    if (webhookRegistered) {
      startupInfo('[syra-telegram] webhook mode —', webhookUrl);
      return;
    }
    startupWarn('[syra-telegram] webhook registration failed — falling back to polling');
  }

  const shouldPoll =
    isSyraTelegramPollingEnabled() ||
    !useWebhook ||
    process.env.NODE_ENV !== 'production';

  if (!shouldPoll) {
    startupWarn(
      '[syra-telegram] not receiving messages — set SYRA_TELEGRAM_WEBHOOK_URL or SYRA_TELEGRAM_POLLING_ENABLED=true',
    );
    return;
  }

  await deleteSyraTelegramWebhook().catch(() => {});
  await startSyraTelegramPolling({ force: true });
  startupInfo('[syra-telegram] long-polling active — send /start to your bot in Telegram');
}
