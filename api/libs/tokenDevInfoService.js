/**
 * Dev/creator wallet intelligence for pump.fun tokens.
 * OKX sources:
 * - memepump/tokenDevInfo — devHoldingInfo + devLaunchedInfo (nested)
 * - memepump/similarToken — same-creator token list
 * - memepump/tokenDetails — creatorAddress + tags.devHoldingsPercent
 * - market/token/advanced-info — dev counts, rug pulls, token tags
 * Fallback/enrich: GMGN security + created-tokens.
 */
import {
  getDexMemepumpSimilarTokens,
  getDexMemepumpTokenDetails,
  getDexMemepumpTokenDevInfo,
  getDexTokenAdvancedInfo,
  hasOkxDexCredentials,
} from './okxDexMarket.js';
import { runGmgnAgentTool } from './gmgnAgentService.js';

const CACHE_TTL_MS = 120_000;

/** @type {Map<string, { expires: number; data: unknown }>} */
const cache = new Map();

/** @param {unknown} v */
function toNum(v) {
  if (v == null || v === '') return null;
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
function asRecord(root) {
  if (!root || typeof root !== 'object') return null;
  return /** @type {Record<string, unknown>} */ (root);
}

/** @param {unknown} devRoot */
function extractOkxDevInfo(devRoot) {
  const data = unwrapOkxData(devRoot);
  if (!data) return {};

  const holding = asRecord(data.devHoldingInfo) ?? data;
  const launched = asRecord(data.devLaunchedInfo) ?? data;

  const devWallet = [
    holding.devAddress,
    holding.devWallet,
    data.devAddress,
    data.creatorAddress,
    data.creator,
    data.deployerAddress,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find((v) => v.length >= 32);

  const devHoldingPct =
    toNum(holding.devHoldingPercent) ??
    toNum(holding.devHoldRate) ??
    toNum(holding.devHoldRatio) ??
    toNum(holding.devHoldingPct) ??
    toNum(data.devHoldingPercent);

  const devSoldPct =
    toNum(holding.devSoldRate) ??
    toNum(holding.devSellRate) ??
    toNum(data.devSoldRate) ??
    (devHoldingPct != null ? Math.max(0, 100 - devHoldingPct) : null);

  return {
    devWallet: devWallet ?? null,
    devHoldingPct,
    devSoldPct,
    fundingAddress:
      typeof holding.fundingAddress === 'string' ? holding.fundingAddress.trim() || null : null,
    devBalance: toNum(holding.devBalance ?? data.devBalance),
    lastFundedAt:
      typeof holding.lastFundedTimestamp === 'string'
        ? holding.lastFundedTimestamp
        : typeof data.lastFundedTimestamp === 'string'
          ? data.lastFundedTimestamp
          : null,
    tokensLaunched:
      toNum(launched.totalToken) ??
      toNum(launched.totalTokens) ??
      toNum(data.totalToken),
    rugPullCount:
      toNum(launched.rugPullCount) ??
      toNum(launched.rugCount) ??
      toNum(data.rugPullCount),
    migratedCount: toNum(launched.migratedCount ?? data.migratedCount),
    goldenGemCount: toNum(launched.goldenGemCount ?? data.goldenGemCount),
  };
}

/** @param {unknown} detailsRoot */
function extractDetailsDevInfo(detailsRoot) {
  const data = unwrapOkxData(detailsRoot);
  if (!data) return {};

  const tags =
    data.tags && typeof data.tags === 'object'
      ? /** @type {Record<string, unknown>} */ (data.tags)
      : null;

  const creatorAddress =
    typeof data.creatorAddress === 'string' ? data.creatorAddress.trim() : '';

  return {
    devWallet: creatorAddress.length >= 32 ? creatorAddress : null,
    devHoldingPct: toNum(tags?.devHoldingsPercent ?? tags?.devHoldingPercent),
  };
}

/** @param {unknown} advancedRoot */
function extractAdvancedDevInfo(advancedRoot) {
  const data = unwrapOkxData(advancedRoot);
  if (!data) return {};

  const creatorAddress =
    typeof data.creatorAddress === 'string' ? data.creatorAddress.trim() : '';

  const tokenTags = Array.isArray(data.tokenTags)
    ? data.tokenTags.map((t) => String(t))
    : [];

  return {
    devWallet: creatorAddress.length >= 32 ? creatorAddress : null,
    devHoldingPct: toNum(data.devHoldingPercent ?? data.devHoldPercent),
    tokensLaunched:
      toNum(data.devLaunchedTokenCount) ??
      toNum(data.devCreateTokenCount),
    rugPullCount: toNum(data.devRugPullTokenCount),
    devFullySold: tokenTags.includes('devHoldingStatusSellAll'),
  };
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

  const market = asRecord(o.market);
  const marketCapUsd =
    toNum(o.marketCapUsd) ??
    toNum(o.marketCap) ??
    toNum(market?.marketCapUsd) ??
    toNum(o.mcap) ??
    toNum(o.fdv);

  const createdAt =
    typeof o.createdTimestamp === 'string'
      ? o.createdTimestamp
      : typeof o.createTime === 'string'
        ? o.createTime
        : typeof o.createdAt === 'string'
          ? o.createdAt
          : null;

  return {
    mint,
    symbol:
      String(o.tokenSymbol ?? o.symbol ?? o.ticker ?? '').trim() || mint.slice(0, 4).toUpperCase(),
    name: String(o.tokenName ?? o.name ?? '').trim() || null,
    imageUri:
      typeof o.tokenLogo === 'string'
        ? o.tokenLogo
        : typeof o.logoUrl === 'string'
          ? o.logoUrl
          : typeof o.logo === 'string'
            ? o.logo
            : null,
    marketCapUsd,
    createdAt,
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
  let source = 'none';

  /** @type {ReturnType<typeof normalizeSimilarToken>[]} */
  let similarTokens = [];
  /** @type {ReturnType<typeof extractCreatedTokens>} */
  let createdTokens = [];

  const okxTasks = hasOkxDexCredentials()
    ? [
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
        getDexMemepumpTokenDetails(trimmed, 'solana')
          .then((out) => ({ kind: 'okxDetails', result: out.result }))
          .catch((err) => {
            errors.push(`okx_details: ${err instanceof Error ? err.message : 'failed'}`);
            return { kind: 'okxDetails', result: null };
          }),
        getDexTokenAdvancedInfo(trimmed, 'solana')
          .then((out) => ({ kind: 'okxAdvanced', result: out.result }))
          .catch((err) => {
            errors.push(`okx_advanced: ${err instanceof Error ? err.message : 'failed'}`);
            return { kind: 'okxAdvanced', result: null };
          }),
      ]
    : (errors.push('okx_credentials_missing'), []);

  const [okxSettled, gmgnSecurity] = await Promise.all([
    Promise.all(okxTasks),
    runGmgnAgentTool('gmgn-token-security', { chain: 'sol', address: trimmed }).catch((err) => {
      errors.push(`gmgn_security: ${err instanceof Error ? err.message : 'failed'}`);
      return { ok: false };
    }),
  ]);

  const okxDev = extractOkxDevInfo(
    okxSettled.find((item) => item.kind === 'okxDev')?.result ?? null,
  );
  const detailsDev = extractDetailsDevInfo(
    okxSettled.find((item) => item.kind === 'okxDetails')?.result ?? null,
  );
  const advancedDev = extractAdvancedDevInfo(
    okxSettled.find((item) => item.kind === 'okxAdvanced')?.result ?? null,
  );

  if (okxSettled.some((item) => item.result)) source = 'okx';

  const similarRaw = okxSettled.find((item) => item.kind === 'okxSimilar')?.result ?? null;
  similarTokens = extractSimilarTokens(similarRaw).map(normalizeSimilarToken).filter(Boolean);

  let devWallet =
    okxDev.devWallet ?? detailsDev.devWallet ?? advancedDev.devWallet ?? null;

  let devHoldingPct =
    okxDev.devHoldingPct ?? detailsDev.devHoldingPct ?? advancedDev.devHoldingPct ?? null;

  let devSoldPct = okxDev.devSoldPct ?? null;
  if (devSoldPct == null && devHoldingPct != null) {
    devSoldPct = Math.max(0, 100 - devHoldingPct);
  }

  if (!devWallet && gmgnSecurity.ok) {
    devWallet = extractGmgnDeployer(gmgnSecurity.data);
    if (devWallet && source === 'none') source = 'gmgn';
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

  const tokensLaunched =
    okxDev.tokensLaunched ??
    advancedDev.tokensLaunched ??
    (mergedSimilar.length > 0 ? mergedSimilar.length : 0);

  const rugPullCount =
    okxDev.rugPullCount ??
    advancedDev.rugPullCount ??
    mergedSimilar.filter((t) => t && t.marketCapUsd != null && t.marketCapUsd < 10_000).length;

  const migratedCount = okxDev.migratedCount ?? null;
  const goldenGemCount = okxDev.goldenGemCount ?? null;

  const devStillHolding = devHoldingPct != null ? devHoldingPct > 1 : null;
  const devFullySold =
    advancedDev.devFullySold === true ||
    (devHoldingPct != null ? devHoldingPct < 1 : devSoldPct != null ? devSoldPct >= 95 : false);

  const data = {
    mint: trimmed,
    devWallet,
    devHoldingPct,
    devSoldPct,
    fundingAddress: okxDev.fundingAddress ?? null,
    devBalance: okxDev.devBalance ?? null,
    lastFundedAt: okxDev.lastFundedAt ?? null,
    similarTokens: mergedSimilar.filter((t) => t && t.mint !== trimmed).slice(0, 20),
    summary: {
      tokensLaunched,
      rugHistoryCount: rugPullCount,
      migratedCount,
      goldenGemCount,
      devStillHolding,
      devFullySold,
    },
    source,
    errors: errors.length > 0 ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(trimmed, data);
  return { ok: true, data };
}
