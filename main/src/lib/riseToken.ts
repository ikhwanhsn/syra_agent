/** RISE-listed $UPONLY tranche — same mint as uponly-fund / Syra API proxies. */
export const RISE_ALPHA_TOKEN_MINT = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise" as const;

export const RISE_ALPHA_TOKEN = {
  mint: RISE_ALPHA_TOKEN_MINT,
  name: "Up Only",
  symbol: "UPONLY",
  network: "Solana",
  launchVenue: "RISE" as const,
  targetMarketCapUsd: 100_000_000,
  riseRichTradeId: RISE_ALPHA_TOKEN_MINT,
  buyOnRiseEnabled: true,
};

const RISE_RICH_TRADE_ORIGIN = "https://rise.rich/trade" as const;

export function buildRiseTradeUrl(mint: string | null | undefined): string | null {
  const id = mint?.trim();
  if (!id) return null;
  return `${RISE_RICH_TRADE_ORIGIN}/${id.replace(/^\//, "")}`;
}

export function buildSolscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${encodeURIComponent(mint)}`;
}

export function shortenMint(mint: string, leading = 4, trailing = 4): string {
  if (mint.length <= leading + trailing + 1) return mint;
  return `${mint.slice(0, leading)}…${mint.slice(-trailing)}`;
}

export function progressTowardTarget(marketCapUsd: number | null, targetUsd: number): number {
  if (marketCapUsd == null || !Number.isFinite(marketCapUsd) || marketCapUsd < 0 || targetUsd <= 0) return 0;
  return Math.min(100, (marketCapUsd / targetUsd) * 100);
}
