/** Shared formatters for market / token display on marketing pages. */

function pctDisplayFractionDigits(abs: number): {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
} {
  if (!Number.isFinite(abs) || abs === 0) {
    return { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  }
  if (abs >= 1) {
    return { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  }
  return {
    minimumFractionDigits: abs > 0 && abs < 0.01 ? 2 : 0,
    maximumFractionDigits: 2,
  };
}

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

/** Pass percent as a whole number, e.g. 25 for 25%. Uses locale grouping (e.g. 2,300%). No decimals when |n| ≥ 1. */
export function formatPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n === 0) return "0%";
  const abs = Math.abs(n);
  const valueToFormat = abs >= 1 ? Math.sign(n) * Math.trunc(abs) : n;
  const { minimumFractionDigits, maximumFractionDigits } = pctDisplayFractionDigits(abs);
  return `${new Intl.NumberFormat(undefined, {
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(valueToFormat)}%`;
}

/** Signed delta percent (e.g. 24h change). Examples: +456%, +2,300%, −0.35%. Integers only when |pct| ≥ 1. */
export function formatPctSigned(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "—";
  if (pct === 0) return "0%";
  const abs = Math.abs(pct);
  const magnitude = abs >= 1 ? Math.trunc(abs) : abs;
  const { minimumFractionDigits, maximumFractionDigits } = pctDisplayFractionDigits(abs);
  const sign = pct > 0 ? "+" : "-";
  const body = new Intl.NumberFormat(undefined, {
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(magnitude);
  return `${sign}${body}%`;
}
