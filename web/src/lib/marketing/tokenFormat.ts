/** Token amount formatting (aligned with staking app). */

export function formatUnits(
  value: bigint,
  decimals: number,
  maxFractionDigits = 6,
): string {
  if (value === 0n) return "0";
  const divisor = 10 ** decimals;
  const whole = value / BigInt(divisor);
  const fraction = value % BigInt(divisor);
  const fractionPadded = fraction.toString().padStart(decimals, "0");
  const fractionTrimmed = fractionPadded
    .replace(/0+$/, "")
    .slice(0, maxFractionDigits);
  if (!fractionTrimmed) return whole.toString();
  return `${whole}.${fractionTrimmed}`;
}

export function formatCompactAmount(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) {
    const n = num / 1_000_000_000;
    return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    const n = num / 1_000_000;
    return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const n = num / 1_000;
    return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}K`;
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
