/**
 * Invest facade — public board lists onchain Solana protocols from investCatalog.
 * Liquid-staking deposits (Marinade, Jito) execute via walletBroker + invest agent wallet.
 * Internal adapters (giza, lp_real, rise) stay off the public board.
 */
import AgentWallet from '../models/agent/AgentWallet.js';
import {
  EXECUTABLE_INVEST_ADAPTERS,
  INVEST_CATALOG,
  PUBLIC_INVEST_ADAPTERS,
  getInvestCatalogEntry,
} from '../config/investCatalog.js';
import { getAgentTool } from '../config/agentTools.js';
import { siblingAnonymousId, purposeQuery } from './agentWalletPurpose.js';
import { fetchInvestYieldsByAdapter } from './investYieldsService.js';
import { buildMarinadeDepositTx } from './invest/marinadeExecutor.js';
import { buildJitoDepositTx } from './invest/jitoStakePoolExecutor.js';
import { executeIntent } from '../services/walletBroker.js';

/** @typedef {'marinade' | 'jito' | 'kamino' | 'marginfi' | 'meteora' | 'jupiter' | 'giza' | 'lp_real' | 'rise'} InvestAdapterId */

const SOL_PRICE_FALLBACK_USD = 150;

/**
 * @param {string} anonymousId — session or sibling id
 */
async function resolveInvestWallet(anonymousId) {
  const investAid = siblingAnonymousId(anonymousId, 'invest');
  if (!investAid) {
    return { error: 'Invalid anonymous id' };
  }
  const wallet = await AgentWallet.findOne({
    anonymousId: investAid,
    chain: 'solana',
    status: 'active',
    ...purposeQuery('invest'),
  }).lean();
  if (!wallet?.agentAddress) {
    return { error: 'Invest wallet not provisioned. Fund Invest from Wallet first.' };
  }
  return { investAid, wallet };
}

/**
 * Rough SOL→USD for policy caps. Prefer live price when available; never block on failure.
 * @returns {Promise<number>}
 */
async function estimateSolUsd() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5_000) },
    );
    if (!res.ok) return SOL_PRICE_FALLBACK_USD;
    const json = await res.json();
    const n = Number(json?.solana?.usd);
    return Number.isFinite(n) && n > 0 ? n : SOL_PRICE_FALLBACK_USD;
  } catch {
    return SOL_PRICE_FALLBACK_USD;
  }
}

/**
 * Ensure deposit toolId is permitted when the wallet has a restrictive allowlist.
 * @param {string} investAid
 * @param {string} toolId
 */
async function ensureInvestToolAllowed(investAid, toolId) {
  const wallet = await AgentWallet.findOne({ anonymousId: investAid }).select('allowedTools').lean();
  const current = Array.isArray(wallet?.allowedTools) ? wallet.allowedTools : [];
  if (current.length === 0 || current.includes(toolId)) return;
  await AgentWallet.updateOne(
    { anonymousId: investAid },
    { $addToSet: { allowedTools: toolId } },
  );
}

/**
 * @param {{ viewerAnonymousId?: string | null }} [opts]
 */
