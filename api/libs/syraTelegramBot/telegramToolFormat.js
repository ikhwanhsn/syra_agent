/**
 * Direct Telegram formatting for tool results — skip slow LLM synthesis when possible.
 */

/**
 * @param {unknown} data
 * @param {string} [ticker]
 * @returns {string | null}
 */
export function formatNewsTelegram(data, ticker = 'general') {
  const articles = Array.isArray(data?.news) ? data.news : [];
  if (articles.length === 0) return null;

  const label =
    ticker && String(ticker).toLowerCase() !== 'general'
      ? String(ticker).toUpperCase()
      : 'Crypto';
  const lines = [`📰 **${label} news**`, ''];

  for (const a of articles.slice(0, 8)) {
    const title = String(a?.title || '').trim();
    if (!title) continue;
    const source = String(a?.source_name || a?.source || '').trim();
    const date = String(a?.date || a?.published_at || '').trim().slice(0, 10);
    const url = String(a?.news_url || a?.url || '').trim();
    const meta = [source, date].filter(Boolean).join(' · ');
    if (meta) {
      lines.push(`• **${title}**`);
      lines.push(`  _${meta}_`);
    } else {
      lines.push(`• **${title}**`);
    }
    if (url.startsWith('http')) {
      lines.push(`  [Read](${url})`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * @param {unknown} data
 * @param {string} [ticker]
 * @returns {string | null}
 */
export function formatEventTelegram(data, ticker = 'general') {
  const rows = Array.isArray(data?.event) ? data.event : [];
  if (rows.length === 0) return null;

  const label =
    ticker && String(ticker).toLowerCase() !== 'general'
      ? String(ticker).toUpperCase()
      : 'Crypto';
  const lines = [`📅 **${label} events**`, ''];

  for (const row of rows.slice(0, 5)) {
    const date = String(row?.date || '').trim();
    const buckets = [row?.ticker, row?.general].filter(Array.isArray);
    for (const events of buckets) {
      for (const ev of events.slice(0, 6)) {
        const name = String(ev?.event_name || ev?.title || '').trim();
        if (!name) continue;
        const text = String(ev?.event_text || ev?.text || '').trim();
        if (date) lines.push(`• **${name}** _(${date})_`);
        else lines.push(`• **${name}**`);
        if (text && text !== name) {
          lines.push(`  ${text.slice(0, 220)}${text.length > 220 ? '…' : ''}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n').trim().length > 20 ? lines.join('\n').trim() : null;
}

/**
 * @param {unknown} data
 * @returns {string | null}
 */
export function formatSundownDigestTelegram(data) {
  const items = Array.isArray(data?.sundownDigest) ? data.sundownDigest : [];
  if (items.length === 0) return null;

  const lines = ['🌅 **Sundown digest**', ''];
  for (const item of items.slice(0, 6)) {
    const title = String(item?.title || '').trim();
    if (!title) continue;
    const body = String(item?.body || item?.text || '').trim();
    const tickers = Array.isArray(item?.tickers)
      ? item.tickers.map((t) => String(t).toUpperCase()).filter(Boolean).slice(0, 4)
      : [];
    const meta = tickers.length ? tickers.join(', ') : '';
    lines.push(`• **${title}**`);
    if (meta) lines.push(`  _${meta}_`);
    if (body && body !== title) {
      lines.push(`  ${body.slice(0, 280)}${body.length > 280 ? '…' : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * @param {unknown} data
 * @param {string} [ticker]
 * @returns {string | null}
 */
export function formatTrendingHeadlineTelegram(data, ticker = 'general') {
  const headlines = Array.isArray(data?.trendingHeadline) ? data.trendingHeadline : [];
  if (headlines.length === 0) return null;

  const label =
    ticker && String(ticker).toLowerCase() !== 'general'
      ? String(ticker).toUpperCase()
      : 'Crypto';
  const lines = [`🔥 **${label} trending headlines**`, ''];

  for (const h of headlines.slice(0, 8)) {
    const title = String(h?.headline || h?.title || '').trim();
    if (!title) continue;
    const source = String(h?.source_name || h?.source || '').trim();
    const date = String(h?.date || '').trim().slice(0, 10);
    const url = String(h?.news_url || h?.url || '').trim();
    const meta = [source, date].filter(Boolean).join(' · ');
    lines.push(`• **${title}**`);
    if (meta) lines.push(`  _${meta}_`);
    if (url.startsWith('http')) lines.push(`  [Read](${url})`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * @param {string} toolId
 * @param {unknown} data
 * @param {Record<string, string>} [params]
 * @returns {string | null}
 */
export function formatTelegramToolDirect(toolId, data, params = {}) {
  const ticker = params.ticker || params.token || 'general';
  switch (toolId) {
    case 'news':
      return formatNewsTelegram(data, ticker);
    case 'stablecrypto-coingecko-price':
      return formatPriceTelegram(data, params.ids || params.id);
    case 'event':
      return formatEventTelegram(data, ticker);
    case 'sundown-digest':
      return formatSundownDigestTelegram(data);
    case 'trending-headline':
      return formatTrendingHeadlineTelegram(data, ticker);
    default:
      return null;
  }
}

const COIN_LABELS = Object.freeze({
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
});

/**
 * @param {unknown} data
 * @param {string} [idsHint]
 * @returns {string | null}
 */
export function formatPriceTelegram(data, idsHint = '') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const rows = Object.entries(/** @type {Record<string, unknown>} */ (data)).filter(
    ([key, value]) => key !== 'success' && value && typeof value === 'object' && !Array.isArray(value),
  );
  if (rows.length === 0) return null;

  const lines = ['💰 **Live prices**', ''];
  for (const [id, prices] of rows.slice(0, 6)) {
    const quote = /** @type {Record<string, unknown>} */ (prices);
    const usd = quote.usd ?? quote.USD;
    const amount = Number(usd);
    if (!Number.isFinite(amount)) continue;
    const label = COIN_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1);
    const formatted = amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: amount >= 1 ? 2 : 6,
    });
    lines.push(`• **${label}**: ${formatted}`);
  }

  if (lines.length <= 2 && idsHint) {
    return null;
  }
  return lines.length > 2 ? lines.join('\n').trim() : null;
}

/** Tools that can skip LLM synthesis when direct format succeeds. */
export const TELEGRAM_DIRECT_FORMAT_TOOLS = new Set([
  'news',
  'stablecrypto-coingecko-price',
  'event',
  'sundown-digest',
  'trending-headline',
]);
