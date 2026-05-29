/**
 * Badge labels for indicator filters — mirrors api/libs/indicatorFilters.js `label()`.
 */

export function indicatorFilterBadgeLabels(f: Record<string, unknown> | null | undefined): string[] {
  if (f == null || typeof f !== "object") return [];
  const out: string[] = [];
  for (const key of Object.keys(f)) {
    const v = f[key];
    const s = formatIndicatorFilterEntry(key, v);
    if (s) out.push(s);
  }
  return out;
}

function bandLabel(prefix: string, v: unknown): string | null {
  const b = v as { min?: number; max?: number };
  const parts: string[] = [];
  if (b?.min != null) parts.push(`≥${b.min}`);
  if (b?.max != null) parts.push(`≤${b.max}`);
  return parts.length ? `${prefix} ${parts.join(" ")}` : null;
}

function formatIndicatorFilterEntry(key: string, v: unknown): string | null {
  switch (key) {
    case "rsiBand":
      return bandLabel("RSI", v);
    case "rsiOversold":
      return v === true ? "RSI≤30" : null;
    case "rsiOverbought":
      return v === true ? "RSI≥70" : null;
    case "rsiBullishZone":
      return v === true ? "RSI 40–60" : null;
    case "macd":
      return (
        {
          BULL_HIST: "MACD+hist",
          BEAR_HIST: "MACD−hist",
          BULL_CROSS: "MACD>sig",
          BEAR_CROSS: "MACD<sig",
        } as Record<string, string>
      )[String(v)] ?? String(v);
    case "macdHist":
      return v === "BULL_HIST" ? "MACD+hist" : v === "BEAR_HIST" ? "MACD−hist" : String(v);
    case "macdCross":
      return v === "BULL_CROSS" ? "MACD>sig" : v === "BEAR_CROSS" ? "MACD<sig" : String(v);
    case "macdZeroLine":
      return v === "ABOVE" ? "MACD>0" : v === "BELOW" ? "MACD<0" : String(v);
    case "emaStack":
      return v === "GOLDEN" ? "EMA golden" : v === "DEATH" ? "EMA death" : String(v);
    case "smaStack":
      return v === "BULL" ? "SMA bull stack" : v === "BEAR" ? "SMA bear stack" : String(v);
    case "priceVsMa":
      return (
        {
          ABOVE_SMA20: ">SMA20",
          ABOVE_SMA50: ">SMA50",
          BELOW_SMA20: "<SMA20",
          BELOW_SMA50: "<SMA50",
        } as Record<string, string>
      )[String(v)] ?? String(v);
    case "priceVsEma12":
      return v === "ABOVE" ? ">EMA12" : v === "BELOW" ? "<EMA12" : String(v);
    case "priceVsEma26":
      return v === "ABOVE" ? ">EMA26" : v === "BELOW" ? "<EMA26" : String(v);
    case "bollingerPosition":
      return (
        { LOWER: "BB lower", UPPER: "BB upper", INSIDE: "BB mid" } as Record<string, string>
      )[String(v)] ?? String(v);
    case "bbPositionBand":
      return bandLabel("BBpos%", v);
    case "bbWidthBand":
      return bandLabel("BBw%", v);
    case "volatilityLevel":
      return `Vol ${String(v).toLowerCase()}`;
    case "priceVsVwap":
      return v === "ABOVE" ? ">VWAP" : v === "BELOW" ? "<VWAP" : String(v);
    case "supportProximityPct":
      return typeof v === "number" ? `near S ±${v}%` : String(v);
    case "resistanceProximityPct":
      return typeof v === "number" ? `near R ±${v}%` : String(v);
    case "adxValueBand":
      return bandLabel("ADX", v);
    case "adxTrendStrength":
      return `ADX ${String(v).replace(/_/g, " ").toLowerCase()}`;
    case "adxDiStack":
      return v === "BULL" ? "+DI>−DI" : v === "BEAR" ? "+DI<−DI" : String(v);
    case "adxDiCrossover":
      return String(v).includes("BULLISH") ? "DI bull X" : "DI bear X";
    case "adxTrendDirection":
      return `ADX ${String(v).toLowerCase()}`;
    case "mfiBand":
      return bandLabel("MFI", v);
    case "mfiOverbought":
      return v === true ? "MFI≥80" : null;
    case "mfiOversold":
      return v === true ? "MFI≤20" : null;
    case "volumePressure":
      return `VolΔ ${String(v).split(" ")[0]}`;
    case "mfiDivergence":
      return String(v).includes("BULLISH") ? "MFI bull div" : "MFI bear div";
    case "atrPercentBand":
      return bandLabel("ATR%", v);
    case "trendClearSignal":
      return `Trend ${String(v)}`;
    case "momentumClearSignal":
      return `Mom ${String(v)}`;
    case "priceChange24hBand":
      return bandLabel("24h%", v);
    case "confidenceFloor":
      return `Conf≥${String(v)}`;
    default:
      return `${key}:${JSON.stringify(v)}`;
  }
}

/** Alias for backward-compatible imports from tradingExperimentApi */
export const experimentIndicatorFilterBadgeLabels = indicatorFilterBadgeLabels;
