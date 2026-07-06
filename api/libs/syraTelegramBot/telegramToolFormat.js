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
export const TELEGRAM_DIRECT_FORMAT_TOOLS = new Set(['news', 'stablecrypto-coingecko-price']);
