import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Fish,
  TrendingDown,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnsemListRowSkeleton,
  AnsemSectionHeaderSkeleton,
  AnsemTileGridSkeleton,
} from "@/components/ansem/ansemSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { AnsemCommunityPayload } from "@/lib/ansemCommunityApi";
import type { HolderInsightsRow } from "@/lib/pumpfunAnalysisApi";
import { ANSEM_MINT } from "@/lib/ansem";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { formatRelativeTime } from "@/lib/agentWalletUi";
import { cn } from "@/lib/utils";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";

const WHALE_NET_WORTH_USD = 100_000;
const MEGA_WHALE_NET_WORTH_USD = 500_000;
const WHALE_SUPPLY_PCT = 5;
const DOLPHIN_SUPPLY_PCT = 1;

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function formatHolders(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function holderTier(sharePct: number | null | undefined): "whale" | "dolphin" | "shrimp" {
  const pct = sharePct ?? 0;
  if (pct >= WHALE_SUPPLY_PCT) return "whale";
  if (pct >= DOLPHIN_SUPPLY_PCT) return "dolphin";
  return "shrimp";
}

function tierMeta(tier: ReturnType<typeof holderTier>) {
  if (tier === "whale") {
    return {
      label: "Whale",
      className: "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400",
      icon: Waves,
    };
  }
  if (tier === "dolphin") {
    return {
      label: "Dolphin",
      className: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      icon: Fish,
    };
  }
  return {
    label: "Shrimp",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Fish,
  };
}

function WalletAvatar({
  rank,
  netWorthUsd,
  tier,
}: {
  rank: number;
  netWorthUsd: number | null | undefined;
  tier: ReturnType<typeof holderTier>;
}) {
  const isMegaWhale = netWorthUsd != null && netWorthUsd >= MEGA_WHALE_NET_WORTH_USD;
  const isPortfolioWhale = netWorthUsd != null && netWorthUsd >= WHALE_NET_WORTH_USD;
  const showWhaleLogo = isPortfolioWhale || tier === "whale";

  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg shadow-sm",
        isMegaWhale
          ? "border-amber-400/50 bg-gradient-to-br from-amber-500/25 via-violet-500/20 to-sky-500/20"
          : isPortfolioWhale
            ? "border-violet-400/40 bg-gradient-to-br from-violet-500/20 to-sky-500/15"
            : "border-border/50 bg-muted/30",
      )}
      title={
        isMegaWhale
          ? "Mega whale — large total wallet balance"
          : isPortfolioWhale
            ? "Whale — significant total wallet balance"
            : `Rank #${rank}`
      }
    >
      {showWhaleLogo ? (
        <span role="img" aria-label="Whale" className="text-xl leading-none">
          🐋
        </span>
      ) : (
        <span className="font-mono text-xs font-semibold text-muted-foreground">{rank}</span>
      )}
    </span>
  );
}

function ProfitPill({
  inProfit,
  profitUsd,
}: {
  inProfit: boolean | null;
  profitUsd: number | null;
}) {
  if (inProfit == null) {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        PnL —
      </Badge>
    );
  }
  const detail =
    profitUsd != null
      ? `${profitUsd >= 0 ? "+" : "−"}${formatCompactUsd(Math.abs(profitUsd))}`
      : null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px]",
        inProfit
          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
          : "border-red-500/40 text-red-600 dark:text-red-400",
      )}
    >
      {inProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {inProfit ? "In profit" : "At loss"}
      {detail ? ` · ${detail}` : ""}
    </Badge>
  );
}

function TradePill({ side, at }: { side: string | null; at: string | null }) {
  if (!side && !at) return null;
  const isBuy = side === "buy";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {isBuy ? (
        <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
      ) : (
        <ArrowUpRight className="h-3 w-3 text-red-500" />
      )}
      <span className="capitalize">{side ?? "trade"}</span>
      {at ? <span>· {formatRelativeTime(at)}</span> : null}
    </span>
  );
}

