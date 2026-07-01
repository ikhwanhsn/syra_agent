/**
 * Dev/creator wallet intelligence for pump.fun tokens.
 * Primary: OKX memepump tokenDevInfo + similarToken. Fallback/enrich: GMGN security + created-tokens.
 */
import {
  getDexMemepumpTokenDevInfo,
  getDexMemepumpSimilarTokens,
  hasOkxDexCredentials,
} from './okxDexMarket.js';
import { runGmgnAgentTool } from './gmgnAgentService.js';

const CACHE_TTL_MS = 120_000;

/** @type {Map<string, { expires: number; data: unknown }>} */
const cache = new Map();

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {string} mint */
function readCache(mint) {
  const hit = cache.get(mint);
  if (!hit || Date.now() > hit.expires) {
    if (hit) cache.delete(mint);
    return null;
  }
  return hit.data;
}

/** @param {string} mint @param {unknown} data */
function writeCache(mint, data) {
  cache.set(mint, { expires: Date.now() + CACHE_TTL_MS, data });
}

/** @param {unknown} root */
function unwrapOkxData(root) {
  if (!root || typeof root !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (root);
  if (o.data && typeof o.data === 'object') return /** @type {Record<string, unknown>} */ (o.data);
  return o;
}

/** @param {unknown} root */
function extractDevWallet(root) {
  const data = unwrapOkxData(root);
  if (!data) return null;
  const candidates = [
    data.devAddress,
    data.devWallet,
    data.creatorAddress,
    data.creator,
    data.deployerAddress,
    data.deployer,
    data.ownerAddress,
    data.owner,
    data.walletAddress,
  ];
  for (const c of candidates) {
    const s = typeof c === 'string' ? c.trim() : '';
    if (s.length >= 32) return s;
  }
  return null;
}

/** @param {unknown} root */
function extractDevHoldingPct(root) {
  const data = unwrapOkxData(root);
  if (!data) return null;
  return (
    toNum(data.devHoldRate) ??
    toNum(data.devHoldRatio) ??
    toNum(data.devHoldingPct) ??
    toNum(data.devHoldingRate) ??
    toNum(data.creatorHoldRate)
  );
}

/** @param {unknown} root */
function extractDevSoldPct(root) {
  const data = unwrapOkxData(root);
  if (!data) return null;
  return (
    toNum(data.devSoldRate) ??
    toNum(data.devSellRate) ??
    toNum(data.creatorSoldRate) ??
    toNum(data.soldRate)
  );
}

/** @param {unknown} root */
function extractSimilarTokens(root) {
  if (!root) return [];
  if (Array.isArray(root)) return root;
  const data = unwrapOkxData(root);
  if (!data) return [];
  const candidates = [data.similarToken, data.similarTokens, data.tokens, data.list, data.items];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

/** @param {unknown} row */
function normalizeSimilarToken(row) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);
  const mint =
    typeof o.tokenContractAddress === 'string'
      ? o.tokenContractAddress.trim()
      : typeof o.mint === 'string'
        ? o.mint.trim()
        : typeof o.address === 'string'
          ? o.address.trim()
          : '';
  if (!mint) return null;
  return {
    mint,
    symbol: String(o.symbol ?? o.ticker ?? '').trim() || mint.slice(0, 4).toUpperCase(),
    name: String(o.name ?? o.tokenName ?? '').trim() || null,
    imageUri: typeof o.imageUrl === 'string' ? o.imageUrl : typeof o.logo === 'string' ? o.logo : null,
    marketCapUsd: toNum(o.marketCap ?? o.marketCapUsd ?? o.mcap ?? o.fdv),
    createdAt: typeof o.createTime === 'string' ? o.createTime : typeof o.createdAt === 'string' ? o.createdAt : null,
    complete: o.complete != null ? Boolean(o.complete) : o.migrated != null ? Boolean(o.migrated) : null,
    status: String(o.status ?? o.stage ?? '').trim() || null,
  };
}

/** @param {unknown} gmgnData */
function extractGmgnDeployer(gmgnData) {
  if (!gmgnData || typeof gmgnData !== 'object') return null;
  const root =
    'data' in /** @type {object} */ (gmgnData)
      ? /** @type {Record<string, unknown>} */ (/** @type {object} */ (gmgnData).data)
      : /** @type {Record<string, unknown>} */ (gmgnData);
  const addr = String(root.creator ?? root.deployer ?? root.owner ?? '').trim();
  return addr.length >= 32 ? addr : null;
}

