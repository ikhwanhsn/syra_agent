/**
 * Map canonical asset identifiers to news ticker + signal token (CoinGecko id).
 */
import { resolveTickerFromCoingecko } from '../utils/coingeckoAPI.js';
import { keywordsForAsset } from '../config/internalNewsConfig.js';

/** @type {Record<string, string>} */
const ASSET_ID_SIGNAL_ALIASES = {
  btc: 'bitcoin',
  bitcoin: 'bitcoin',
  eth: 'ethereum',
  ethereum: 'ethereum',
  sol: 'solana',
  solana: 'solana',
  xrp: 'ripple',
  ripple: 'ripple',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  dogecoin: 'dogecoin',
  ada: 'cardano',
  cardano: 'cardano',
  avax: 'avalanche-2',
  dot: 'polkadot',
  link: 'chainlink',
  matic: 'polygon',
  polygon: 'matic-network',
  usd: 'usd-coin',
  usdc: 'usd-coin',
  usdt: 'tether',
};

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {{ assetId?: string; symbol?: string; ref?: string; name?: string }} input
 * @returns {Promise<{
 *   assetId: string;
 *   ticker: string;
 *   signalToken: string | null;
 *   keywordQuery: { primary: string[]; all: string[] };
 * }>}
 */
export async function resolveAssetIntelligenceKeys(input) {
  const assetId = trim(input.assetId);
  const symbol = trim(input.symbol);
  const ref = trim(input.ref);
  const name = trim(input.name);

  /** @type {string[]} */
  const candidates = [];
  for (const c of [symbol, ref, assetId, name]) {
    const t = trim(c);
    if (t && !candidates.includes(t)) candidates.push(t);
  }

  let coin = null;
  for (const candidate of candidates) {
    try {
      coin = await resolveTickerFromCoingecko(candidate);
      if (coin) break;
    } catch {
      /* try next candidate */
    }
  }

  const ticker = coin ? coin.symbol.toUpperCase() : symbol.toUpperCase() || 'general';
  const aliasKey = (assetId || ref || symbol || '').toLowerCase();
  const signalToken = coin?.id ?? ASSET_ID_SIGNAL_ALIASES[aliasKey] ?? null;

  const keywordQuery = keywordsForAsset({
    ticker: ticker !== 'GENERAL' ? ticker : symbol || assetId,
    name: name || undefined,
    coinName: coin?.name || undefined,
    assetId: assetId || undefined,
  });

  return {
    assetId: assetId || coin?.id || ref || symbol || 'unknown',
    ticker: ticker !== 'GENERAL' ? ticker : 'general',
    signalToken,
    keywordQuery,
  };
}
