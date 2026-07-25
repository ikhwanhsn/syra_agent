/**
 * Human-readable HTML fragments for Syra Daily digest sections.
 * Never stringify raw tool payloads into the user-facing message.
 */
import { escapeTelegramHtml } from '../telegramFormat.js';
import { extractSignalFields } from '../experimentSignalExtract.js';
import { TELEGRAM_CAPTION_MAX_LEN } from '../telegramBot.js';

/**
 * Chart caption + digest HTML for a photo caption (max 1024).
 * @param {string} chartLine
 * @param {string} html
 */
export function buildDigestPhotoCaption(chartLine, html) {
  const header = escapeTelegramHtml(String(chartLine || '').trim());
  const body = String(html || '').trim();
  if (!header) return body.slice(0, TELEGRAM_CAPTION_MAX_LEN);
  if (!body) return header.slice(0, TELEGRAM_CAPTION_MAX_LEN);

  const sep = '\n\n';
  const combined = `${header}${sep}${body}`;
  if (combined.length <= TELEGRAM_CAPTION_MAX_LEN) return combined;

  const budget = TELEGRAM_CAPTION_MAX_LEN - header.length - sep.length - 1;
  if (budget < 80) return header.slice(0, TELEGRAM_CAPTION_MAX_LEN);
  return `${header}${sep}${body.slice(0, budget)}…`;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function asCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Record<string, unknown>} bucket
 * @returns {{ positive: number; negative: number; neutral: number; score: number | null }}
 */
function readSentimentCounts(bucket) {
  if (!bucket || typeof bucket !== 'object') {
    return { positive: 0, negative: 0, neutral: 0, score: null };
  }
  const positive = asCount(bucket.Positive ?? bucket.positive);
  const negative = asCount(bucket.Negative ?? bucket.negative);
  const neutral = asCount(bucket.Neutral ?? bucket.neutral);
  const rawScore = bucket.sentiment_score ?? bucket.Sentiment_Score ?? bucket.score;
  const scoreNum = Number(rawScore);
  const score = Number.isFinite(scoreNum) ? scoreNum : null;
  return { positive, negative, neutral, score };
}

/**
 * @param {{ positive: number; negative: number; neutral: number; score: number | null }} counts
 * @returns {string}
 */
function sentimentLeanLabel(counts) {
  if (counts.score != null) {
    const normalized = Math.abs(counts.score) <= 1 ? counts.score : counts.score / 100;
    if (normalized > 0.15) return 'Positive lean';
    if (normalized < -0.15) return 'Negative lean';
    return 'Neutral';
  }
  if (counts.positive > counts.negative) return 'Positive lean';
  if (counts.negative > counts.positive) return 'Negative lean';
  return 'Neutral';
}

/**
 * Latest row from sentimentAnalysis[] (by date when present).
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
export function pickLatestSentimentRow(data) {
  const rows = Array.isArray(data?.sentimentAnalysis) ? data.sentimentAnalysis : [];
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const da = String(a?.date || '');
    const db = String(b?.date || '');
    return da.localeCompare(db);
  });
  const last = sorted[sorted.length - 1];
  return last && typeof last === 'object' ? /** @type {Record<string, unknown>} */ (last) : null;
}

/**
 * @param {unknown} data
 * @param {string} [ticker]
 * @returns {string | null} HTML bullet line (no section header)
 */
export function formatDigestSentimentHtml(data, ticker = 'BTC') {
  const row = pickLatestSentimentRow(data);
  if (!row) {
    const legacy =
      (typeof data?.sentiment === 'string' && data.sentiment) ||
      (typeof data?.label === 'string' && data.label) ||
      (typeof data?.overall === 'string' && data.overall) ||
      (typeof data?.summary === 'string' && data.summary) ||
      null;
    if (!legacy) return null;
    const label = String(ticker || 'BTC').toUpperCase();
    return `• ${escapeTelegramHtml(label)} pulse: <b>${escapeTelegramHtml(String(legacy).slice(0, 100))}</b>`;
  }

  const bucket =
    (row.ticker && typeof row.ticker === 'object' ? row.ticker : null) ||
    (row.general && typeof row.general === 'object' ? row.general : null) ||
    row;
  const counts = readSentimentCounts(/** @type {Record<string, unknown>} */ (bucket));
  if (counts.positive === 0 && counts.negative === 0 && counts.neutral === 0 && counts.score == null) {
    return null;
  }

  const lean = sentimentLeanLabel(counts);
  const label = String(ticker || 'BTC').toUpperCase();
  const detail = `${counts.positive} pos / ${counts.negative} neg`;
  return `• ${escapeTelegramHtml(label)} pulse: <b>${escapeTelegramHtml(lean)}</b> <i>(${escapeTelegramHtml(detail)})</i>`;
}

/**
 * @param {unknown} data
 * @returns {string[]} HTML bullet lines
 */
export function formatDigestNewsBulletsHtml(data) {
  const items = Array.isArray(data?.news)
    ? data.news
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
  /** @type {string[]} */
  const out = [];
  for (const item of items.slice(0, 2)) {
    const title = String(item?.title || item?.headline || '').trim();
    if (!title) continue;
    out.push(`• ${escapeTelegramHtml(title.slice(0, 140))}`);
  }
  return out;
}

