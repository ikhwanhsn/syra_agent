import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';
import { fetchWithRetry } from '../utils/resilientFetch.js';
import { SYRA_TOKEN_MINT } from './syraToken.js';
import { runTokensAgentTool } from './tokensAgentService.js';
import {
  fetchJupiterTokenMetaBatch,
  fetchOnchainMetaplexMetaBatch,
} from './solanaTokenMetadata.js';

const LAMPORTS_PER_SOL = 1e9;
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DEXSCREENER_TOKENS_URL = 'https://api.dexscreener.com/latest/dex/tokens';
const PUMP_FUN_API = (process.env.PUMP_FUN_FRONTEND_API_URL || 'https://frontend-api-v3.pump.fun').replace(
  /\/$/,
  '',
);
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
const COINGECKO_SOL_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

/** @type {Record<string, { symbol: string; name: string; decimals: number; priceUsd?: number; imageUrl?: string }>} */
const KNOWN_TOKENS = {
  [WRAPPED_SOL_MINT]: { symbol: 'SOL', name: 'Solana', decimals: 9 },
  [USDC_MINT]: { symbol: 'USDC', name: 'USD Coin', decimals: 6, priceUsd: 1 },
  [SYRA_TOKEN_MINT]: { symbol: 'SYRA', name: 'Syra', decimals: 9 },
};

/**
 * @typedef {{ symbol: string; name: string; priceUsd: number | null; imageUrl: string | null }} TokenMeta
 */

/**
 * @param {import('@solana/web3.js').ParsedAccountData['parsed']} parsed
 */
