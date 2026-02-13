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
export function parseUnits(value: string, decimals: number): bigint {
  const [whole = "0", fraction = ""] = value.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const wholeBig = BigInt(whole) * BigInt(10 ** decimals);
  const fractionBig = BigInt(paddedFraction || "0");
  return wholeBig + fractionBig;
}
