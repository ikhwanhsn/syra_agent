/**
 * Agent Internet Protocol (AIP) configuration.
 * @see https://aipagents.xyz
 */
import { DEFAULT_PROGRAM_ID } from "@aipagents/did-resolver";

export const AIP_REGISTRY_PROGRAM_ID =
  process.env.AIP_REGISTRY_PROGRAM_ID?.trim() || DEFAULT_PROGRAM_ID;

export const AIP_DEFAULT_AGENT_ID =
  process.env.SYRA_AIP_AGENT_ID?.trim() || "syra";

export const AIP_AGENT_TYPE = "Task";

export const AIP_AGENT_VERSION = process.env.SYRA_AIP_VERSION?.trim() || "1.0.0";

/** @returns {string} */
export function getSyraPublicApiUrl() {
  return (
    process.env.SYRA_PUBLIC_API_URL?.trim() ||
    process.env.BASE_URL?.trim() ||
    "https://api.syraa.fun"
  ).replace(/\/+$/, "");
}

/** @returns {string} */
export function getAipRpcUrl() {
  const cluster = getAipCluster();
  if (process.env.AIP_RPC_URL?.trim()) return process.env.AIP_RPC_URL.trim();
  if (process.env.SOLANA_RPC_URL?.trim()) return process.env.SOLANA_RPC_URL.trim();
  return cluster === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
}

/** @returns {"devnet"|"mainnet-beta"} */
export function getAipCluster() {
  const raw = String(process.env.AIP_CLUSTER || process.env.SOLANA_CLUSTER || "devnet")
    .trim()
    .toLowerCase();
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta";
  return "devnet";
}

/** @returns {string} */
export function getAipNetworkLabel() {
  return getAipCluster() === "mainnet-beta" ? "solana:mainnet" : "solana:devnet";
}

/** @returns {string | null} */
export function getSyraAipWallet() {
  return process.env.SYRA_AIP_WALLET?.trim() || null;
}

/** Treasury anonymousId for server-side A2A / brain delegation tool calls. */
export function getAipTreasuryAnonymousId() {
  return (
    process.env.AIP_TREASURY_ANONYMOUS_ID?.trim() ||
    process.env.SYRA_MCP_AGENT_ANONYMOUS_ID?.trim() ||
    null
  );
}

/** AIP marketplace API (optional discovery). */
export function getAipMarketplaceApiUrl() {
  return (process.env.AIP_API_URL || "https://aipagents.xyz/api").replace(/\/+$/, "");
}

export function isAipConfigured() {
  return Boolean(getSyraAipWallet());
}
