import { useMemo } from "react";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { EmptyState, GlassCard } from "@/components/rise/RiseShared";
import { getSignal, type SignalToken } from "@/lib/cryptoSignalApi";
import { useRiseDashboard, useRiseOhlc } from "@/lib/RiseDashboardContext";
import { momentum, rsi, volatility } from "@/lib/computeIndicators";
import { SignalsPreview } from "./previews/SignalsPreview";
import { useLanguage } from "@/lib/LanguageContext";

const TOKENS: SignalToken[] = ["bitcoin", "solana", "ethereum"];

export function SignalsLive() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { uponly } = useRiseDashboard();
  const ohlc = useRiseOhlc(uponly?.mint ?? null, "1h", 120);
  const closes = useMemo(
    () =>
      (ohlc.data?.candles ?? [])
        .map((row) => row.close ?? row.open)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    [ohlc.data],
  );

  const indicator = useMemo(
    () => ({
      rsi: rsi(closes, 14),
      momentum: momentum(closes, 24),
      volatility: volatility(closes),
    }),
    [closes],
  );

  const signalQueries = useQueries({
    queries: TOKENS.map((token) => ({
      queryKey: ["macro-signal", token],
      queryFn: ({ signal }: { signal: AbortSignal }) => getSignal(token, signal),
      staleTime: 120_000,
      retry: 1,
    })),
  });

  const hasSignalError = signalQueries.some((query) => query.isError);

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={isZh ? "信号" : "Signals"}
        description={
          isZh
            ? "将宏观方向信号与 RISE 本地技术指标结合。"
            : "Blend macro directional context from signal endpoints with RISE-native technical indicators."
        }
        eyebrow={isZh ? "洞察" : "Insights"}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {signalQueries.map((query, idx) => (
          <GlassCard key={TOKENS[idx]}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{TOKENS[idx]}</p>
              {query.isFetching ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
            </div>
            {query.isError ? (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {(query.error as Error)?.message || (isZh ? "加载失败" : "Failed to load")}
              </div>
            ) : (
              <div className="mt-2 space-y-1.5 text-xs">
                {Object.entries((query.data?.data?.signal ?? {}) as Record<string, unknown>)
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <p key={key} className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/25 px-2 py-1.5">
                      <span className="truncate text-muted-foreground">{key}</span>
                      <span className="truncate font-medium text-foreground">
                        {typeof value === "number" ? value.toFixed(4).replace(/\.?0+$/, "") : String(value)}
                      </span>
                    </p>
                  ))}
                {!query.isPending &&
                Object.keys((query.data?.data?.signal ?? {}) as Record<string, unknown>).length === 0 ? (
                  <p className="text-muted-foreground">{isZh ? "无信号载荷。" : "No signal payload."}</p>
                ) : null}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-success" /> {isZh ? "UPONLY 技术快照（1h K线）" : "UPONLY technical snapshot (1h candles)"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            RSI(14): <span className="font-medium text-foreground">{indicator.rsi?.toFixed(2) ?? "—"}</span>
          </p>
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            {isZh ? "动量(24)" : "Momentum(24)"}:{" "}
            <span className="font-medium text-foreground">{indicator.momentum?.toFixed(2) ?? "—"}%</span>
          </p>
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            {isZh ? "波动率" : "Volatility"}: <span className="font-medium text-foreground">{indicator.volatility?.toFixed(2) ?? "—"}%</span>
          </p>
        </div>
        {hasSignalError ? (
          <div className="mt-3">
            <EmptyState
              icon={AlertTriangle}
              title={isZh ? "部分宏观数据流失败" : "Some macro feeds failed"}
              description={
                isZh
                  ? "技术快照仍可用。网络稳定后可重试宏观数据流。"
                  : "Technical snapshot remains available. Retry macro feeds when network stabilizes."
              }
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    signalQueries.forEach((query) => query.refetch());
                  }}
                >
                  {isZh ? "重试宏观数据流" : "Retry macro feeds"}
                </Button>
              }
            />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}

export default function SignalsPage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <TokenGate pageTitle={isZh ? "信号" : "Signals"} preview={<SignalsPreview />}>
      <SignalsLive />
    </TokenGate>
  );
}
