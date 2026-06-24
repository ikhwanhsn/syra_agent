/**
 * Shared agent tool execution — used by POST /agent/tools/call and POST /mcp/tools/call.
 */
import { getAgentTool, normalizeJupiterSwapParams } from '../config/agentTools.js';
import { X402_PAYSH_FLOOR_USD, PASSTHROUGH_MARGIN } from '../config/x402Pricing.js';
import { getEffectiveAgentToolPriceUsd } from './pactPricing.js';
import {
  callX402V2WithAgent,
  signAndSubmitSerializedTransaction,
  signAndSubmitSwapTransaction,
} from './agentX402Client.js';
import {
  enrichPumpfunToolParams,
  omitParamsKeys,
  substituteAgentToolPath,
  PUMPFUN_TX_TOOL_IDS,
} from './agentPumpfunTools.js';
import { pickSignalToolQueryParams } from './agentSignalToolQuery.js';
import { getAgentToolParamGateMessage } from './agentToolParamGate.js';
import { enrichGmgnToolParams } from './gmgnToolParams.js';
import { callNansenWithAgent } from './agentNansenClient.js';
import { callZerionWithAgent } from './agentZerionClient.js';
import { callBirdeyeWithAgent } from './agentBirdeyeClient.js';
import { callStablecryptoWithAgent } from './agentStablecryptoClient.js';
import { callStablesocialWithAgent } from './agentStablesocialClient.js';
import { callStableenrichWithAgent } from './agentStableenrichClient.js';
import {
  purchVaultSearch,
  purchVaultBuy,
  purchVaultDownload,
} from './agentPurchVaultClient.js';
import {
  getAgentUsdcBalance,
  getAgentAddress,
  getConnectedWalletAddress,
  getTempoPayoutRecipientAddress,
  ensureSwapToolsAllowed,
} from './agentWallet.js';
import { sendTempoPayout } from './tempoPayout.js';
import { TEMPO_PUBLIC_REFERENCE, fetchTempoTokenList } from './tempoPublic.js';
import { runAgentPartnerDirectTool } from './agentPartnerDirectTools.js';
import { chargeAgentForInternalTool } from './agentInternalToolCharge.js';
import {
  runPayshToolForAgent,
  fetchCatalog,
  findProvider,
  parsePayshForceRefresh,
} from './payshClient.js';
import { runAgentscoreToolForAgent } from './agentscoreClient.js';
import { runAipToolForAgent } from './aipClient.js';
import { resolveAgentBaseUrl } from '../routes/agent/utils.js';

/** @param {number} status @param {Record<string, unknown>} body */
function respond(status, body) {
  return { status, body };
}

/**
 * @param {{
 *   anonymousId: string;
 *   toolId: string;
 *   params?: Record<string, unknown>;
 *   ctx?: {
 *     host?: string;
 *     user?: { guest?: boolean; sessionId?: string };
 *     ip?: string;
 *     userAgent?: string;
 *     skipGuestTxBlock?: boolean;
 *   };
 * }} input
 */
