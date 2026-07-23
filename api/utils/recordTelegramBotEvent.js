import TelegramBotEvent from '../models/agent/TelegramBotEvent.js';

/**
 * Record a Telegram bot funnel event (fire-and-forget; never throws to callers).
 * @param {string} event
 * @param {{ telegramUserId?: number | null; anonymousId?: string | null; props?: Record<string, unknown> }} [meta]
 */
export async function recordTelegramBotEvent(event, meta = {}) {
  const name = String(event || '').trim();
  if (!name) return;
  try {
    const dayUtc = new Date().toISOString().slice(0, 10);
    await TelegramBotEvent.create({
      event: name,
      telegramUserId:
        meta.telegramUserId != null && Number.isFinite(Number(meta.telegramUserId))
          ? Math.trunc(Number(meta.telegramUserId))
          : null,
      anonymousId: meta.anonymousId ? String(meta.anonymousId).trim() : null,
      props: meta.props && typeof meta.props === 'object' ? meta.props : {},
      dayUtc,
    });
  } catch (e) {
    console.warn(
      '[telegram-bot-event] record failed:',
      e instanceof Error ? e.message : String(e),
    );
  }
}
