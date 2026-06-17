import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Coins,
  Megaphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchKolStats } from "@/lib/kolApi";
import { formatCompact, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 p-4 sm:p-5 flex flex-col gap-3",
        accent ? "bg-primary/5 border-primary/20" : "panel-glass",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-primary/80">{icon}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

export function MarketplaceStats() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kol-stats"],
    queryFn: fetchKolStats,
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) return <StatsSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
        Marketplace stats unavailable. Campaign browsing still works.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total KOLs"
          value={formatCompact(data.uniqueKols)}
          sub={`${formatCompact(data.totalSubmissions)} submissions`}
          icon={<Users className="w-4 h-4" />}
          accent
        />
        <StatCard
          label="Total Projects"
          value={formatCompact(data.uniqueProjects)}
          sub={`${data.totalCampaigns} campaigns`}
          icon={<Sparkles className="w-4 h-4" />}
        />
        <StatCard
          label="Active Campaigns"
          value={String(data.activeCampaigns)}
          sub={`${data.completedCampaigns} completed`}
          icon={<Megaphone className="w-4 h-4" />}
        />
        <StatCard
          label="Reward Pool"
          value={`${formatSol(data.totalKolPoolSol)} SOL`}
          sub={`${formatSol(data.totalRewardSol)} SOL total funded`}
          icon={<Coins className="w-4 h-4" />}
          accent
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Paid Out"
          value={`${formatSol(data.totalPaidSol)} SOL`}
          sub="Confirmed KOL payouts"
          icon={<Wallet className="w-4 h-4" />}
        />
        <StatCard
          label="Total Engagement"
          value={formatCompact(data.engagement.total)}
          sub="Likes + RTs + replies + quotes + views"
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Views"
          value={formatCompact(data.engagement.views)}
          sub={`${formatCompact(data.engagement.likes)} likes`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Interactions"
          value={formatCompact(
            data.engagement.likes +
              data.engagement.retweets +
              data.engagement.replies +
              data.engagement.quotes,
          )}
          sub={`${formatCompact(data.engagement.retweets)} retweets`}
          icon={<Users className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}
