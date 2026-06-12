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

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

function toSubscriptCount(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[d] ?? d)
    .join("");
}

function trimTrailingZeros(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "").replace(/\.$/u, "");
}

/** Full-precision string for tooltips / copy — never scientific notation. */
export function formatPortfolioTokenAmountFull(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  if (amount >= 1) {
    return trimTrailingZeros(
      amount.toLocaleString("en-US", { maximumFractionDigits: 9, useGrouping: false }),
    );
  }
  const fixed = amount.toFixed(12);
  return trimTrailingZeros(fixed);
}

export interface FormattedPortfolioTokenAmount {
  display: string;
  ariaLabel: string;
  full: string;
}

/**
 * Human-readable token balance for portfolio rows.
 * Never uses scientific notation; uses zero-subscript for micro amounts.
 */
export function formatPortfolioTokenAmount(amount: number): FormattedPortfolioTokenAmount {
  const full = formatPortfolioTokenAmountFull(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { display: "0", ariaLabel: "0", full: "0" };
  }

  if (amount >= 1_000_000) {
    const display = formatCompactAmount(amount);
    return { display, ariaLabel: full, full };
  }

  if (amount >= 1) {
    const display = amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return { display, ariaLabel: full, full };
  }

  if (amount >= 0.01) {
    const display = amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return { display, ariaLabel: full, full };
  }

  const fixed = amount.toFixed(20);
  const match = fixed.match(/^0\.(0*)([1-9]\d*)/u);
  if (match) {
    const leadingZeros = match[1].length;
    const significant = match[2].replace(/0+$/u, "").slice(0, 4);
    if (leadingZeros >= 3 && significant) {
      const display = `0.0${toSubscriptCount(leadingZeros)}${significant}`;
      return { display, ariaLabel: full, full };
    }
  }

  const display = trimTrailingZeros(amount.toPrecision(8));
  return { display, ariaLabel: full, full };
}

export function parseUnits(value: string, decimals: number): bigint {
  const [whole = "0", fraction = ""] = value.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const wholeBig = BigInt(whole) * BigInt(10 ** decimals);
  const fractionBig = BigInt(paddedFraction || "0");
  return wholeBig + fractionBig;
}
