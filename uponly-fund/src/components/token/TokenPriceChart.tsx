import { useId, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard, SectionHeader, formatPriceSmart } from "@/components/rise/RiseShared";
import { useRiseOhlc } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow, RiseTimeframe } from "@/lib/riseDashboardTypes";
import { formatPctSigned } from "@/lib/marketDisplayFormat";
import { computeOhlcStats } from "@/lib/marketIntel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

type ChartTimeframe = RiseTimeframe | "all";

const TIMEFRAMES: ChartTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d", "all"];

const TF_LIMITS: Record<RiseTimeframe, number> = {
  "1m": 240,
  "5m": 288,
  "15m": 288,
  "1h": 336,
  "4h": 336,
  "1d": 365,
};

function normalizeOhlc(
  candles: { time: number | null; open: number | null; high: number | null; low: number | null; close: number | null }[],
) {
  return candles
    .map((row, idx) => {
      const rawTime = typeof row.time === "number" && Number.isFinite(row.time) ? row.time : null;
      const closeCandidate =
        typeof row.close === "number" && Number.isFinite(row.close)
          ? row.close
          : typeof row.open === "number" && Number.isFinite(row.open)
            ? row.open
            : typeof row.high === "number" && Number.isFinite(row.high)
              ? row.high
              : typeof row.low === "number" && Number.isFinite(row.low)
                ? row.low
                : null;
      if (closeCandidate === null) return null;
      const tsMs =
        rawTime === null
          ? idx * 3_600_000
          : rawTime > 1_000_000_000_000
            ? rawTime
            : rawTime * 1000;
      return { time: tsMs, value: closeCandidate };
    })
    .filter((r): r is { time: number; value: number } => r !== null)
    .sort((a, b) => a.time - b.time);
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { time?: number } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value;
  const t = payload[0]?.payload?.time;
  const hasValidTimestamp = typeof t === "number" && Number.isFinite(t) && t >= Date.UTC(2000, 0, 1);
  return (
    <div className="rounded-md border border-border/60 bg-card/95 px-2 py-1.5 text-[0.7rem] shadow-md backdrop-blur-sm">
      <p className="font-medium text-foreground">{formatPriceSmart(typeof v === "number" ? v : null)}</p>
      {hasValidTimestamp ? (
        <p className="text-[0.65rem] text-muted-foreground">{new Date(t as number).toLocaleString()}</p>
      ) : null}
    </div>
  );
}

export function TokenPriceChart({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const [tf, setTf] = useState<ChartTimeframe>("1h");
  const gradientId = useId();
  const address = market?.marketAddress || market?.mint || null;

  const resolvedTimeframe: RiseTimeframe = tf === "all" ? "1d" : tf;
  const limit = tf === "all" ? 2000 : TF_LIMITS[resolvedTimeframe];
  const ohlc = useRiseOhlc(address, resolvedTimeframe, limit);
  const data = useMemo(() => normalizeOhlc(ohlc.data?.candles ?? []), [ohlc.data]);
  const stats = useMemo(() => computeOhlcStats(ohlc.data?.candles ?? []), [ohlc.data]);

  if (!market) return null;

  return (
    <GlassCard padded={false} className={cn("overflow-hidden", className)}>
      <div className="border-b border-border/40 px-4 py-4 sm:px-6">
        <SectionHeader
          eyebrow={t.sectionPrice}
          title={t.chartSource}
          description={
            tf === "all"
              ? t.chartAllTimeframe
              : `${resolvedTimeframe} · ${limit} candles`
          }
          right={
            <div className="flex flex-wrap gap-1">
              {TIMEFRAMES.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setTf(x)}
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[0.65rem] tabular-nums transition-colors",
                    tf === x
                      ? "border-foreground/55 bg-foreground/[0.08] text-foreground"
                      : "border-border/45 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  aria-pressed={tf === x}
                >
                  {x === "all" ? "ALL" : x}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <div className="px-4 pb-4 pt-2 sm:px-6">
        {ohlc.isPending ? (
          <Skeleton className="h-[360px] w-full rounded-xl" />
        ) : ohlc.isError || data.length < 2 ? (
          <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-border/45 bg-background/25 text-sm text-muted-foreground">
            {t.chartNoData}
          </div>
        ) : (
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis dataKey="value" hide domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--success))"
                  strokeWidth={1.6}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 grid gap-2 border-t border-border/35 pt-4 text-[0.7rem] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="text-muted-foreground/80">{t.chartHigh}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">{formatPriceSmart(stats.high)}</span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartLow}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">{formatPriceSmart(stats.low)}</span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartRange}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">{formatPriceSmart(stats.range)}</span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartWindowChg}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">
              {stats.lastVsFirstPct != null ? formatPctSigned(stats.lastVsFirstPct) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartRsi}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">
              {stats.rsi14 != null ? stats.rsi14.toFixed(1) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartMom}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">
              {stats.momentum14 != null ? formatPctSigned(stats.momentum14) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartVolSample}:</span>{" "}
            <span className="font-mono tabular-nums text-foreground">
              {stats.annualisedVol != null ? stats.annualisedVol.toFixed(2) : "—"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground/80">{t.chartUpdated}:</span>{" "}
            <span className="font-mono text-foreground/90">
              {ohlc.data?.updatedAt ? new Date(ohlc.data.updatedAt).toLocaleString() : "—"}
            </span>
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
