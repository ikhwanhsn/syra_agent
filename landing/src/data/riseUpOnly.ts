/**
 * Up Only — **manual** RISE / on-chain fields for the /rise page.
 * Update this file when you have the real market address, mint, stats, and links.
 * No API call: values are read at build time.
 */
export type RiseUpOnlyManual = {
  name: string;
  symbol: string;
  network: string;
  launchVenue: "RISE";
  /** Optional — token or IPFS image URL for the logo */
  imageUrl: string | null;
  /** SPL token mint (RISE) */
  mint: string | null;
  /**
   * Syra-published experiment mint for Up Only, if it differs from `mint` or is announced later.
   * When null, the “Up Only (Syra) mint” row shows TBA.
   */
  syraExperimentMint: string | null;
  creator: string | null;
  createdAtLabel: string | null;
  tokenMetadataUri: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  holders: number | null;
  /** e.g. 25 for 25% */
  creatorFeePct: number | null;
  startingPriceUsd: number | null;
  /**
   * RISE rise.rich trade path id — final URL: `https://rise.rich/trade/{id}`.
   * Replace with your live Up Only id when it is listed.
   */
  riseRichTradeId: string | null;
  /**
   * Set to `true` when the Buy button should open RISE. Until then the button stays disabled
   * even if `riseRichTradeId` is set.
   */
  buyOnRiseEnabled: boolean;
};

export const RISE_UP_ONLY: RiseUpOnlyManual = {
  name: "Up Only",
  symbol: "UPONLY",
  network: "Solana",
  launchVenue: "RISE",
  imageUrl: null,
  mint: "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise",
  syraExperimentMint: null,
  creator: null,
  createdAtLabel: null,
  tokenMetadataUri: null,
  twitterUrl: null,
  telegramUrl: null,
  priceUsd: null,
  marketCapUsd: null,
  volume24hUsd: null,
  holders: null,
  creatorFeePct: null,
  startingPriceUsd: null,
  /** `rise.rich/trade/{id}` — same id as mint when listed on RISE. */
  riseRichTradeId: "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise",
  buyOnRiseEnabled: true,
};

const RISE_RICH_TRADE_ORIGIN = "https://rise.rich/trade" as const;

export function getRiseRichTradeUrl(m: RiseUpOnlyManual): string | null {
  const id = m.riseRichTradeId?.trim();
  if (!id) return null;
  return `${RISE_RICH_TRADE_ORIGIN}/${id.replace(/^\//, "")}`;
}

export function riseUpOnlyHasAnyMarketStats(m: RiseUpOnlyManual): boolean {
  return [
    m.priceUsd,
    m.marketCapUsd,
    m.volume24hUsd,
    m.holders,
    m.creatorFeePct,
    m.startingPriceUsd,
  ].some((v) => v !== null);
}
