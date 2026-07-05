/**
 * Telegram wallet portfolio — SPL holdings + SOL (on-chain read, no tool payment).
 */
import { fetchAgentWalletPortfolio } from '../agentWalletPortfolio.js';

const MAX_TOKEN_ROWS = 18;

/**
 * @param {number} n
 * @param {number} [decimals]
 */
function fmtAmount(n, decimals = 4) {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * @param {number | null | undefined} valueUsd
 */
function fmtUsd(valueUsd) {
  if (valueUsd == null || !Number.isFinite(valueUsd)) return null;
  if (valueUsd >= 1_000_000) return `$${fmtAmount(valueUsd / 1_000_000, 2)}M`;
  if (valueUsd >= 1_000) return `$${fmtAmount(valueUsd, 0)}`;
  if (valueUsd >= 1) return `$${fmtAmount(valueUsd, 2)}`;
  return `$${fmtAmount(valueUsd, 4)}`;
}

/**
 * @param {Awaited<ReturnType<typeof fetchAgentWalletPortfolio>>} portfolio
 * @param {(text: string) => string} escapeHtml
 * @returns {string}
 */
export function formatPortfolioTelegramHtml(portfolio, escapeHtml) {
  const tokens = Array.isArray(portfolio.tokens) ? portfolio.tokens : [];
  const lines = [
    '<b>📊 Wallet Portfolio</b>',
    '',
    `<code>${escapeHtml(portfolio.address)}</code>`,
  ];

  if (portfolio.totalValueUsd != null && Number.isFinite(portfolio.totalValueUsd)) {
    lines.push('', `Estimated total: <b>${escapeHtml(fmtUsd(portfolio.totalValueUsd) ?? '—')}</b>`);
  }

  if (tokens.length === 0) {
    lines.push('', '<i>No token holdings found.</i>');
    return lines.join('\n');
  }

  lines.push('', '<b>Holdings</b>');

  const visible = tokens.slice(0, MAX_TOKEN_ROWS);
  for (const row of visible) {
    const symbol = escapeHtml(String(row.symbol || 'TOKEN').trim());
    const amount = fmtAmount(row.amount, row.symbol === 'USDC' ? 2 : 6);
    const usd = fmtUsd(row.valueUsd);
    lines.push(usd ? `• <b>${symbol}</b> — ${amount} (${usd})` : `• <b>${symbol}</b> — ${amount}`);
  }

  const hidden = tokens.length - visible.length;
  if (hidden > 0) {
    lines.push('', `<i>…and ${hidden} more token${hidden === 1 ? '' : 's'}</i>`);
  }

  const unpriced = tokens.filter((t) => t.valueUsd == null && t.priceUsd == null).length;
  if (unpriced > 0) {
    lines.push('', '<i>Some tokens have no USD price yet.</i>');
  }

  return lines.join('\n');
}

/**
 * @param {string} agentAddress
 * @returns {Promise<Awaited<ReturnType<typeof fetchAgentWalletPortfolio>> | null>}
 */
export async function fetchTelegramWalletPortfolio(agentAddress) {
  const address = String(agentAddress || '').trim();
  if (!address) return null;
  try {
    return await fetchAgentWalletPortfolio(address);
  } catch (err) {
    console.warn(
      '[syra-telegram] portfolio fetch failed:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
