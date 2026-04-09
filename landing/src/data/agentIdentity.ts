/**
 * Public Syra agent identity anchors (landing /identity).
 * 8004 agent asset is documented in api/README.md (override via SYRA_AGENT_ASSET when re-registered).
 */
export const SYRA_8004_AGENT_ASSET =
  "8aJwH76QsQe5uEAxbFXha24toSUKjHxsdCk4BRuKERYx";

export const SYRA_IDENTITY_NETWORK = "Solana Mainnet";

export function truncateBase58(addr: string, head = 8, tail = 8): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export const syraSolscanAccountUrl = (address: string) =>
  `https://solscan.io/account/${address}`;

/** Production API origin for public identity / discovery links on the marketing page. */
export const SYRA_API_PUBLIC_ORIGIN = "https://api.syraa.fun";
