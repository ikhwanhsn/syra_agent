import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  FileStack,
  Inbox,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  INTERNAL_TEAM_MONITOR_SOLANA_WALLET,
  isInternalTeamMonitorWallet,
} from "@/constants/internalTeamMonitorWallet";
import { requireInternalAgentMeta, type InternalAgentSlug } from "@/lib/internalAgentsCatalog";
import {
  fetchAgentTeamLatest,
  fetchGrowthSectorNarrativeLatest,
  fetchGrowthSyraMarketLatest,
  fetchGrowthSyraSocialLatest,
  fetchX402XTrendsLatest,
} from "@/lib/internalTeamAgentsApi";
import type {
  AgentTeamLatestPayload,
  GrowthSectorNarrativePayload,
  GrowthSyraMarketPayload,
  GrowthSyraSocialPayload,
  X402XTrendsLatestPayload,
} from "@/lib/internalTeamAgentsApi";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STALE_MS = 45_000;

function formatShortDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function agentTeamStats(payload: AgentTeamLatestPayload | null | undefined) {
  if (!payload) return [];
  const internal = payload.internal;
  const business = payload.business;
  const surfaces = payload.surfaces?.length ?? 0;
  const recs = internal?.recommendations?.length ?? 0;
  const risks = internal?.risks?.length ?? 0;
  const gtm = business?.gtmRecommendations?.length ?? 0;
  const monet = business?.monetizationIdeas?.length ?? 0;
  const comp = business?.competitiveRisks?.length ?? 0;
  const stats: { label: string; value: string | number }[] = [];
  if (surfaces > 0) stats.push({ label: "Pages crawled", value: surfaces });
  if (recs > 0) stats.push({ label: "Recommendations", value: recs });
  if (risks > 0) stats.push({ label: "Risks", value: risks });
  if (gtm > 0) stats.push({ label: "GTM ideas", value: gtm });
  if (monet > 0) stats.push({ label: "Monetization", value: monet });
  if (comp > 0) stats.push({ label: "Competitive risks", value: comp });
  return stats;
}

function x402Stats(payload: X402XTrendsLatestPayload | null | undefined) {
  if (!payload) return [];
  const bullets = payload.bullets?.length ?? 0;
  const watch = payload.watchlist?.length ?? 0;
  const caveats = payload.noiseOrCaveats?.length ?? 0;
  const tweets = payload.tweetsSampled;
  const stats: { label: string; value: string | number }[] = [];
  if (tweets != null) stats.push({ label: "Posts sampled", value: tweets });
  if (bullets > 0) stats.push({ label: "Trend bullets", value: bullets });
  if (watch > 0) stats.push({ label: "Watchlist", value: watch });
  if (caveats > 0) stats.push({ label: "Caveats", value: caveats });
  return stats;
}

function growthMarketStats(payload: GrowthSyraMarketPayload | null | undefined) {
  if (!payload) return [];
  const s = payload.sourceStats;
  const stats: { label: string; value: string | number }[] = [];
  if (s?.dexPairCount != null && s.dexPairCount > 0) {
    stats.push({ label: "DEX pairs", value: s.dexPairCount });
  }
  if (s?.bestLiquidityUsd != null) {
    stats.push({ label: "Top liq", value: formatCompactUsd(s.bestLiquidityUsd) });
  }
  if (s?.bestVolumeH24 != null) {
    stats.push({ label: "Vol 24h", value: formatCompactUsd(s.bestVolumeH24) });
  }
  if (s?.bestFdv != null) {
    stats.push({ label: "FDV (top)", value: formatCompactUsd(s.bestFdv) });
  }
  const actions = payload.growthActions?.length ?? 0;
  if (actions > 0) stats.push({ label: "Growth actions", value: actions });
  if (payload.liquidityAssessment) {
    stats.push({ label: "Liq health", value: payload.liquidityAssessment });
  }
  if (payload.volumeAssessment) {
    stats.push({ label: "Volume", value: payload.volumeAssessment });
  }
  return stats;
}

function growthSocialStats(payload: GrowthSyraSocialPayload | null | undefined) {
  if (!payload) return [];
  const stats: { label: string; value: string | number }[] = [];
  if (payload.tweetsSampled != null) stats.push({ label: "Posts sampled", value: payload.tweetsSampled });
  if (payload.sentiment) stats.push({ label: "Sentiment", value: payload.sentiment });
  const themes = payload.topThemes?.length ?? 0;
  if (themes > 0) stats.push({ label: "Themes", value: themes });
  const actions = payload.recommendedActions?.length ?? 0;
  if (actions > 0) stats.push({ label: "Actions", value: actions });
  const bullets = payload.bullets?.length ?? 0;
  if (bullets > 0) stats.push({ label: "Bullets", value: bullets });
  return stats;
}

