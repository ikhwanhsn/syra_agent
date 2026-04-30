import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { useRiseDashboard, useRiseTransactionsBatch } from "@/lib/RiseDashboardContext";
import { EmptyState, GlassCard } from "@/components/rise/RiseShared";
import { formatUsd } from "@/lib/marketDisplayFormat";
import { ActivityPreview } from "./previews/ActivityPreview";
import { useLanguage } from "@/lib/LanguageContext";

type SideFilter = "all" | "buy" | "sell";

export function ActivityLive() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const { aggregate } = useRiseDashboard();
  const addresses = (aggregate.data?.topVolume24h ?? []).slice(0, 6).map((row) => row.mint);
  const txQueries = useRiseTransactionsBatch(addresses, 10);

  const merged = useMemo(() => {
    const items = txQueries.flatMap((query) => query.data?.transactions ?? []);
    return items
      .filter((tx) => (sideFilter === "all" ? true : (tx.kind ?? "").includes(sideFilter)))
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
      .slice(0, 120);
  }, [txQueries, sideFilter]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={isZh ? "活动流" : "Activity feed"}
        description={
          isZh
            ? "来自高成交量 RISE 市场的跨市场交易流聚合。"
            : "Merged cross-market transaction stream from top-volume RISE markets."
        }
        eyebrow={isZh ? "洞察" : "Insights"}
        right={
          <div className="flex items-center gap-1">
            {(["all", "buy", "sell"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSideFilter(filter)}
                className={`min-h-10 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sideFilter === filter
                    ? "border-foreground/60 bg-foreground/[0.08] text-foreground"
                    : "border-border/45 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />
      <GlassCard>
        {txQueries.some((query) => query.isError) ? (
          <EmptyState
            title={isZh ? "活动流构建失败" : "Failed to build activity stream"}
            description={isZh ? "一个或多个市场流失败。请重试刷新数据。" : "One or more market streams failed. Retry to refresh data."}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  txQueries.forEach((query) => query.refetch());
                }}
              >
                {isZh ? "重试流" : "Retry streams"}
              </Button>
            }
          />
        ) : txQueries.every((query) => query.isPending) ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            {isZh ? "实时交易流加载中..." : "Streaming live trades..."}
          </div>
        ) : merged.length === 0 ? (
          <EmptyState
            title={isZh ? "暂无活动" : "No activity yet"}
            description={isZh ? "交易到达后将自动填充数据流。" : "The feed will populate as transactions arrive."}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {merged.map((tx, index) => (
              <div
                key={`${tx.txSig ?? index}-${index}`}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-lg border border-border/30 bg-background/20 px-3 py-2.5 text-xs sm:grid-cols-[3.25rem_minmax(0,1fr)_6rem_6rem_6.5rem]"
              >
                <span className="w-12 shrink-0 text-muted-foreground">{(tx.kind ?? "—").toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{tx.walletShort ?? "—"}</span>
                <span className="w-20 shrink-0 text-right text-foreground">{formatUsd(tx.amountUsd, { compact: true })}</span>
                <span className="w-20 shrink-0 text-right text-muted-foreground">{formatUsd(tx.priceUsd)}</span>
                <span className="w-24 shrink-0 text-right text-muted-foreground">
                  {tx.ts ? new Date(tx.ts * 1000).toLocaleTimeString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function ActivityPage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <TokenGate pageTitle={isZh ? "活动流" : "Activity feed"} preview={<ActivityPreview />}>
      <ActivityLive />
    </TokenGate>
  );
}
