import { type ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Calendar,
  Coins,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Rocket,
  Target,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { PageLoader } from "@/components/PageLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { pageContent } from "@/lib/siteLayout";
import { fetchGrowthMetrics, type DailyCount, type GrowthMetrics, type StatusCounts } from "@/lib/growthApi";
import { formatCompact, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

const trendChartConfig = {
  count: { label: "Count", color: "hsl(var(--primary))" },
};

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
        "flex flex-col gap-2 rounded-2xl border border-border/60 p-4 sm:gap-3 sm:p-5",
        accent ? "border-primary/20 bg-primary/5" : "panel-glass",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-primary/80">{icon}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function BreakdownList({ title, counts }: { title: string; counts: StatusCounts }) {
  const entries = Object.entries(counts).filter(([key]) => key !== "all");
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {entries
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => (
            <li key={key} className="flex items-center justify-between gap-2 text-sm">
              <span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
              <span className="font-medium tabular-nums">{formatCompact(value)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

function TrendChart({ data, label }: { data: DailyCount[]; label: string }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No {label.toLowerCase()} in the last 30 days.</p>
    );
  }

  return (
    <ChartContainer config={trendChartConfig} className="h-[180px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

interface FunnelStepProps {
  title: string;
  metrics: { label: string; value: string }[];
  icon: ReactNode;
}

function FunnelStep({ title, metrics, icon }: FunnelStepProps) {
  return (
    <div className="panel-glass relative flex flex-col gap-3 rounded-2xl border border-border/60 p-5">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {metrics.map((m) => (
          <li key={m.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="font-medium tabular-nums">{m.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface GrowthRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function buildRecommendations(data: GrowthMetrics): GrowthRecommendation[] {
  const recs: GrowthRecommendation[] = [];
  const { kol, jobs, events, hackathons, runs, funnel } = data;

  if (kol.pendingDepositCampaigns > 0) {
    recs.push({
      priority: "high",
      title: "Convert pending campaign deposits",
      detail: `${kol.pendingDepositCampaigns} campaign(s) are waiting on deposit confirmation.`,
      action: "Follow up with project wallets on /kol — deposits unlock KOL activation.",
    });
  }

  const activeRatio =
    kol.totalCampaigns > 0 ? kol.activeCampaigns / kol.totalCampaigns : 0;
  if (kol.totalCampaigns > 0 && activeRatio < 0.35) {
    recs.push({
      priority: "high",
      title: "Increase active campaign ratio",
      detail: `Only ${Math.round(activeRatio * 100)}% of campaigns are active (${kol.activeCampaigns}/${kol.totalCampaigns}).`,
      action: "Launch new campaigns or re-activate completed ones with fresh bounties.",
    });
  }

  if (kol.uniqueKols >= 3 && kol.activeCampaigns === 0) {
    recs.push({
      priority: "high",
      title: "Activate KOL supply",
      detail: `${formatCompact(kol.uniqueKols)} KOLs exist but no active campaigns.`,
      action: "Post a funded campaign so existing KOLs can submit engagement.",
    });
  }

  const newEvents = events.byStatus.new ?? 0;
  if (newEvents >= 8) {
    recs.push({
      priority: "medium",
      title: "Triage events backlog",
      detail: `${newEvents} upcoming events still marked "new".`,
      action: "Review /events — mark interested items and register for high-fit events.",
    });
  }

  const telegramRate =
    jobs.totalFresh > 0 ? jobs.postedToTelegram / jobs.totalFresh : 0;
  if (jobs.totalFresh >= 5 && telegramRate < 0.4) {
    recs.push({
      priority: "medium",
      title: "Boost Telegram job distribution",
      detail: `Only ${Math.round(telegramRate * 100)}% of fresh jobs posted to Telegram (${jobs.postedToTelegram}/${jobs.totalFresh}).`,
      action: "Ensure jobs bot scheduler is on and increase posting cadence in Telegram.",
    });
  }

  const newHackathons = hackathons.byStatus.new ?? 0;
  if (newHackathons >= 5) {
    recs.push({
      priority: "medium",
      title: "Shortlist hackathon opportunities",
      detail: `${newHackathons} open hackathons awaiting review.`,
      action: "Pick 1–2 on /hackathon to join or submit — drives brand + builder pipeline.",
    });
  }

  const staleThresholdDays = 7;
  const stalePipelines: string[] = [];
  for (const [name, run] of [
    ["Events scout", runs.events],
    ["Hackathons scout", runs.hackathons],
    ["Jobs bot", runs.jobs],
  ] as const) {
    const age = daysSince(run.savedAt ?? run.ranAt);
    if (age === null || age > staleThresholdDays) {
      stalePipelines.push(name);
    }
  }
  if (stalePipelines.length > 0) {
    recs.push({
      priority: "high",
      title: "Refresh discovery pipelines",
      detail: `Stale or missing runs: ${stalePipelines.join(", ")}.`,
      action: "Trigger scout runs from /events, /hackathon admin panels or cron jobs.",
    });
  }

  if (kol.payoutSuccessRate !== null && kol.payoutSuccessRate < 90) {
    recs.push({
      priority: "high",
      title: "Investigate payout failures",
      detail: `KOL payout success rate is ${kol.payoutSuccessRate}% (target ≥ 95%).`,
      action: "Check pool wallet balance and failed payout records in admin tools.",
    });
  }

  if (funnel.acquisition.discoveryReach > 0 && funnel.activation.activeCampaigns === 0) {
    recs.push({
      priority: "medium",
      title: "Monetize discovery inventory",
      detail: `${formatCompact(funnel.acquisition.discoveryReach)} fresh listings across jobs/events/hackathons.`,
      action: "Cross-promote listings on X/Telegram and tie campaigns to trending opportunities.",
    });
  }

  if (funnel.engagement.stakerCount > 0 && kol.activeCampaigns < 2) {
    recs.push({
      priority: "low",
      title: "Leverage staker community",
      detail: `${formatCompact(funnel.engagement.stakerCount)} SYRA stakers — potential advocates.`,
      action: "Offer staker-exclusive campaign slots or early KOL program access.",
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: "low",
      title: "Metrics look healthy",
      detail: "No critical gaps detected from current data.",
      action: "Focus on outbound: 2+ new project campaigns and 1 hackathon submission this week.",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

function priorityBadge(priority: GrowthRecommendation["priority"]) {
  const styles = {
    high: "border-destructive/40 bg-destructive/10 text-destructive",
    medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    low: "border-border/60 bg-muted/30 text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", styles[priority])}>
      {priority}
    </Badge>
  );
}

function formatRunAge(run: { savedAt: string | null; ranAt: string | null }): string {
  const age = daysSince(run.savedAt ?? run.ranAt);
  if (age === null) return "Never";
  if (age === 0) return "Today";
  if (age === 1) return "1 day ago";
  return `${age} days ago`;
}

function InternalPageContent() {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["growth-metrics", address],
    queryFn: () => fetchGrowthMetrics(address!),
    enabled: Boolean(address),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const recommendations = useMemo(
    () => (data ? buildRecommendations(data) : []),
    [data],
  );

  if (isLoading) {
    return (
      <div className={pageContent}>
        <PageLoader label="Loading growth metrics" variant="section" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={pageContent}>
        <div className="panel-glass rounded-2xl border border-destructive/30 p-8 text-center space-y-4">
          <p className="text-lg font-semibold">Failed to load growth metrics</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { kol, jobs, events, hackathons, wallets, runs, funnel } = data;

  return (
    <div className={cn(pageContent, "space-y-10 pb-16")}>
      <header className="space-y-4">
        <p className="eyebrow">Internal · Growth system</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient">
              S3 Labs Growth Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Live funnel metrics across KOL marketplace, discovery (jobs, events, hackathons),
              wallets, and staking. Use recommended actions to prioritize weekly growth work.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(dataUpdatedAt).toLocaleString()} · {data.trendDays}-day trends
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Key metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Unique KOLs"
            value={formatCompact(kol.uniqueKols)}
            sub={`${formatCompact(kol.totalSubmissions)} submissions`}
            icon={<Users className="h-4 w-4" />}
            accent
          />
          <StatCard
            label="Paid out"
            value={`${formatSol(kol.totalPaidSol)} SOL`}
            sub={`${formatSol(kol.totalRewardSol)} SOL funded`}
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            label="Active campaigns"
            value={String(kol.activeCampaigns)}
            sub={`${kol.completedCampaigns} completed`}
            icon={<Megaphone className="h-4 w-4" />}
            accent
          />
          <StatCard
            label="Discovery reach"
            value={formatCompact(funnel.acquisition.discoveryReach)}
            sub="Fresh jobs + upcoming events + hackathons"
            icon={<Rocket className="h-4 w-4" />}
          />
          <StatCard
            label="Fresh jobs"
            value={formatCompact(jobs.totalFresh)}
            sub={`${jobs.remotePercent}% remote`}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <StatCard
            label="Upcoming events"
            value={formatCompact(events.totalUpcoming)}
            sub={`${events.indonesiaUpcoming} Indonesia`}
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatCard
            label="Open hackathons"
            value={formatCompact(hackathons.totalFresh)}
            sub={`$${formatCompact(hackathons.totalPrizeUsd)} prize pool`}
            icon={<Trophy className="h-4 w-4" />}
          />
          <StatCard
            label="Connected wallets"
            value={formatCompact(wallets.connectedWallets)}
            sub={`${formatCompact(wallets.stakerCount)} stakers`}
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Growth funnel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FunnelStep
            title="Acquisition"
            icon={<Users className="h-4 w-4" />}
            metrics={[
              { label: "Connected wallets", value: formatCompact(funnel.acquisition.connectedWallets) },
              { label: "Discovery listings", value: formatCompact(funnel.acquisition.discoveryReach) },
              { label: "Unique KOLs", value: formatCompact(funnel.acquisition.uniqueKols) },
              { label: "Unique projects", value: formatCompact(funnel.acquisition.uniqueProjects) },
            ]}
          />
          <FunnelStep
            title="Activation"
            icon={<Megaphone className="h-4 w-4" />}
            metrics={[
              { label: "Total campaigns", value: formatCompact(funnel.activation.totalCampaigns) },
              { label: "Active campaigns", value: formatCompact(funnel.activation.activeCampaigns) },
              { label: "Pending deposits", value: formatCompact(funnel.activation.pendingDepositCampaigns) },
              { label: "Events interested+", value: formatCompact(funnel.activation.eventsInterested) },
              { label: "Hackathons joined+", value: formatCompact(funnel.activation.hackathonsJoined) },
            ]}
          />
          <FunnelStep
            title="Engagement"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              { label: "KOL submissions", value: formatCompact(funnel.engagement.totalSubmissions) },
              { label: "Engagement score", value: formatCompact(funnel.engagement.engagementTotal) },
              { label: "Events attended", value: formatCompact(funnel.engagement.eventsAttended) },
              { label: "Hackathons submitted", value: formatCompact(funnel.engagement.hackathonsSubmitted) },
              { label: "SYRA stakers", value: formatCompact(funnel.engagement.stakerCount) },
            ]}
          />
          <FunnelStep
            title="Monetization"
            icon={<Coins className="h-4 w-4" />}
            metrics={[
              { label: "Total funded", value: `${formatSol(funnel.monetization.totalFundedSol)} SOL` },
              { label: "Total paid", value: `${formatSol(funnel.monetization.totalPaidSol)} SOL` },
              { label: "Platform fees", value: `${formatSol(funnel.monetization.platformFeesSol)} SOL` },
              {
                label: "Confirmed fees",
                value: `${formatSol(funnel.monetization.confirmedPlatformFeesSol)} SOL`,
              },
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommended next steps
        </h2>
        <ul className="space-y-3">
          {recommendations.map((rec) => (
            <li
              key={rec.title}
              className="panel-glass rounded-2xl border border-border/60 p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                {priorityBadge(rec.priority)}
                <h3 className="font-semibold">{rec.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{rec.detail}</p>
              <p className="text-sm flex items-start gap-2 text-foreground/90">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                {rec.action}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pipeline health</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["Events scout", runs.events],
              ["Hackathons scout", runs.hackathons],
              ["Jobs bot", runs.jobs],
            ] as const
          ).map(([label, run]) => (
            <div
              key={label}
              className="panel-glass rounded-2xl border border-border/60 p-5 space-y-2"
            >
              <p className="text-sm font-medium">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{formatRunAge(run)}</p>
              <p className="text-xs text-muted-foreground">
                {run.totalNew != null
                  ? `Last run: +${run.totalNew} new, ${run.totalUpdated ?? 0} updated`
                  : "No run metadata"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Channel breakdown</h2>

        <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">KOL marketplace</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <BreakdownList
                title="Campaign status"
                counts={{
                  all: kol.totalCampaigns,
                  active: kol.activeCampaigns,
                  completed: kol.completedCampaigns,
                  pending_deposit: kol.pendingDepositCampaigns,
                  cancelled: kol.cancelledCampaigns,
                }}
              />
              {kol.payoutSuccessRate !== null ? (
                <p className="text-sm text-muted-foreground">
                  Payout success rate:{" "}
                  <span className="font-medium text-foreground">{kol.payoutSuccessRate}%</span>
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Campaigns created (30d)
              </p>
              <TrendChart data={kol.campaignsPerDay} label="campaigns" />
            </div>
          </div>
        </div>

        <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Jobs</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <BreakdownList title="By category" counts={jobs.byCategory} />
              <BreakdownList title="By source" counts={jobs.bySource} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New jobs (30d)
              </p>
              <TrendChart data={jobs.newPerDay} label="jobs" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {jobs.postedToTelegram} of {jobs.totalFresh} fresh jobs posted to Telegram (
            {jobs.totalFresh > 0
              ? Math.round((jobs.postedToTelegram / jobs.totalFresh) * 100)
              : 0}
            %)
          </p>
        </div>

        <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Events</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <BreakdownList title="By status" counts={events.byStatus} />
              <BreakdownList title="By source" counts={events.bySource} />
              <BreakdownList title="By category" counts={events.byCategory} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discoveries (30d)
              </p>
              <TrendChart data={events.discoveriesPerDay} label="events" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {events.totalUpcoming} upcoming · {events.totalAllTime} all-time ·{" "}
            {events.indonesiaUpcoming} Indonesia / {events.globalUpcoming} global
          </p>
        </div>

        <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Hackathons</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <BreakdownList title="By status" counts={hackathons.byStatus} />
              <BreakdownList title="By open state" counts={hackathons.byOpenState} />
              <BreakdownList title="By source" counts={hackathons.bySource} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discoveries (30d)
              </p>
              <TrendChart data={hackathons.discoveriesPerDay} label="hackathons" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Avg prize ${hackathons.avgPrizeUsd.toLocaleString()} ·{" "}
            {formatCompact(hackathons.totalRegistrations)} registrations tracked
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-muted/10 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Not tracked yet</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>S3 Labs website page views / DAU</li>
          <li>Job application conversions (listings are scraped only)</li>
          <li>Verified in-person event attendance</li>
        </ul>
      </section>
    </div>
  );
}

const InternalPage = () => (
  <SitePageShell>
    <InternalPageContent />
  </SitePageShell>
);

export default InternalPage;
