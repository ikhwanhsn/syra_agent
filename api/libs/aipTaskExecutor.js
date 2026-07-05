/**
 * Execute AIP A2A capabilities using Syra agent tools / treasury.
 */
import { executeAgentToolCall } from "./agentToolExecutor.js";
import { callOpenRouter } from "./openrouter.js";
import { getAipTreasuryAnonymousId } from "../config/aipConfig.js";
import {
  AIP_CAPABILITY_ROUTING,
  getAipCapabilityPriceUsd,
} from "./aipAgentCard.js";
import { getResourceDescription } from "../config/x402ResourceCatalog.js";

/**
 * @param {string} capabilityId
 * @param {string} input
 * @returns {Record<string, string>}
 */
function buildToolParams(capabilityId, input) {
  const text = String(input || "").trim();
  switch (capabilityId) {
    case "crypto.signal": {
      const tokenMatch = text.match(/\b(bitcoin|btc|ethereum|eth|solana|sol)\b/i);
      const token = tokenMatch ? tokenMatch[1].toLowerCase() : "bitcoin";
      const normalized =
        token === "btc" ? "bitcoin" : token === "eth" ? "ethereum" : token === "sol" ? "solana" : token;
      return { token: normalized, source: "binance", interval: "1h", limit: "100" };
    }
    case "crypto.news": {
      const tickerMatch = text.match(/\b(BTC|ETH|SOL|bitcoin|ethereum|solana)\b/i);
      return { ticker: tickerMatch ? tickerMatch[1].toLowerCase() : "general" };
    }
    case "crypto.sentiment": {
      const tickerMatch = text.match(/\b(BTC|ETH|SOL|bitcoin|ethereum|solana)\b/i);
      return { ticker: tickerMatch ? tickerMatch[1].toLowerCase() : "BTC" };
    }
    case "crypto.pumpfun.analyze": {
      const mintMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
      if (!mintMatch) {
        throw new Error("Provide a Solana mint address in input for pump.fun analysis");
      }
      return { mint: mintMatch[0] };
    }
    case "crypto.indicator": {
      const symMatch = text.match(/\b(BTC|ETH|SOL|bitcoin|ethereum|solana)\b/i);
      const symbol = symMatch ? symMatch[1].toUpperCase().replace("BITCOIN", "BTC").replace("ETHEREUM", "ETH").replace("SOLANA", "SOL") : "BTC";
      return { symbol, source: "binance", interval: "1h", limit: "100", indicators: "rsi,macd,ema" };
    }
    case "crypto.bitcoin":
      return { exchange: "binance", interval: "1h", limit: "48" };
    case "crypto.brain":
    default:
      return { question: text };
  }
}

/**
 * @param {string} capabilityId
 * @param {string} input
 * @param {{ host?: string }} [ctx]
 */
export async function executeAipCapability(capabilityId, input, ctx = {}) {
  const capId = String(capabilityId || "").trim();
  const route = AIP_CAPABILITY_ROUTING[capId];
  if (!route) {
    throw new Error(`Unsupported capability: ${capId}`);
  }

  const anonymousId = getAipTreasuryAnonymousId();
  if (!anonymousId) {
    throw new Error(
      "AIP treasury not configured — set AIP_TREASURY_ANONYMOUS_ID or SYRA_MCP_AGENT_ANONYMOUS_ID"
    );
  }

  if (capId === "crypto.brain") {
    const { response } = await callOpenRouter(
      [
        {
          role: "system",
          content: `You are Syra — machine money for agents on Solana. ${getResourceDescription("brain")}`,
        },
        { role: "user", content: String(input || "").trim() },
      ],
      { max_tokens: 2000 }
    );
    return {
      capability: capId,
      artifact: response || "",
      source: "syra-brain-lite",
    };
  }

  if (!route.toolId) {
    throw new Error(`Capability ${capId} has no tool mapping`);
  }

  const params = buildToolParams(capId, input);
  const result = await executeAgentToolCall({
    anonymousId,
    toolId: route.toolId,
    params,
    ctx: {
      host: ctx.host,
      skipGuestTxBlock: true,
    },
  });

  if (!result.body?.success) {
    throw new Error(result.body?.error || `Tool ${route.toolId} failed`);
  }

  return {
    capability: capId,
    toolId: route.toolId,
    artifact: result.body.data,
    source: "syra-tool",
  };
}

export { getAipCapabilityPriceUsd };
