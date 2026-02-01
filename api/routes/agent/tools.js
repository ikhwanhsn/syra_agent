/**
 * Agent tools: list x402 v2 resources and call them with agent wallet (balance checked first).
 * If user has 0 balance or lower than price, return insufficientBalance and message; otherwise pay and call.
 */
import express from 'express';
import { AGENT_TOOLS, getAgentTool } from '../../config/agentTools.js';
import { callX402V2WithAgent } from '../../libs/agentX402Client.js';
import { getAgentUsdcBalance } from '../../libs/agentWallet.js';
import { resolveAgentBaseUrl } from './utils.js';

const router = express.Router();

/**
 * GET /agent/tools
 * List available x402 v2 tools (resources) with id, name, description, priceUsd.
 */
router.get('/', async (req, res) => {
  try {
    const tools = AGENT_TOOLS.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      priceUsd: t.priceUsd,
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
 * Call an x402 v2 API using the agent wallet. Always check balance first.
 * If balance is 0 or lower than price, return insufficientBalance and a message; otherwise pay and call.
 * Body: { anonymousId: string, toolId: string, params?: Record<string, string> }
 */
router.post('/call', async (req, res) => {
  try {
    const { anonymousId, toolId, params = {} } = req.body || {};
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

    const { usdcBalance } = balanceResult;
    const requiredUsdc = tool.priceUsd;
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

    const url = `${resolveAgentBaseUrl(req)}${tool.path}`;
    const method = tool.method || 'GET';
    const query = method === 'GET' ? params : {};
    const body = method === 'POST' ? params : undefined;

    const result = await callX402V2WithAgent({
      anonymousId,
      url,
      method,
      query,
      body,
    });

    if (!result.success) {
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
