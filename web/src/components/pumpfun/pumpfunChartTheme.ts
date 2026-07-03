import { ColorType, CrosshairMode, LineStyle, type DeepPartial, type ChartOptions } from "lightweight-charts";

export const PUMPFUN_CHART_UP = "#22c55e";
export const PUMPFUN_CHART_UP_TOP = "rgba(34, 197, 94, 0.42)";
export const PUMPFUN_CHART_UP_BOTTOM = "rgba(34, 197, 94, 0.02)";
export const PUMPFUN_CHART_DOWN = "#ef4444";
export const PUMPFUN_CHART_DOWN_TOP = "rgba(239, 68, 68, 0.38)";
export const PUMPFUN_CHART_DOWN_BOTTOM = "rgba(239, 68, 68, 0.02)";

export const PUMPFUN_CHART_DEFAULT_ACCENT = "#3b82f6";
export const PUMPFUN_CHART_DEFAULT_TOP = "rgba(59, 130, 246, 0.45)";
export const PUMPFUN_CHART_DEFAULT_BOTTOM = "rgba(59, 130, 246, 0.02)";

export function formatPumpChartPrice(p: number): string {
  if (!Number.isFinite(p)) return "";
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString(undefined, { maximumSignificantDigits: 6 });
  return p.toExponential(2);
}

export function formatPumpChartPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function buildPumpfunTerminalChartOptions(isDark: boolean, height: number): DeepPartial<ChartOptions> {
  const bg = isDark ? "#0c0c0e" : "#fafafa";
  const text = isDark ? "#71717a" : "#a1a1aa";
  const grid = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.05)";
  const crosshair = isDark ? "rgba(161, 161, 170, 0.4)" : "rgba(113, 113, 122, 0.45)";
  const labelBg = isDark ? "#27272a" : "#e4e4e7";

  return {
    layout: {
      attributionLogo: false,
      background: { type: ColorType.Solid, color: bg },
      textColor: text,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: grid, style: LineStyle.Dotted },
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.1, bottom: 0.12 },
      autoScale: true,
    },
    timeScale: {
      borderVisible: false,
      fixLeftEdge: false,
      fixRightEdge: false,
      rightOffset: 8,
      barSpacing: 8,
      minBarSpacing: 3,
      timeVisible: true,
      secondsVisible: false,
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        visible: true,
        color: crosshair,
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: labelBg,
      },
      horzLine: {
        visible: true,
        color: crosshair,
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: labelBg,
      },
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: { time: true, price: false },
      mouseWheel: true,
      pinch: true,
    },
    height,
  };
}

export function buildPumpfunDefaultChartOptions(isDark: boolean, height: number): DeepPartial<ChartOptions> {
  const bg = isDark ? "#09090b" : "#fafafa";
  const text = isDark ? "#a1a1aa" : "#71717a";

  return {
    layout: {
      attributionLogo: false,
      background: { type: ColorType.Solid, color: bg },
      textColor: text,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
    },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
    crosshair: { vertLine: { visible: false }, horzLine: { visible: true, style: 1 } },
    handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
    handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false },
    height,
  };
}

export type PumpChartPalette = {
  line: string;
  top: string;
  bottom: string;
};

export function paletteForChange(changePct: number): PumpChartPalette {
  if (changePct >= 0) {
    return { line: PUMPFUN_CHART_UP, top: PUMPFUN_CHART_UP_TOP, bottom: PUMPFUN_CHART_UP_BOTTOM };
  }
  return { line: PUMPFUN_CHART_DOWN, top: PUMPFUN_CHART_DOWN_TOP, bottom: PUMPFUN_CHART_DOWN_BOTTOM };
}

export type PumpChartRangeStats = {
  open: number;
  close: number;
  high: number;
  low: number;
  changePct: number;
};

export function computeRangeStats(points: { value: number }[]): PumpChartRangeStats | null {
  if (points.length === 0) return null;
  const open = points[0].value;
  const close = points[points.length - 1].value;
  let high = open;
  let low = open;
  for (const p of points) {
    if (p.value > high) high = p.value;
    if (p.value < low) low = p.value;
  }
  const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
  return { open, close, high, low, changePct };
}
