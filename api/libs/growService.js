/**
 * Grow facade — deterministic yield + portfolio optimization recommendations.
 * Analysis-first; execution delegates to Invest deploy (policy-gated).
 */
import { fetchAgentWalletPortfolio } from './agentWalletPortfolio.js';
import { deployInvestCapital } from './investService.js';
import { getWalletDefiPositions } from './defiPositionsService.js';
import AgentWallet from '../models/agent/AgentWallet.js';

/**
 * @param {string} walletAddress
 */
export async function getGrowPortfolio(walletAddress) {
  const [portfolio, defi] = await Promise.all([
    fetchAgentWalletPortfolio(walletAddress),
    getWalletDefiPositions(walletAddress).catch(() => null),
  ]);

  const tokenTotalUsd = portfolio.totalValueUsd ?? 0;
  const netWorthUsd =
    defi?.netWorthUsd != null && Number.isFinite(defi.netWorthUsd)
      ? defi.netWorthUsd
      : tokenTotalUsd;

  const allocation = (portfolio.tokens ?? []).map((t) => ({
    symbol: t.symbol,
    mint: t.mint,
    amount: t.amount,
    valueUsd: t.valueUsd,
    pct: netWorthUsd > 0 && t.valueUsd != null ? (t.valueUsd / netWorthUsd) * 100 : null,
  }));

  return {
    ...portfolio,
    totalValueUsd: netWorthUsd > 0 ? netWorthUsd : portfolio.totalValueUsd,
    defi: defi ?? undefined,
    allocation,
    summary: {
      totalValueUsd: netWorthUsd > 0 ? netWorthUsd : portfolio.totalValueUsd,
      tokenValueUsd: portfolio.totalValueUsd ?? null,
      defiNetWorthUsd: defi?.netWorthUsd ?? null,
      tokenCount: allocation.length,
      solBalance: portfolio.solBalance,
      activeProtocols: defi?.activeProtocols?.length ?? 0,
      lendingNetUsd: defi?.lending?.netUsd ?? null,
      perpsCollateralUsd: defi?.perps?.collateralUsd ?? null,
      lpValueUsd: defi?.lp?.valueUsd ?? null,
      stakingValueUsd: defi?.staking?.valueUsd ?? null,
      yieldValueUsd: defi?.yield?.valueUsd ?? null,
      pendingRewardsUsd: defi?.rewards?.pendingUsd ?? null,
    },
  };
}

/**
 * Deterministic rebalance/yield suggestions — not trade execution.
 * @param {{ walletAddress: string; viewerAnonymousId?: string | null }} opts
 */
export async function getGrowRecommendations(opts) {
  const { walletAddress } = opts;
  const portfolio = await getGrowPortfolio(walletAddress);

  /** @type {Array<{ id: string; type: string; priority: 'low' | 'medium' | 'high'; title: string; rationale: string; suggestedAdapter?: string; probabilistic: boolean }>} */
  const recommendations = [];

  const usdc = portfolio.allocation?.find((a) => a.symbol === 'USDC');
  const usdcPct = usdc?.pct ?? 0;
  const idleUsdc = usdc?.valueUsd ?? 0;

  const defi = portfolio.defi;
  const pendingRewards = defi?.rewards?.pendingUsd ?? 0;
  if (pendingRewards > 1) {
    recommendations.push({
      id: 'claim-pending-rewards',
      type: 'yield',
      priority: pendingRewards > 25 ? 'high' : 'medium',
      title: 'Review unclaimed protocol rewards',
      rationale: `~$${pendingRewards.toFixed(2)} in pending rewards detected across DeFi protocols — consider claiming when gas-efficient. Analysis only.`,
      probabilistic: true,
    });
  }

  const borrowUsd = defi?.lending?.borrowUsd ?? 0;
  const depositUsd = defi?.lending?.depositUsd ?? 0;
  if (borrowUsd > 0 && depositUsd > 0) {
    const leverageRatio = borrowUsd / Math.max(depositUsd, 1);
    if (leverageRatio > 0.65) {
      recommendations.push({
        id: 'lending-health-review',
        type: 'risk',
        priority: leverageRatio > 0.85 ? 'high' : 'medium',
        title: 'Review lending health factor',
        rationale: `Borrowed ~$${borrowUsd.toFixed(2)} against ~$${depositUsd.toFixed(2)} deposits — elevated leverage may increase liquidation risk in volatile markets.`,
        probabilistic: true,
      });
    }
  }

  if (idleUsdc > 10) {
    recommendations.push({
      id: 'review-idle-usdc',
      type: 'rebalance',
      priority: idleUsdc > 100 ? 'medium' : 'low',
      title: 'Review idle USDC',
      rationale: `~$${idleUsdc.toFixed(2)} USDC (${usdcPct.toFixed(1)}% of portfolio) is liquid — consider allocation via swap if it fits your plan. Analysis only.`,
      suggestedAdapter: 'jupiter',
      probabilistic: true,
    });
  }

  if (portfolio.solBalance > 0.5 && (portfolio.totalValueUsd ?? 0) > 50) {
    recommendations.push({
      id: 'diversify-concentration',
      type: 'rebalance',
      priority: 'medium',
      title: 'Review portfolio concentration',
      rationale:
        'Large SOL balance relative to total assets — consider diversification via swap. This is analysis only; no direction assumed.',
      suggestedAdapter: 'jupiter',
      probabilistic: true,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'maintain-current',
      type: 'hold',
      priority: 'low',
      title: 'No urgent rebalance signals',
      rationale: 'Portfolio within default heuristics. Monitor via /grow/portfolio periodically.',
      probabilistic: true,
    });
  }

  return {
    recommendations,
    portfolioSummary: portfolio.summary,
    defiSummary: defi
      ? {
          netWorthUsd: defi.netWorthUsd,
          activeProtocols: defi.activeProtocols,
          lendingNetUsd: defi.lending.netUsd,
          pendingRewardsUsd: defi.rewards.pendingUsd,
        }
      : undefined,
    disclaimer:
      'Recommendations are probabilistic analysis — not financial advice or guaranteed outcomes. Apply requires explicit confirmation.',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Apply a grow recommendation via Invest deploy (confirm-gated).
 * @param {{
 *   anonymousId: string;
 *   recommendationId: string;
 *   adapter?: string;
 *   action?: string;
 *   requestContext?: import('../services/walletBroker.js').ExecuteContext;
 * }} input
 */
export async function applyGrowRecommendation(input) {
  const { anonymousId, recommendationId, adapter, action, requestContext } = input;

  const recs = await AgentWallet.findOne({ anonymousId }).lean();
  if (!recs?.agentAddress) {
    return { success: false, error: 'Agent wallet not found' };
  }

  const suggestions = await getGrowRecommendations({
    walletAddress: recs.agentAddress,
    viewerAnonymousId: anonymousId,
  });
  const match = suggestions.recommendations.find((r) => r.id === recommendationId);
  if (!match) {
    return { success: false, error: 'Unknown recommendation id' };
  }

  const targetAdapter = adapter || match.suggestedAdapter;
  if (!targetAdapter) {
    return { success: false, error: 'Recommendation has no deploy action — informational only' };
  }

  return deployInvestCapital({
    anonymousId,
    adapter: /** @type {import('./investService.js').InvestAdapterId} */ (targetAdapter),
    action,
    requestContext,
  });
}
