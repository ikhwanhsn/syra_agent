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
const DEXSCREENER_V1_URL = 'https://api.dexscreener.com/tokens/v1/solana';
const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? 'https://api.jup.ag' : 'https://lite-api.jup.ag';
const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v2`;
const COINGECKO_SOL_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
const PUMP_FUN_API = (process.env.PUMP_FUN_FRONTEND_API_URL || 'https://frontend-api-v3.pump.fun').replace(
  /\/$/,
  '',
);

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
    // priceNative = quote tokens per 1 base token; quote USD = base USD / priceNative
    if (Number.isFinite(priceNative) && priceNative > 0) return priceUsd / priceNative;
    return null;
  }
  return null;
}

/**
 * Conservative USD price when multiple sources disagree (portfolio valuations).
 * @param {number | null | undefined} primary
 * @param {number | null | undefined} secondary
 * @returns {number | null}
 */
function conservativeUsdPrice(primary, secondary) {
  const a = primary != null && Number.isFinite(primary) && primary > 0 ? primary : null;
  const b = secondary != null && Number.isFinite(secondary) && secondary > 0 ? secondary : null;
  if (a == null) return b;
  if (b == null) return a;
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  if (max / min > 3) return min;
  return a;
}

/**
 * @param {string[]} mints
 * @returns {Promise<Map<string, TokenMeta>>}
 */
async function fetchDexScreenerV1Meta(mints) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const unique = [...new Set(mints.filter((m) => m && m !== WRAPPED_SOL_MINT))];
  const chunkSize = 30;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${DEXSCREENER_V1_URL}/${chunk.map(encodeURIComponent).join(',')}`;
    try {
      const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, { retries: 1 });
      if (!res.ok) continue;
      const pairs = await res.json().catch(() => null);
      if (!Array.isArray(pairs)) continue;

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
      /* best-effort */
    }
  }

  return out;
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
 * Spot USD price from pump.fun — never marketCap/totalSupply (misprices memecoins).
 * @param {Record<string, unknown>} data
 * @param {number | null} solUsd
 * @returns {number | null}
 */
function resolvePumpfunSpotPriceUsd(data, solUsd) {
  const apiPrice =
    Number(data.price_usd) > 0 && Number.isFinite(Number(data.price_usd))
      ? Number(data.price_usd)
      : null;

  let curvePrice = null;
  if (solUsd != null && solUsd > 0) {
    const virtualSol = Number(data.virtual_sol_reserves) || Number(data.real_sol_reserves);
    const virtualToken = Number(data.virtual_token_reserves) || Number(data.real_token_reserves);
    const tokenDecimals = Number(data.decimals) || 6;
    if (
      Number.isFinite(virtualSol) &&
      Number.isFinite(virtualToken) &&
      virtualSol > 0 &&
      virtualToken > 0
    ) {
      const solHuman = virtualSol / LAMPORTS_PER_SOL;
      const tokenHuman = virtualToken / 10 ** tokenDecimals;
      if (tokenHuman > 0) {
        const computed = (solHuman / tokenHuman) * solUsd;
        if (Number.isFinite(computed) && computed > 0) curvePrice = computed;
      }
    }
  }

  return conservativeUsdPrice(curvePrice, apiPrice);
}

