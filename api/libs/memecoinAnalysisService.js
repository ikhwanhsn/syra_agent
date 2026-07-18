/**
 * Aggregates multi-source memecoin analysis for the /pumpfun alpha terminal.
 * Uses Syra-owned / free infra only.
 */
import { buildMintDossier } from './tokensDossierService.js';
import { fetchTokenKolShills } from './tokenKolShillService.js';
import { fetchSplTokenTopHolders } from './solanaTokenLargestHolders.js';
import { analyzeHolderDistribution } from './holderDistributionService.js';
import { fetchOnChainMintSecurity } from './onChainMintSecurity.js';
import { buildPumpfunMarketProfile, mergeMemecoinMarketStats } from './pumpfunCoinAnalysis.js';
import { formatSolanaReadError } from './solanaMintProgram.js';
import { isLikelySolanaMint } from './tokenChainDetect.js';

const ANALYSIS_CACHE_TTL_MS = 45_000;
const HOLDER_SAMPLE_LIMIT = 10;

/** @type {Map<string, { expires: number; data: unknown }>} */
const analysisCache = new Map();

/** @param {string} s */
function trim(s) {
  return s != null ? String(s).trim() : '';
}

/**
 * @template T
 * @param {Promise<{ ok: boolean; data?: T; error?: string; status?: number }>} promise
 * @param {string} source
 */
async function wrapSource(promise, source) {
  try {
    const result = await promise;
    if (result && typeof result === 'object' && 'ok' in result) {
      if (result.ok) {
        return { ok: true, source, data: result.data ?? null };
      }
      return {
        ok: false,
        source,
        error: result.error || `${source} unavailable`,
        status: result.status,
      };
    }
    return { ok: true, source, data: result ?? null };
  } catch (err) {
    const message = formatSolanaReadError(err, `${source} failed`);
    return { ok: false, source, error: message };
  }
}

/** @param {PromiseSettledResult<{ ok?: boolean; data?: unknown; error?: string; status?: number }>} settled @param {string} source */
function unwrapOnChain(settled, source) {
  if (settled.status === 'rejected') {
    return {
      ok: false,
      source,
      error: formatSolanaReadError(settled.reason, `${source} failed`),
    };
  }
  const val = settled.value;
  if (val?.ok) {
    return { ok: true, source, data: val.data ?? null };
  }
  return {
    ok: false,
    source,
    error: val?.error || `${source} unavailable`,
    status: val?.status,
  };
}

/** @param {string} mint */
async function fetchOnChainHoldersAndDistribution(mint) {
  try {
    const holdersPayload = await fetchSplTokenTopHolders(mint, { limit: HOLDER_SAMPLE_LIMIT });
    const distribution = analyzeHolderDistribution(holdersPayload);
    return { ok: true, data: { holders: holdersPayload, distribution } };
  } catch (err) {
    return {
      ok: false,
      error: formatSolanaReadError(err, 'On-chain holder fetch failed'),
      status: 502,
    };
  }
}

/** @param {string} mint */
async function fetchOnChainSecurity(mint) {
  try {
    const data = await fetchOnChainMintSecurity(mint);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: formatSolanaReadError(err, 'On-chain mint security read failed'),
      status: 502,
    };
  }
}

/** @param {unknown} marketScore */
function gradeToScore(marketScore) {
  if (!marketScore || typeof marketScore !== 'object') return 0;
  const row = /** @type {Record<string, unknown>} */ (marketScore);
  const grade = String(row.grade ?? row.label ?? '').toUpperCase();
  const tone = String(row.tone ?? '').toLowerCase();
  if (grade.startsWith('A') || tone === 'safe') return 18;
  if (grade.startsWith('B')) return 10;
  if (grade.startsWith('C') || tone === 'warning') return 0;
  if (grade.startsWith('D') || grade.startsWith('F') || tone === 'danger') return -18;
  const numeric = typeof row.score === 'number' ? row.score : null;
  if (numeric != null && Number.isFinite(numeric)) {
    if (numeric >= 80) return 15;
    if (numeric >= 60) return 5;
    if (numeric >= 40) return -5;
    return -15;
  }
  return 0;
}

/** @param {number | null | undefined} pct */
function concentrationScore(pct) {
  if (pct == null || !Number.isFinite(pct)) return 0;
  if (pct < 25) return 12;
  if (pct < 40) return 6;
  if (pct < 55) return 0;
  if (pct < 70) return -10;
  return -20;
}