export async function executeAgentToolCall(input) {
  const { anonymousId, toolId, params: rawParams = {}, ctx = {} } = input;
  try {
    if (!anonymousId || !toolId) {
      return respond(400, {
        success: false,
        error: 'anonymousId and toolId are required',
      });
    }

    const tool = getAgentTool(toolId);
    if (!tool) {
      return respond(400, {
        success: false,
        error: `Unknown tool: ${toolId}. Use GET /agent/tools to list available tools.`,
      });
    }

    const requiresTxSign =
      tool.id === 'jupiter-swap-order' || PUMPFUN_TX_TOOL_IDS.has(tool.id);
    if (requiresTxSign && ctx.user?.guest && !ctx.skipGuestTxBlock) {
      return respond(403, {
        success: false,
        error: 'auth_required',
        message:
          'Sign in with your wallet to complete swaps. Approve the Syra session signature when prompted.',
      });
    }
    if (requiresTxSign && !ctx.user?.guest) {
      await ensureSwapToolsAllowed(anonymousId);
    }

    // Tempo public: token list + network reference (no wallet spend, no USDC balance check)
    if (tool.tempoPublic) {
      const params = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      if (tool.tempoPublic === 'networks') {
        return respond(200, {
          success: true,
          toolId: tool.id,
          data: TEMPO_PUBLIC_REFERENCE,
        });
      }
      if (tool.tempoPublic === 'tokenlist') {
        const chainId = params.chainId || params.chain_id || '4217';
        const result = await fetchTempoTokenList(chainId);
        if (!result.ok) {
          return respond(502, {
            success: false,
            error: result.error,
            toolId: tool.id,
          });
        }
        return respond(200, {
          success: true,
          toolId: tool.id,
          data: result.data,
        });
      }
    }

    // Tempo payout: treasury rail; recipient resolved server-side (never from LLM). No agent USDC balance check.
    if (tool.tempoPayout) {
      if (String(process.env.TEMPO_AGENT_PAYOUT_ENABLED || '').trim() !== 'true') {
        return respond(403, {
          success: false,
          error: 'Tempo agent payouts are disabled. Set TEMPO_AGENT_PAYOUT_ENABLED=true on the server.',
          toolId: tool.id,
        });
      }

      let params = Object.fromEntries(
        Object.entries(rawParams).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );

      const maxUsdRaw = Number(process.env.TEMPO_AGENT_PAYOUT_MAX_USD || '50');
      const cap = Number.isFinite(maxUsdRaw) && maxUsdRaw > 0 ? maxUsdRaw : 50;
      const amountUsd = Number(params.amountUsd ?? params.amount_usd);
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
        return respond(400, {
          success: false,
          error: 'amountUsd is required and must be a positive number',
          toolId: tool.id,
        });
      }
      if (amountUsd > cap) {
        return respond(400, {
          success: false,
          error: `amountUsd exceeds maximum allowed per payout ($${cap})`,
          toolId: tool.id,
        });
      }

      const recipient = await getTempoPayoutRecipientAddress(anonymousId);
      if (!recipient) {
        return respond(400, {
          success: false,
          error:
            'No Tempo payout recipient: connect an EVM wallet (0x) or create a Base agent wallet so Syra has an Ethereum address to receive the payout.',
          toolId: tool.id,
        });
      }

      const memo =
        params.memo != null && String(params.memo).trim() ? String(params.memo).trim() : undefined;
      const payout = await sendTempoPayout({ to: recipient, amountUsd, memo });
      if (!payout.success) {
        return respond(502, {
          success: false,
          error: payout.error || 'Tempo payout failed',
          toolId: tool.id,
          recipient,
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: {
          transactionHash: payout.transactionHash,
          recipient,
          amountUsd,
          memo: memo ?? null,
        },
      });
    }

    // pay.sh catalog: discover + list endpoints — no USDC balance check (public catalog / OpenAPI metadata)
    if (tool.paysh === 'discover' || tool.paysh === 'endpoints') {
      const payshParams = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      const payshOut = await runPayshToolForAgent(tool.paysh, payshParams, {
        anonymousId,
        connectedWalletAddress: undefined,
      });
      if (!payshOut.success) {
        return respond(payshOut.status ?? 502, {
          success: false,
          error: payshOut.error,
          toolId: tool.id,
          ...(payshOut.budgetExceeded ? { budgetExceeded: true } : {}),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: payshOut.data,
      });
    }

    // AgentScore: discover / check / passport-status — no USDC balance check
    if (
      tool.agentscore === 'discover' ||
      tool.agentscore === 'check' ||
      tool.agentscore === 'passport-status'
    ) {
      const agentscoreParams = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      const agentscoreOut = await runAgentscoreToolForAgent(tool.agentscore, agentscoreParams, {
        anonymousId,
        connectedWalletAddress: undefined,
      });
      if (!agentscoreOut.success) {
        return respond(agentscoreOut.status ?? 502, {
          success: false,
          error: agentscoreOut.error,
          toolId: tool.id,
          ...(agentscoreOut.identityRequired ? { identityRequired: true, data: agentscoreOut.data } : {}),
          ...(agentscoreOut.budgetExceeded ? { budgetExceeded: true } : {}),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: agentscoreOut.data,
      });
    }

    // AIP: discover / resolve — no USDC balance check
    if (tool.aip === 'discover' || tool.aip === 'resolve') {
      const aipParams = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      const aipOut = await runAipToolForAgent(tool.aip, aipParams, {
        anonymousId,
        host: ctx.host,
      });
      if (!aipOut.success) {
        return respond(aipOut.status ?? 502, {
          success: false,
          error: aipOut.error,
          toolId: tool.id,
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: aipOut.data,
      });
    }

    let params = Object.fromEntries(
      Object.entries(rawParams).filter(
        ([k, v]) => typeof k === 'string' && v != null && v !== ''
      ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
    );

    // pump.fun swap: accept LLM-style from_token / to_token / amount human numbers (same normalizer as chat).
    if (tool.id === 'pumpfun-agents-swap') {
      const fromLlm = normalizeJupiterSwapParams(params);
      if (fromLlm) {
        Object.assign(params, fromLlm);
      }
    }

    // Jupiter Ultra (Corbits): same mint/amount normalizer; taker defaults to agent wallet.
    if (tool.id === 'jupiter-swap-order') {
      const fromLlm = normalizeJupiterSwapParams(params);
      if (fromLlm) {
        Object.assign(params, fromLlm);
      }
      const takerAddr = (await getAgentAddress(anonymousId)) ?? '';
      if (takerAddr && !String(params.taker || '').trim()) {
        params = { ...params, taker: takerAddr };
      }
    }

    // hey.lol tools: backend must send anonymousId so the heylol route can resolve the agent wallet
    if (tool.path && tool.path.startsWith('/heylol')) {
      params = { ...params, anonymousId };
    }

    if (tool.id.startsWith('pumpfun-')) {
      params = await enrichPumpfunToolParams(anonymousId, tool.id, params);
    }

    if (tool.id.startsWith('gmgn-')) {
      params = enrichGmgnToolParams(tool.id, params);
    }

    if (tool.id === 'signal') {
      params = pickSignalToolQueryParams(params);
      if (!String(params.source || '').trim()) {
        params = { ...params, source: 'coingecko' };
      }
    }

    const paramGateMsg = getAgentToolParamGateMessage(tool.id, tool.method || 'GET', params);
    if (paramGateMsg) {
      const apiError = paramGateMsg.replace(/^\[|\]$/g, '').trim();
      return respond(400, {
        success: false,
        skippedPayment: true,
        error: apiError,
        toolId: tool.id,
      });
    }

    // pay.sh gateway call — balance must cover max(tool price floor, provider catalog min_price_usd)
    if (tool.paysh === 'call') {
      const balanceResultCall = await getAgentUsdcBalance(anonymousId);
      if (!balanceResultCall) {
        return respond(404, {
          success: false,
          insufficientBalance: true,
          error: 'Agent wallet not found',
          message:
            'You do not have an agent wallet yet. Create one (e.g. connect wallet or start a chat) and deposit USDC to use paid tools.',
        });
      }
      const connectedWalletCall = await getConnectedWalletAddress(anonymousId);
      let providerMinUsd = 0;
      try {
        const catalog = await fetchCatalog({ forceRefresh: parsePayshForceRefresh(params) });
        const prov = findProvider(catalog.providers, params.fqn || '');
        if (!prov) {
          return respond(404, {
            success: false,
            error: `Unknown pay.sh provider fqn: ${params.fqn}`,
            toolId: tool.id,
          });
        }
        const m = Number(prov.min_price_usd);
        const providerPassthrough = Number.isFinite(m) ? m * PASSTHROUGH_MARGIN : 0;
        providerMinUsd = Math.max(X402_PAYSH_FLOOR_USD, providerPassthrough);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return respond(400, {
          success: false,
          error: msg,
          toolId: tool.id,
        });
      }
      const basePriceCall = Math.max(tool.priceUsd, providerMinUsd);
      const effectivePriceCall = getEffectiveAgentToolPriceUsd(
        { ...tool, priceUsd: basePriceCall },
        connectedWalletCall
      );
      const { usdcBalance: usdcCall } = balanceResultCall;
      if (usdcCall <= 0 || usdcCall < effectivePriceCall) {
        return respond(402, {
          success: false,
          insufficientBalance: true,
          usdcBalance: usdcCall,
          requiredUsdc: effectivePriceCall,
          toolId: tool.id,
          toolName: tool.name,
          message:
            usdcCall <= 0
              ? `Your agent wallet has 0 USDC balance. pay.sh call requires at least $${effectivePriceCall.toFixed(4)} USDC for this provider. Deposit USDC to continue.`
              : `Your agent wallet balance ($${usdcCall.toFixed(4)} USDC) is lower than $${effectivePriceCall.toFixed(4)} required for ${tool.name}.`,
        });
      }
      const payshCallOut = await runPayshToolForAgent('call', params, {
        anonymousId,
        connectedWalletAddress: connectedWalletCall || undefined,
      });
      if (!payshCallOut.success) {
        return respond(payshCallOut.status ?? 502, {
          success: false,
          error: payshCallOut.error,
          toolId: tool.id,
          ...(payshCallOut.budgetExceeded ? { budgetExceeded: true } : {}),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: payshCallOut.data,
      });
    }

    // AIP delegate — balance must cover tool price floor
    if (tool.aip === 'delegate') {
      const balanceResultAip = await getAgentUsdcBalance(anonymousId);
      if (!balanceResultAip) {
        return respond(404, {
          success: false,
          insufficientBalance: true,
          error: 'Agent wallet not found',
          message:
            'You do not have an agent wallet yet. Create one (e.g. connect wallet or start a chat) and deposit USDC to delegate to AIP agents.',
        });
      }
      const connectedWalletAip = await getConnectedWalletAddress(anonymousId);
      const effectivePriceAip = getEffectiveAgentToolPriceUsd(tool, connectedWalletAip);
      const usdcAip = balanceResultAip.usdcBalance;
      if (usdcAip <= 0 || usdcAip < effectivePriceAip) {
        return respond(402, {
          success: false,
          insufficientBalance: true,
          usdcBalance: usdcAip,
          requiredUsdc: effectivePriceAip,
          toolId: tool.id,
          toolName: tool.name,
          message:
            usdcAip <= 0
              ? `Your agent wallet has 0 USDC balance. ${tool.name} requires at least $${effectivePriceAip.toFixed(4)} USDC.`
              : `Your agent wallet balance ($${usdcAip.toFixed(4)} USDC) is lower than $${effectivePriceAip.toFixed(4)} required for ${tool.name}.`,
        });
      }
      const aipParams = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      const aipDelegateOut = await runAipToolForAgent('delegate', aipParams, {
        anonymousId,
        host: ctx.host,
      });
      if (!aipDelegateOut.success) {
        return respond(aipDelegateOut.status ?? 502, {
          success: false,
          error: aipDelegateOut.error,
          toolId: tool.id,
          ...(aipDelegateOut.data ? { data: aipDelegateOut.data } : {}),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: aipDelegateOut.data,
      });
    }

    // AgentScore pay — balance must cover tool price floor
    if (tool.agentscore === 'pay') {
      const balanceResultAgentscore = await getAgentUsdcBalance(anonymousId);
      if (!balanceResultAgentscore) {
        return respond(404, {
          success: false,
          insufficientBalance: true,
          error: 'Agent wallet not found',
          message:
            'You do not have an agent wallet yet. Create one (e.g. connect wallet or start a chat) and deposit USDC to use paid tools.',
        });
      }
      const connectedWalletAgentscore = await getConnectedWalletAddress(anonymousId);
      const effectivePriceAgentscore = getEffectiveAgentToolPriceUsd(tool, connectedWalletAgentscore);
      const usdcAgentscore = balanceResultAgentscore.usdcBalance;
      if (usdcAgentscore <= 0 || usdcAgentscore < effectivePriceAgentscore) {
        return respond(402, {
          success: false,
          insufficientBalance: true,
          usdcBalance: usdcAgentscore,
          requiredUsdc: effectivePriceAgentscore,
          toolId: tool.id,
          toolName: tool.name,
          message:
            usdcAgentscore <= 0
              ? `Your agent wallet has 0 USDC balance. ${tool.name} requires at least $${effectivePriceAgentscore.toFixed(4)} USDC.`
              : `Your agent wallet balance ($${usdcAgentscore.toFixed(4)} USDC) is lower than $${effectivePriceAgentscore.toFixed(4)} required for ${tool.name}.`,
        });
      }
      const agentscorePayOut = await runAgentscoreToolForAgent('pay', params, {
        anonymousId,
        connectedWalletAddress: connectedWalletAgentscore || undefined,
      });
      if (!agentscorePayOut.success) {
        return respond(agentscorePayOut.status ?? 502, {
          success: false,
          error: agentscorePayOut.error,
          toolId: tool.id,
          ...(agentscorePayOut.identityRequired
            ? { identityRequired: true, data: agentscorePayOut.data }
            : {}),
          ...(agentscorePayOut.budgetExceeded ? { budgetExceeded: true } : {}),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: agentscorePayOut.data,
      });
    }

    const balanceResult = await getAgentUsdcBalance(anonymousId);
    if (!balanceResult) {
      return respond(404, {
        success: false,
        insufficientBalance: true,
        error: 'Agent wallet not found',
        message:
          'You do not have an agent wallet yet. Create one (e.g. connect wallet or start a chat) and deposit USDC to use paid tools.',
      });
    }

    const connectedWallet = await getConnectedWalletAddress(anonymousId);
    const effectivePrice = getEffectiveAgentToolPriceUsd(tool, connectedWallet);
    const { usdcBalance } = balanceResult;
    const requiredUsdc = effectivePrice;
    if (usdcBalance <= 0 || usdcBalance < requiredUsdc) {
      return respond(402, {
        success: false,
        insufficientBalance: true,
        usdcBalance,
        requiredUsdc,
        toolId: tool.id,
        toolName: tool.name,
        message:
          usdcBalance <= 0
            ? `Your agent wallet has 0 USDC balance. This tool (${tool.name}) costs $${requiredUsdc.toFixed(4)}. Deposit USDC to your agent wallet to use paid tools, or ask for a normal answer without paid data.`
            : `Your agent wallet balance ($${usdcBalance.toFixed(4)} USDC) is lower than the required $${requiredUsdc.toFixed(4)} for ${tool.name}. Deposit more USDC to use this tool, or ask for a normal answer.`,
      });
    }

    // Nansen tools: call real Nansen API (api.nansen.ai) with agent wallet for x402 payment
    if (tool.nansenPath) {
      const result = await callNansenWithAgent(anonymousId, tool.nansenPath, params);
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    if (tool.zerionPath) {
      const result = await callZerionWithAgent(
        anonymousId,
        tool.zerionPath,
        tool.method || 'GET',
        params
      );
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    if (tool.birdeyePath) {
      const result = await callBirdeyeWithAgent(
        anonymousId,
        tool.birdeyePath,
        tool.method || 'GET',
        params,
        connectedWallet || undefined
      );
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    if (tool.stablecryptoPath) {
      const result = await callStablecryptoWithAgent(
        anonymousId,
        tool.stablecryptoPath,
        params,
        connectedWallet || undefined
      );
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    if (tool.stablesocialPath) {
      const result = await callStablesocialWithAgent(
        anonymousId,
        tool.stablesocialPath,
        params,
        connectedWallet || undefined
      );
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    if (tool.stableenrichPath) {
      const result = await callStableenrichWithAgent(
        anonymousId,
        tool.stableenrichPath,
        tool.stableenrichMethod || 'POST',
        params,
        tool.stableenrichAsync,
        connectedWallet || undefined
      );
      if (!result.success) {
        const status = result.budgetExceeded ? 402 : 502;
        return respond(status, {
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return respond(200, {
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    // Binance, Giza, Bankr, Neynar, SIWA, and migrated proxy tools — no public HTTP routes;
    // run server-side with same libs as former routes, and settle USDC to Syra treasury on-chain per call.
    if (tool.agentDirect) {
      const out = await runAgentPartnerDirectTool(toolId, params, { host: ctx.host });
      if (!out.ok) {
        return respond(out.status ?? 502, {
          success: false,
          error: out.error,
          toolId: tool.id,
        });
      }

      let paymentSignature = null;
      if (effectivePrice > 0) {
        const charge = await chargeAgentForInternalTool({
          anonymousId,
          priceUsd: effectivePrice,
          toolId: tool.id,
          toolPath: tool.path,
        });
        if (!charge.success) {
          return respond(402, {
            success: false,
            error: charge.error || 'Failed to charge agent wallet for this tool',
            toolId: tool.id,
          });
        }
        paymentSignature = charge.signature || null;
      }

      let data = out.data;
      const shouldSubmitSerializedTx =
        data &&
        typeof data.transaction === 'string' &&
        (PUMPFUN_TX_TOOL_IDS.has(tool.id) || tool.id === 'jupiter-swap-order');
      if (shouldSubmitSerializedTx) {
        try {
          const { signature } = await signAndSubmitSerializedTransaction(anonymousId, data.transaction, {
            toolId: tool.id,
            estimatedUsd: effectivePrice,
            sessionId: ctx.user?.sessionId,
            ip: ctx.ip,
            userAgent: ctx.userAgent || undefined,
            guest: ctx.user?.guest === true,
          });
          data = { ...data, submittedSignature: signature, submittedOnChain: true };
        } catch (pumpErr) {
          if (pumpErr?.code === 'CONFIRMATION_REQUIRED') {
            data = {
              ...data,
              submittedOnChain: false,
              confirmationRequired: true,
              intentId: pumpErr.intentId,
              expiresAt: pumpErr.expiresAt,
              submitError: 'User confirmation required',
            };
          } else {
            data = {
              ...data,
              submittedOnChain: false,
              submitError: pumpErr?.message || 'Failed to sign or submit Solana transaction',
            };
          }
        }
      }

      return respond(out.httpStatus ?? 200, {
        success: true,
        toolId: tool.id,
        data,
        ...(paymentSignature ? { paymentSignature } : {}),
      });
    }

    // Purch Vault: call api.purch.xyz (search, or buy + sign/submit + download)
    if (tool.purchVaultPath) {
      if (tool.id === 'purch-vault-search') {
        const result = await purchVaultSearch(anonymousId, params);
        if (!result.success) {
          const status = result.budgetExceeded ? 402 : 502;
          return respond(status, {
            success: false,
            error: result.error,
            toolId: tool.id,
            ...(result.budgetExceeded && { budgetExceeded: true }),
          });
        }
        return respond(200, { success: true, toolId: tool.id, data: result.data });
      }
      if (tool.id === 'purch-vault-buy') {
        const slug = params.slug && String(params.slug).trim();
        if (!slug) {
          return respond(400, {
            success: false,
            error: 'slug is required to buy a Purch Vault item',
            toolId: tool.id,
          });
        }
        const buyResult = await purchVaultBuy(anonymousId, {
          slug,
          email: (params.email && String(params.email).trim()) || undefined,
        });
        if (!buyResult.success) {
          const status = buyResult.budgetExceeded ? 402 : 502;
          return respond(status, {
            success: false,
            error: buyResult.error,
            toolId: tool.id,
            ...(buyResult.budgetExceeded && { budgetExceeded: true }),
          });
        }
        try {
          const { signature } = await signAndSubmitSwapTransaction(
            anonymousId,
            buyResult.data.serializedTransaction,
            {
              toolId: 'purch-vault-buy',
              estimatedUsd: tool.priceUsd || 1,
              sessionId: ctx.user?.sessionId,
              ip: ctx.ip,
              userAgent: ctx.userAgent || undefined,
              guest: ctx.user?.guest === true,
            }
          );
          const downloadResult = await purchVaultDownload(anonymousId, {
            purchaseId: buyResult.data.purchaseId,
            downloadToken: buyResult.data.downloadToken,
            txSignature: signature,
          });
          if (downloadResult.success) {
            return respond(200, {
              success: true,
              toolId: tool.id,
              data: {
                purchaseId: buyResult.data.purchaseId,
                item: buyResult.data.item,
                payment: buyResult.data.payment,
                purchased: true,
                downloadCompleted: true,
              },
            });
          }
          return respond(502, {
            success: false,
            error: `Purchase submitted but download failed: ${downloadResult.error}`,
            toolId: tool.id,
          });
        } catch (signErr) {
          return respond(502, {
            success: false,
            error: signErr?.message || 'Failed to sign or submit purchase transaction',
            toolId: tool.id,
          });
        }
      }
    }

    let toolPath = tool.path;
    const pathSub = substituteAgentToolPath(toolPath, params);
    if ('error' in pathSub && pathSub.error) {
      return respond(400, {
        success: false,
        error: pathSub.error,
        toolId: tool.id,
      });
    }
    toolPath = pathSub.path;
    if (pathSub.consumed?.length) {
      params = omitParamsKeys(params, pathSub.consumed);
    }

    const url = `${resolveAgentBaseUrl()}${toolPath}`;
  const method = tool.method || 'GET';
  const query = method === 'GET' || method === 'DELETE' ? params : {};
  const body = method === 'POST' ? params : undefined;

  const result = await callX402V2WithAgent({
    anonymousId,
    url,
    method,
    query,
    body,
    connectedWalletAddress: connectedWallet || undefined,
  });

  if (!result.success) {
    const status = result.budgetExceeded ? 402 : 502;
    return respond(status, {
      success: false,
      error: result.error,
      toolId: tool.id,
      ...(result.budgetExceeded && { budgetExceeded: true }),
    });
  }

    let data = result.data;
    if (PUMPFUN_TX_TOOL_IDS.has(tool.id) && data && typeof data.transaction === 'string') {
      try {
        const { signature } = await signAndSubmitSerializedTransaction(anonymousId, data.transaction, {
          toolId: tool.id,
          estimatedUsd: effectivePrice,
          sessionId: ctx.user?.sessionId,
          ip: ctx.ip,
          userAgent: ctx.userAgent || undefined,
          guest: ctx.user?.guest === true,
        });
        data = { ...data, submittedSignature: signature, submittedOnChain: true };
      } catch (pumpErr) {
        if (pumpErr?.code === 'CONFIRMATION_REQUIRED') {
          data = {
            ...data,
            submittedOnChain: false,
            confirmationRequired: true,
            intentId: pumpErr.intentId,
            expiresAt: pumpErr.expiresAt,
            submitError: 'User confirmation required',
          };
        } else {
          data = {
            ...data,
            submittedOnChain: false,
            submitError: pumpErr?.message || 'Failed to sign or submit Solana transaction',
          };
        }
      }
    }

    return respond(200, {
      success: true,
      toolId: tool.id,
      data,
    });
  } catch (error) {
    return respond(500, {
      success: false,
      error: error.message || 'Tool call failed',
    });
  }
}