function growthSectorStats(payload: GrowthSectorNarrativePayload | null | undefined) {
  if (!payload) return [];
  const stats: { label: string; value: string | number }[] = [];
  if (payload.tweetsSampled != null) stats.push({ label: "Posts sampled", value: payload.tweetsSampled });
  const tw = payload.tailwindThemes?.length ?? 0;
  const hw = payload.headwindThemes?.length ?? 0;
  if (tw > 0) stats.push({ label: "Tailwinds", value: tw });
  if (hw > 0) stats.push({ label: "Headwinds", value: hw });
  const pos = payload.positioningIdeasForSyra?.length ?? 0;
  if (pos > 0) stats.push({ label: "Positioning ideas", value: pos });
  return stats;
}

type RowStatus = "loading" | "error" | "empty" | "ok";

function statusBadge(status: RowStatus, message?: string) {
  if (status === "loading") {
    return (
      <Badge variant="secondary" className="gap-1 font-normal">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="destructive" className="max-w-[200px] truncate font-normal" title={message}>
        Error
      </Badge>
    );
  }
  if (status === "empty") {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        No run yet
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="bg-emerald-600/90 hover:bg-emerald-600 font-normal dark:bg-emerald-700">
      Has data
    </Badge>
  );
}

interface AgentRowProps {
  name: string;
  subtitle: string;
  status: RowStatus;
  lastRun?: string;
  stats: { label: string; value: string | number }[];
  errorMessage?: string;
  detailSlug?: InternalAgentSlug;
}

