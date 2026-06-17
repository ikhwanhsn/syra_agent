import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import { formatBtcRatio, formatBtcUsd, formatBubbleTimestamp } from "@/lib/btcApi";
import {
  type BtcChartVariant,
  type ChartRow,
} from "@/components/btc/chart/btcChartShared";
import { colorWithAlpha, type ResolvedShareTheme } from "@/components/btc/share/btcChartShareTheme";
import {
  BTC_PRICE_BOTTOM,
  BTC_PRICE_COLOR,
  BTC_PRICE_LINE_MINIMAL,
  BTC_PRICE_TOP,
  buildBtcChartOptions,
  formatBtcChartPrice,
  formatBtcChartRatio,
} from "@/components/btc/chart/btcLwcTheme";
import {
  RatioBubblePrimitive,
  chartRowsToBubblePoints,
  type RatioBubblePoint,
} from "@/components/btc/chart/btcRatioBubblePrimitive";
import { ChartFootnote, ChartLegend } from "@/components/btc/chart/BtcChartParts";

type PriceSeries = ISeriesApi<"Area" | "Line", Time>;

function dedupePriceData(rows: ChartRow[]): LineData<Time>[] {
  const seen = new Set<number>();
  const out: LineData<Time>[] = [];
  for (const row of rows) {
    const sec = Math.floor(row.time / 1000);
    if (seen.has(sec)) continue;
    seen.add(sec);
    out.push({ time: sec as UTCTimestamp, value: row.price });
  }
  return out;
}

function ratioBarColor(ratio: number, alpha: number): string {
  return ratio >= 1 ? `rgba(22, 163, 74, ${alpha})` : `rgba(220, 38, 38, ${alpha})`;
}

function ratioHistogramData(rows: ChartRow[], useIntensity: boolean): HistogramData<Time>[] {
  const seen = new Set<number>();
  const out: HistogramData<Time>[] = [];
  for (const row of rows) {
    const sec = Math.floor(row.time / 1000);
    if (seen.has(sec)) continue;
    seen.add(sec);
    const alpha = useIntensity ? 0.35 + (row.extremePercentile / 100) * 0.55 : 0.55;
    out.push({
      time: sec as UTCTimestamp,
      value: useIntensity ? row.ratioDeviation : row.ratio,
      color: ratioBarColor(row.ratio, alpha),
    });
  }
  return out;
}

function rowByTime(rows: ChartRow[], time: Time | undefined): ChartRow | null {
  if (time == null) return null;
  const sec = typeof time === "number" ? time : null;
  if (sec == null) return null;
  return rows.find((r) => Math.floor(r.time / 1000) === sec) ?? null;
}

function variantHeights(variant: BtcChartVariant): { main: number; ratio?: number } {
  switch (variant) {
    case "dual":
      return { main: 300, ratio: 110 };
    case "heatmap":
      return { main: 300, ratio: 88 };
    default:
      return { main: 440 };
  }
}

function bubbleSizeForVariant(variant: BtcChartVariant): [number, number] {
  switch (variant) {
    case "minimal":
      return [7, 24];
    case "area":
      return [6, 22];
    case "heatmap":
      return [4, 14];
    default:
      return [5, 20];
  }
}

export interface BtcFlowChartProps {
  rows: ChartRow[];
  variant: BtcChartVariant;
  ratioNote?: string;
  captureMode?: boolean;
  shareTheme?: ResolvedShareTheme;
  showChrome?: boolean;
  className?: string;
}

