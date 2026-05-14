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

export function applySlippageFloor(rawOut: number | null | undefined, slippagePct: number): number {
  if (rawOut == null || !Number.isFinite(rawOut) || rawOut <= 0) return 0;
  const factor = Math.max(0, Math.min(1, 1 - slippagePct / 100));
  return Math.max(0, Math.floor(rawOut * factor));
}
