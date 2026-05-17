import { formatCompactAmount } from "@/lib/tokenFormat";

/** Whole-token amounts (not lamports). Keep in sync with $SYRA tokenomics disclosures. */
export const SYRA_TOTAL_SUPPLY = 1_000_000_000;
export const SYRA_CIRCULATING_SUPPLY = 995_000_000;

export function getSyraBurnedSupply(): number {
  return Math.max(0, SYRA_TOTAL_SUPPLY - SYRA_CIRCULATING_SUPPLY);
}

export function formatSyraSupplyCompact(amount: number): string {
  return formatCompactAmount(amount);
}

export const SYRA_TOKENOMICS_DISPLAY = {
  totalSupply: formatSyraSupplyCompact(SYRA_TOTAL_SUPPLY),
  circulating: formatSyraSupplyCompact(SYRA_CIRCULATING_SUPPLY),
  burned: formatSyraSupplyCompact(getSyraBurnedSupply()),
} as const;