function readParsedTokenRow(parsed) {
  const info = parsed?.info;
  const tokenAmount = info?.tokenAmount;
  if (!info?.mint || !tokenAmount) return null;

  const amount = readTokenUiAmount(tokenAmount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const mint = String(info.mint);
  const known = KNOWN_TOKENS[mint];
  const decimals =
    known?.decimals ??
    (Number.isFinite(tokenAmount.decimals) ? Number(tokenAmount.decimals) : 0);

  return {
    mint,
    symbol: known?.symbol ?? shortenMint(mint),
    name: known?.name ?? `Token ${shortenMint(mint)}`,
    decimals,
    amount,
    priceUsd: known?.priceUsd ?? null,
    valueUsd: known?.priceUsd != null ? amount * known.priceUsd : null,
    imageUrl: known?.imageUrl ?? null,
  };
}

/**
 * @param {{ uiAmount?: number | null; uiAmountString?: string }} tokenAmount
 */
function readTokenUiAmount(tokenAmount) {
  if (tokenAmount?.uiAmount != null && Number.isFinite(tokenAmount.uiAmount)) {
    return tokenAmount.uiAmount;
  }
  const parsed = Number.parseFloat(tokenAmount?.uiAmountString ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortenMint(mint) {
  if (mint.length <= 10) return mint;
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {PublicKey} owner
 */
async function fetchSplTokenRows(connection, owner) {
  const [legacy, token2022] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
  ]);

  /** @type {Map<string, ReturnType<typeof readParsedTokenRow>>} */
  const byMint = new Map();

  for (const acc of [...(legacy?.value ?? []), ...(token2022?.value ?? [])]) {
    const parsed = acc?.account?.data?.parsed;
    const row = readParsedTokenRow(parsed);
    if (!row) continue;
    const existing = byMint.get(row.mint);
    if (existing) {
      existing.amount += row.amount;
    } else {
      byMint.set(row.mint, row);
    }
  }

  return [...byMint.values()];
}

/**
 * @param {unknown} pair
 * @param {string} mint
 */
function pairTokenUsdPrice(pair, mint) {
  if (!pair || typeof pair !== 'object') return null;
  const base = pair.baseToken;
  const quote = pair.quoteToken;
  const priceUsd = Number(pair.priceUsd);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;

  if (base?.address === mint) return priceUsd;
  if (quote?.address === mint) {
    const priceNative = Number(pair.priceNative);
    if (Number.isFinite(priceNative) && priceNative > 0) return 1 / priceNative;
    return null;
  }
  return null;
}

/**
 * @param {string[]} mints
 * @returns {Promise<Map<string, TokenMeta>>}
 */
async function fetchDexScreenerMeta(mints) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const unique = [...new Set(mints.filter((m) => m && m !== WRAPPED_SOL_MINT))];
  const chunkSize = 30;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${DEXSCREENER_TOKENS_URL}/${chunk.join(',')}`;
    try {
      const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, { retries: 1 });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const pairs = Array.isArray(json?.pairs) ? json.pairs : [];

      for (const mint of chunk) {
        const relevant = pairs.filter(
          (p) =>
            p?.chainId === 'solana' &&
            (p?.baseToken?.address === mint || p?.quoteToken?.address === mint),
        );
        if (!relevant.length) continue;

        const ranked = [...relevant].sort(
          (a, b) => (Number(b?.liquidity?.usd) || 0) - (Number(a?.liquidity?.usd) || 0),
        );
        const best = ranked[0];
        const isBase = best?.baseToken?.address === mint;
        const token = isBase ? best.baseToken : best.quoteToken;
        const symbol = typeof token?.symbol === 'string' ? token.symbol.trim() : '';
        const name = typeof token?.name === 'string' ? token.name.trim() : '';
        const imageUrl =
          typeof best?.info?.imageUrl === 'string' && best.info.imageUrl.trim()
            ? best.info.imageUrl.trim()
            : null;

        out.set(mint, {
          symbol: symbol || shortenMint(mint),
          name: name || symbol || `Token ${shortenMint(mint)}`,
          priceUsd: pairTokenUsdPrice(best, mint),
          imageUrl,
        });
      }
    } catch {
      /* best-effort enrichment */
    }
  }

  return out;
}

/**
 * @param {string} mint
 * @returns {Promise<TokenMeta | null>}
 */
async function fetchPumpfunMeta(mint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const url = `${PUMP_FUN_API}/coins-v2/${encodeURIComponent(mint)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return null;

    const symbol = typeof data.symbol === 'string' ? data.symbol.trim() : '';
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const imageUri = typeof data.image_uri === 'string' ? data.image_uri.trim() : '';
    const usdMarketCap = Number(data.usd_market_cap);
    const priceUsd =
      Number.isFinite(usdMarketCap) && usdMarketCap > 0 && Number(data.total_supply) > 0
        ? usdMarketCap / Number(data.total_supply)
        : Number(data.price_usd) > 0
          ? Number(data.price_usd)
          : null;

    if (!symbol && !name) return null;
    return {
      symbol: (symbol || shortenMint(mint)).toUpperCase(),
      name: name || symbol || `Token ${shortenMint(mint)}`,
      priceUsd: Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null,
      imageUrl: imageUri || null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string[]} mints
 * @param {Map<string, TokenMeta>} dexMeta
 * @returns {Promise<Map<string, TokenMeta>>}
 */
async function fetchPumpfunMetaBatch(mints, existing) {
  const missing = mints.filter((mint) => !existing.has(mint) && mint !== WRAPPED_SOL_MINT);
  if (!missing.length) return new Map();

  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const concurrency = 4;
  for (let i = 0; i < missing.length; i += concurrency) {
    const batch = missing.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((mint) => fetchPumpfunMeta(mint)));
    for (let j = 0; j < batch.length; j += 1) {
      const meta = results[j];
      if (meta) out.set(batch[j], meta);
    }
  }
  return out;
}

/**
 * @param {unknown} body
 * @returns {Map<string, TokenMeta>}
 */
function extractTokensXyzSnapshots(body) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  if (!body || typeof body !== 'object') return out;

  const root = /** @type {Record<string, unknown>} */ (body);
  const candidates = [];
  if (Array.isArray(root.snapshots)) candidates.push(...root.snapshots);
  if (Array.isArray(root.data)) candidates.push(...root.data);
  if (root.data && typeof root.data === 'object') {
    const data = /** @type {Record<string, unknown>} */ (root.data);
    if (Array.isArray(data.snapshots)) candidates.push(...data.snapshots);
    if (Array.isArray(data.items)) candidates.push(...data.items);
  }

  for (const row of candidates) {
    if (!row || typeof row !== 'object') continue;
    const item = /** @type {Record<string, unknown>} */ (row);
    const mint = String(item.mint ?? item.address ?? item.id ?? '').trim();
    if (!mint) continue;
    const symbol = typeof item.symbol === 'string' ? item.symbol.trim() : '';
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const priceUsd = Number(item.priceUsd ?? item.price_usd ?? item.usdPrice ?? item.price);
    const imageUrl =
      typeof item.imageUrl === 'string'
        ? item.imageUrl.trim()
        : typeof item.image === 'string'
          ? item.image.trim()
          : null;
    if (!symbol && !name) continue;
    out.set(mint, {
      symbol: (symbol || name).toUpperCase(),
      name: name || symbol,
      priceUsd: Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null,
      imageUrl: imageUrl || null,
    });
  }

  return out;
}

/**
 * @param {string[]} mints
 * @param {Map<string, TokenMeta>} existing
 * @returns {Promise<Map<string, TokenMeta>>}
 */
async function fetchTokensXyzMetaBatch(mints, existing) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  if (!process.env.TOKENS_API_KEY?.trim()) return out;

  const missing = mints.filter((mint) => !existing.has(mint) && mint !== WRAPPED_SOL_MINT);
  if (!missing.length) return out;

  const chunkSize = 50;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    try {
      const result = await runTokensAgentTool('tokens-market-snapshots', {
        mints: chunk.join(','),
      });
      if (!result.ok) continue;
      const parsed = extractTokensXyzSnapshots(result.data);
      for (const [mint, meta] of parsed.entries()) {
        out.set(mint, meta);
      }
    } catch {
      /* optional */
    }
  }

  return out;
}