/** @returns {Promise<number | null>} */
async function fetchPumpfunSolUsd() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${PUMP_FUN_API}/sol-price`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    if (!raw || typeof raw !== 'object') return null;
    const price = Number(raw.solPrice ?? raw.sol_price ?? raw.price ?? raw.usd);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} mint
 * @param {number | null} solUsd
 * @returns {Promise<TokenMeta | null>}
 */
async function fetchPumpfunMeta(mint, solUsd = null) {
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
    const priceUsd = resolvePumpfunSpotPriceUsd(data, solUsd);

    if (!symbol && !name) return null;
    return {
      symbol: (symbol || shortenMint(mint)).toUpperCase(),
      name: name || symbol || `Token ${shortenMint(mint)}`,
      priceUsd,
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
  const targets = mints.filter((mint) => {
    if (!mint || mint === WRAPPED_SOL_MINT) return false;
    const meta = existing.get(mint);
    if (!meta) return true;
    return meta.priceUsd == null;
  });
  if (!targets.length) return new Map();

  const solUsd = await fetchPumpfunSolUsd();

  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const concurrency = 4;
  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((mint) => fetchPumpfunMeta(mint, solUsd)));
    for (let j = 0; j < batch.length; j += 1) {
      const meta = results[j];
      if (!meta) continue;
      const prev = existing.get(batch[j]);
      out.set(batch[j], prev
        ? {
            ...prev,
            ...meta,
            priceUsd: conservativeUsdPrice(prev.priceUsd, meta.priceUsd),
          }
        : meta);
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
        priceUsd: conservativeUsdPrice(prev.priceUsd, meta.priceUsd),
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
  const unique = [...new Set(mints.filter(Boolean))];
  if (!unique.length) return {};

  /** @type {Record<string, number>} */
  const out = {};
  const chunkSize = 100;
  const apiKey = process.env.JUPITER_API_KEY?.trim();

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${JUPITER_PRICE_API}?ids=${chunk.map(encodeURIComponent).join(',')}`;
    try {
      const headers = { Accept: 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const res = await fetchWithRetry(url, { headers }, { retries: 1 });
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
  const solPrice = solPriceUsd ?? jupiterPrices[WRAPPED_SOL_MINT] ?? null;

  if (solBalance > 0) {
    const existingSol = rows.find((row) => row.mint === WRAPPED_SOL_MINT);
    if (existingSol) {
      existingSol.amount += solBalance;
      existingSol.symbol = 'SOL';
      existingSol.name = 'Solana';
      if (existingSol.priceUsd == null) existingSol.priceUsd = solPrice;
    } else {
      rows.unshift({
        mint: WRAPPED_SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        amount: solBalance,
        priceUsd: solPrice,
        valueUsd: solPrice != null ? solBalance * solPrice : null,
        imageUrl: null,
      });
    }
  }

  for (const row of rows) {
    const metaPrice = row.priceUsd;
    const jup = jupiterPrices[row.mint];
    let price =
      row.mint === USDC_MINT
        ? 1
        : row.mint === WRAPPED_SOL_MINT
          ? solPrice ?? jup ?? metaPrice ?? KNOWN_TOKENS[row.mint]?.priceUsd ?? null
          : conservativeUsdPrice(jup, metaPrice);

    if (price == null && row.mint !== WRAPPED_SOL_MINT && row.mint !== USDC_MINT) {
      price = jup ?? metaPrice ?? KNOWN_TOKENS[row.mint]?.priceUsd ?? null;
    }

    row.priceUsd = price;
    row.valueUsd = price != null ? row.amount * price : null;
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
      if (meta.priceUsd != null && row.priceUsd == null) row.priceUsd = meta.priceUsd;
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

  const [dexV1Meta, dexMeta, solPriceUsd, jupiterMeta, jupiterPrices] = await Promise.all([
    fetchDexScreenerV1Meta(mints),
    fetchDexScreenerMeta(mints),
    fetchSolUsdPrice(),
    fetchJupiterTokenMetaBatch(mints),
    fetchJupiterPrices([WRAPPED_SOL_MINT, ...mints.filter((mint) => mint !== USDC_MINT)]),
  ]);

  let metaByMint = mergeMetaMaps(dexV1Meta, dexMeta, jupiterMeta);
  const pumpMeta = await fetchPumpfunMetaBatch(mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, pumpMeta);

  const tokensXyzMeta = await fetchTokensXyzMetaBatch(mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, tokensXyzMeta);

  const onchainMeta = await fetchOnchainMetaplexMetaBatch(picked.connection, mints, metaByMint);
  metaByMint = mergeMetaMaps(metaByMint, onchainMeta);

  applyTokenMeta(splRows, metaByMint);

  const priced = finalizePortfolio(splRows, solBalance, solPriceUsd, jupiterPrices);

  return {
    address: pubkey.toBase58(),
    solBalance,
    ...priced,
    fetchedAt: new Date().toISOString(),
  };
}
