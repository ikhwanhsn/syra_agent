/**
 * Format raw token amount (smallest units) to human-readable string.
 */
export function formatUnits(
  value: bigint,
  decimals: number,
  maxFractionDigits: number = 6
): string {
  if (value === 0n) return "0";
  const divisor = 10 ** decimals;
  const whole = value / BigInt(divisor);
  const fraction = value % BigInt(divisor);
  const fractionPadded = fraction.toString().padStart(decimals, "0");
  const fractionTrimmed = fractionPadded.replace(/0+$/, "").slice(0, maxFractionDigits);
  if (!fractionTrimmed) return whole.toString();
  return `${whole}.${fractionTrimmed}`;
}

/**
 * Parse human-readable amount to raw token amount (smallest units).
 */
function formatCompactScaled(value: number, divisor: number, suffix: string): string {
  const n = value / divisor;
  if (n >= 10) return `${Math.floor(n)}${suffix}`;
  const floored = Math.floor(n * 10) / 10;
  return `${floored}${suffix}`;
}

/** Compact display for large token amounts (e.g. 1.2M, 450K). Rounds normally. */
export function formatCompactAmount(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) {
    return formatCompactScaled(num, 1_000_000_000, "B");
  }
  if (num >= 1_000_000) {
    return formatCompactScaled(num, 1_000_000, "M");
  }
  if (num >= 1_000) {
    return formatCompactScaled(num, 1_000, "K");
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/**
 * Compact display that never rounds up (safe for "max available" labels).
 * e.g. 935_999 → "935.9K" not "936K".
 */
export function formatCompactAmountFloor(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) {
    return formatCompactScaled(num, 1_000_000_000, "B");
  }
  if (num >= 1_000_000) {
    return formatCompactScaled(num, 1_000_000, "M");
  }
  if (num >= 1_000) {
    return formatCompactScaled(num, 1_000, "K");
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function parseUnits(value: string, decimals: number): bigint {
  const [whole = "0", fraction = ""] = value.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const wholeBig = BigInt(whole) * BigInt(10 ** decimals);
  const fractionBig = BigInt(paddedFraction || "0");
  return wholeBig + fractionBig;
}
