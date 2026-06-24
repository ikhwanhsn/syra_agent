/**
 * AIP-01 Agent Card builder for Syra — generated from x402 discovery catalog.
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from "../config/x402DiscoveryResourcePaths.js";
import {
  getResourceDescription,
  getResourceMeta,
  getResourceName,
  getResourceSummary,
} from "../config/x402ResourceCatalog.js";
import {
  AIP_AGENT_TYPE,
  AIP_AGENT_VERSION,
  AIP_DEFAULT_AGENT_ID,
  getSyraPublicApiUrl,
} from "../config/aipConfig.js";
import {
  SYRA_AGENT_DESCRIPTION,
  SYRA_BAZAAR_ICON_URL,
} from "../config/syraBranding.js";

/** @typedef {import('@aipagents/agent-sdk').AgentCard} AgentCard */

/** Primary A2A capabilities exposed on POST /a2a (subset of full x402 catalog). */
export const AIP_A2A_CAPABILITY_IDS = Object.freeze([
  "crypto.brain",
  "crypto.signal",
  "crypto.news",
  "crypto.sentiment",
  "crypto.pumpfun.analyze",
  "crypto.indicator",
  "crypto.bitcoin",
]);

/** Maps AIP capability id → x402 catalog segment + optional agent tool id. */
export const AIP_CAPABILITY_ROUTING = Object.freeze({
  "crypto.brain": { segment: "brain", toolId: null, defaultPrice: 0.08 },
  "crypto.signal": { segment: "signal", toolId: "signal", defaultPrice: 0.01 },
  "crypto.news": { segment: "news", toolId: "news", defaultPrice: 0.01 },
  "crypto.sentiment": { segment: "sentiment", toolId: "sentiment", defaultPrice: 0.01 },
  "crypto.pumpfun.analyze": {
    segment: "pumpfun/analyzer",
    toolId: "pumpfun-analyzer",
    defaultPrice: 0.02,
  },
  "crypto.indicator": { segment: "indicator", toolId: "indicator", defaultPrice: 0.01 },
  "crypto.bitcoin": { segment: "bitcoin", toolId: "bitcoin-hub", defaultPrice: 0.01 },
});

/**
 * @param {string} walletAddress - base58 Solana pubkey (owner / payee)
 * @param {string} [agentId]
 * @returns {AgentCard}
 */
export function buildSyraAipAgentCard(walletAddress, agentId = AIP_DEFAULT_AGENT_ID) {
  const baseUrl = getSyraPublicApiUrl();
  const did = `did:aip:${walletAddress}:${agentId}`;

  /** @type {AgentCard["capabilities"]} */
  const capabilities = AIP_A2A_CAPABILITY_IDS.map((id) => {
    const route = AIP_CAPABILITY_ROUTING[id];
    const meta = route ? getResourceMeta(route.segment) : null;
    const priceUsd = meta?.suggestedPriceStx ?? route?.defaultPrice ?? 0.01;
    return {
      id,
      description: meta?.summary ?? meta?.name ?? id,
      pricing: {
        amount: priceUsd.toFixed(2),
        token: "USDC",
        network: "solana",
      },
    };
  });

  return {
    did,
    name: process.env.SYRA_AIP_NAME?.trim() || "Syra",
    version: AIP_AGENT_VERSION,
    endpoint: `${baseUrl}/a2a`,
    type: AIP_AGENT_TYPE,
    walletAddress,
    capabilities,
  };
}

/**
 * Extended Agent Card document served at /.well-known/agent.json
 * (AIP Agent Card + Syra discovery metadata).
 * @param {string} walletAddress
 * @param {string} [agentId]
 */
export function buildSyraAipAgentCardDocument(walletAddress, agentId = AIP_DEFAULT_AGENT_ID) {
  const card = buildSyraAipAgentCard(walletAddress, agentId);
  const baseUrl = getSyraPublicApiUrl();

  const x402Resources = X402_DISCOVERY_RESOURCE_PATHS.map((segment) => {
    const meta = getResourceMeta(segment);
    return {
      path: `/${segment}`,
      name: getResourceName(segment),
      summary: getResourceSummary(segment),
      description: getResourceDescription(segment),
      priceUsd: meta?.suggestedPriceStx ?? null,
      category: meta?.category ?? "crypto",
    };
  });

  return {
    ...card,
    agentCardUrl: `${baseUrl}/.well-known/agent.json`,
    image: process.env.SYRA_AGENT_IMAGE_URI?.trim() || SYRA_BAZAAR_ICON_URL,
    description: process.env.SYRA_AIP_DESCRIPTION?.trim() || SYRA_AGENT_DESCRIPTION,
    website: process.env.SYRA_COLLECTION_EXTERNAL_URL?.trim() || "https://syraa.fun",
    documentation: "https://docs.syraa.fun",
    protocols: ["aip-01", "aip-02", "aip-03", "x402-v2"],
    payment: {
      scheme: "exact",
      token: "USDC",
      networks: ["solana", "base", "bsc", "algorand"],
      discovery: `${baseUrl}/.well-known/x402`,
    },
    a2a: {
      jsonrpc: "2.0",
      url: `${baseUrl}/a2a`,
      methods: ["task/create", "task/status"],
    },
    x402Resources,
  };
}

/**
 * @param {string} capabilityId
 * @returns {number}
 */
export function getAipCapabilityPriceUsd(capabilityId) {
  const route = AIP_CAPABILITY_ROUTING[capabilityId];
  if (!route) return 0.01;
  const meta = getResourceMeta(route.segment);
  return meta?.suggestedPriceStx ?? route.defaultPrice ?? 0.01;
}
