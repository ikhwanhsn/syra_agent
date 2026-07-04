/**
 * Invest facade — public surface is Jupiter swap only.
 * Giza, RISE, and Meteora DLMM (lp_real) stay internal / not listed publicly.
 */
import { executeIntent } from '../services/walletBroker.js';
import { getAgentTool } from '../config/agentTools.js';
import AgentWallet from '../models/agent/AgentWallet.js';

/** @typedef {'giza' | 'lp_real' | 'jupiter' | 'rise'} InvestAdapterId */

/** Adapters exposed on the public Invest opportunities board. */
const PUBLIC_ADAPTERS = new Set(['jupiter']);

/**
 * @param {{ viewerAnonymousId?: string | null }} [opts]
 */
export async function getInvestOpportunities(_opts = {}) {
  const opportunities = [
    {
      adapter: 'jupiter',
      label: 'Jupiter swap',
      chain: 'solana',
      description: 'Same-chain token swaps via Jupiter Ultra — policy-gated when executed from an agent wallet.',
      status: 'available',
      toolId: 'jupiter-swap-order',
    },
  ];

  return {
    opportunities,
    disclaimer:
      'Invest outputs are probabilistic analysis and deployment options — not guaranteed returns. Execution requires policy approval.',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Public positions list — no internal adapters (e.g. DLMM) are surfaced.
 * @param {{ viewerAnonymousId?: string | null; limit?: number; offset?: number }} [opts]
 */
export async function getInvestPositions(_opts = {}) {
  return {
    positions: [],
    count: 0,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Policy-gated deploy — public path is Jupiter only.
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
  const { anonymousId, adapter, toolId, params = {}, requestContext } = input;

  if (!anonymousId) {
    return { success: false, error: 'anonymousId required' };
  }

  if (!PUBLIC_ADAPTERS.has(adapter)) {
    return {
      success: false,
      error: `Adapter "${adapter}" is not available on the public Invest surface.`,
    };
  }

  if (adapter === 'jupiter') {
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

  return { success: false, error: `Unknown adapter: ${adapter}` };
}