/**
 * @param {unknown} data
 * @returns {string[]} HTML bullet lines
 */
export function formatDigestEventBulletsHtml(data) {
  const rows = Array.isArray(data?.event) ? data.event : [];
  /** @type {string[]} */
  const out = [];
  for (const row of rows) {
    if (out.length >= 2) break;
    const date = String(row?.date || '').trim();
    const buckets = [row?.ticker, row?.general].filter(Array.isArray);
    for (const events of buckets) {
      for (const ev of events) {
        if (out.length >= 2) break;
        const name = String(ev?.event_name || ev?.title || '').trim();
        if (!name) continue;
        const label = date
          ? `• ${escapeTelegramHtml(name.slice(0, 100))} <i>(${escapeTelegramHtml(date)})</i>`
          : `• ${escapeTelegramHtml(name.slice(0, 120))}`;
        out.push(label);
      }
    }
  }
  return out;
}

/**
 * @param {unknown} data
 * @param {string} [tokenLabel]
 * @returns {string | null} HTML bullet line
 */
export function formatDigestSignalHtml(data, tokenLabel = 'BTC') {
  const signal =
    data?.signal && typeof data.signal === 'object'
      ? data.signal
      : data && typeof data === 'object' && data.quickSummary
        ? data
        : null;
  if (!signal) return null;

  const qs = signal.quickSummary;
  if (!qs || typeof qs !== 'object') return null;
  const rawAction = qs.signal ?? qs.action ?? qs.clearSignal;
  if (rawAction == null || String(rawAction).trim() === '') return null;

  const fields = extractSignalFields(/** @type {Record<string, unknown>} */ (signal));
  const action = String(fields.clearSignal || rawAction).toUpperCase();
  if (!action || action === 'UNDEFINED') return null;

  const parts = [action];
  if (fields.rsi != null) parts.push(`RSI ${Math.round(fields.rsi)}`);
  if (fields.confidence) parts.push(String(fields.confidence));

  const label = String(tokenLabel || 'BTC').toUpperCase();
  return `• ${escapeTelegramHtml(label)} signal: <b>${escapeTelegramHtml(parts.join(' · '))}</b>`;
}

/**
 * Build digest body sections from tool payloads.
 * @param {{
 *   newsData?: unknown;
 *   sentimentData?: unknown;
 *   eventData?: unknown;
 *   signalData?: unknown;
 * }} payloads
 * @returns {{
 *   sectionLines: string[];
 *   hasNews: boolean;
 *   hasSentiment: boolean;
 *   hasEvents: boolean;
 *   hasSignal: boolean;
 * }}
 */
export function assembleDigestSections(payloads = {}) {
  /** @type {string[]} */
  const sectionLines = [];
  let hasNews = false;
  let hasSentiment = false;
  let hasEvents = false;
  let hasSignal = false;

  const newsBullets = formatDigestNewsBulletsHtml(payloads.newsData);
  if (newsBullets.length > 0) {
    hasNews = true;
    sectionLines.push('<b>News</b>', ...newsBullets, '');
  }

  const sentimentLine = formatDigestSentimentHtml(payloads.sentimentData, 'BTC');
  if (sentimentLine) {
    hasSentiment = true;
    sectionLines.push('<b>BTC pulse</b>', sentimentLine, '');
  }

  const eventBullets = formatDigestEventBulletsHtml(payloads.eventData);
  if (eventBullets.length > 0) {
    hasEvents = true;
    sectionLines.push('<b>Events</b>', ...eventBullets, '');
  }

  const signalLine = formatDigestSignalHtml(payloads.signalData, 'BTC');
  if (signalLine) {
    hasSignal = true;
    sectionLines.push('<b>BTC signal</b>', signalLine, '');
  }

  while (sectionLines.length > 0 && sectionLines[sectionLines.length - 1] === '') {
    sectionLines.pop();
  }

  return { sectionLines, hasNews, hasSentiment, hasEvents, hasSignal };
}

/**
 * @param {{ hasEvents?: boolean; hasSignal?: boolean }} flags
 */
export function buildDigestReplyMarkup(flags = {}) {
  const hasEvents = Boolean(flags.hasEvents);
  const hasSignal = Boolean(flags.hasSignal);

  /** @type {Array<{ text: string; callback_data: string }>} */
  const row1 = [{ text: 'BTC news', callback_data: 'digest:q:btc_news' }];
  if (hasSignal) {
    row1.push({ text: 'BTC signal', callback_data: 'digest:q:btc_signal' });
  } else {
    row1.push({ text: 'SOL signal', callback_data: 'digest:q:sol_signal' });
  }

  /** @type {Array<{ text: string; callback_data: string }>} */
  const row2 = [];
  if (hasEvents) {
    row2.push({ text: 'Events', callback_data: 'digest:q:events' });
  } else {
    row2.push({ text: 'Smart money today', callback_data: 'digest:q:smart_money' });
  }
  row2.push({ text: 'Ask Syra', callback_data: 'menu:ask' });

  return { inline_keyboard: [row1, row2] };
}
