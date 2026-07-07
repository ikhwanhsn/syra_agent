/** $ANSEM token hub — single source of truth for mint, identity, and external venues. */

export const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump" as const;

export const ANSEM = {
  mint: ANSEM_MINT,
  symbol: "ANSEM",
  name: "The Black Bull",
} as const;

export type AnsemVenueKind = "buy" | "track" | "social";

export interface AnsemVenue {
  id: string;
  label: string;
  description: string;
  href: string;
  kind: AnsemVenueKind;
  primary?: boolean;
}

export const ANSEM_VENUES: AnsemVenue[] = [
  {
    id: "pumpfun",
    label: "pump.fun",
    description: "Trade on the bonding curve",
    href: `https://pump.fun/coin/${ANSEM_MINT}`,
    kind: "buy",
    primary: true,
  },
  {
    id: "axiom",
    label: "Axiom",
    description: "Pro trading terminal",
    href: `https://axiom.trade/t/${ANSEM_MINT}`,
    kind: "buy",
  },
  {
    id: "jupiter",
    label: "Jupiter",
    description: "Best-route swap",
    href: `https://jup.ag/swap/SOL-${ANSEM_MINT}`,
    kind: "buy",
  },
  {
    id: "dexscreener",
    label: "Dexscreener",
    description: "Live pairs & chart",
    href: `https://dexscreener.com/solana/${ANSEM_MINT}`,
    kind: "track",
  },
  {
    id: "solscan",
    label: "Solscan",
    description: "On-chain explorer",
    href: `https://solscan.io/token/${ANSEM_MINT}`,
    kind: "track",
  },
  {
    id: "x",
    label: "X / Twitter",
    description: "Community buzz",
    href: "https://x.com/search?q=%24ANSEM&src=typed_query&f=live",
    kind: "social",
  },
];

export const ANSEM_DOSSIER_QUERY = {
  mint: ANSEM_MINT,
  symbol: ANSEM.symbol,
  name: ANSEM.name,
} as const;

/** Auto-refresh interval for live market data (ms). */
export const ANSEM_LIVE_REFETCH_MS = 45_000;

/** Community snapshot (holders, KOL, safety) — server-cached. */
export const ANSEM_COMMUNITY_REFETCH_MS = 15 * 60_000;

/** Fast holder count — lightweight dedicated endpoint. */
export const ANSEM_HOLDER_COUNT_REFETCH_MS = 90_000;


/** Fallback token logo (Dexscreener CDN) when live metadata is unavailable. */
export const ANSEM_LOGO_URL =
  "https://cdn.dexscreener.com/cms/images/A8aHRXC8VPrpfPIF?width=256&height=256&quality=95&format=auto";
