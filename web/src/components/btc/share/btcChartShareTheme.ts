export type BtcChartShareThemeMode = "light" | "dark" | "custom";

export interface BtcChartShareCustomColors {
  background: string;
  accent: string;
  chartLine: string;
}

export interface BtcChartShareTheme {
  mode: BtcChartShareThemeMode;
  custom: BtcChartShareCustomColors;
}

export interface ResolvedShareTheme {
  mode: BtcChartShareThemeMode;
  exportBackground: string;
  frame: {
    backgroundCss: string;
    textPrimary: string;
    textMuted: string;
    textFaint: string;
    border: string;
    accent: string;
    accentSoft: string;
    chipBg: string;
    chipBorder: string;
    chipText: string;
    spotCardBg: string;
    spotCardBorder: string;
    iconBorder: string;
    iconBg: string;
    chartIcon: string;
  };
  chart: {
    isDark: boolean;
    background: string;
    textColor: string;
    gridColor: string;
    borderColor: string;
    crosshairLabelBg: string;
    priceLine: string;
    priceTop: string;
    priceBottom: string;
    priceLineMinimal: string;
  };
}

const STORAGE_KEY = "syra-btc-share-theme-custom";

export const DEFAULT_SHARE_CUSTOM: BtcChartShareCustomColors = {
  background: "#0f172a",
  accent: "#F7931A",
  chartLine: "#3b82f6",
};

export const DEFAULT_SHARE_THEME: BtcChartShareTheme = {
  mode: "dark",
  custom: DEFAULT_SHARE_CUSTOM,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

export function isColorDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.55;
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function shiftHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function chartAreaColors(line: string, dark: boolean): { top: string; bottom: string; minimal: string } {
  return {
    top: rgba(line, dark ? 0.38 : 0.28),
    bottom: rgba(line, dark ? 0.02 : 0.04),
    minimal: shiftHex(line, dark ? 30 : -20),
  };
}

function resolveFromPalette(bg: string, accent: string, chartLine: string, mode: BtcChartShareThemeMode): ResolvedShareTheme {
  const dark = isColorDark(bg);
  const bgEnd = shiftHex(bg, dark ? -12 : 8);
  const area = chartAreaColors(chartLine, dark);

  return {
    mode,
    exportBackground: bg,
    frame: {
      backgroundCss: `linear-gradient(165deg, ${bg} 0%, ${shiftHex(bg, dark ? -6 : 4)} 42%, ${bgEnd} 100%)`,
      textPrimary: dark ? "#fafafa" : "#18181b",
      textMuted: dark ? "rgba(250, 250, 250, 0.65)" : "rgba(24, 24, 27, 0.65)",
      textFaint: dark ? "rgba(250, 250, 250, 0.4)" : "rgba(24, 24, 27, 0.45)",
      border: dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
      accent,
      accentSoft: rgba(accent, 0.9),
      chipBg: dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
      chipBorder: dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
      chipText: dark ? "rgba(250, 250, 250, 0.65)" : "rgba(24, 24, 27, 0.7)",
      spotCardBg: dark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
      spotCardBorder: dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
      iconBorder: rgba(accent, 0.3),
      iconBg: rgba(accent, 0.12),
      chartIcon: chartLine,
    },
    chart: {
      isDark: dark,
      background: dark ? shiftHex(bg, 4) : "#ffffff",
      textColor: dark ? "#a1a1aa" : "#71717a",
      gridColor: dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
      borderColor: dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
      crosshairLabelBg: dark ? "#27272a" : "#e4e4e7",
      priceLine: chartLine,
      priceTop: area.top,
      priceBottom: area.bottom,
      priceLineMinimal: area.minimal,
    },
  };
}

export function resolveShareTheme(theme: BtcChartShareTheme): ResolvedShareTheme {
  if (theme.mode === "light") {
    return resolveFromPalette("#fafafa", "#F7931A", "#2563eb", "light");
  }
  if (theme.mode === "dark") {
    return resolveFromPalette("#0a0a0a", "#F7931A", "#3b82f6", "dark");
  }
  const { background, accent, chartLine } = theme.custom;
  return resolveFromPalette(background, accent, chartLine, "custom");
}

export function loadPersistedCustomColors(): BtcChartShareCustomColors {
  if (typeof window === "undefined") return DEFAULT_SHARE_CUSTOM;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHARE_CUSTOM;
    const parsed = JSON.parse(raw) as Partial<BtcChartShareCustomColors>;
    return {
      background: parsed.background ?? DEFAULT_SHARE_CUSTOM.background,
      accent: parsed.accent ?? DEFAULT_SHARE_CUSTOM.accent,
      chartLine: parsed.chartLine ?? DEFAULT_SHARE_CUSTOM.chartLine,
    };
  } catch {
    return DEFAULT_SHARE_CUSTOM;
  }
}

export function persistCustomColors(colors: BtcChartShareCustomColors): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    /* ignore quota errors */
  }
}

export function colorWithAlpha(hex: string, alpha: number): string {
  return rgba(hex, alpha);
}

export function shareThemeStorageKey(theme: BtcChartShareTheme): string {
  if (theme.mode !== "custom") return theme.mode;
  const c = theme.custom;
  return `custom-${c.background}-${c.accent}-${c.chartLine}`;
}
