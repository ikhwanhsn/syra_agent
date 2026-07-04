import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { BarChart3, CandlestickChart, Maximize2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import type { TokensDossierCandle } from "@/lib/tokensDossierApi";

const UP = "#22c55e";
const DOWN = "#ef4444";
const UP_TOP = "rgba(34, 197, 94, 0.38)";
const UP_BOTTOM = "rgba(34, 197, 94, 0.02)";
const DOWN_TOP = "rgba(239, 68, 68, 0.34)";
const DOWN_BOTTOM = "rgba(239, 68, 68, 0.02)";
const UP_VOL = "rgba(34, 197, 94, 0.45)";
const DOWN_VOL = "rgba(239, 68, 68, 0.4)";

type ChartMode = "candles" | "area";
type ChartRange = "24H" | "3D" | "7D";

type CandlePoint = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type RangeStats = {
  open: number;
  high: number;
  low: number;
  close: number;
  changePct: number;
  volume: number;
};

type CrosshairState = {
  x: number;
  y: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time: string;
};

const RANGES: ChartRange[] = ["24H", "3D", "7D"];

function formatChartPrice(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString(undefined, { maximumSignificantDigits: 6 });
  return p.toExponential(2);
}

function formatChartPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatCrosshairTime(time: Time): string {
  if (typeof time !== "number") return "";
  return new Date(time * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCandlePoints(candles: TokensDossierCandle[]): CandlePoint[] {
  return candles
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close),
    )
    .map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: Number.isFinite(c.volume) ? c.volume : undefined,
    }))
    .sort((a, b) => a.time - b.time);
}

function sliceByRange(points: CandlePoint[], range: ChartRange): CandlePoint[] {
  if (points.length === 0) return [];
  const hours = range === "24H" ? 24 : range === "3D" ? 72 : 168;
  return points.slice(-hours);
}

function computeStats(points: CandlePoint[]): RangeStats | null {
  if (points.length === 0) return null;
  const open = points[0].open;
  const close = points[points.length - 1].close;
  let high = points[0].high;
  let low = points[0].low;
  let volume = 0;
  for (const p of points) {
    if (p.high > high) high = p.high;
    if (p.low < low) low = p.low;
    if (p.volume != null) volume += p.volume;
  }
  const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
  return { open, high, low, close, changePct, volume };
}

function TerminalStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down" | "neutral";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
      <p
        className={cn(
          "truncate font-mono text-sm font-semibold tabular-nums tracking-tight",
          accent === "up" && "text-emerald-500",
          accent === "down" && "text-red-500",
          accent === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export interface TokensOhlcvChartProps {
  candles: TokensDossierCandle[];
  className?: string;
  height?: number;
  symbol?: string;
  intervalLabel?: string;
}

export function TokensOhlcvChart({
  candles,
  className,
  height = 380,
  symbol,
  intervalLabel = "1H",
}: TokensOhlcvChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area", Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const openLineRef = useRef<ReturnType<ISeriesApi<"Candlestick", Time>["createPriceLine"]> | null>(null);
  const openLineOwnerRef = useRef<ISeriesApi<"Candlestick", Time> | ISeriesApi<"Area", Time> | null>(null);

  const [mode, setMode] = useState<ChartMode>("candles");
  const [range, setRange] = useState<ChartRange>("7D");
  const [crosshair, setCrosshair] = useState<CrosshairState | null>(null);

  const allPoints = useMemo(() => toCandlePoints(candles), [candles]);
  const points = useMemo(() => sliceByRange(allPoints, range), [allPoints, range]);
  const stats = useMemo(() => computeStats(points), [points]);
  const isUp = (stats?.changePct ?? 0) >= 0;
  const hasVolume = points.some((p) => p.volume != null && p.volume > 0);

  const disposeChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      areaSeriesRef.current = null;
      volumeSeriesRef.current = null;
      openLineRef.current = null;
      openLineOwnerRef.current = null;
    }
  }, []);

  const applyData = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || points.length === 0) return;

    const candleData = points.map((p) => ({
      time: p.time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
    const areaData = points.map((p) => ({ time: p.time, value: p.close }));
    const volumeData = points.map((p) => ({
      time: p.time,
      value: p.volume ?? 0,
      color: p.close >= p.open ? UP_VOL : DOWN_VOL,
    }));

    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
        visible: mode === "candles",
        lastValueVisible: mode === "candles",
        priceLineVisible: mode === "candles",
      });
      candleSeriesRef.current.setData(candleData);
    }
    if (areaSeriesRef.current) {
      const line = isUp ? UP : DOWN;
      areaSeriesRef.current.applyOptions({
        visible: mode === "area",
        lastValueVisible: mode === "area",
        priceLineVisible: mode === "area",
        lineColor: line,
        topColor: isUp ? UP_TOP : DOWN_TOP,
        bottomColor: isUp ? UP_BOTTOM : DOWN_BOTTOM,
        crosshairMarkerBackgroundColor: line,
      });
      areaSeriesRef.current.setData(areaData);
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(hasVolume ? volumeData : []);
    }

    if (openLineRef.current && openLineOwnerRef.current) {
      openLineOwnerRef.current.removePriceLine(openLineRef.current);
      openLineRef.current = null;
      openLineOwnerRef.current = null;
    }

    const activeSeries = mode === "candles" ? candleSeriesRef.current : areaSeriesRef.current;
    if (activeSeries && stats) {
      openLineRef.current = activeSeries.createPriceLine({
        price: stats.open,
        color: isDark ? "rgba(161, 161, 170, 0.35)" : "rgba(113, 113, 122, 0.45)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "O",
      });
      openLineOwnerRef.current = activeSeries;
    }

    chart.timeScale().applyOptions({
      barSpacing: mode === "candles" ? 8 : 6,
    });
    chart.timeScale().fitContent();
  }, [hasVolume, isDark, isUp, mode, points, stats]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    disposeChart();

    const bg = isDark ? "#0a0a0c" : "#fafafa";
    const text = isDark ? "#71717a" : "#a1a1aa";
    const grid = isDark ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.05)";
    const crosshairColor = isDark ? "rgba(161,161,170,0.4)" : "rgba(113,113,122,0.45)";
    const labelBg = isDark ? "#27272a" : "#e4e4e7";

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
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
        scaleMargins: { top: 0.08, bottom: hasVolume ? 0.22 : 0.08 },
        autoScale: true,
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false,
        rightOffset: 6,
        barSpacing: 8,
        minBarSpacing: 2,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          visible: true,
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: labelBg,
        },
        horzLine: {
          visible: true,
          color: crosshairColor,
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
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      borderUpColor: UP,
      borderDownColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dotted,
      priceFormat: { type: "custom", formatter: formatChartPrice },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: UP,
      topColor: UP_TOP,
      bottomColor: UP_BOTTOM,
      lineWidth: 2,
      visible: false,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dotted,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: isDark ? "#18181b" : "#fafafa",
      priceFormat: { type: "custom", formatter: formatChartPrice },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
      borderVisible: false,
    });

    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      if (!param.point || param.time == null) {
        setCrosshair(null);
        return;
      }

      const candle = candleSeriesRef.current
        ? param.seriesData.get(candleSeriesRef.current)
        : undefined;
      const area = areaSeriesRef.current ? param.seriesData.get(areaSeriesRef.current) : undefined;
      const vol = volumeSeriesRef.current
        ? param.seriesData.get(volumeSeriesRef.current)
        : undefined;

      if (candle && "open" in candle && typeof candle.open === "number") {
        setCrosshair({
          x: param.point.x,
          y: param.point.y,
          open: candle.open,
          high: candle.high as number,
          low: candle.low as number,
          close: candle.close as number,
          volume: vol && "value" in vol ? (vol.value as number) : undefined,
          time: formatCrosshairTime(param.time),
        });
        return;
      }

      if (area && "value" in area && typeof area.value === "number") {
        const match = points.find((p) => p.time === param.time);
        setCrosshair({
          x: param.point.x,
          y: param.point.y,
          open: match?.open ?? area.value,
          high: match?.high ?? area.value,
          low: match?.low ?? area.value,
          close: area.value,
          volume: match?.volume,
          time: formatCrosshairTime(param.time),
        });
        return;
      }

      setCrosshair(null);
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    areaSeriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

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
  }, [disposeChart, hasVolume, height, isDark, points.length > 0]);

  useEffect(() => {
    applyData();
  }, [applyData]);

  if (!allPoints.length) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/55 bg-muted/15 px-6 text-center",
          className,
        )}
        style={{ height: height + 120 }}
      >
        <CandlestickChart className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm font-medium text-muted-foreground">Chart unavailable for this asset</p>
        <p className="text-xs text-muted-foreground/70">OHLCV data was not returned for this market.</p>
      </div>
    );
  }

  const changeAccent = stats == null ? "neutral" : stats.changePct >= 0 ? "up" : "down";
  const ChangeIcon = stats != null && stats.changePct < 0 ? TrendingDown : TrendingUp;
  const displayPrice = crosshair?.close ?? stats?.close;
  const displayChange = crosshair
    ? stats && stats.open > 0
      ? ((crosshair.close - stats.open) / stats.open) * 100
      : null
    : stats?.changePct;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50",
        "bg-gradient-to-b from-muted/25 via-background to-background",
        "shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04),0_20px_40px_-28px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="border-b border-border/40 bg-muted/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                Market chart
              </p>
              <span className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                {intervalLabel}
              </span>
              {symbol ? (
                <span className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground/80">
                  {symbol}/USD
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <h3 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {displayPrice != null ? formatChartPrice(displayPrice) : "—"}
              </h3>
              {displayChange != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-sm font-semibold tabular-nums",
                    displayChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
                  )}
                >
                  <ChangeIcon className="h-3.5 w-3.5" aria-hidden />
                  {formatChartPct(displayChange)}
                </span>
              ) : null}
            </div>

            {crosshair ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                <span>
                  O <span className="text-foreground/90">{formatChartPrice(crosshair.open)}</span>
                </span>
                <span>
                  H <span className="text-emerald-500">{formatChartPrice(crosshair.high)}</span>
                </span>
                <span>
                  L <span className="text-red-500">{formatChartPrice(crosshair.low)}</span>
                </span>
                <span>
                  C{" "}
                  <span className={crosshair.close >= crosshair.open ? "text-emerald-500" : "text-red-500"}>
                    {formatChartPrice(crosshair.close)}
                  </span>
                </span>
                {crosshair.volume != null && crosshair.volume > 0 ? (
                  <span>
                    V <span className="text-foreground/90">{formatCompactUsd(crosshair.volume)}</span>
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Hover for OHLC · scroll to zoom · drag to pan
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="flex gap-0.5 rounded-xl border border-border/50 bg-background/70 p-0.5 shadow-sm">
              {RANGES.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 min-w-[2.75rem] rounded-lg px-2.5 font-mono text-xs font-semibold",
                    range === r
                      ? "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                >
                  {r}
                </Button>
              ))}
            </div>

            <div className="flex gap-0.5 rounded-xl border border-border/50 bg-background/70 p-0.5 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  mode === "candles"
                    ? "bg-foreground text-background hover:bg-foreground hover:text-background"
                    : "text-muted-foreground",
                )}
                onClick={() => setMode("candles")}
                aria-label="Candlestick chart"
                aria-pressed={mode === "candles"}
              >
                <CandlestickChart className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  mode === "area"
                    ? "bg-foreground text-background hover:bg-foreground hover:text-background"
                    : "text-muted-foreground",
                )}
                onClick={() => setMode("area")}
                aria-label="Area chart"
                aria-pressed={mode === "area"}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg border-border/50"
              onClick={() => chartRef.current?.timeScale().fitContent()}
              aria-label="Reset chart zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {stats ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <TerminalStat label="Open" value={formatChartPrice(stats.open)} />
            <TerminalStat label="High" value={formatChartPrice(stats.high)} accent="up" />
            <TerminalStat label="Low" value={formatChartPrice(stats.low)} accent="down" />
            <TerminalStat
              label={`${range} change`}
              value={formatChartPct(stats.changePct)}
              accent={changeAccent}
            />
            <TerminalStat
              label="Volume"
              value={stats.volume > 0 ? formatCompactUsd(stats.volume) : "—"}
              accent="neutral"
            />
          </div>
        ) : null}
      </div>

      <div className="relative">
        {crosshair ? (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border/60 bg-background/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
            style={{
              left: Math.min(Math.max(crosshair.x, 56), (containerRef.current?.clientWidth ?? 320) - 56),
              top: Math.max(12, crosshair.y - 10),
            }}
          >
            <p
              className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                crosshair.close >= crosshair.open ? "text-emerald-500" : "text-red-500",
              )}
            >
              {formatChartPrice(crosshair.close)}
            </p>
            <p className="text-[10px] text-muted-foreground">{crosshair.time}</p>
          </div>
        ) : null}

        <div
          ref={containerRef}
          className="w-full min-w-0"
          style={{ height }}
          aria-label={`${symbol ?? "Token"} price chart`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/70 to-transparent" />
      </div>
    </div>
  );
}
