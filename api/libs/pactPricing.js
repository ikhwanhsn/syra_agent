/**
 * Pact premium helpers for agent tool pricing / balance checks.
 */
import { getEffectivePriceUsd } from '../config/x402Pricing.js';
import { isPactEnabled, getPactPremiumUsdDefault } from './pactConfig.js';

/**
 * @param {import('../config/agentTools.js').AgentTool | { nansenPath?: string; zerionPath?: string; birdeyePath?: string; stablecryptoPath?: string; stablesocialPath?: string; stableenrichPath?: string; purchVaultPath?: string; agentscore?: string; paysh?: string; agentDirect?: boolean } | null | undefined} tool
 */
export function isPactEligibleAgentTool(tool) {
  if (!tool || !isPactEnabled()) return false;
  return !!(
    tool.nansenPath ||
    tool.zerionPath ||
    tool.birdeyePath ||
    tool.stablecryptoPath ||
    tool.stablesocialPath ||
    tool.stableenrichPath ||
    tool.purchVaultPath ||
    tool.agentscore === 'pay' ||
    tool.paysh === 'call'
  );
}

/**
 * Per-call Pact premium estimate (USDC) for balance checks.
 */
export function getPactPremiumUsd() {
  if (!isPactEnabled()) return 0;
  return getPactPremiumUsdDefault();
}

/**
 * Effective tool price including optional Pact premium for external paid providers.
 * @param {import('../config/agentTools.js').AgentTool} tool
 * @param {string | null | undefined} connectedWalletAddress
 */
export function getEffectiveAgentToolPriceUsd(tool, connectedWalletAddress) {
  const base = getEffectivePriceUsd(tool.priceUsd, connectedWalletAddress) ?? tool.priceUsd;
  if (!isPactEligibleAgentTool(tool)) return base;
  return base + getPactPremiumUsd();
}

/**
 * Display price for tool listings (uses displayPriceUsd when set).
 * @param {import('../config/agentTools.js').AgentTool} tool
 */
export function getDisplayAgentToolPriceUsd(tool) {
  const base = tool.displayPriceUsd ?? tool.priceUsd;
  if (!isPactEligibleAgentTool(tool)) return base;
  return base + getPactPremiumUsd();
}
