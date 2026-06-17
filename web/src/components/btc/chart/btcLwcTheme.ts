import { ColorType, CrosshairMode, LineStyle, type DeepPartial, type ChartOptions } from "lightweight-charts";
import type { ResolvedShareTheme } from "@/components/btc/share/btcChartShareTheme";

export const BTC_PRICE_COLOR = "#3b82f6";
export const BTC_PRICE_TOP = "rgba(59, 130, 246, 0.38)";
export const BTC_PRICE_BOTTOM = "rgba(59, 130, 246, 0.02)";
export const BTC_PRICE_LINE_MINIMAL = "#60a5fa";

export function formatBtcChartPrice(p: number): string {
  if (!Number.isFinite(p)) return "";
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatBtcChartRatio(p: number): string {
  if (!Number.isFinite(p)) return "";
  return p.toFixed(2);
}

export function buildBtcChartOptions(
  isDark: boolean,
  captureMode: boolean,
  shareChart?: ResolvedShareTheme["chart"],
): DeepPartial<ChartOptions> {
  const dark = shareChart?.isDark ?? isDark;
  const bg = shareChart?.background ?? (captureMode ? "#0a0a0a" : dark ? "rgba(9, 9, 11, 0)" : "rgba(250, 250, 250, 0)");
  const text = shareChart?.textColor ?? (dark ? "#a1a1aa" : "#71717a");
  const grid = shareChart?.gridColor ?? (dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)");
  const border = shareChart?.borderColor ?? (dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)");
  const crosshairLabelBg = shareChart?.crosshairLabelBg ?? (dark ? "#27272a" : "#e4e4e7");

  return {
    layout: {
      attributionLogo: false,
      background: { type: ColorType.Solid, color: bg },
      textColor: text,
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: grid, style: LineStyle.Dotted },
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.12, bottom: 0.08 },
      autoScale: true,
    },
    leftPriceScale: { visible: false },
    timeScale: {
      borderVisible: false,
      borderColor: border,
      fixLeftEdge: false,
      fixRightEdge: false,
      rightOffset: 6,
      barSpacing: 7,
      minBarSpacing: 2,
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        visible: true,
        color: dark ? "rgba(161, 161, 170, 0.35)" : "rgba(113, 113, 122, 0.45)",
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: crosshairLabelBg,
      },
      horzLine: {
        visible: true,
        color: dark ? "rgba(161, 161, 170, 0.35)" : "rgba(113, 113, 122, 0.45)",
        width: 1,
        style: LineStyle.Dashed,
        labelBackgroundColor: crosshairLabelBg,
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
  };
}
