import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Loader2, Maximize2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAgentChartUsdSeries, type PumpChartRange } from "@/lib/pumpTokenChartData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildPumpfunDefaultChartOptions,
  buildPumpfunTerminalChartOptions,
  computeRangeStats,
  formatPumpChartPct,
  formatPumpChartPrice,
  paletteForChange,
  PUMPFUN_CHART_DEFAULT_ACCENT,
  PUMPFUN_CHART_DEFAULT_BOTTOM,
  PUMPFUN_CHART_DEFAULT_TOP,
  type PumpChartRangeStats,
} from "@/components/pumpfun/pumpfunChartTheme";

const RANGES: PumpChartRange[] = ["1D", "1W", "1M", "1Y"];

type ChartPoint = { time: UTCTimestamp; value: number };

export interface PumpfunPriceChartProps {
  /** Solana mint (pump.fun / on-chain chart) */
  mint?: string;
  /** CoinGecko coin id (e.g. bitcoin, solana) — trading signal */
  coinId?: string;
  /** Short label (e.g. symbol or "SOL") */
  title?: string;
  /** Compact chat card vs pro trading terminal (scan results) */
  variant?: "default" | "terminal";
  /** Data source label — shown in terminal header */
  source?: string;
  /** Default selected range (terminal variant). */
  defaultRange?: PumpChartRange;
  /** Chart canvas height in px (terminal variant). */
  chartHeight?: number;
  className?: string;
}

