/** Shared formatters for market / token display on marketing pages. */

export function formatUsd(n: number | null, opts?: { compact?: boolean }): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (opts?.compact) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 0.0001 ? 8 : 6,
  }).format(n);
}

export function formatInt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined).format(Math.round(n));
}

/** Pass percent as a whole number, e.g. 25 for 25%. */
export function formatPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(n < 1 ? 2 : 1).replace(/\.0+$/, "")}%`;
}