export function BtcFlowChart({
  rows,
  variant,
  ratioNote = "",
  captureMode = false,
  shareTheme,
  showChrome = true,
  className,
}: BtcFlowChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = shareTheme?.chart.isDark ?? (captureMode || resolvedTheme !== "light");

  const priceLine = shareTheme?.chart.priceLine ?? BTC_PRICE_COLOR;
  const priceTop = shareTheme?.chart.priceTop ?? BTC_PRICE_TOP;
  const priceBottom = shareTheme?.chart.priceBottom ?? BTC_PRICE_BOTTOM;
  const priceLineMinimal = shareTheme?.chart.priceLineMinimal ?? BTC_PRICE_LINE_MINIMAL;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<PriceSeries | null>(null);
  const ratioSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const bubblePrimitiveRef = useRef<RatioBubblePrimitive | null>(null);
  const parityLineRef = useRef<ReturnType<ISeriesApi<"Histogram", Time>["createPriceLine"]> | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    row: ChartRow;
  } | null>(null);

  const heights = variantHeights(variant);
  const totalHeight = heights.main + (heights.ratio ?? 0);
  const priceData = useMemo(() => dedupePriceData(rows), [rows]);
  const bubblePoints = useMemo(() => chartRowsToBubblePoints(rows), [rows]);
  const [minBubbleR, maxBubbleR] = bubbleSizeForVariant(variant);

  const disposeChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      ratioSeriesRef.current = null;
      bubblePrimitiveRef.current = null;
      parityLineRef.current = null;
    }
  }, []);

  const applyBubblePoints = useCallback(
    (points: RatioBubblePoint[]) => {
      const primitive = bubblePrimitiveRef.current;
      if (!primitive) return;
      primitive.setBubbleSize(minBubbleR, maxBubbleR);
      primitive.setPoints(points);
    },
    [minBubbleR, maxBubbleR],
  );

  const onCrosshairMove = useCallback(
    (param: MouseEventParams<Time>) => {
      if (!param.point || param.time == null) {
        setTooltip(null);
        return;
      }
      const row = rowByTime(rows, param.time);
      if (!row) {
        setTooltip(null);
        return;
      }
      setTooltip({ x: param.point.x, y: param.point.y, row });
    },
    [rows],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rows.length < 2) return;

    disposeChart();

    const chart = createChart(el, {
      ...buildBtcChartOptions(isDark, captureMode, shareTheme?.chart),
      width: el.clientWidth,
      height: totalHeight,
      autoSize: false,
    });

    const useLineOnly = variant === "minimal";
    const showBubblesOnChart = variant !== "dual";

    let priceSeries: PriceSeries;
    if (useLineOnly) {
      priceSeries = chart.addSeries(LineSeries, {
        color: priceLineMinimal,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lastValueVisible: true,
        priceLineVisible: true,
        priceFormat: { type: "custom", formatter: formatBtcChartPrice, minMove: 0.01 },
      });
    } else {
      const isDepth = variant === "area";
      priceSeries = chart.addSeries(AreaSeries, {
        lineColor: priceLine,
        topColor: isDepth ? colorWithAlpha(priceLine, 0.48) : priceTop,
        bottomColor: priceBottom,
        lineWidth: isDepth ? 3 : 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lastValueVisible: true,
        priceLineVisible: true,
        priceFormat: { type: "custom", formatter: formatBtcChartPrice, minMove: 0.01 },
      });
    }

    let bubblePrimitive: RatioBubblePrimitive | null = null;
    if (showBubblesOnChart) {
      bubblePrimitive = new RatioBubblePrimitive();
      priceSeries.attachPrimitive(bubblePrimitive);
    }

    if (variant === "dual" || variant === "heatmap") {
      const ratioPane = chart.addPane();
      ratioPane.setStretchFactor(variant === "heatmap" ? 0.22 : 0.28);

      const ratioSeries = ratioPane.addSeries(HistogramSeries, {
        priceFormat: { type: "custom", formatter: formatBtcChartRatio, minMove: 0.01 },
        lastValueVisible: false,
        priceLineVisible: false,
        base: variant === "heatmap" ? 0 : undefined,
      });

      const histData = ratioHistogramData(rows, variant === "heatmap");
      ratioSeries.setData(histData);

      if (variant === "dual") {
        parityLineRef.current = ratioSeries.createPriceLine({
          price: 1,
          color: isDark ? "rgba(161, 161, 170, 0.45)" : "rgba(113, 113, 122, 0.55)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
        });
      }

      ratioSeriesRef.current = ratioSeries;
    }

    priceSeries.setData(priceData);
    if (bubblePrimitive) {
      bubblePrimitive.setBubbleSize(minBubbleR, maxBubbleR);
      bubblePrimitive.setPoints(bubblePoints);
    }
    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove(onCrosshairMove);

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    bubblePrimitiveRef.current = bubblePrimitive;

    const ro = new ResizeObserver(() => {
      if (chartRef.current && el.clientWidth > 0) {
        chartRef.current.applyOptions({ width: el.clientWidth, height: totalHeight });
        chartRef.current.timeScale().fitContent();
      }
    });
    ro.observe(el);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      ro.disconnect();
      disposeChart();
    };
  // Data updates handled in separate effect — rebuild only on layout/style changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- priceData/bubblePoints/rows update via data effect
  }, [
    variant,
    isDark,
    captureMode,
    shareTheme,
    totalHeight,
    minBubbleR,
    maxBubbleR,
    priceLine,
    priceTop,
    priceBottom,
    priceLineMinimal,
    disposeChart,
    onCrosshairMove,
  ]);

  useEffect(() => {
    if (!priceSeriesRef.current || !chartRef.current) return;
    priceSeriesRef.current.setData(priceData);
    if (bubblePrimitiveRef.current) {
      applyBubblePoints(bubblePoints);
    }
    ratioSeriesRef.current?.setData(ratioHistogramData(rows, variant === "heatmap"));
    chartRef.current.timeScale().fitContent();
  }, [priceData, bubblePoints, rows, variant, applyBubblePoints]);

  if (rows.length < 2) {
    return (
      <div className={cn("flex h-[440px] items-center justify-center", className)}>
        <p className="text-sm text-muted-foreground">Not enough data</p>
      </div>
    );
  }

  const showBubbles = variant !== "dual";
  const legendCompact = variant === "minimal";

  return (
    <div className={cn("relative", className)}>
      {showChrome ? (
        <>
          {showBubbles ? <ChartLegend compact={legendCompact} /> : null}
          {ratioNote && variant !== "dual" ? <ChartFootnote ratioNote={ratioNote} /> : null}
          {variant === "dual" && ratioNote ? (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,20rem)] rounded-lg border border-border/40 bg-background/80 px-3 py-2 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
              <p>{ratioNote}</p>
              <p className="mt-1">Bars = buy/sell ratio · Line = BTC price · Dashed = parity (1.0)</p>
            </div>
          ) : null}
        </>
      ) : null}

      <div
        ref={containerRef}
        className="w-full min-w-0"
        style={{ height: totalHeight }}
        aria-label="BTC price and flow ratio chart"
      />

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 min-w-[11rem] rounded-xl border border-border/60 bg-background/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 300) - 200),
            top: Math.max(tooltip.y - 80, 8),
          }}
        >
          <p className="mb-2 font-medium text-foreground">{formatBubbleTimestamp(tooltip.row.time)}</p>
          <div className="grid gap-1.5 font-mono tabular-nums">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold text-foreground">{formatBtcUsd(tooltip.row.price, 2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Ratio</span>
              <span
                className={cn(
                  "font-semibold",
                  tooltip.row.ratio >= 1
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {formatBtcRatio(tooltip.row.ratio)}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Extreme</span>
              <span>{tooltip.row.extremePercentile.toFixed(0)}th pct</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
