import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, Bot, MessagesSquare, Wallet } from "lucide-react";
import { FUND_STATS } from "@/data/fundStats";
import { useRiseDashboard } from "@/lib/RiseDashboardContext";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { cn } from "@/lib/utils";
import { GlassCard, StatTile } from "@/components/rise/RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

function formatAsOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function AnimatedUsd({ value, compact = false }: { value: number; compact?: boolean }) {
  const reduceMotion = useReducedMotion() ?? false;
  const animated = useAnimatedNumber(value, { duration: 900, disabled: reduceMotion });
  return <>{formatUsd(animated, { compact })}</>;
}

function AnimatedPct({ value }: { value: number }) {
  const reduceMotion = useReducedMotion() ?? false;
  const animated = useAnimatedNumber(value, { duration: 900, disabled: reduceMotion });
  return <>{formatPct(animated)}</>;
}

export function FundCommandHero() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { aggregate } = useRiseDashboard();

  const deployedPct = useMemo(() => {
    if (FUND_STATS.aumUsd <= 0) return 0;
    return Math.max(0, Math.min(100, (FUND_STATS.deployedUsd / FUND_STATS.aumUsd) * 100));
  }, []);

  const dailyPnl = useMemo(() => {
    const pnl = aggregate.data?.uponly?.priceChange24hPct ?? null;
    if (pnl === null) return null;
    return (FUND_STATS.deployedUsd * pnl) / 100;
  }, [aggregate.data?.uponly?.priceChange24hPct]);

  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 z-0 h-[24rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.16),transparent_58%),radial-gradient(ellipse_42%_38%_at_88%_26%,hsl(220_80%_55%/0.08),transparent_52%)]"
        aria-hidden
      />
      <div className="relative z-[1] grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <GlassCard className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/55 bg-background/45 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-foreground/85 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                {isZh ? "实时 · 智能代理基金 · RISE 生态" : "Live · Smart Agent Fund · RISE Ecosystem"}
              </p>
              <div>
                <h1 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl lg:text-[2rem]">
                  {isZh ? "一站发现 Alpha" : "Find alpha in one place"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {isZh
                    ? "代理持续发现高置信度 RISE 市场，并按资金部署需求进行排序与分层。"
                    : "Agents continuously surface high-conviction RISE markets, sized and ranked for fund deployment."}
                </p>
              </div>
            </div>
            <div className="grid gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
              <StatTile label={isZh ? "AUM（界面）" : "AUM (UI)"} value={<AnimatedUsd value={FUND_STATS.aumUsd} compact />} />
              <StatTile
                label={isZh ? "24h 盈亏（估算）" : "24h P&L (proxy)"}
                value={dailyPnl === null ? "—" : <AnimatedUsd value={dailyPnl} compact />}
                sub={aggregate.data?.uponly ? `${formatPct(aggregate.data.uponly.priceChange24hPct)} ${isZh ? "对应 $UPONLY" : "on $UPONLY"}` : undefined}
                accent={Boolean(dailyPnl && dailyPnl > 0)}
              />
              <StatTile
                label={isZh ? "已部署资金" : "Deployed capital"}
                value={<AnimatedPct value={deployedPct} />}
                sub={formatUsd(FUND_STATS.deployedUsd, { compact: true })}
              />
              <StatTile
                label={isZh ? "今日 Alpha 候选" : "Alpha picks today"}
                value={FUND_STATS.alphaPicksToday}
                sub={isZh ? "高置信度提醒" : "High-conviction alerts"}
              />
              <StatTile
                label={isZh ? "在线代理" : "Agents online"}
                value={FUND_STATS.agentsOnline}
                sub={isZh ? "扫描 RISE 全市场" : "Scanning the RISE universe"}
              />
              <StatTile
                label={isZh ? "胜率（30d）" : "Win rate (30d)"}
                value={<AnimatedPct value={FUND_STATS.winRate30d * 100} />}
                sub={isZh ? `自 ${formatAsOf(FUND_STATS.inceptionIso)} 起` : `Since ${formatAsOf(FUND_STATS.inceptionIso)}`}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <div className="flex h-full flex-col gap-4">
            <a
              href={FUND_STATS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-between gap-2 rounded-xl border border-border/55 bg-background/40 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-background/60"
            >
              <span className="inline-flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 opacity-80" aria-hidden />
                @uponly_fund
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <div className="space-y-2 rounded-xl border border-border/55 bg-muted/20 p-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "基金快照" : "Fund snapshot"}</p>
              <p className="text-sm font-semibold text-foreground">{isZh ? "截至" : "As of"} {formatAsOf(FUND_STATS.asOfIso)}</p>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? "这是专业 UI 基准展示。数值为仪表盘演示场景整理。"
                  : "This is a professional UI benchmark. Values are curated for dashboard presentation."}
              </p>
            </div>
            <div className="grid gap-2 text-xs">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-2.5 py-2 text-muted-foreground">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                {aggregate.data?.degraded ? (isZh ? "部分数据流" : "Partial feed") : isZh ? "数据流健康" : "Feed healthy"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-2.5 py-2 text-muted-foreground">
                <Bot className="h-3.5 w-3.5" aria-hidden />
                {FUND_STATS.agentsOnline} {isZh ? "个监控代理在线" : "monitoring agents active"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-2.5 py-2 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" aria-hidden />
                <span className={cn("font-medium text-foreground/85")}>
                  {formatUsd(FUND_STATS.idleUsd, { compact: true })} {isZh ? "闲置可用资金" : "idle dry powder"}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
