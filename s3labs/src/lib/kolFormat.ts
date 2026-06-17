export function formatSol(sol: number, maxFractionDigits = 4): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  }).format(sol);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatFollowers(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatCompact(n);
}
