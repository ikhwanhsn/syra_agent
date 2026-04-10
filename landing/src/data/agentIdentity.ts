/**
 * Public Syra agent identity anchors (landing /identity).
 */

/** $SYRA SPL mint (utility / governance token). */
export const SYRA_TOKEN_MINT =
  "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";

/**
 * 8004 marketplace creator anchor; same pubkey as the SAP agent on Synapse Explorer.
 */
export const SYRA_8004_CREATOR_ADDRESS =
  "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";

/** @deprecated Use SYRA_8004_CREATOR_ADDRESS — kept for imports expecting the old name. */
export const SYRA_8004_AGENT_ASSET = SYRA_8004_CREATOR_ADDRESS;

export const SYRA_8004_COLLECTION_URL =
  "https://8004market.io/collection/solana/mainnet-beta/31";

/** Synapse Agent Protocol — agent PDA (OOBE). */
export const SYRA_SAP_AGENT_PDA =
  "29Mw1QJRYb8BwiR4iPRYGp276PHeoCzSQMHxUYQd3o47";

export const SYRA_SAP_EXPLORER_AGENT_URL = `https://explorer.oobeprotocol.ai/agents/${SYRA_8004_CREATOR_ADDRESS}`;

export const X402SCAN_SYRA_AGENT_URL =
  "https://www.x402scan.com/composer/agent/c543b43e-6f49-492d-9f8a-6b0cc273fb06";

export const X402SCAN_SYRA_SERVER_URL =
  "https://www.x402scan.com/server/2d6b5ab5-7ba0-4708-a5bf-fa3cb68ad773";

export const SYRA_IDENTITY_NETWORK = "Solana Mainnet";

export function truncateBase58(addr: string, head = 8, tail = 8): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export const syraSolscanAccountUrl = (address: string) =>
  `https://solscan.io/account/${address}`;

export const syraSolscanTokenUrl = (mint: string) =>
  `https://solscan.io/token/${mint}`;

/** Production API origin for public identity / discovery links on the marketing page. */
export const SYRA_API_PUBLIC_ORIGIN = "https://api.syraa.fun";
