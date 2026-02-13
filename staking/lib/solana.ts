import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type Cluster,
} from "@solana/web3.js";
import { CONFIG, IS_DEVNET } from "@/constants/config";

/**
 * Get Solana connection. Uses CONFIG.rpcEndpoint.
 */
export function getConnection(): Connection {
  return new Connection(CONFIG.rpcEndpoint, "confirmed");
}

/**
 * Get cluster for wallet adapter (devnet / mainnet-beta).
 */
export function getCluster(): Cluster {
  return IS_DEVNET ? "devnet" : "mainnet-beta";
}

/**
 * Get cluster API URL (fallback when no custom RPC).
 */
export function getClusterApiUrl(): string {
  return clusterApiUrl(getCluster());
}

/**
 * Shorten public key for display.
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
