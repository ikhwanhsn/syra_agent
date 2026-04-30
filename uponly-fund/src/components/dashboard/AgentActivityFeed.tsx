import { useMemo } from "react";
import { Bot, Radar, ShieldCheck, Zap } from "lucide-react";
import { useRiseDashboard } from "@/lib/RiseDashboardContext";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { ChangePill, GlassCard } from "@/components/rise/RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

type AgentEvent = {
  id: string;
  agent: "Scout" | "Flow" | "Floor" | "Risk";
  verb: string;
  symbol: string;
  metric: string;
  pctValue?: number | null;
  ago: string;
};

const AGO_LABELS = ["2m ago", "5m ago", "8m ago", "11m ago", "14m ago", "18m ago"] as const;

const AGENT_ICON = {
  Scout: Radar,
  Flow: Zap,
  Floor: ShieldCheck,
  Risk: Bot,
} as const;

export function AgentActivityFeed({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { aggregate } = useRiseDashboard();

  const events = useMemo<AgentEvent[]>(() => {
    const gainers = aggregate.data?.topGainers24h ?? [];
    const volume = aggregate.data?.topVolume24h ?? [];
    const merged = [...gainers.slice(0, 4), ...volume.slice(0, 4)];

    return merged.slice(0, 6).map((row, index) => {
      const mode = index % 4;
      const symbol = row.symbol ? `$${row.symbol}` : "$—";
      if (mode === 0) {
        return {
          id: `${row.mint}-scout`,
          agent: "Scout",
          verb: isZh ? "命中 Alpha" : "alpha hit",
          symbol,
          metric:
            row.priceChange24hPct === null
              ? isZh ? "无波动数据" : "No move data"
              : `${row.priceChange24hPct > 0 ? "+" : ""}${formatPct(Math.abs(row.priceChange24hPct))}`,
          pctValue: row.priceChange24hPct,
          ago: AGO_LABELS[index] ?? (isZh ? "20分钟前" : "20m ago"),
        };
      }
      if (mode === 1) {
        return {
          id: `${row.mint}-flow`,
          agent: "Flow",
          verb: isZh ? "成交量激增" : "volume spike",
          symbol,
          metric: formatUsd(row.volume24hUsd, { compact: true }),
          ago: AGO_LABELS[index] ?? (isZh ? "20分钟前" : "20m ago"),
        };
      }
      if (mode === 2) {
        return {
          id: `${row.mint}-floor`,
          agent: "Floor",
          verb: isZh ? "入场候选" : "entry candidate",
          symbol,
          metric: `${isZh ? "市值" : "MC"} ${formatUsd(row.marketCapUsd, { compact: true })}`,
          ago: AGO_LABELS[index] ?? (isZh ? "20分钟前" : "20m ago"),
        };
      }
      return {
        id: `${row.mint}-risk`,
        agent: "Risk",
        verb: isZh ? "风险检查通过" : "risk check clear",
        symbol,
        metric: `${isZh ? "流动性" : "Liq"} ${formatUsd(row.liquidityUsd, { compact: true })}`,
        ago: AGO_LABELS[index] ?? (isZh ? "20分钟前" : "20m ago"),
      };
    });
  }, [aggregate.data, isZh]);

  return (
    <GlassCard className={cn("p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">{isZh ? "代理活动" : "Agent activity"}</h2>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "运维控制台" : "Ops console"}</span>
      </div>
      <div className="space-y-2">
        {events.map((event, index) => {
          const Icon = AGENT_ICON[event.agent];
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border/55 bg-background/35 px-3 py-2 text-xs",
                index === 0 && "animate-pulse",
              )}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/55 bg-background/60">
                <Icon className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">
                  <span className="font-semibold">{isZh ? "代理" : "Agent"} {event.agent}</span> · {event.verb} ·{" "}
                  <span className="font-semibold">{event.symbol}</span>
                </p>
                <p className="mt-0.5 text-muted-foreground">{event.ago}</p>
              </div>
              {event.verb === (isZh ? "命中 Alpha" : "alpha hit") ? (
                <ChangePill pct={event.pctValue ?? null} />
              ) : (
                <span className="font-mono text-[0.7rem] text-foreground/85">{event.metric}</span>
              )}
            </div>
          );
        })}
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/55 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
            {isZh ? "暂无代理事件。" : "No recent agent events yet."}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
