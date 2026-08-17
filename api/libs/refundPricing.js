/**
 * Agent tool pricing helpers. Refund coverage is self-insured (no per-call premium).
 */
import { getEffectivePriceUsd } from "../config/x402Pricing.js";
import { isOutboundRefundEnabled, isRefundEnabled } from "../config/refund.js";

/**
 * @param {import('../config/agentTools.js').AgentTool | { nansenPath?: string; zerionPath?: string; birdeyePath?: string; stablecryptoPath?: string; stablesocialPath?: string; stableenrichPath?: string; purchVaultPath?: string; agentscore?: string; paysh?: string; agentDirect?: boolean } | null | undefined} tool
 */
export function isRefundEligibleAgentTool(tool) {
  if (!tool || !isRefundEnabled() || !isOutboundRefundEnabled()) return false;
  return !!(
    tool.nansenPath ||
    tool.zerionPath ||
    tool.birdeyePath ||
    tool.stablecryptoPath ||
    tool.stablesocialPath ||
    tool.stableenrichPath ||
    tool.purchVaultPath ||
    tool.agentscore === "pay" ||
    tool.paysh === "call"
  );
}

/**
 * @param {import('../config/agentTools.js').AgentTool} tool
 * @param {string | null | undefined} connectedWalletAddress
 */
export function getEffectiveAgentToolPriceUsd(tool, connectedWalletAddress) {
  return getEffectivePriceUsd(tool.priceUsd, connectedWalletAddress) ?? tool.priceUsd;
}

/**
 * @param {import('../config/agentTools.js').AgentTool} tool
 */
export function getDisplayAgentToolPriceUsd(tool) {
  return tool.displayPriceUsd ?? tool.priceUsd;
}
