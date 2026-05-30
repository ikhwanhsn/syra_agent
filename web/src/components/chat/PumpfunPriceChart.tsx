import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AreaSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { fetchAgentChartUsdSeries, type PumpChartRange } from "@/lib/pumpTokenChartData";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const RANGES: PumpChartRange[] = ["1D", "1W", "1M", "1Y"];

const ACCENT = "#3b82f6";
const ACCENT_TOP = "rgba(59, 130, 246, 0.45)";
const ACCENT_BOTTOM = "rgba(59, 130, 246, 0.02)";

export interface PumpfunPriceChartProps {
  /** Solana mint (pump.fun / on-chain chart) */
  mint?: string;
  /** CoinGecko coin id (e.g. bitcoin, solana) — trading signal */
  coinId?: string;
  /** Short label (e.g. symbol or "SOL") */
  title?: string;
  className?: string;
}

export function PumpfunPriceChart({ mint, coinId, title, className }: PumpfunPriceChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  /** Narrow surface used here (full series type is from lightweight-charts). */
  const seriesRef = useRef<{
    setData: (data: Array<{ time: UTCTimestamp; value: number }>) => void;
  } | null>(null);
  const [range, setRange] = useState<PumpChartRange>("1D");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const acRef = useRef<AbortController | null>(null);

  const disposeChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
  }, []);

  const ensureChart = useCallback(() => {
    const el = containerRef.current;
    if (!el || chartRef.current) return;
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
      height: 220,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: ACCENT,
      topColor: ACCENT_TOP,
      bottomColor: ACCENT_BOTTOM,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      priceFormat: {
        type: "custom",
        formatter: (p: number) => {
          if (!Number.isFinite(p)) return "";
          if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
          if (p >= 0.0001) return p.toLocaleString(undefined, { maximumSignificantDigits: 6 });
          return p.toExponential(2);
        },
      },
    });
    chartRef.current = chart;
    seriesRef.current = series;
  }, [isDark]);

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
          seriesRef.current?.setData([]);
          return;
        }
        ensureChart();
        const series = seriesRef.current;
        const chart = chartRef.current;
        if (!series || !chart) return;
        const data = raw.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.value,
        }));
        series.setData(data);
        chart.timeScale().fitContent();
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
        <div ref={containerRef} className="h-[220px] w-full min-w-0 pb-2" aria-label={`${heading} price chart`} />
      </div>
    </div>
  );
}