function formatCrosshairTime(time: Time): string {
  if (typeof time !== "number") return "";
  const d = new Date(time * 1000);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function PumpfunPriceChart({
  mint,
  coinId,
  title,
  variant = "default",
  source,
  defaultRange = "1D",
  chartHeight: chartHeightProp,
  className,
}: PumpfunPriceChartProps) {
  const isTerminal = variant === "terminal";
  const chartHeight = chartHeightProp ?? (isTerminal ? 360 : 220);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area", Time> | null>(null);
  const openLineRef = useRef<ReturnType<ISeriesApi<"Area", Time>["createPriceLine"]> | null>(null);

  const [range, setRange] = useState<PumpChartRange>(defaultRange);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<ChartPoint[]>([]);
  const [rangeStats, setRangeStats] = useState<PumpChartRangeStats | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; time: string } | null>(null);
  const acRef = useRef<AbortController | null>(null);

  const palette = useMemo(() => {
    if (!isTerminal || !rangeStats) {
      return { line: PUMPFUN_CHART_DEFAULT_ACCENT, top: PUMPFUN_CHART_DEFAULT_TOP, bottom: PUMPFUN_CHART_DEFAULT_BOTTOM };
    }
    return paletteForChange(rangeStats.changePct);
  }, [isTerminal, rangeStats]);

  const disposeChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      openLineRef.current = null;
    }
  }, []);

  const applySeriesPalette = useCallback(
    (series: ISeriesApi<"Area", Time>, stats: PumpChartRangeStats | null) => {
      const colors = stats && isTerminal ? paletteForChange(stats.changePct) : palette;
      series.applyOptions({
        lineColor: colors.line,
        topColor: colors.top,
        bottomColor: colors.bottom,
        crosshairMarkerBackgroundColor: colors.line,
      });
    },
    [isTerminal, palette],
  );

  const ensureChart = useCallback(() => {
    const el = containerRef.current;
    if (!el || chartRef.current) return;

    const options = isTerminal
      ? buildPumpfunTerminalChartOptions(isDark, chartHeight)
      : buildPumpfunDefaultChartOptions(isDark, chartHeight);

    const chart = createChart(el, {
      ...options,
      width: el.clientWidth,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: PUMPFUN_CHART_DEFAULT_ACCENT,
      topColor: PUMPFUN_CHART_DEFAULT_TOP,
      bottomColor: PUMPFUN_CHART_DEFAULT_BOTTOM,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: isTerminal ? 5 : 4,
      crosshairMarkerBorderColor: isDark ? "#18181b" : "#fafafa",
      crosshairMarkerBackgroundColor: PUMPFUN_CHART_DEFAULT_ACCENT,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dotted,
      priceFormat: {
        type: "custom",
        formatter: formatPumpChartPrice,
      },
    });

    if (isTerminal) {
      chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
        if (!param.point || param.time == null || !seriesRef.current) {
          setCrosshair(null);
          return;
        }
        const price = param.seriesData.get(seriesRef.current);
        if (!price || !("value" in price) || typeof price.value !== "number") {
          setCrosshair(null);
          return;
        }
        setCrosshair({
          x: param.point.x,
          y: param.point.y,
          price: price.value,
          time: formatCrosshairTime(param.time),
        });
      });
    }

    chartRef.current = chart;
    seriesRef.current = series;
  }, [chartHeight, isDark, isTerminal]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (chartRef.current && el.clientWidth > 0) {
        chartRef.current.applyOptions({ width: el.clientWidth });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    disposeChart();
    ensureChart();
    return () => disposeChart();
  }, [disposeChart, ensureChart]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || seriesData.length === 0) return;
    series.setData(seriesData);
    applySeriesPalette(series, rangeStats);

    if (isTerminal && rangeStats) {
      if (openLineRef.current) {
        series.removePriceLine(openLineRef.current);
        openLineRef.current = null;
      }
      openLineRef.current = series.createPriceLine({
        price: rangeStats.open,
        color: isDark ? "rgba(161, 161, 170, 0.35)" : "rgba(113, 113, 122, 0.45)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Open",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [applySeriesPalette, isDark, isTerminal, rangeStats, seriesData]);

  useEffect(() => {
    const trimmedMint = mint?.trim() ?? "";
    const trimmedCoin = coinId?.trim() ?? "";
    if (!trimmedMint && !trimmedCoin) {
      setStatus("error");
      setError("Missing chart asset");
      return;
    }

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    setStatus("loading");
    setError(null);
    setCrosshair(null);

    (async () => {
      try {
        const raw = await fetchAgentChartUsdSeries(
          { mint: trimmedMint || undefined, coinId: trimmedCoin || undefined },
          range,
          ac.signal,
        );
        if (ac.signal.aborted) return;

        if (raw.length === 0) {
          setStatus("error");
          setError("No chart data for this token or pair.");
          setSeriesData([]);
          setRangeStats(null);
          seriesRef.current?.setData([]);
          return;
        }

        const data: ChartPoint[] = raw.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.value,
        }));
        const stats = computeRangeStats(data);

        ensureChart();
        setSeriesData(data);
        setRangeStats(stats);
        setStatus("ready");
      } catch (e) {
        if (ac.signal.aborted) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load chart");
      }
    })();

    return () => ac.abort();
  }, [mint, coinId, range, ensureChart]);

  const heading = title?.trim() || "Price";
  const changeAccent = rangeStats == null ? "neutral" : rangeStats.changePct >= 0 ? "up" : "down";
  const ChangeIcon = rangeStats != null && rangeStats.changePct < 0 ? TrendingDown : TrendingUp;

  if (isTerminal) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 via-background to-background shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.05),0_24px_48px_-32px_rgba(0,0,0,0.55)]",
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
                  Live USD
                </p>
                {source ? (
                  <span className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {source}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h3 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {rangeStats ? formatPumpChartPrice(rangeStats.close) : status === "loading" ? "—" : heading}
                </h3>
                {rangeStats ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-sm font-semibold tabular-nums",
                      changeAccent === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
                    )}
                  >
                    <ChangeIcon className="h-3.5 w-3.5" aria-hidden />
                    {formatPumpChartPct(rangeStats.changePct)}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {heading} · pump.fun · DexScreener / GeckoTerminal fallback
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
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

          {rangeStats ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TerminalStat label="Open" value={formatPumpChartPrice(rangeStats.open)} />
              <TerminalStat label="High" value={formatPumpChartPrice(rangeStats.high)} accent="up" />
              <TerminalStat label="Low" value={formatPumpChartPrice(rangeStats.low)} accent="down" />
              <TerminalStat
                label={`${range} change`}
                value={formatPumpChartPct(rangeStats.changePct)}
                accent={changeAccent}
              />
            </div>
          ) : status === "loading" ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          {status === "loading" ? (
            <div className="absolute inset-0 z-10 flex items-end px-3 pb-8 pt-4 sm:px-4">
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
          ) : null}
          {status === "error" && error ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{error}</p>
          ) : null}

          {crosshair ? (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border/60 bg-background/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
              style={{ left: crosshair.x, top: Math.max(12, crosshair.y - 10) }}
            >
              <p className="font-mono text-xs font-semibold tabular-nums text-foreground">
                {formatPumpChartPrice(crosshair.price)}
              </p>
              <p className="text-[10px] text-muted-foreground">{crosshair.time}</p>
            </div>
          ) : null}

          <div
            ref={containerRef}
            className={cn("w-full min-w-0", status === "error" && "hidden")}
            style={{ height: chartHeight }}
            aria-label={`${heading} price chart`}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-3 overflow-hidden rounded-xl border border-border/60 bg-muted/10 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            Live chart
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{heading}</p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg bg-background/60 p-0.5 ring-1 ring-border/40">
          {RANGES.map((r) => (
            <Button
              key={r}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 min-w-[2.5rem] px-2.5 text-xs font-semibold",
                range === r ? "bg-muted shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative px-1 pb-1 pt-0.5 sm:px-2">
        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          </div>
        )}
        {status === "error" && error && (
          <p className="px-3 py-2 text-center text-xs text-muted-foreground">{error}</p>
        )}
        <div
          ref={containerRef}
          className={cn("w-full min-w-0 pb-2", status === "error" && "hidden")}
          style={{ height: chartHeight }}
          aria-label={`${heading} price chart`}
        />
      </div>
    </div>
  );
}
