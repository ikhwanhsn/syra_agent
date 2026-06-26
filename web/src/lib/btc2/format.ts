const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNum = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatUsd(value: number, whole = false): string {
  if (!Number.isFinite(value)) return "—";
  return whole ? usdWhole.format(value) : usdCompact.format(value);
}

export function formatPct(value: number, signed = false): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = pctFmt.format(value / 100);
  if (!signed || value === 0) return formatted;
  return value > 0 ? `+${formatted}` : formatted;
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return compactNum.format(value);
}

export function formatBtcPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatHash(hash: string, chars = 6): string {
  if (!hash || hash.length < chars * 2) return hash;
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}%`;
}
