/**
 * Grow facade — deterministic yield + portfolio optimization recommendations.
 * Analysis-first; execution delegates to Invest deploy (policy-gated).
 */
import { fetchAgentWalletPortfolio } from './agentWalletPortfolio.js';
import { getInvestOpportunities } from './investService.js';
import { deployInvestCapital } from './investService.js';
import AgentWallet from '../models/agent/AgentWallet.js';

/**
 * @param {string} walletAddress
 */
export async function getGrowPortfolio(walletAddress) {
  const portfolio = await fetchAgentWalletPortfolio(walletAddress);
  const totalUsd = portfolio.totalValueUsd ?? 0;
  const allocation = (portfolio.tokens ?? []).map((t) => ({
    symbol: t.symbol,
    mint: t.mint,
    amount: t.amount,
    valueUsd: t.valueUsd,
    pct: totalUsd > 0 && t.valueUsd != null ? (t.valueUsd / totalUsd) * 100 : null,
  }));

  return {
    ...portfolio,
    allocation,
    summary: {
      totalValueUsd: totalUsd,
      tokenCount: allocation.length,
      solBalance: portfolio.solBalance,
    },
  };
}

/**
 * Deterministic rebalance/yield suggestions — not trade execution.
 * @param {{ walletAddress: string; viewerAnonymousId?: string | null }} opts
 */
export async function getGrowRecommendations(opts) {
  const { walletAddress, viewerAnonymousId } = opts;
  const portfolio = await getGrowPortfolio(walletAddress);
  const invest = await getInvestOpportunities({ viewerAnonymousId });

  /** @type {Array<{ id: string; type: string; priority: 'low' | 'medium' | 'high'; title: string; rationale: string; suggestedAdapter?: string; probabilistic: boolean }>} */
  const recommendations = [];

  const usdc = portfolio.allocation?.find((a) => a.symbol === 'USDC');
  const usdcPct = usdc?.pct ?? 0;
  const idleUsdc = usdc?.valueUsd ?? 0;

  if (idleUsdc > 10) {
    recommendations.push({
      id: 'deploy-idle-usdc-lp',
      type: 'yield',
      priority: idleUsdc > 100 ? 'high' : 'medium',
      title: 'Deploy idle USDC to yield',
      rationale: `~$${idleUsdc.toFixed(2)} USDC (${usdcPct.toFixed(1)}% of portfolio) may earn fees via Meteora LP or Giza yield — subject to market risk.`,
      suggestedAdapter: 'lp_real',
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
        'Large SOL balance relative to total assets — consider diversification. This is analysis only; no direction assumed.',
      probabilistic: true,
    });
  }

  const gizaAvailable = invest.opportunities?.some((o) => o.adapter === 'giza' && o.status === 'available');
  if (gizaAvailable && idleUsdc > 50) {
    recommendations.push({
      id: 'giza-yield-optimizer',
      type: 'yield',
      priority: 'low',
      title: 'EVM yield optimization (Giza)',
      rationale: 'Giza adapter available for Base/Arbitrum USDC yield strategies — requires explicit deploy confirmation.',
      suggestedAdapter: 'giza',
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