/** @param {number | null | undefined} liquidity */
function liquidityScore(liquidity) {
  if (liquidity == null || !Number.isFinite(liquidity)) return 0;
  if (liquidity >= 100_000) return 12;
  if (liquidity >= 50_000) return 8;
  if (liquidity >= 10_000) return 3;
  if (liquidity >= 1_000) return -5;
  return -15;
}

/** @param {unknown} securityData */
function onChainSecurityScore(securityData) {
  if (!securityData || typeof securityData !== 'object') return 0;
  const row = /** @type {Record<string, unknown>} */ (securityData);
  let delta = 0;
  if (row.mintAuthorityRenounced === true) delta += 8;
  else if (row.mintAuthorityRenounced === false) delta -= 12;
  if (row.freezeAuthorityRenounced === true) delta += 4;
  else if (row.freezeAuthorityRenounced === false) delta -= 8;
  return delta;
}

/** @param {number | null | undefined} decentralizationScore */
function decentralizationScoreDelta(decentralizationScore) {
  if (decentralizationScore == null || !Number.isFinite(decentralizationScore)) return 0;
  if (decentralizationScore >= 70) return 8;
  if (decentralizationScore >= 50) return 3;
  if (decentralizationScore >= 35) return 0;
  if (decentralizationScore >= 20) return -5;
  return -10;
}

/** @param {number} score */
export function scoreToVerdict(score) {
  if (score >= 80) return { verdict: 'Strong Alpha', tone: 'safe' };
  if (score >= 65) return { verdict: 'Solid Setup', tone: 'safe' };
  if (score >= 50) return { verdict: 'Mixed Signals', tone: 'warning' };
  if (score >= 35) return { verdict: 'High Risk', tone: 'warning' };
  return { verdict: 'Avoid', tone: 'danger' };
}

/**
 * @param {{
 *   dossier?: unknown;
 *   market?: unknown;
 *   holders?: unknown;
 *   distribution?: unknown;
 *   pumpfun?: unknown;
 *   onChainSecurity?: unknown;
 *   kolShills?: unknown;
 * }} inputs
 */
