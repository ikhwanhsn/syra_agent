/**
 * Agent tools: list x402 resources and call them with agent wallet (balance checked first).
 * Nansen calls api.nansen.ai; Zerion calls api.zerion.io (x402); other tools call our API.
 * When connected wallet is a dev wallet (e.g. playground), pricing is cheaper (same as API playground).
 */
import express from 'express';
import { AGENT_TOOLS, getAgentTool, normalizeJupiterSwapParams } from '../../config/agentTools.js';
import { getEffectivePriceUsd } from '../../config/x402Pricing.js';
import {
  callX402V2WithAgent,
  signAndSubmitSerializedTransaction,
  signAndSubmitSwapTransaction,
} from '../../libs/agentX402Client.js';
import {
  enrichPumpfunToolParams,
  omitParamsKeys,
  substituteAgentToolPath,
  PUMPFUN_TX_TOOL_IDS,
} from '../../libs/agentPumpfunTools.js';
import { getAgentToolParamGateMessage } from '../../libs/agentToolParamGate.js';
import { callNansenWithAgent } from '../../libs/agentNansenClient.js';
import { callZerionWithAgent } from '../../libs/agentZerionClient.js';
import {
  purchVaultSearch,
  purchVaultBuy,
  purchVaultDownload,
} from '../../libs/agentPurchVaultClient.js';
import {
  getAgentUsdcBalance,
  getAgentAddress,
  getConnectedWalletAddress,
  getTempoPayoutRecipientAddress,
} from '../../libs/agentWallet.js';
import { sendTempoPayout } from '../../libs/tempoPayout.js';
import { TEMPO_PUBLIC_REFERENCE, fetchTempoTokenList } from '../../libs/tempoPublic.js';
import { runAgentPartnerDirectTool } from '../../libs/agentPartnerDirectTools.js';
import { resolveAgentBaseUrl } from './utils.js';

const router = express.Router();

/**
 * GET /agent/tools
 * List available x402 tools (resources) with id, name, description, priceUsd.
 */
router.get('/', async (req, res) => {
  try {
    const tempoAgentPayoutEnabled = String(process.env.TEMPO_AGENT_PAYOUT_ENABLED || '').trim() === 'true';
    const tools = AGENT_TOOLS.filter((t) => t.id !== 'tempo-send-payout' || tempoAgentPayoutEnabled).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      priceUsd: t.displayPriceUsd ?? t.priceUsd,
      path: t.path,
      method: t.method,
    }));
    return res.json({ success: true, tools });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/tools/call
 * Call an x402 API using the agent wallet. Always check balance first.
 * If balance is 0 or lower than price, return insufficientBalance and a message; otherwise pay and call.
 * Body: { anonymousId: string, toolId: string, params?: Record<string, string> }
 */
