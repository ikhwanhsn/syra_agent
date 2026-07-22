/**
 * On-chain / market data fetchers for x402 Labs /insights/* endpoints.
 */
import { fetchPythPrices, parsePythPriceRequest } from '../pythHermesService.js';
import { fetchDefillamaTvl } from '../defillamaService.js';
import { fetchDexscreenerPairs } from '../dexscreenerService.js';
import { withSolanaRpcFallback } from '../solanaServerRpc.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

/** Fail fast on slow primary RPC so withSolanaRpcFallback can try the next URL. */
const INSIGHTS_RPC_TIMEOUT_MS = Number.parseInt(process.env.INSIGHTS_RPC_TIMEOUT_MS || '3500', 10);

const insightsRpcOpts = {
  timeoutMs: Number.isFinite(INSIGHTS_RPC_TIMEOUT_MS) && INSIGHTS_RPC_TIMEOUT_MS > 0
    ? INSIGHTS_RPC_TIMEOUT_MS
    : 3500,
};

/**
 * @returns {Promise<object>}
 */
export async function fetchNetworkHealthInsight() {
  return withSolanaRpcFallback(async (connection) => {
    const [slot, epochInfo, perfSamples, recentPrioritizationFees] = await Promise.all([
      connection.getSlot('confirmed'),
      connection.getEpochInfo('confirmed'),
      connection.getRecentPerformanceSamples(5).catch(() => []),
      connection.getRecentPrioritizationFees().catch(() => []),
    ]);

    const avgTps =
      Array.isArray(perfSamples) && perfSamples.length > 0
        ? perfSamples.reduce((s, p) => s + (p.numTransactions / Math.max(p.samplePeriodSecs, 1)), 0) /
          perfSamples.length
        : null;

    const fees = Array.isArray(recentPrioritizationFees)
      ? recentPrioritizationFees.map((f) => f.prioritizationFee).filter((n) => Number.isFinite(n))
      : [];
    const medianFee =
      fees.length > 0
        ? [...fees].sort((a, b) => a - b)[Math.floor(fees.length / 2)]
        : null;

    return {
      network: 'solana-mainnet',
      slot,
      epoch: epochInfo?.epoch ?? null,
      slotIndex: epochInfo?.slotIndex ?? null,
      slotsInEpoch: epochInfo?.slotsInEpoch ?? null,
      avgTps: avgTps != null ? Math.round(avgTps * 100) / 100 : null,
      medianPriorityFeeLamports: medianFee,
      computedAt: new Date().toISOString(),
    };
  }, 'insights network-health', insightsRpcOpts);
}

/**
 * @returns {Promise<object>}
 */
export async function fetchGasOracleInsight() {
  return withSolanaRpcFallback(async (connection) => {
    const recent = await connection.getRecentPrioritizationFees().catch(() => []);
    const fees = Array.isArray(recent)
      ? recent.map((f) => f.prioritizationFee).filter((n) => Number.isFinite(n) && n >= 0)
      : [];
    fees.sort((a, b) => a - b);

    const pct = (p) => {
      if (fees.length === 0) return null;
      const idx = Math.min(fees.length - 1, Math.floor((p / 100) * fees.length));
      return fees[idx];
    };

    return {
      network: 'solana-mainnet',
      sampleCount: fees.length,
      minLamports: fees.length ? fees[0] : null,
      p25Lamports: pct(25),
      p50Lamports: pct(50),
      p75Lamports: pct(75),
      p95Lamports: pct(95),
      maxLamports: fees.length ? fees[fees.length - 1] : null,
      computedAt: new Date().toISOString(),
    };
  }, 'insights gas-oracle', insightsRpcOpts);
}

/**
 * @returns {Promise<object>}
 */
