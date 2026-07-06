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

/** Tools that can skip LLM synthesis when direct format succeeds. */
export const TELEGRAM_DIRECT_FORMAT_TOOLS = new Set(['news']);