function DistributionBar({
  tiers,
}: {
  tiers: { whale: number; dolphin: number; shrimp: number };
}) {
  const total = tiers.whale + tiers.dolphin + tiers.shrimp || 1;
  const segments = [
    { key: "whale", count: tiers.whale, color: "bg-violet-500", label: "Whales" },
    { key: "dolphin", count: tiers.dolphin, color: "bg-sky-500", label: "Dolphins" },
    { key: "shrimp", count: tiers.shrimp, color: "bg-emerald-500", label: "Shrimp" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted/40">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={cn(seg.color, "h-full transition-all")}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="rounded-lg border border-border/40 bg-background/20 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", seg.color)} />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{seg.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnsemHolderPulse({
  community,
  holderCount: holderCountProp,
  holdersLoading,
  isLoading,
  className,
}: {
  community?: AnsemCommunityPayload | null;
  holderCount?: number | null;
  holdersLoading?: boolean;
  isLoading: boolean;
  className?: string;
}) {
  const holders = community?.holders;
  const distribution = community?.distribution;
  const insights = community?.holderInsights;
  const topHolders = holders?.topHolders ?? [];

  const insightsByWallet = useMemo(() => {
    const map = new Map<string, HolderInsightsRow>();
    for (const row of insights?.holders ?? []) {
      map.set(row.wallet, row);
    }
    return map;
  }, [insights?.holders]);

  const top10 = holders?.top10ConcentrationPct;
  const decentralization =
    distribution?.decentralizationScore ??
    (top10 != null ? Math.max(0, Math.min(100, Math.round(100 - top10 * 1.2))) : null);

  const totalNetWorth =
    holders?.totalNetWorthUsd ??
    insights?.summary?.totalNetWorthUsd ??
    null;

  const effectiveHolderCount =
    holders?.count != null && holders.count > 0
      ? holders.count
      : holderCountProp != null && holderCountProp > 0
        ? holderCountProp
        : null;

  if (isLoading && !community) {
    return (
      <section className={cn("min-w-0 space-y-4", className)}>
        <AnsemSectionHeaderSkeleton />
        <div className={cn(overviewCardShell, "space-y-5 p-5 sm:p-6")}>
          <AnsemTileGridSkeleton count={4} />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <AnsemListRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-4", className)}>
      <AnsemSectionHeader
        kicker="On-chain"
        title="Holder intelligence"
        description="Top wallets, supply concentration, portfolio whales, and holder PnL — built for $ANSEM holders."
      />

      <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/40 bg-background/30 p-4">
            <p className={overviewKickerClass}>Total holders</p>
            {holdersLoading && effectiveHolderCount == null ? (
              <Skeleton className="mt-2 h-9 w-28" />
            ) : (
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
                {effectiveHolderCount != null ? formatHolders(effectiveHolderCount) : "—"}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-4">
            <p className={overviewKickerClass}>Top 10 concentration</p>
            <p
              className={cn(
                "mt-1 font-mono text-3xl font-semibold tabular-nums",
                top10 != null && top10 >= 60
                  ? "text-red-500"
                  : top10 != null && top10 >= 40
                    ? "text-amber-500"
                    : "text-emerald-500",
              )}
            >
              {top10 != null ? `${top10.toFixed(1)}%` : "—"}
            </p>
            {top10 != null ? <Progress value={Math.min(100, top10)} className="mt-3 h-2" /> : null}
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-4">
            <p className={overviewKickerClass}>Decentralization</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
              {decentralization != null ? `${decentralization}/100` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Higher = more distributed supply</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-4">
            <p className={overviewKickerClass}>Top wallets net worth</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
              {totalNetWorth != null ? formatCompactUsd(totalNetWorth) : "—"}
            </p>
            {insights?.summary ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {insights.summary.inProfit} in profit · {insights.summary.atLoss} at loss
              </p>
            ) : null}
          </div>
        </div>

        {distribution?.tiers ? (
          <div className="mb-6 rounded-xl border border-border/40 bg-background/20 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Holder tiers (top sample)
            </p>
            <DistributionBar tiers={distribution.tiers} />
          </div>
        ) : null}

        {distribution?.flags && distribution.flags.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {distribution.flags.map((flag) => (
              <Badge
                key={flag.id}
                variant="outline"
                className={cn(
                  "text-xs",
                  flag.severity === "high"
                    ? "border-red-500/40 text-red-600 dark:text-red-400"
                    : flag.severity === "medium"
                      ? "border-amber-500/40 text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground",
                )}
              >
                {flag.message}
              </Badge>
            ))}
          </div>
        ) : null}

        {topHolders.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Top wallets
            </p>
            <ul className="space-y-2">
              {topHolders.map((row) => {
                const insight = row.wallet ? insightsByWallet.get(row.wallet) : undefined;
                const tier = holderTier(row.sharePct);
                const tierInfo = tierMeta(tier);
                const TierIcon = tierInfo.icon;
                const netWorth = row.netWorthUsd ?? insight?.netWorth?.netWorthUsd;

                return (
                  <li
                    key={row.wallet ?? row.rank}
                    className="rounded-xl border border-border/40 bg-background/20 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <WalletAvatar rank={row.rank} netWorthUsd={netWorth} tier={tier} />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {row.wallet ? (
                            <a
                              href={`https://solscan.io/account/${row.wallet}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm font-semibold hover:text-primary hover:underline"
                            >
                              {truncateWallet(row.wallet)}
                            </a>
                          ) : (
                            <span className="font-mono text-sm text-muted-foreground">Unknown</span>
                          )}
                          <Badge variant="outline" className={cn("gap-1 text-[10px]", tierInfo.className)}>
                            <TierIcon className="h-3 w-3" />
                            {tierInfo.label}
                          </Badge>
                          {netWorth != null && netWorth >= WHALE_NET_WORTH_USD ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
                            >
                              🐋 {formatCompactUsd(netWorth)} portfolio
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {row.balanceHuman != null ? (
                            <span>
                              <span className="text-foreground font-medium">
                                {row.balanceHuman.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>{" "}
                              $ANSEM
                            </span>
                          ) : null}
                          {row.sharePct != null ? (
                            <span>
                              <span className="font-mono font-medium text-foreground">
                                {row.sharePct.toFixed(2)}%
                              </span>{" "}
                              of supply
                            </span>
                          ) : null}
                          {insight?.netWorth?.nativeBalanceSol != null ? (
                            <span>{insight.netWorth.nativeBalanceSol.toFixed(2)} SOL idle</span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {insight ? (
                            <ProfitPill
                              inProfit={insight.inProfit}
                              profitUsd={insight.profitUsd}
                            />
                          ) : null}
                          {insight?.lastTrade ? (
                            <TradePill
                              side={insight.lastTrade.side}
                              at={insight.lastTrade.at}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        {row.sharePct != null ? (
                          <p className="font-mono text-lg font-semibold tabular-nums">
                            {row.sharePct.toFixed(2)}%
                          </p>
                        ) : null}
                        {netWorth != null ? (
                          <p className="text-xs text-muted-foreground">
                            {formatCompactUsd(netWorth)} total
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">Top holder data will appear shortly.</p>
          </div>
        )}

        {community?.holderInsightsError && !insights ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Portfolio & PnL enrichment unavailable right now — on-chain balances still shown above.
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <a
            href={`https://solscan.io/token/${ANSEM_MINT}#holders`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            View all holders on Solscan
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
