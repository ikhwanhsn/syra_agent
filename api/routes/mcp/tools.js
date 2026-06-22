/**
 * MCP bridge — server-side agent tool execution for external MCP clients.
 * POST /mcp/tools/call with X-MCP-API-Key (SYRA_MCP_API_KEY).
 */
import express from 'express';
import rateLimit from '../../utils/rateLimit.js';
import { executeAgentToolCall } from '../../libs/agentToolExecutor.js';

const router = express.Router();

function isMcpBridgeEnabled() {
  return String(process.env.SYRA_MCP_BRIDGE_ENABLED || '').trim() === 'true';
}

function getExpectedMcpApiKey() {
  return (process.env.SYRA_MCP_API_KEY || '').trim();
}

function getMcpAgentAnonymousId() {
  return (process.env.SYRA_MCP_AGENT_ANONYMOUS_ID || '').trim();
}

const mcpCallLimiter = rateLimit.simple({
  windowMs: 60 * 1000,
  max: Number(process.env.SYRA_MCP_RATE_LIMIT_PER_MIN || 120),
  message: { success: false, error: 'MCP rate limit exceeded. Try again later.' },
});

function requireMcpApiKey(req, res, next) {
  if (!isMcpBridgeEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'MCP bridge is disabled. Set SYRA_MCP_BRIDGE_ENABLED=true on the API server.',
    });
  }

  const expected = getExpectedMcpApiKey();
  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'MCP bridge is not configured. Set SYRA_MCP_API_KEY on the API server.',
    });
  }

  const provided = String(req.headers['x-mcp-api-key'] || req.headers['x-api-key'] || '').trim();
  if (!provided || provided !== expected) {
    return res.status(401).json({ success: false, error: 'Invalid or missing X-MCP-API-Key' });
  }

  const anonymousId = getMcpAgentAnonymousId();
  if (!anonymousId) {
    return res.status(503).json({
      success: false,
      error: 'MCP bridge wallet not configured. Set SYRA_MCP_AGENT_ANONYMOUS_ID on the API server.',
    });
  }

  req.mcpAnonymousId = anonymousId;
  return next();
}

/**
 * POST /mcp/tools/call
 * Body: { toolId, params? }
 */
router.post('/call', mcpCallLimiter, requireMcpApiKey, async (req, res) => {
  const { toolId, params: rawParams = {} } = req.body || {};
  if (!toolId) {
    return res.status(400).json({ success: false, error: 'toolId is required' });
  }

  const result = await executeAgentToolCall({
    anonymousId: req.mcpAnonymousId,
    toolId,
    params: rawParams,
    ctx: {
      host: req.get('host'),
      user: { guest: false },
      ip: req.ip,
      userAgent: req.get('user-agent') || 'syra-mcp-bridge',
      skipGuestTxBlock: true,
    },
  });

  return res.status(result.status).json(result.body);
});

export async function createMcpToolsRouter() {
  return router;
}

export default router;
