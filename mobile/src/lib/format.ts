function formatCompactScaled(value: number, divisor: number, suffix: string): string {
  const n = value / divisor;
  if (n >= 10) return `${Math.floor(n)}${suffix}`;
  const floored = Math.floor(n * 10) / 10;
  return `${floored}${suffix}`;
}

/** Compact display for large amounts (e.g. 1.2M, 450K). */
export function formatCompactAmount(value: string | number): string {
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000_000) return formatCompactScaled(num, 1_000_000_000, 'B');
  if (num >= 1_000_000) return formatCompactScaled(num, 1_000_000, 'M');
  if (num >= 1_000) return formatCompactScaled(num, 1_000, 'K');
  return num.toLocaleString('en-US', {maximumFractionDigits: 2});
}

export function formatUsd(value: number | string | null | undefined, digits = 2): string {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '-';
  if (Math.abs(n) >= 1000) return `$${formatCompactAmount(n)}`;
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function shortenAddress(addr: string, left = 4, right = 4): string {
  if (!addr || addr.length <= left + right + 1) return addr || '';
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export function formatUsdcAmount(microOrDecimal: string | number, decimals = 6): string {
  const s = String(microOrDecimal).trim();
  if (!s) return '0';
  if (s.includes('.')) {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n.toFixed(Math.min(4, decimals)) : s;
  }
  try {
    const value = BigInt(s);
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const decPart = value % divisor;
    if (decPart === BigInt(0)) return intPart.toString();
    const decStr = decPart
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '')
      .slice(0, 4);
    return `${intPart}.${decStr}`;
  } catch {
    return s;
  }
}
