/**
 * Invest facade — unifies Giza, LP-Real Meteora, Jupiter, and RISE adapters.
 * Read + policy-gated deploy; delegates to existing services (no new execution logic).
 */
import { hasGizaCredentials } from './gizaClient.js';
import {
  getLpRealSummary,
  listLpRealPositions,
  enableLpReal,
} from './lpRealService.js';
import { executeIntent } from '../services/walletBroker.js';
import { getAgentTool } from '../config/agentTools.js';
import AgentWallet from '../models/agent/AgentWallet.js';

/** @typedef {'giza' | 'lp_real' | 'jupiter' | 'rise'} InvestAdapterId */

/**
 * @param {{ viewerAnonymousId?: string | null }} [opts]
 */
export async function getInvestOpportunities(opts = {}) {
  const opportunities = [];

  if (hasGizaCredentials()) {
    opportunities.push({
      adapter: 'giza',
      label: 'Giza yield optimization',
      chain: 'evm',
      description: 'DeFi yield optimization on Base/Arbitrum via Giza Agent SDK',
      status: 'available',
      actions: ['activate', 'top-up', 'run-optimizer', 'withdraw'],
    });
  } else {
    opportunities.push({
      adapter: 'giza',
      label: 'Giza yield optimization',
      chain: 'evm',
      description: 'Configure GIZA_API_KEY to enable',
      status: 'unconfigured',
    });
  }

  opportunities.push({
    adapter: 'lp_real',
    label: 'Meteora DLMM LP agent',
    chain: 'solana',
    description: 'Autonomous liquidity provision on Meteora DLMM from agent wallet',
    status: 'available',
    actions: ['enable', 'open-position', 'close-position', 'claim-fees'],
  });

  opportunities.push({
    adapter: 'jupiter',
    label: 'Jupiter swap',
    chain: 'solana',
    description: 'Same-chain token swaps via Jupiter Ultra (policy-gated)',
    status: 'available',
    toolId: 'jupiter-swap-order',
  });

  opportunities.push({
    adapter: 'rise',
    label: 'RISE markets',
    chain: 'solana',
    description: 'UpOnly/RISE market creation, buy/sell, borrow/lend',
    status: 'available',
    actions: ['buy', 'sell', 'borrow', 'repay'],
  });

  if (opts.viewerAnonymousId) {
    try {
      const summary = await getLpRealSummary({ viewerAnonymousId: opts.viewerAnonymousId });
      const lpOpp = opportunities.find((o) => o.adapter === 'lp_real');
      if (lpOpp && summary) {
        lpOpp.summary = {
          enabled: summary.enabled,
          openPositions: summary.openPositionCount ?? 0,
          deployedSol: summary.deployedSol ?? null,
        };
      }
    } catch {
      // non-fatal
    }
  }

  return {
    opportunities,
    disclaimer:
      'Invest outputs are probabilistic analysis and deployment options — not guaranteed returns. Execution requires policy approval.',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * @param {{ viewerAnonymousId?: string | null; limit?: number; offset?: number }} [opts]
 */
export async function getInvestPositions(opts = {}) {
  const positions = [];

  if (opts.viewerAnonymousId) {
    try {
      const lp = await listLpRealPositions({
        viewerAnonymousId: opts.viewerAnonymousId,
        limit: opts.limit ?? 50,
        offset: opts.offset ?? 0,
        status: 'open',
      });
      if (lp?.items?.length) {
        for (const p of lp.items) {
          positions.push({
            adapter: 'lp_real',
            id: p._id?.toString?.() ?? p.id,
            pool: p.poolAddress ?? p.pool,
            status: p.status,
            strategyId: p.strategyId,
            deployedSol: p.deployedSol ?? null,
            netPnlPct: p.netPnlPct ?? null,
          });
        }
      }
    } catch {
      // non-fatal
    }
  }

  return {
    positions,
    count: positions.length,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Policy-gated deploy — routes to the appropriate adapter.
 * @param {{
 *   anonymousId: string;
 *   adapter: InvestAdapterId;
 *   action?: string;
 *   toolId?: string;
 *   params?: Record<string, unknown>;
 *   requestContext?: import('../services/walletBroker.js').ExecuteContext;
 * }} input
 */
export async function deployInvestCapital(input) {
  const { anonymousId, adapter, action, toolId, params = {}, requestContext } = input;

  if (!anonymousId) {
    return { success: false, error: 'anonymousId required' };
  }

  switch (adapter) {
    case 'lp_real': {
      if (action === 'enable' || !action) {
        const result = await enableLpReal({ anonymousId, enabledBy: anonymousId });
        return { success: true, data: { adapter, action: 'enable', result } };
      }
      return {
        success: false,
        error: `Unsupported lp_real action: ${action}. Use /experiment/lp-agent-real for advanced ops.`,
      };
    }
    case 'jupiter': {
      const tid = toolId || 'jupiter-swap-order';
      const tool = getAgentTool(tid);
      if (!tool) return { success: false, error: `Unknown tool: ${tid}` };
      const wallet = await AgentWallet.findOne({ anonymousId }).lean();
      if (!wallet?.agentAddress) {
        return { success: false, error: 'Agent wallet not provisioned' };
      }
      const estimatedUsd = Number(params.estimatedUsd ?? tool.priceUsd ?? 0.01);
      const brokerResult = await executeIntent(
        {
          type: 'x402_pay',
          chain: 'solana',
          toolId: tid,
          estimatedUsd,
          summary: `Invest deploy via ${tid}`,
          params,
        },
        { anonymousId, ...requestContext },
      );
      return { success: brokerResult.status === 'ok', data: { adapter, toolId: tid, brokerResult } };
    }
    case 'giza': {
      if (!hasGizaCredentials()) {
        return { success: false, error: 'Giza is not configured on this deployment' };
      }
      return {
        success: true,
        data: {
          adapter,
          action: action || 'activate',
          message:
            'Use POST /giza/activate or agent tool giza-activate with x402 payment. Invest facade confirms Giza is available.',
          configured: true,
        },
      };
    }
    case 'rise': {
      return {
        success: true,
        data: {
          adapter,
          action: action || 'buy',
          message: 'Use rise-* agent tools or /uponly-rise-* routes for RISE market operations.',
          toolIds: ['rise-buy-token', 'rise-sell-token', 'rise-deposit-and-borrow'],
        },
      };
    }
    default:
      return { success: false, error: `Unknown adapter: ${adapter}` };
  }
}
