import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { AreaSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { cn } from "@/lib/utils";
import type { TokensDossierCandle } from "@/lib/tokensDossierApi";

const ACCENT = "#22c55e";
const ACCENT_TOP = "rgba(34, 197, 94, 0.4)";
const ACCENT_BOTTOM = "rgba(34, 197, 94, 0.02)";

function formatChartPrice(p: number): string {
  if (!Number.isFinite(p)) return "";
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString(undefined, { maximumSignificantDigits: 6 });
  return p.toExponential(2);
}

export interface TokensOhlcvChartProps {
  candles: TokensDossierCandle[];
  className?: string;
  height?: number;
}

export function TokensOhlcvChart({ candles, className, height = 240 }: TokensOhlcvChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<{
    setData: (data: Array<{ time: UTCTimestamp; value: number }>) => void;
  } | null>(null);

  const disposeChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    disposeChart();
    const bg = isDark ? "#09090b" : "#fafafa";
    const text = isDark ? "#a1a1aa" : "#71717a";
    const chart = createChart(el, {
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
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: ACCENT,
      topColor: ACCENT_TOP,
      bottomColor: ACCENT_BOTTOM,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      priceFormat: { type: "custom", formatter: formatChartPrice },
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const points = candles
      .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close))
      .map((c) => ({ time: c.time as UTCTimestamp, value: c.close }))
      .sort((a, b) => a.time - b.time);
    series.setData(points);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (chartRef.current && el.clientWidth > 0) {
        chartRef.current.applyOptions({ width: el.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      disposeChart();
    };
  }, [candles, disposeChart, height, isDark]);

  if (!candles.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        Chart unavailable for this asset
      </div>
    );
  }

  return <div ref={containerRef} className={cn("w-full rounded-xl overflow-hidden", className)} />;
}
