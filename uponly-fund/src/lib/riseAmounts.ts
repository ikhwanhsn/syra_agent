/** Wrapped SOL mint (Rise collateral). */
export const WSOL_MAINNET = "So11111111111111111111111111111111111111112" as const;
/** USDC mint (Rise collateral). */
export const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as const;

export function collateralDecimalsForMint(mintMain: string | null | undefined): number {
  if (mintMain === USDC_MAINNET) return 6;
  return 9;
}

export function tokenDecimalsOrDefault(tokenDecimals: number | null | undefined): number {
  if (tokenDecimals != null && Number.isFinite(tokenDecimals) && tokenDecimals >= 0 && tokenDecimals <= 18) {
    return Math.round(tokenDecimals);
  }
  return 9;
}

export function humanToRawFloor(human: number, decimals: number): number {
  if (!Number.isFinite(human) || human <= 0) return 0;
  return Math.floor(human * 10 ** decimals);
}

export function rawToHuman(raw: number, decimals: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw / 10 ** decimals;
}

/** String for trade amount inputs — avoids scientific notation and trailing zeros. */
export function formatAmountInputValue(n: number, decimals: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  const frac = Math.min(Math.max(0, decimals), 12);
  const fixed = n.toFixed(frac);
  const trimmed = fixed.replace(/\.?0+$/, "");
  return trimmed.length > 0 ? trimmed : "0";
}

/** Reserve native SOL for tx fees when using “max” on buy. */
export const SOL_BUY_FEE_RESERVE_HUMAN = 0.01;

export function applySlippageFloor(rawOut: number | null | undefined, slippagePct: number): number {
  if (rawOut == null || !Number.isFinite(rawOut) || rawOut <= 0) return 0;
  const factor = Math.max(0, Math.min(1, 1 - slippagePct / 100));
  return Math.max(0, Math.floor(rawOut * factor));
}
