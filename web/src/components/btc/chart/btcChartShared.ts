import type { BtcBubblePoint, BtcBubblemapData } from "@/lib/btcApi";

export type BtcChartVariant = "classic" | "area" | "dual" | "minimal" | "heatmap";

export const BTC_CHART_VARIANTS: readonly {
  id: BtcChartVariant;
  label: string;
  hint: string;
}[] = [
  { id: "classic", label: "Flow", hint: "TradingView area chart + flow bubbles" },
  { id: "area", label: "Depth", hint: "Gradient price with aggressive flow overlay" },
  { id: "dual", label: "Dual", hint: "Price pane + ratio histogram with parity line" },
  { id: "minimal", label: "Clean", hint: "Minimal line with bold flow markers" },
  { id: "heatmap", label: "Intensity", hint: "Price + flow intensity strip" },
] as const;

export const PRICE_LINE = "#2563eb";
export const RATIO_GTE = "#16a34a";
export const RATIO_LT = "#dc2626";
export const RATIO_NEUTRAL = "#94a3b8";

export interface ChartRow extends BtcBubblePoint {
  tickLabel: string;
  ratioDeviation: number;
  ratioBarHeight: number;
}

export function exchangeLabel(exchange: BtcBubblemapData["exchange"]): string {
  return exchange === "coinbase" ? "Coinbase" : "Binance";
}

export function ratioNoteFor(data: BtcBubblemapData | undefined): string {
  if (!data) return "";
  if (data.ratioSource === "taker") return "Taker buy/sell volume ratio from Binance klines.";
  if (data.exchange === "coinbase") return "Coinbase buy-pressure proxy (no taker volume on public candles).";
  return "Buy-pressure proxy from CoinGecko OHLC (Binance klines unavailable).";
}

export function formatAxisDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toChartRows(data: BtcBubblemapData | undefined): ChartRow[] {
  if (!data?.points?.length) return [];
  const maxDev = Math.max(...data.points.map((p) => Math.abs(p.ratio - 1)), 0.01);
  return data.points.map((p) => {
    const ratioDeviation = Math.abs(p.ratio - 1);
    return {
      ...p,
      tickLabel: formatAxisDate(p.time),
      ratioDeviation,
      ratioBarHeight: (ratioDeviation / maxDev) * 100,
    };
  });
}

export function computePriceDomain(rows: ChartRow[]): [number, number] {
  if (rows.length === 0) return [0, 1];
  const prices = rows.map((r) => r.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min;
  const pad = span > 0 ? span * 0.06 : max * 0.015;
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

export function computeRatioDomain(rows: ChartRow[]): [number, number] {
  if (rows.length === 0) return [0, 2];
  const ratios = rows.map((r) => r.ratio);
  const min = Math.min(...ratios);
  const max = Math.max(...ratios);
  const pad = Math.max((max - min) * 0.15, 0.1);
  return [Math.max(0, min - pad), max + pad];
}

export function ratioBarFill(ratio: number): string {
  return ratio >= 1 ? RATIO_GTE : RATIO_LT;
}

export function xTickInterval(rowCount: number): number {
  return Math.max(0, Math.floor(rowCount / 8) - 1);
}

export const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
export const GRID_STROKE = "hsl(var(--border) / 0.35)";