/**
 * @param {Map<string, TokenMeta>[]} maps
 * @returns {Map<string, TokenMeta>}
 */
function mergeMetaMaps(...maps) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  for (const map of maps) {
    for (const [mint, meta] of map.entries()) {
      const prev = out.get(mint);
      if (!prev) {
        out.set(mint, { ...meta });
        continue;
      }
      out.set(mint, {
        symbol: prev.symbol || meta.symbol,
        name: prev.name || meta.name,
        priceUsd: prev.priceUsd ?? meta.priceUsd,
        imageUrl: prev.imageUrl ?? meta.imageUrl,
      });
    }
  }
  return out;
}

function looksLikeMintLabel(value) {
  const text = String(value || '').trim();
  return text.includes('…') || (text.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(text));
}

async function fetchSolUsdPrice() {
  const dex = await fetchDexScreenerMeta([WRAPPED_SOL_MINT]);
  const fromDex = dex.get(WRAPPED_SOL_MINT)?.priceUsd;
  if (fromDex != null && Number.isFinite(fromDex) && fromDex > 0) return fromDex;

  try {
    const res = await fetchWithRetry(COINGECKO_SOL_URL, { headers: { Accept: 'application/json' } }, { retries: 1 });
    if (!res.ok) throw new Error('coingecko_unavailable');
    const json = await res.json().catch(() => null);
    const price = Number(json?.solana?.usd);
    if (Number.isFinite(price) && price > 0) return price;
  } catch {
    /* fall through */
  }

  return null;
}

/**
 * @param {string[]} mints
 * @returns {Promise<Record<string, number>>}
 */
