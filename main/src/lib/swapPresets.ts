/** Mainnet mints — keep aligned with `api/routes/agent/chat.js` Jupiter helpers. */
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SYRA_MINT = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
export const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

export const SWAP_PRESET_TOKENS = [
  { label: "SOL", mint: WSOL_MINT, decimals: 9 },
  { label: "USDC", mint: USDC_MINT, decimals: 6 },
  { label: "SYRA", mint: SYRA_MINT, decimals: 9 },
  { label: "BONK", mint: BONK_MINT, decimals: 5 },
] as const;

export type SwapPresetId = (typeof SWAP_PRESET_TOKENS)[number]["label"] | "custom";

/**
 * Canonical wrapped SOL for Jupiter/SPL. The canonical mint ends with `…11112`; a common
 * miscopy ends with `…11111` (last base58 char `1` instead of `2`), which broke preset matching.
 */
export function normalizeWsolMint(mint: string): string {
  const t = mint.trim();
  if (t === WSOL_MINT) return WSOL_MINT;
  if (
    t.length === WSOL_MINT.length &&
    t.at(-1) === "1" &&
    t.slice(0, -1) === WSOL_MINT.slice(0, -1)
  ) {
    return WSOL_MINT;
  }
  return t;
}

/**
 * Map common LLM / OCR mistakes to canonical preset mints (USDC: same length + long shared prefix).
 */
export function normalizeCommonPresetMints(mint: string): string {
  const t = normalizeWsolMint(mint.trim());
  if (
    t.length === USDC_MINT.length &&
    t !== USDC_MINT &&
    t.slice(0, 34) === USDC_MINT.slice(0, 34)
  ) {
    return USDC_MINT;
  }
  return t;
}

/** Map a mainnet mint to a built-in preset label, or null if it is not one of the presets. */
export function presetLabelFromMint(mint: string): Exclude<SwapPresetId, "custom"> | null {
  const normalized = normalizeCommonPresetMints(mint);
  const row = SWAP_PRESET_TOKENS.find((x) => x.mint === normalized);
  return row ? row.label : null;
}

export function decimalsForMint(mint: string): number | null {
  const normalized = normalizeCommonPresetMints(mint);
  const row = SWAP_PRESET_TOKENS.find((t) => t.mint === normalized);
  return row ? row.decimals : null;
}

export function isValidBase58Mint(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
}

/** Human amount → base units when decimals known; null if invalid. */
export function humanToBaseUnits(amountStr: string, decimals: number): string | null {
  const raw = amountStr.trim().replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  const base = Math.round(n * 10 ** decimals);
  if (!Number.isFinite(base) || base <= 0) return null;
  return String(base);
}