export async function fetchMarketPulseInsight() {
  const params = parsePythPriceRequest({
    method: 'GET',
    query: { symbols: 'SOL/USD,BTC/USD,ETH/USD' },
  });
  const data = await fetchPythPrices(params);
  return {
    assets: (data.prices ?? []).map((p) => ({
      symbol: p.symbol,
      priceUsd: p.priceUsd,
      confidenceUsd: p.confidenceUsd ?? null,
      publishTime: p.publishTime ?? null,
    })),
    count: data.count ?? 0,
    computedAt: data.computedAt ?? new Date().toISOString(),
  };
}

/**
 * @returns {Promise<object>}
 */
export async function fetchTokenMetricsInsight() {
  const data = await fetchDexscreenerPairs({
    mode: 'token',
    chainId: 'solana',
    tokenAddress: SOL_MINT,
  });
  const pairs = (data.pairs ?? []).slice(0, 5).map((p) => ({
    pairAddress: p.pairAddress,
    dexId: p.dexId,
    baseToken: p.baseToken?.symbol,
    quoteToken: p.quoteToken?.symbol,
    priceUsd: p.priceUsd,
    volume24h: p.volume?.h24,
    priceChange24h: p.priceChange24h,
    liquidityUsd: p.liquidity?.usd,
  }));
  return {
    token: 'SOL',
    mint: SOL_MINT,
    pairs,
    count: pairs.length,
    computedAt: data.computedAt ?? new Date().toISOString(),
  };
}

/**
 * @returns {Promise<object>}
 */
export async function fetchDefiTvlInsight() {
  const data = await fetchDefillamaTvl({ mode: 'chain', chain: 'Solana' });
  return {
    chain: 'Solana',
    currentTvlUsd: data.currentTvlUsd,
    name: data.name,
    mode: data.mode,
    computedAt: data.computedAt ?? new Date().toISOString(),
  };
}

/**
 * @returns {Promise<object>}
 */
export async function fetchVolatilityIndexInsight() {
  const params = parsePythPriceRequest({
    method: 'GET',
    query: { symbols: 'SOL/USD,BTC/USD,ETH/USD' },
  });
  const data = await fetchPythPrices(params);
  const prices = data.prices ?? [];
  const confidences = prices
    .map((p) => {
      if (!p.priceUsd || !p.confidenceUsd) return null;
      return (p.confidenceUsd / p.priceUsd) * 100;
    })
    .filter((v) => v != null && Number.isFinite(v));

  const avgUncertainty =
    confidences.length > 0
      ? confidences.reduce((s, v) => s + v, 0) / confidences.length
      : null;

  const indexScore =
    avgUncertainty != null ? Math.min(100, Math.round(avgUncertainty * 1000) / 10) : null;

  return {
    indexScore,
    avgPriceUncertaintyPct: avgUncertainty != null ? Math.round(avgUncertainty * 10000) / 10000 : null,
    components: prices.map((p) => ({
      symbol: p.symbol,
      priceUsd: p.priceUsd,
      confidenceUsd: p.confidenceUsd ?? null,
      uncertaintyPct:
        p.priceUsd && p.confidenceUsd
          ? Math.round((p.confidenceUsd / p.priceUsd) * 10000) / 100
          : null,
    })),
    computedAt: data.computedAt ?? new Date().toISOString(),
  };
}

/**
 * Premium combined snapshot — network health, market pulse, and DeFi TVL.
 * PayAI-facilitated Labs endpoint with a strict daily call cap.
 * @returns {Promise<object>}
 */
export async function fetchEcosystemBriefInsight() {
  const [network, market, defi] = await Promise.all([
    fetchNetworkHealthInsight(),
    fetchMarketPulseInsight(),
    fetchDefiTvlInsight(),
  ]);

  return {
    facilitator: 'payai',
    network: {
      slot: network.slot ?? null,
      avgTps: network.avgTps ?? null,
      medianPriorityFeeLamports: network.medianPriorityFeeLamports ?? null,
    },
    market: {
      assets: market.assets ?? [],
      count: market.count ?? 0,
    },
    defi: {
      chain: defi.chain ?? 'Solana',
      currentTvlUsd: defi.currentTvlUsd ?? null,
    },
    computedAt: new Date().toISOString(),
  };
}