async function fetchJupiterPrices(mints) {
  const apiKey = process.env.JUPITER_API_KEY;
  if (!apiKey) return {};

  const unique = [...new Set(mints.filter(Boolean))];
  if (!unique.length) return {};

  /** @type {Record<string, number>} */
  const out = {};
  const chunkSize = 100;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${JUPITER_PRICE_API}?ids=${chunk.map(encodeURIComponent).join(',')}`;
    try {
      const res = await fetchWithRetry(
        url,
        { headers: { Accept: 'application/json', 'x-api-key': apiKey } },
        { retries: 1 },
      );
      if (!res.ok) continue;
      const body = await res.json().catch(() => null);
      const data = body?.data;
      if (!data || typeof data !== 'object') continue;
      for (const [mint, row] of Object.entries(data)) {
        const price = Number(row?.price);
        if (Number.isFinite(price) && price > 0) out[mint] = price;
      }
    } catch {
      /* optional fallback */
    }
  }

  return out;
}

/**
 * @param {Array<{ mint: string; symbol: string; name: string; decimals: number; amount: number; priceUsd: number | null; valueUsd: number | null; imageUrl?: string | null }>} tokens
 * @param {number} solBalance
 * @param {number | null} solPriceUsd
 * @param {Record<string, number>} jupiterPrices
 */
function finalizePortfolio(tokens, solBalance, solPriceUsd, jupiterPrices) {
  const rows = [...tokens];

  if (solBalance > 0) {
    const price = solPriceUsd ?? jupiterPrices[WRAPPED_SOL_MINT] ?? null;
    rows.unshift({
      mint: WRAPPED_SOL_MINT,
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      amount: solBalance,
      priceUsd: price,
      valueUsd: price != null ? solBalance * price : null,
      imageUrl: null,
    });
  }

  for (const row of rows) {
    if (row.mint === WRAPPED_SOL_MINT) continue;
    if (row.priceUsd == null) {
      const fallback = jupiterPrices[row.mint] ?? KNOWN_TOKENS[row.mint]?.priceUsd ?? null;
      row.priceUsd = fallback;
    }
    row.valueUsd = row.priceUsd != null ? row.amount * row.priceUsd : null;
  }

  rows.sort((a, b) => {
    const av = a.valueUsd ?? -1;
    const bv = b.valueUsd ?? -1;
    if (bv !== av) return bv - av;
    return b.amount - a.amount;
  });

  const pricedTotal = rows.reduce((sum, row) => sum + (row.valueUsd ?? 0), 0);
  const hasAnyPrice = rows.some((row) => row.priceUsd != null);

  return {
    tokens: rows,
    totalValueUsd: hasAnyPrice && pricedTotal > 0 ? pricedTotal : null,
  };
}

/**
 * @param {ReturnType<typeof readParsedTokenRow>[]} rows
 * @param {Map<string, TokenMeta>} dexMeta
 * @param {Map<string, TokenMeta>} pumpMeta
 */
function applyTokenMeta(rows, metaByMint) {
  for (const row of rows) {
    const known = KNOWN_TOKENS[row.mint];
    const meta = metaByMint.get(row.mint);
    if (known) {
      row.symbol = known.symbol;
      row.name = known.name;
      if (known.imageUrl) row.imageUrl = known.imageUrl;
    }
    if (meta) {
      if (meta.symbol && (!looksLikeMintLabel(row.symbol) || !looksLikeMintLabel(meta.symbol))) {
        row.symbol = meta.symbol;
      } else if (meta.symbol && looksLikeMintLabel(row.symbol)) {
        row.symbol = meta.symbol;
      }
      if (meta.name && !looksLikeMintLabel(meta.name)) {
        row.name = meta.name;
      } else if (meta.name && looksLikeMintLabel(row.name)) {
        row.name = meta.name;
      }
      if (meta.imageUrl) row.imageUrl = meta.imageUrl;
      if (meta.priceUsd != null) row.priceUsd = meta.priceUsd;
    }
  }
}

/**
 * Fetch full SPL portfolio for a Solana wallet address.
 * @param {string} address
 */
export async function fetchAgentWalletPortfolio(address) {
  const pubkey = new PublicKey(address.trim());
  const picked = await pickSolanaConnectionForReads(pubkey);
  const solBalance = Number(picked.lamports) / LAMPORTS_PER_SOL;
  const splRows = await fetchSplTokenRows(picked.connection, pubkey);
  const mints = splRows.map((row) => row.mint);

  const [dexMeta, solPriceUsd, jupiterMeta] = await Promise.all([
    fetchDexScreenerMeta(mints),
    fetchSolUsdPrice(),
    fetchJupiterTokenMetaBatch(mints),
  ]);

  let metaByMint = mergeMetaMaps(dexMeta, jupiterMeta);
  const pumpMeta = await fetchPumpfunMetaBatch(mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, pumpMeta);

  const tokensXyzMeta = await fetchTokensXyzMetaBatch(mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, tokensXyzMeta);

  const onchainMeta = await fetchOnchainMetaplexMetaBatch(picked.connection, mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, onchainMeta);

  applyTokenMeta(splRows, metaByMint);

  const jupiterPrices = await fetchJupiterPrices([
    WRAPPED_SOL_MINT,
    ...mints.filter((mint) => {
      const row = splRows.find((r) => r.mint === mint);
      return row?.priceUsd == null;
    }),
  ]);

  const priced = finalizePortfolio(splRows, solBalance, solPriceUsd, jupiterPrices);

  return {
    address: pubkey.toBase58(),
    solBalance,
    ...priced,
    fetchedAt: new Date().toISOString(),
  };
}
