import { PublicKey } from '@solana/web3.js';
import { fetchWithRetry } from '../utils/resilientFetch.js';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const JUPITER_TOKENS_SEARCH = 'https://api.jup.ag/tokens/v2/search';

/**
 * @typedef {{ symbol: string; name: string; priceUsd: number | null; imageUrl: string | null }} TokenMeta
 */

/**
 * @param {Buffer} buffer
 * @param {number} offset
 * @param {number} maxLen
 */
function readFixedString(buffer, offset, maxLen) {
  const slice = buffer.subarray(offset, offset + maxLen);
  const zero = slice.indexOf(0);
  const end = zero >= 0 ? zero : maxLen;
  return slice.subarray(0, end).toString('utf8').replace(/\0/g, '').trim();
}

/**
 * @param {Buffer} data
 * @returns {{ name: string; symbol: string; uri: string } | null}
 */
function decodeMetaplexMetadata(data) {
  if (!data || data.length < 107) return null;
  const name = readFixedString(data, 65, 32);
  const symbol = readFixedString(data, 97, 10);
  const uri = readFixedString(data, 107, 200);
  if (!name && !symbol) return null;
  return {
    name: name || symbol,
    symbol: symbol || name.slice(0, 10),
    uri,
  };
}

/**
 * @param {string} uri
 * @returns {Promise<string | null>}
 */
async function fetchImageFromMetadataUri(uri) {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(trimmed, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const image = typeof json?.image === 'string' ? json.image.trim() : '';
    return image || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} mint
 * @returns {Promise<TokenMeta | null>}
 */
export async function fetchOnchainMetaplexMeta(connection, mint) {
  try {
    const mintPk = new PublicKey(mint);
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
      METADATA_PROGRAM_ID,
    );
    const account = await connection.getAccountInfo(metadataPda, 'confirmed');
    if (!account?.data?.length) return null;

    const decoded = decodeMetaplexMetadata(account.data);
    if (!decoded) return null;

    const imageUrl = await fetchImageFromMetadataUri(decoded.uri);

    return {
      symbol: (decoded.symbol || decoded.name).toUpperCase(),
      name: decoded.name || decoded.symbol,
      priceUsd: null,
      imageUrl,
    };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} row
 * @returns {TokenMeta | null}
 */
function normalizeJupiterToken(row) {
  if (!row || typeof row !== 'object') return null;
  const mint = String(row.id ?? row.mint ?? '').trim();
  const symbol = typeof row.symbol === 'string' ? row.symbol.trim() : '';
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!mint || (!symbol && !name)) return null;

  const priceUsd = Number(row.usdPrice ?? row.price);
  const imageUrl = typeof row.icon === 'string' && row.icon.trim() ? row.icon.trim() : null;

  return {
    symbol: (symbol || name).toUpperCase(),
    name: name || symbol,
    priceUsd: Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null,
    imageUrl,
  };
}

/**
 * @param {string[]} mints
 * @returns {Promise<Map<string, TokenMeta>>}
 */
export async function fetchJupiterTokenMetaBatch(mints) {
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const apiKey = process.env.JUPITER_API_KEY?.trim();
  if (!apiKey) return out;

  const unique = [...new Set(mints.filter(Boolean))];
  const chunkSize = 100;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${JUPITER_TOKENS_SEARCH}?query=${chunk.map(encodeURIComponent).join(',')}`;
    try {
      const res = await fetchWithRetry(
        url,
        { headers: { Accept: 'application/json', 'x-api-key': apiKey } },
        { retries: 1 },
      );
      if (!res.ok) continue;
      const rows = await res.json().catch(() => null);
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const meta = normalizeJupiterToken(row);
        const mint = String(row?.id ?? row?.mint ?? '').trim();
        if (meta && mint) out.set(mint, meta);
      }
    } catch {
      /* optional */
    }
  }

  return out;
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string[]} mints
 * @param {Map<string, TokenMeta>} existing
 * @returns {Promise<Map<string, TokenMeta>>}
 */
export async function fetchOnchainMetaplexMetaBatch(connection, mints, existing = new Map()) {
  const missing = mints.filter((mint) => mint && !existing.has(mint));
  /** @type {Map<string, TokenMeta>} */
  const out = new Map();
  const concurrency = 6;

  for (let i = 0; i < missing.length; i += concurrency) {
    const batch = missing.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((mint) => fetchOnchainMetaplexMeta(connection, mint)));
    for (let j = 0; j < batch.length; j += 1) {
      const meta = results[j];
      if (meta) out.set(batch[j], meta);
    }
  }

  return out;
}