export function computeSyraAlphaScore(inputs) {
  let score = 50;
  const factors = [];

  const dossier = inputs.dossier;
  if (dossier && typeof dossier === 'object') {
    const d = /** @type {Record<string, unknown>} */ (dossier);
    const includes =
      d.includes && typeof d.includes === 'object' ? /** @type {Record<string, unknown>} */ (d.includes) : null;
    const riskInclude =
      includes?.risk && typeof includes.risk === 'object'
        ? /** @type {Record<string, unknown>} */ (includes.risk)
        : null;
    const riskData =
      riskInclude?.ok && riskInclude.data && typeof riskInclude.data === 'object'
        ? /** @type {Record<string, unknown>} */ (riskInclude.data)
        : null;
    const mintRisk =
      d.mintRisk && typeof d.mintRisk === 'object'
        ? /** @type {Record<string, unknown>} */ (d.mintRisk)
        : null;
    const mintRiskScore =
      mintRisk?.risk && typeof mintRisk.risk === 'object'
        ? /** @type {Record<string, unknown>} */ (mintRisk.risk)
        : null;
    const marketScore = riskData?.marketScore ?? mintRiskScore?.marketScore ?? null;

    const gradeDelta = gradeToScore(marketScore);
    score += gradeDelta;
    if (gradeDelta !== 0) factors.push({ id: 'risk_grade', delta: gradeDelta, label: 'Risk grade' });
  }

  const market = inputs.market;
  if (market && typeof market === 'object') {
    const m = /** @type {Record<string, unknown>} */ (market);
    const liqDelta = liquidityScore(typeof m.liquidityUsd === 'number' ? m.liquidityUsd : null);
    score += liqDelta;
    if (liqDelta !== 0) factors.push({ id: 'liquidity', delta: liqDelta, label: 'Liquidity depth' });
  }

  const holders = inputs.holders;
  if (holders && typeof holders === 'object') {
    const h = /** @type {Record<string, unknown>} */ (holders);
    const concDelta = concentrationScore(
      typeof h.top10ConcentrationPct === 'number' ? h.top10ConcentrationPct : null,
    );
    score += concDelta;
    if (concDelta !== 0) factors.push({ id: 'concentration', delta: concDelta, label: 'Holder concentration' });
  }

  const distribution = inputs.distribution;
  if (distribution && typeof distribution === 'object') {
    const dist = /** @type {Record<string, unknown>} */ (distribution);
    const decDelta = decentralizationScoreDelta(
      typeof dist.decentralizationScore === 'number' ? dist.decentralizationScore : null,
    );
    score += decDelta;
    if (decDelta !== 0) factors.push({ id: 'decentralization', delta: decDelta, label: 'Distribution score' });
  }

  const pumpfun = inputs.pumpfun;
  if (pumpfun && typeof pumpfun === 'object') {
    const p = /** @type {Record<string, unknown>} */ (pumpfun);
    if (p.complete === true) {
      score += 5;
      factors.push({ id: 'graduated', delta: 5, label: 'Graduated to Raydium' });
    }
  }

  const onChainSecurity = inputs.onChainSecurity;
  if (onChainSecurity) {
    const secDelta = onChainSecurityScore(onChainSecurity);
    score += secDelta;
    if (secDelta !== 0) factors.push({ id: 'on_chain_security', delta: secDelta, label: 'Mint authorities' });
  }

  const intelligence = inputs.kolShills;
  if (intelligence && typeof intelligence === 'object') {
    const intel = /** @type {Record<string, unknown>} */ (intelligence);
    const summary =
      intel.summary && typeof intel.summary === 'object'
        ? /** @type {Record<string, unknown>} */ (intel.summary)
        : null;
    const combinedReach = typeof summary?.combinedReach === 'number' ? summary.combinedReach : null;
    const directShills = typeof summary?.directShills === 'number' ? summary.directShills : 0;
    const warnings = typeof summary?.warnings === 'number' ? summary.warnings : 0;
    let kolDelta = 0;
    if (combinedReach != null && combinedReach >= 500_000 && directShills > 0) kolDelta = 8;
    else if (combinedReach != null && combinedReach >= 50_000 && directShills > 0) kolDelta = 5;
    if (warnings > directShills && warnings >= 2) kolDelta -= 5;
    score += kolDelta;
    if (kolDelta !== 0) factors.push({ id: 'kol_radar', delta: kolDelta, label: 'KOL mentions on X' });
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { verdict, tone } = scoreToVerdict(clamped);

  return {
    score: clamped,
    verdict,
    tone,
    factors,
    disclaimer: 'Probabilistic analysis only — not financial advice. Do your own research.',
  };
}

/**
 * @param {{ mint: string; force?: boolean }} input
 */
export async function buildMemecoinAnalysis(input) {
  const mint = trim(input.mint);
  if (!mint || !isLikelySolanaMint(mint)) {
    return { ok: false, error: 'Provide a valid Solana mint address', status: 400 };
  }

  if (!input.force) {
    const cached = analysisCache.get(mint);
    if (cached && Date.now() < cached.expires) {
      return { ok: true, data: cached.data };
    }
  }

  const kolShillsPromise = wrapSource(
    fetchTokenKolShills({ mint }, { fast: true }),
    'kolShills',
  );

  const [
    dossierSettled,
    onChainSettled,
    pumpfunSettled,
    securitySettled,
    kolShillsSettled,
  ] = await Promise.allSettled([
    wrapSource(buildMintDossier({ mint, lite: true }), 'dossier'),
    fetchOnChainHoldersAndDistribution(mint),
    wrapSource(buildPumpfunMarketProfile(mint), 'pumpfun'),
    fetchOnChainSecurity(mint),
    kolShillsPromise,
  ]);

  /** @param {PromiseSettledResult<unknown>} settled @param {string} source */
  function unwrap(settled, source) {
    if (settled.status === 'rejected') {
      const message = settled.reason instanceof Error ? settled.reason.message : `${source} failed`;
      return { ok: false, source, error: message };
    }
    return settled.value;
  }

  const dossierSection = unwrap(dossierSettled, 'dossier');
  const onChainSection = unwrapOnChain(onChainSettled, 'onChain');
  const pumpfunSection = unwrap(pumpfunSettled, 'pumpfun');
  const onChainSecuritySection = unwrapOnChain(securitySettled, 'onChainSecurity');
  const kolShillsSection = unwrap(kolShillsSettled, 'kolShills');

  const onChainData = onChainSection.ok ? onChainSection.data : null;
  const holdersSection = onChainData?.holders
    ? { ok: true, source: 'holders', data: onChainData.holders }
    : { ok: false, source: 'holders', error: onChainSection.error || 'Holders unavailable' };
  const distributionSection = onChainData?.distribution
    ? { ok: true, source: 'distribution', data: onChainData.distribution }
    : { ok: false, source: 'distribution', error: onChainSection.error || 'Distribution unavailable' };

  const dossierData = dossierSection.ok ? dossierSection.data : null;
  const kolShillsData = kolShillsSection.ok ? kolShillsSection.data : null;
  const pumpfunData = pumpfunSection.ok ? pumpfunSection.data : null;
  const onChainSecurityData = onChainSecuritySection.ok ? onChainSecuritySection.data : null;

  let holdersSectionFinal = holdersSection;
  let distributionSectionFinal = distributionSection;

  if (!holdersSection.ok && pumpfunData?.holderCount != null) {
    holdersSectionFinal = {
      ok: true,
      source: 'holders',
      data: {
        mint,
        decimals: onChainSecurityData?.decimals ?? 6,
        supplyHuman: pumpfunData.totalSupply ?? 0,
        holders: [],
        top10ConcentrationPct: null,
        holderCountEstimate: pumpfunData.holderCount,
        estimateSource: 'pumpfun',
      },
    };
    if (!distributionSection.ok) {
      distributionSectionFinal = {
        ok: false,
        source: 'distribution',
        error:
          'Top holder breakdown temporarily unavailable (Solana RPC busy). Showing pump.fun holder count only.',
      };
    }
  }

  const holdersData = holdersSectionFinal.ok ? holdersSectionFinal.data : null;
  const distributionData = distributionSectionFinal.ok ? distributionSectionFinal.data : null;

  const market = mergeMemecoinMarketStats(
    dossierData,
    pumpfunData,
    pumpfunData?.dexPair ?? null,
  );

  const syraAlpha = computeSyraAlphaScore({
    dossier: dossierData,
    market,
    holders: holdersData,
    distribution: distributionData,
    pumpfun: pumpfunData,
    onChainSecurity: onChainSecurityData,
    kolShills: kolShillsData,
  });

  const hasCoreData = dossierSection.ok || pumpfunSection.ok || holdersSectionFinal.ok;
  if (!hasCoreData) {
    return {
      ok: false,
      error: 'Could not load token data from any source',
      status: 502,
      partial: {
        dossier: dossierSection,
        pumpfun: pumpfunSection,
        holders: holdersSectionFinal,
      },
    };
  }

  const tokenMeta = {
    symbol:
      (pumpfunData && typeof pumpfunData.symbol === 'string' && pumpfunData.symbol) ||
      (dossierData?.asset?.symbol && String(dossierData.asset.symbol)) ||
      'TOKEN',
    name:
      (pumpfunData && typeof pumpfunData.name === 'string' && pumpfunData.name) ||
      (dossierData?.asset?.name && String(dossierData.asset.name)) ||
      'Token',
    imageUri:
      (pumpfunData && typeof pumpfunData.imageUri === 'string' && pumpfunData.imageUri) ||
      (dossierData?.asset?.imageUrl && String(dossierData.asset.imageUrl)) ||
      null,
    twitter: (pumpfunData && typeof pumpfunData.twitter === 'string' && pumpfunData.twitter) || null,
    telegram: (pumpfunData && typeof pumpfunData.telegram === 'string' && pumpfunData.telegram) || null,
    website: (pumpfunData && typeof pumpfunData.website === 'string' && pumpfunData.website) || null,
  };

  const payload = {
    mint,
    chain: 'solana',
    token: tokenMeta,
    syraAlpha,
    market,
    dossier: dossierSection,
    kolShills: kolShillsSection,
    holders: holdersSectionFinal,
    distribution: distributionSectionFinal,
    onChainSecurity: onChainSecuritySection,
    pumpfun: pumpfunSection,
    fetchedAt: new Date().toISOString(),
  };

  analysisCache.set(mint, { data: payload, expires: Date.now() + ANALYSIS_CACHE_TTL_MS });

  return {
    ok: true,
    data: payload,
  };
}