function AgentRow({ name, subtitle, status, lastRun, stats, errorMessage, detailSlug }: AgentRowProps) {
  const inner = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{name}</h2>
            {statusBadge(status, errorMessage)}
            {detailSlug ? (
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:inline" aria-hidden />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <p className="text-[11px] font-mono text-muted-foreground/90">
            Last saved: {formatShortDate(lastRun)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-2 sm:justify-end">
          {status === "error" && errorMessage ? (
            <p className="max-w-xs text-xs text-destructive">{errorMessage}</p>
          ) : stats.length > 0 ? (
            stats.map((s) => (
              <div key={s.label} className="text-right">
                <div className="text-lg font-semibold tabular-nums text-foreground">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              </div>
            ))
          ) : status === "ok" ? (
            <span className="text-xs text-muted-foreground">No breakdown</span>
          ) : null}
        </div>
      </div>
      {detailSlug ? <p className="mt-2 text-xs text-primary sm:hidden">Tap row for full details</p> : null}
    </>
  );

  if (detailSlug) {
    return (
      <Link
        to={`/dashboard/internal-team-agents/${detailSlug}`}
        className="block border-b border-border/60 py-4 last:border-b-0 rounded-lg -mx-1 px-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </Link>
    );
  }

  return <div className="border-b border-border/60 py-4 last:border-b-0">{inner}</div>;
}

function queryRowStatus(q: {
  isLoading: boolean;
  isError: boolean;
  data?: { data?: unknown } | null;
}): RowStatus {
  if (q.isLoading) return "loading";
  if (q.isError) return "error";
  if (!q.data?.data) return "empty";
  return "ok";
}

function maxIsoDate(isos: string[]): string | undefined {
  if (isos.length === 0) return undefined;
  let best = isos[0];
  let t = Date.parse(best);
  for (let i = 1; i < isos.length; i++) {
    const ti = Date.parse(isos[i]);
    if (ti > t) {
      best = isos[i];
      t = ti;
    }
  }
  return best;
}

type FleetQueryRow = {
  isLoading: boolean;
  isError: boolean;
  data?: { savedAt?: string; data?: unknown } | null;
};

function aggregateFleetMetrics(
  agentTeamQ: FleetQueryRow,
  x402Q: FleetQueryRow,
  growthMarketQ: FleetQueryRow,
  growthSocialQ: FleetQueryRow,
  growthSectorQ: FleetQueryRow,
) {
  const qs = [agentTeamQ, x402Q, growthMarketQ, growthSocialQ, growthSectorQ];
  const rowStatuses = qs.map((r) => queryRowStatus(r));
  const ok = rowStatuses.filter((s) => s === "ok").length;
  const err = rowStatuses.filter((s) => s === "error").length;
  const empty = rowStatuses.filter((s) => s === "empty").length;
  const loading = rowStatuses.filter((s) => s === "loading").length;

  const savedAtList = qs
    .map((r) => r.data?.savedAt)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  const latestSavedAt = maxIsoDate(savedAtList);

  const at = agentTeamQ.data?.data as AgentTeamLatestPayload | null | undefined;
  const x4 = x402Q.data?.data as X402XTrendsLatestPayload | null | undefined;
  const gm = growthMarketQ.data?.data as GrowthSyraMarketPayload | null | undefined;
  const gs = growthSocialQ.data?.data as GrowthSyraSocialPayload | null | undefined;
  const gsec = growthSectorQ.data?.data as GrowthSectorNarrativePayload | null | undefined;

  const socialBulletsCount = Array.isArray(gs?.bullets) ? gs.bullets.length : 0;

  const postsSampledTotal =
    (x4?.tweetsSampled ?? 0) + (gs?.tweetsSampled ?? 0) + (gsec?.tweetsSampled ?? 0);

  const pagesCrawled = at?.surfaces?.length ?? 0;

  const insightItemsTotal =
    (at?.internal?.recommendations?.length ?? 0) +
    (at?.internal?.risks?.length ?? 0) +
    (x4?.bullets?.length ?? 0) +
    (gm?.growthActions?.length ?? 0) +
    (gs?.recommendedActions?.length ?? 0) +
    socialBulletsCount +
    (gsec?.positioningIdeasForSyra?.length ?? 0) +
    (gsec?.bullets?.length ?? 0);

  return {
    ok,
    err,
    empty,
    loading,
    latestSavedAt,
    postsSampledTotal,
    pagesCrawled,
    insightItemsTotal,
    anyStillLoading: loading > 0,
  };
}

function FleetOverviewStat({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  variant?: "default" | "destructive" | "muted";
}) {
  const valueClass =
    variant === "destructive"
      ? "text-destructive"
      : variant === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-3 sm:flex-col sm:gap-1 sm:px-4 sm:py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background/80 text-muted-foreground sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className={`text-2xl font-semibold tabular-nums tracking-tight ${valueClass}`}>{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function InternalTeamAgentsMonitor() {
  const { address, connected, connectSolana } = useWalletContext();
  const allowed = isInternalTeamMonitorWallet(address);

  const q = useQueries({
    queries: [
      {
        queryKey: ["internal-team-agents", "agent-team"],
        queryFn: fetchAgentTeamLatest,
        enabled: allowed,
        staleTime: STALE_MS,
      },
      {
        queryKey: ["internal-team-agents", "x402"],
        queryFn: fetchX402XTrendsLatest,
        enabled: allowed,
        staleTime: STALE_MS,
      },
      {
        queryKey: ["internal-team-agents", "growth-market"],
        queryFn: fetchGrowthSyraMarketLatest,
        enabled: allowed,
        staleTime: STALE_MS,
      },
      {
        queryKey: ["internal-team-agents", "growth-social"],
        queryFn: fetchGrowthSyraSocialLatest,
        enabled: allowed,
        staleTime: STALE_MS,
      },
      {
        queryKey: ["internal-team-agents", "growth-sector"],
        queryFn: fetchGrowthSectorNarrativeLatest,
        enabled: allowed,
        staleTime: STALE_MS,
      },
    ],
  });

  const [agentTeamQ, x402Q, growthMarketQ, growthSocialQ, growthSectorQ] = q;

  if (!connected) {
    return (
      <div className={DASHBOARD_CONTENT_SHELL}>
        <div className={PAGE_PADDING_TOP_MEDIUM}>
          <Alert className="max-w-xl border-border/80 bg-muted/20">
            <Lock className="h-4 w-4" />
            <AlertTitle>Connect wallet</AlertTitle>
            <AlertDescription className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground">
                This monitor is restricted. Sign in and connect the authorized Solana wallet.
              </p>
              <Button type="button" size="sm" onClick={() => void connectSolana()}>
                Connect Solana wallet
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className={DASHBOARD_CONTENT_SHELL}>
        <div className={PAGE_PADDING_TOP_MEDIUM}>
          <Alert variant="destructive" className="max-w-xl">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription className="space-y-2 pt-1 text-sm">
              <p>
                This page is only available when the connected Solana wallet matches the authorized
                address.
              </p>
              <p className="font-mono text-xs opacity-90 break-all">
                {INTERNAL_TEAM_MONITOR_SOLANA_WALLET}
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/dashboard/overview">Back to overview</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const refetchAll = () => {
    q.forEach((r) => void r.refetch());
  };

  const anyFetching = q.some((r) => r.isFetching);

  const fleet = aggregateFleetMetrics(agentTeamQ, x402Q, growthMarketQ, growthSocialQ, growthSectorQ);

  return (
    <div className={DASHBOARD_CONTENT_SHELL}>
      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Internal agents
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Scheduled pipelines · stats from last successful run
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => refetchAll()}
            disabled={anyFetching}
          >
            {anyFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        <Card className="border-border/70">
          <CardHeader className="space-y-1 pb-2 pt-4 sm:pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-semibold">Fleet overview</CardTitle>
              {anyFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
              ) : null}
            </div>
            <CardDescription>
              Rolled up from all five pipelines (X + growth social/sector for posts sampled; agent team for pages).
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0 sm:pb-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <FleetOverviewStat label="With data" value={`${fleet.ok}/5`} icon={Layers} />
              <FleetOverviewStat
                label="No run yet"
                value={fleet.empty}
                icon={Inbox}
                variant={fleet.empty > 0 ? "default" : "muted"}
              />
              <FleetOverviewStat
                label="Errors"
                value={fleet.err}
                icon={AlertTriangle}
                variant={fleet.err > 0 ? "destructive" : "muted"}
              />
              <FleetOverviewStat
                label="Latest save"
                value={fleet.latestSavedAt ? formatShortDate(fleet.latestSavedAt) : "—"}
                icon={Clock}
                variant={fleet.latestSavedAt ? "default" : "muted"}
              />
              <FleetOverviewStat
                label="Posts sampled"
                value={fleet.postsSampledTotal > 0 ? fleet.postsSampledTotal : "—"}
                icon={Activity}
                variant={fleet.postsSampledTotal > 0 ? "default" : "muted"}
              />
              <FleetOverviewStat
                label="Pages crawled"
                value={fleet.pagesCrawled > 0 ? fleet.pagesCrawled : "—"}
                icon={FileStack}
                variant={fleet.pagesCrawled > 0 ? "default" : "muted"}
              />
              <FleetOverviewStat
                label="Insight lines"
                value={fleet.insightItemsTotal > 0 ? fleet.insightItemsTotal : "—"}
                icon={Sparkles}
                variant={fleet.insightItemsTotal > 0 ? "default" : "muted"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="px-4 pb-2 pt-1 sm:px-6">
            <AgentRow
              name={requireInternalAgentMeta("agent-team").name}
              subtitle={requireInternalAgentMeta("agent-team").subtitle}
              status={queryRowStatus(agentTeamQ)}
              lastRun={agentTeamQ.data?.savedAt}
              stats={agentTeamStats(agentTeamQ.data?.data ?? undefined)}
              errorMessage={agentTeamQ.isError ? agentTeamQ.error?.message : undefined}
              detailSlug="agent-team"
            />
            <AgentRow
              name={requireInternalAgentMeta("x402-pulse").name}
              subtitle={requireInternalAgentMeta("x402-pulse").subtitle}
              status={queryRowStatus(x402Q)}
              lastRun={x402Q.data?.savedAt}
              stats={x402Stats(x402Q.data?.data ?? undefined)}
              errorMessage={x402Q.isError ? x402Q.error?.message : undefined}
              detailSlug="x402-pulse"
            />
            <AgentRow
              name={requireInternalAgentMeta("growth-syra-market").name}
              subtitle={requireInternalAgentMeta("growth-syra-market").subtitle}
              status={queryRowStatus(growthMarketQ)}
              lastRun={growthMarketQ.data?.savedAt}
              stats={growthMarketStats(growthMarketQ.data?.data ?? undefined)}
              errorMessage={growthMarketQ.isError ? growthMarketQ.error?.message : undefined}
              detailSlug="growth-syra-market"
            />
            <AgentRow
              name={requireInternalAgentMeta("growth-syra-social").name}
              subtitle={requireInternalAgentMeta("growth-syra-social").subtitle}
              status={queryRowStatus(growthSocialQ)}
              lastRun={growthSocialQ.data?.savedAt}
              stats={growthSocialStats(growthSocialQ.data?.data ?? undefined)}
              errorMessage={growthSocialQ.isError ? growthSocialQ.error?.message : undefined}
              detailSlug="growth-syra-social"
            />
            <AgentRow
              name={requireInternalAgentMeta("growth-sector-narrative").name}
              subtitle={requireInternalAgentMeta("growth-sector-narrative").subtitle}
              status={queryRowStatus(growthSectorQ)}
              lastRun={growthSectorQ.data?.savedAt}
              stats={growthSectorStats(growthSectorQ.data?.data ?? undefined)}
              errorMessage={growthSectorQ.isError ? growthSectorQ.error?.message : undefined}
              detailSlug="growth-sector-narrative"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