/** @param {unknown} gmgnData */
function extractCreatedTokens(gmgnData) {
  if (!gmgnData || typeof gmgnData !== 'object') return [];
  const root =
    'data' in /** @type {object} */ (gmgnData)
      ? /** @type {Record<string, unknown>} */ (/** @type {object} */ (gmgnData).data)
      : /** @type {Record<string, unknown>} */ (gmgnData);
  const candidates = [root.list, root.tokens, root.items, root.created_tokens];
  /** @type {unknown[]} */
  let rows = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      rows = c;
      break;
    }
  }
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = /** @type {Record<string, unknown>} */ (row);
      const mint = String(o.address ?? o.mint ?? o.token_address ?? '').trim();
      if (!mint) return null;
      return {
        mint,
        symbol: String(o.symbol ?? '').trim() || mint.slice(0, 4).toUpperCase(),
        name: String(o.name ?? '').trim() || null,
        imageUri: typeof o.logo === 'string' ? o.logo : typeof o.image === 'string' ? o.image : null,
        marketCapUsd: toNum(o.market_cap ?? o.mcap ?? o.fdv),
        createdAt: typeof o.created_at === 'string' ? o.created_at : null,
        complete: o.is_migrated != null ? Boolean(o.is_migrated) : null,
        status: typeof o.migrate_state === 'string' ? o.migrate_state : null,
      };
    })
    .filter(Boolean);
}

/**
 * @param {{ mint: string }} input
 * @returns {Promise<{ ok: boolean; data?: object; error?: string; status?: number }>}
 */
export async function buildTokenDevInfo({ mint }) {
  const trimmed = typeof mint === 'string' ? mint.trim() : '';
  if (!trimmed) {
    return { ok: false, error: 'mint is required', status: 400 };
  }

  const cached = readCache(trimmed);
  if (cached) return { ok: true, data: cached };

  /** @type {string[]} */
  const errors = [];
  let devWallet = null;
  let devHoldingPct = null;
  let devSoldPct = null;
  /** @type {ReturnType<typeof normalizeSimilarToken>[]} */
  let similarTokens = [];
  /** @type {ReturnType<typeof extractCreatedTokens>} */
  let createdTokens = [];
  let source = 'none';

  const tasks = [];

  if (hasOkxDexCredentials()) {
    tasks.push(
      getDexMemepumpTokenDevInfo(trimmed, 'solana')
        .then((out) => ({ kind: 'okxDev', result: out.result }))
        .catch((err) => {
          errors.push(`okx_dev: ${err instanceof Error ? err.message : 'failed'}`);
          return { kind: 'okxDev', result: null };
        }),
      getDexMemepumpSimilarTokens(trimmed, 'solana')
        .then((out) => ({ kind: 'okxSimilar', result: out.result }))
        .catch((err) => {
          errors.push(`okx_similar: ${err instanceof Error ? err.message : 'failed'}`);
          return { kind: 'okxSimilar', result: null };
        }),
    );
  } else {
    errors.push('okx_credentials_missing');
  }

  tasks.push(
    runGmgnAgentTool('gmgn-token-security', { chain: 'sol', address: trimmed })
      .then((out) => ({ kind: 'gmgnSecurity', result: out }))
      .catch((err) => {
        errors.push(`gmgn_security: ${err instanceof Error ? err.message : 'failed'}`);
        return { kind: 'gmgnSecurity', result: { ok: false } };
      }),
  );

  const settled = await Promise.all(tasks);

  for (const item of settled) {
    if (item.kind === 'okxDev' && item.result) {
      devWallet = extractDevWallet(item.result) ?? devWallet;
      devHoldingPct = extractDevHoldingPct(item.result) ?? devHoldingPct;
      devSoldPct = extractDevSoldPct(item.result) ?? devSoldPct;
      source = 'okx';
    }
    if (item.kind === 'okxSimilar' && item.result) {
      similarTokens = extractSimilarTokens(item.result)
        .map(normalizeSimilarToken)
        .filter(Boolean);
    }
    if (item.kind === 'gmgnSecurity' && item.result?.ok) {
      const deployer = extractGmgnDeployer(item.result.data);
      if (!devWallet && deployer) {
        devWallet = deployer;
        if (source === 'none') source = 'gmgn';
      }
    }
  }

  if (devWallet) {
    try {
      const created = await runGmgnAgentTool('gmgn-portfolio-created-tokens', {
        chain: 'sol',
        wallet: devWallet,
      });
      if (created.ok) {
        createdTokens = extractCreatedTokens(created.data);
        if (source === 'none') source = 'gmgn';
      } else {
        errors.push('gmgn_created_tokens_unavailable');
      }
    } catch (err) {
      errors.push(`gmgn_created: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  const mergedSimilar = similarTokens.length > 0 ? similarTokens : createdTokens;
  const rugHistoryCount = mergedSimilar.filter(
    (t) => t && t.marketCapUsd != null && t.marketCapUsd < 10_000,
  ).length;

  const data = {
    mint: trimmed,
    devWallet,
    devHoldingPct,
    devSoldPct,
    similarTokens: mergedSimilar.filter((t) => t && t.mint !== trimmed).slice(0, 20),
    summary: {
      tokensLaunched: mergedSimilar.length,
      rugHistoryCount,
      devStillHolding: devHoldingPct != null ? devHoldingPct > 1 : null,
      devFullySold: devSoldPct != null ? devSoldPct >= 95 : devHoldingPct != null ? devHoldingPct < 1 : null,
    },
    source,
    errors: errors.length > 0 ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(trimmed, data);
  return { ok: true, data };
}