router.post('/call', async (req, res) => {
  try {
    const { anonymousId, toolId, params: rawParams = {} } = req.body || {};
    if (!anonymousId || !toolId) {
      return res.status(400).json({
        success: false,
        error: 'anonymousId and toolId are required',
      });
    }

    const tool = getAgentTool(toolId);
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: `Unknown tool: ${toolId}. Use GET /agent/tools to list available tools.`,
      });
    }

    // Tempo public: token list + network reference (no wallet spend, no USDC balance check)
    if (tool.tempoPublic) {
      const params = Object.fromEntries(
        Object.entries(rawParams || {}).filter(
          ([k, v]) => typeof k === 'string' && v != null && v !== ''
        ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      );
      if (tool.tempoPublic === 'networks') {
        return res.json({
          success: true,
          toolId: tool.id,
          data: TEMPO_PUBLIC_REFERENCE,
        });
      }
      if (tool.tempoPublic === 'tokenlist') {
        const chainId = params.chainId || params.chain_id || '4217';
        const result = await fetchTempoTokenList(chainId);
        if (!result.ok) {
          return res.status(502).json({
            success: false,
            error: result.error,
            toolId: tool.id,
          });
        }
        return res.json({
          success: true,
          toolId: tool.id,
          data: result.data,
        });
      }
    }

    // Tempo payout: treasury rail; recipient resolved server-side (never from LLM). No agent USDC balance check.
    if (tool.tempoPayout) {
      if (String(process.env.TEMPO_AGENT_PAYOUT_ENABLED || '').trim() !== 'true') {
        return res.status(403).json({
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
        return res.status(400).json({
          success: false,
          error: 'amountUsd is required and must be a positive number',
          toolId: tool.id,
        });
      }
      if (amountUsd > cap) {
        return res.status(400).json({
          success: false,
          error: `amountUsd exceeds maximum allowed per payout ($${cap})`,
          toolId: tool.id,
        });
      }

      const recipient = await getTempoPayoutRecipientAddress(anonymousId);
      if (!recipient) {
        return res.status(400).json({
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
        return res.status(502).json({
          success: false,
          error: payout.error || 'Tempo payout failed',
          toolId: tool.id,
          recipient,
        });
      }
      return res.json({
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

    // Normalize params to string key-value (same as chat flow) so GET query is built correctly
    let params = Object.fromEntries(
      Object.entries(rawParams).filter(
        ([k, v]) => typeof k === 'string' && v != null && v !== ''
      ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
    );

    // Jupiter swap order: use agent wallet as taker; accept LLM params (from_token, to_token, amount).
    if (tool.id === 'jupiter-swap-order') {
      const agentAddr = await getAgentAddress(anonymousId);
      if (agentAddr) params.taker = agentAddr;
      const fromLlm = normalizeJupiterSwapParams(params);
      if (fromLlm) {
        Object.assign(params, fromLlm);
      }
    }

    // hey.lol tools: backend must send anonymousId so the heylol route can resolve the agent wallet
    if (tool.path && tool.path.startsWith('/heylol')) {
      params = { ...params, anonymousId };
    }

    if (tool.id.startsWith('pumpfun-')) {
      params = await enrichPumpfunToolParams(anonymousId, tool.id, params);
    }

    if (tool.id === 'signal' && !String(params.source || '').trim()) {
      params = { ...params, source: 'coingecko' };
    }

    const paramGateMsg = getAgentToolParamGateMessage(tool.id, tool.method || 'GET', params);
    if (paramGateMsg) {
      const apiError = paramGateMsg.replace(/^\[|\]$/g, '').trim();
      return res.status(400).json({
        success: false,
        skippedPayment: true,
        error: apiError,
        toolId: tool.id,
      });
    }

    const balanceResult = await getAgentUsdcBalance(anonymousId);
    if (!balanceResult) {
      return res.status(404).json({
        success: false,
        insufficientBalance: true,
        error: 'Agent wallet not found',
        message:
          'You do not have an agent wallet yet. Create one (e.g. connect wallet or start a chat) and deposit USDC to use paid tools.',
      });
    }

    const connectedWallet = await getConnectedWalletAddress(anonymousId);
    const effectivePrice = getEffectivePriceUsd(tool.priceUsd, connectedWallet) ?? tool.priceUsd;
    const { usdcBalance } = balanceResult;
    const requiredUsdc = effectivePrice;
    if (usdcBalance <= 0 || usdcBalance < requiredUsdc) {
      return res.status(402).json({
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
        return res.status(status).json({
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return res.json({
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
        return res.status(status).json({
          success: false,
          error: result.error,
          toolId: tool.id,
          ...(result.budgetExceeded && { budgetExceeded: true }),
        });
      }
      return res.json({
        success: true,
        toolId: tool.id,
        data: result.data,
      });
    }

    // Binance, Giza, Bankr, Neynar, SIWA — no public HTTP routes; run server-side with same libs as former routes
    if (tool.agentDirect) {
      const out = await runAgentPartnerDirectTool(toolId, params, { host: req.get('host') });
      if (!out.ok) {
        return res.status(out.status ?? 502).json({
          success: false,
          error: out.error,
          toolId: tool.id,
        });
      }
      return res.status(out.httpStatus ?? 200).json({
        success: true,
        toolId: tool.id,
        data: out.data,
      });
    }

    // Purch Vault: call api.purch.xyz (search, or buy + sign/submit + download)
    if (tool.purchVaultPath) {
      if (tool.id === 'purch-vault-search') {
        const result = await purchVaultSearch(anonymousId, params);
        if (!result.success) {
          const status = result.budgetExceeded ? 402 : 502;
          return res.status(status).json({
            success: false,
            error: result.error,
            toolId: tool.id,
            ...(result.budgetExceeded && { budgetExceeded: true }),
          });
        }
        return res.json({ success: true, toolId: tool.id, data: result.data });
      }
      if (tool.id === 'purch-vault-buy') {
        const slug = params.slug && String(params.slug).trim();
        if (!slug) {
          return res.status(400).json({
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
          return res.status(status).json({
            success: false,
            error: buyResult.error,
            toolId: tool.id,
            ...(buyResult.budgetExceeded && { budgetExceeded: true }),
          });
        }
        try {
          const { signature } = await signAndSubmitSwapTransaction(
            anonymousId,
            buyResult.data.serializedTransaction
          );
          const downloadResult = await purchVaultDownload(anonymousId, {
            purchaseId: buyResult.data.purchaseId,
            downloadToken: buyResult.data.downloadToken,
            txSignature: signature,
          });
          if (downloadResult.success) {
            return res.json({
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
          return res.status(502).json({
            success: false,
            error: `Purchase submitted but download failed: ${downloadResult.error}`,
            toolId: tool.id,
          });
        } catch (signErr) {
          return res.status(502).json({
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
      return res.status(400).json({
        success: false,
        error: pathSub.error,
        toolId: tool.id,
      });
    }
    toolPath = pathSub.path;
    if (pathSub.consumed?.length) {
      params = omitParamsKeys(params, pathSub.consumed);
    }

    const url = `${resolveAgentBaseUrl(req)}${toolPath}`;
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
    return res.status(status).json({
      success: false,
      error: result.error,
      toolId: tool.id,
      ...(result.budgetExceeded && { budgetExceeded: true }),
    });
  }

    let data = result.data;
    // Jupiter swap: sign and submit the transaction with the agent wallet so the swap executes (agent balance reduced).
    if (tool.id === 'jupiter-swap-order' && data?.transaction) {
      try {
        const { signature } = await signAndSubmitSwapTransaction(anonymousId, data.transaction);
        data = { ...data, swapSignature: signature, swapSubmitted: true };
      } catch (swapErr) {
        data = {
          ...data,
          swapSubmitted: false,
          swapError: swapErr?.message || 'Failed to submit swap transaction',
        };
      }
    } else if (PUMPFUN_TX_TOOL_IDS.has(tool.id) && data && typeof data.transaction === 'string') {
      try {
        const { signature } = await signAndSubmitSerializedTransaction(anonymousId, data.transaction);
        data = { ...data, submittedSignature: signature, submittedOnChain: true };
      } catch (pumpErr) {
        data = {
          ...data,
          submittedOnChain: false,
          submitError: pumpErr?.message || 'Failed to sign or submit pump.fun transaction',
        };
      }
    }

    return res.json({
      success: true,
      toolId: tool.id,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Tool call failed',
    });
  }
});

export async function createAgentToolsRouter() {
  return router;
}

export default router;
