/**
 * Treasury balance display + resolution for agent wallet UIs.
 */

/** Sum chat + LP treasury USDC or SOL (null when both wallets unresolved). */
export function sumAgentTreasuryTotals(
  chat: number | null | undefined,
  lp: number | null | undefined,
): number | null {
  const chatVal = chat != null && Number.isFinite(chat) ? chat : null;
  const lpVal = lp != null && Number.isFinite(lp) ? lp : null;
  if (chatVal == null && lpVal == null) return null;
  return (chatVal ?? 0) + (lpVal ?? 0);
}

/** Prefer context on-chain values when linked, fall back to API balance. */
export function resolveAgentTreasuryBalance(
  useContextFirst: boolean,
  contextBalance: number | null | undefined,
  apiBalance: number | null | undefined,
): number | null {
  const ctx = contextBalance != null && Number.isFinite(contextBalance) ? contextBalance : null;
  const api = apiBalance != null && Number.isFinite(apiBalance) ? apiBalance : null;
  if (useContextFirst) return ctx ?? api;
  return api ?? ctx;
}

/** USDC for agent treasuries — always readable sub-$10k amounts (not overview compact). */
export function formatTreasuryUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 100_000) return `$${(value / 1_000).toFixed(1)}k`;
  if (abs >= 10_000) return `$${(value / 1_000).toFixed(2)}k`;
  if (abs < 0.01 && abs > 0) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