export async function getInvestOpportunities(_opts = {}) {
  let yieldsByAdapter = {};
  try {
    yieldsByAdapter = await fetchInvestYieldsByAdapter();
  } catch (err) {
    console.warn('[investService] yields unavailable:', err?.message || err);
  }

  const opportunities = INVEST_CATALOG.map((entry) => {
    const y = yieldsByAdapter[entry.id] || {};
    return {
      adapter: entry.id,
      label: entry.label,
      protocol: entry.protocol,
      chain: entry.chain,
      kind: entry.kind,
      description: entry.description,
      status: 'available',
      toolId: entry.toolId,
      executable: entry.executable,
      deepLinkUrl: entry.deepLinkUrl,
      riskNote: entry.riskNote,
      apyPct: y.apyPct ?? null,
      tvlUsd: y.tvlUsd ?? null,
      yieldSource: y.source ?? null,
      yieldSymbol: y.symbol ?? null,
      actions: entry.executable ? ['deposit'] : ['external'],
    };
  });

  return {
    opportunities,
    disclaimer:
      'Invest outputs are probabilistic analysis and deployment options — not guaranteed returns. Live APY/TVL from DefiLlama. Onchain deposits (Marinade, Jito) execute from your invest agent wallet and require policy approval.',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Public positions list — stub until LST balance aggregation ships.
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
 * Legacy deploy path — Jupiter x402 tool only (kept for Grow apply / agents).
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

  if (adapter !== 'jupiter') {
    return {
      success: false,
      error: `Adapter "${adapter}" is not available via /invest/deploy. Use /invest/deposit for liquid staking.`,
    };
  }

  const tid = toolId || 'jupiter-swap-order';
  const tool = getAgentTool(tid);
  if (!tool) return { success: false, error: `Unknown tool: ${tid}` };

  const resolved = await resolveInvestWallet(anonymousId);
  if (resolved.error) return { success: false, error: resolved.error };
  const { investAid } = resolved;

  const estimatedUsd = Number(params.estimatedUsd ?? tool.priceUsd ?? 0.01);
  const brokerResult = await executeIntent(
    {
      anonymousId: investAid,
      sessionId: requestContext?.sessionId,
      ip: requestContext?.ip,
      userAgent: requestContext?.userAgent,
      guest: Boolean(requestContext?.guest),
      requestId: requestContext?.requestId,
    },
    {
      type: 'x402_pay',
      chain: 'solana',
      toolId: tid,
      estimatedUsd,
      summary: `Invest deploy via ${tid}`,
      params,
    },
  );
  return { success: brokerResult.status === 'ok', data: { adapter, toolId: tid, brokerResult } };
}

/**
 * Policy-gated liquid-staking deposit from the invest agent wallet.
 * @param {{
 *   anonymousId: string;
 *   adapter: string;
 *   amountSol: number;
 *   requestContext?: import('../services/walletBroker.js').ExecuteContext;
 * }} input
 */
export async function deployInvestDeposit(input) {
  const { anonymousId, adapter, amountSol, requestContext } = input;

  if (!anonymousId) {
    return { success: false, error: 'anonymousId required' };
  }

  const entry = getInvestCatalogEntry(adapter);
  if (!entry || !PUBLIC_INVEST_ADAPTERS.has(entry.id)) {
    return { success: false, error: `Unknown invest adapter: ${adapter}` };
  }
  if (!EXECUTABLE_INVEST_ADAPTERS.has(entry.id)) {
    return {
      success: false,
      error: `${entry.label} is not executable in-app. Open ${entry.deepLinkUrl || 'the protocol dApp'} to invest.`,
    };
  }

  const amount = Number(amountSol);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: 'amountSol must be a positive number' };
  }

  const resolved = await resolveInvestWallet(anonymousId);
  if (resolved.error) return { success: false, error: resolved.error };
  const { investAid, wallet } = resolved;

  let built;
  try {
    if (entry.id === 'marinade') {
      built = await buildMarinadeDepositTx({
        agentAddress: wallet.agentAddress,
        amountSol: amount,
      });
    } else if (entry.id === 'jito') {
      built = await buildJitoDepositTx({
        agentAddress: wallet.agentAddress,
        amountSol: amount,
      });
    } else {
      return { success: false, error: `No executor for adapter: ${entry.id}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  await ensureInvestToolAllowed(investAid, entry.toolId);

  const solUsd = await estimateSolUsd();
  const estimatedUsd = amount * solUsd;
  const summary = `Deposit ${amount} SOL into ${entry.label} (${entry.kind.replace('_', ' ')})`;

  const brokerResult = await executeIntent(
    {
      anonymousId: investAid,
      sessionId: requestContext?.sessionId,
      ip: requestContext?.ip,
      userAgent: requestContext?.userAgent,
      guest: Boolean(requestContext?.guest),
      requestId: requestContext?.requestId,
    },
    {
      type: 'tx_sign',
      chain: 'solana',
      toolId: entry.toolId,
      serializedTxBase64: built.serializedTxBase64,
      lastValidBlockHeight: built.lastValidBlockHeight,
      estimatedUsd,
      summary,
      params: { adapter: entry.id, amountSol: amount },
    },
  );

  if (brokerResult.status === 'pending_confirmation') {
    return {
      success: true,
      data: {
        adapter: entry.id,
        toolId: entry.toolId,
        amountSol: amount,
        status: 'pending_confirmation',
        intentId: brokerResult.intentId,
        expiresAt: brokerResult.expiresAt,
        summary: brokerResult.summary,
        agentAddress: wallet.agentAddress,
      },
    };
  }

  if (brokerResult.status !== 'ok') {
    return {
      success: false,
      error: `Deposit refused: ${(brokerResult.reasons || []).join('; ') || 'policy_denied'}`,
      data: { adapter: entry.id, brokerResult },
    };
  }

  return {
    success: true,
    data: {
      adapter: entry.id,
      toolId: entry.toolId,
      amountSol: amount,
      status: 'ok',
      signature: brokerResult.signature,
      agentAddress: wallet.agentAddress,
    },
  };
}
