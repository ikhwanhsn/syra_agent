/**
 * Lightweight inline price spoiler chart for token list rows.
 *
 * - Lazy: OHLC is only fetched once the row scrolls within the viewport
 *   (IntersectionObserver). Tables of 10+ rows therefore avoid spraying
 *   N requests on the very first paint.
 * - Cheap: hand-rolled SVG path so we don't pay Recharts' wrapper cost per row.
 * - Color tone: derived from first→last close (pump/dump/flat). When candles
 *   are still loading (or upstream returned nothing) we fall back to the
 *   row's `changePct` so the cell is never blank.
 *
 * Dedup is automatic — TanStack Query keys on `address` + timeframe + limit,
 * so opening the detail page reuses the same OHLC payload.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseOhlc } from "@/lib/RiseDashboardContext";
import { cn } from "@/lib/utils";

type Tone = "up" | "down" | "flat";

const TONE: Record<
  Tone,
  { stroke: string; fillId: string; fillFrom: string; fillTo: string }
> = {
  up: {
    stroke: "hsl(142 71% 45%)", // emerald-500-ish
    fillId: "spark-fill-up",
    fillFrom: "hsl(142 71% 45% / 0.32)",
    fillTo: "hsl(142 71% 45% / 0)",
  },
  down: {
    stroke: "hsl(0 72% 55%)", // red-500-ish
    fillId: "spark-fill-down",
    fillFrom: "hsl(0 72% 55% / 0.30)",
    fillTo: "hsl(0 72% 55% / 0)",
  },
  flat: {
    stroke: "hsl(var(--muted-foreground))",
    fillId: "spark-fill-flat",
    fillFrom: "hsl(var(--muted-foreground) / 0.18)",
    fillTo: "hsl(var(--muted-foreground) / 0)",
  },
};

function deriveTone(points: number[], changePct: number | null | undefined): Tone {
  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (last > first * 1.001) return "up";
    if (last < first * 0.999) return "down";
    return "flat";
  }
  if (typeof changePct === "number" && Number.isFinite(changePct)) {
    if (changePct > 0.5) return "up";
    if (changePct < -0.5) return "down";
  }
  return "flat";
}

function buildPaths(points: number[], width: number, height: number) {
  if (points.length < 2) return { line: "", area: "" };
  const minV = Math.min(...points);
  const maxV = Math.max(...points);
  const range = maxV - minV || 1;
  const stepX = width / (points.length - 1);
  const padTop = 1;
  const padBottom = 1;
  const usable = height - padTop - padBottom;

  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = padTop + usable - ((v - minV) / range) * usable;
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = `${line} L${last[0].toFixed(2)} ${height} L${first[0].toFixed(2)} ${height} Z`;
  return { line, area };
}

export type MarketSparklineProps = {
  address: string | null | undefined;
  changePct?: number | null;
  width?: number;
  height?: number;
  className?: string;
  /** Show "Pump"/"Dump" verdict pill at the right edge. */
  showVerdict?: boolean;
  /** Override the OHLC timeframe + count. Defaults to 1h × 24 candles. */
  timeframe?: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  candleLimit?: number;
};

export function MarketSparkline({
  address,
  changePct = null,
  width = 96,
  height = 28,
  className,
  showVerdict = false,
  timeframe = "1h",
  candleLimit = 24,
}: MarketSparklineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const ohlc = useRiseOhlc(visible ? (address ?? null) : null, timeframe, candleLimit);

  const points = useMemo(() => {
    const candles = ohlc.data?.candles ?? [];
    return candles
      .map((c) =>
        typeof c.close === "number" && Number.isFinite(c.close)
          ? c.close
          : typeof c.open === "number" && Number.isFinite(c.open)
            ? c.open
            : null,
      )
      .filter((v): v is number => v !== null);
  }, [ohlc.data]);

  const tone = useMemo(() => deriveTone(points, changePct), [points, changePct]);
  const palette = TONE[tone];
  const { line, area } = useMemo(() => buildPaths(points, width, height), [points, width, height]);
  const uniqueFillId = `${palette.fillId}-${address ?? "anon"}`;

  const verdictLabel = tone === "up" ? "Pump" : tone === "down" ? "Dump" : "Flat";
  const verdictTone =
    tone === "up"
      ? "border-success/35 bg-success/[0.08] text-success"
      : tone === "down"
        ? "border-destructive/35 bg-destructive/[0.08] text-destructive"
        : "border-border/40 bg-muted/30 text-muted-foreground";

  const isLoading = visible && ohlc.isPending && points.length === 0;
  const noData = visible && !ohlc.isPending && points.length < 2;

  return (
    <div
      ref={wrapperRef}
      className={cn("inline-flex items-center gap-2", className)}
      style={{ minHeight: height }}
    >
      <div
        className="overflow-hidden rounded-md"
        style={{ width, height }}
        aria-hidden="true"
      >
        {!visible || isLoading ? (
          <Skeleton className="h-full w-full rounded-md" />
        ) : noData ? (
          <div
            className="flex h-full w-full items-center justify-center text-[0.55rem] text-muted-foreground/70"
            style={{ width, height }}
          >
            —
          </div>
        ) : (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="block"
          >
            <defs>
              <linearGradient id={uniqueFillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.fillFrom} />
                <stop offset="100%" stopColor={palette.fillTo} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${uniqueFillId})`} />
            <path
              d={line}
              fill="none"
              stroke={palette.stroke}
              strokeWidth={1.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>
      {showVerdict ? (
        <span
          className={cn(
            "rounded-md border px-1 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide",
            verdictTone,
          )}
        >
          {verdictLabel}
        </span>
      ) : null}
    </div>
  );
}
