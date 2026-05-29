import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronRight,
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
import { requireInternalAgentMeta } from "@/lib/internalAgentsCatalog";
import { InternalPartnershipBoard } from "@/components/internal/InternalPartnershipBoard";
import {
  fetchPartnershipScoutLatest,
  fetchTrendScoutLatest,
  type PartnershipScoutPayload,
  type TrendScoutPayload,
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

function trendScoutStats(payload: TrendScoutPayload | null | undefined) {
  if (!payload) return [];
  const stats: { label: string; value: string | number }[] = [];
  const topics = payload.trendingTopics?.length ?? 0;
  const content = payload.contentSuggestions?.length ?? 0;
  const features = payload.featureSuggestions?.length ?? 0;
  const caveats = payload.risksOrCaveats?.length ?? 0;
  if (topics > 0) stats.push({ label: "Trending themes", value: topics });
  if (content > 0) stats.push({ label: "Post ideas", value: content });
  if (features > 0) stats.push({ label: "Feature ideas", value: features });
  if (caveats > 0) stats.push({ label: "Caveats", value: caveats });
  const s = payload.sourceStats;
  if (s?.headlineCount != null) stats.push({ label: "Headlines", value: s.headlineCount });
  if (s?.articleCount != null) stats.push({ label: "Articles", value: s.articleCount });
  return stats;
}

function partnershipScoutStats(payload: PartnershipScoutPayload | null | undefined) {
  if (!payload) return [];
  const stats: { label: string; value: string | number }[] = [];
  if (payload.newSaved != null) stats.push({ label: "Last new saved", value: payload.newSaved });
  if (payload.skippedExisting != null) stats.push({ label: "Skipped (in DB)", value: payload.skippedExisting });
  const candidates = payload.candidatesScanned ?? payload.sourceStats?.candidates;
  if (candidates != null) stats.push({ label: "Candidates scanned", value: candidates });
  return stats;
}

type RowStatus = "ok" | "empty" | "error" | "loading";

function queryRowStatus(q: {
  isLoading: boolean;
  isError: boolean;
  data?: { data?: unknown | null };
}): RowStatus {
  if (q.isLoading) return "loading";
  if (q.isError) return "error";
  if (!q.data?.data) return "empty";
  return "ok";
}

function statusBadge(status: RowStatus) {
  switch (status) {
    case "ok":
      return <Badge variant="secondary">OK</Badge>;
    case "empty":
      return <Badge variant="outline">No run yet</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "loading":
      return <Badge variant="outline">Loading…</Badge>;
  }
}

function AgentRow({
  name,
  subtitle,
  status,
  lastRun,
  stats,
  errorMessage,
  detailSlug,
  detailTo,
}: {
  name: string;
  subtitle: string;
  status: RowStatus;
  lastRun?: string;
  stats: { label: string; value: string | number }[];
  errorMessage?: string;
  detailSlug: string;
  detailTo?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/50 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{name}</h2>
          {statusBadge(status)}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground">
          Last run: <span className="font-medium text-foreground">{formatShortDate(lastRun)}</span>
        </p>
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : stats.length > 0 ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {stats.map((s) => (
              <span key={s.label} className="text-xs text-muted-foreground">
                {s.label}: <span className="font-medium text-foreground">{s.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
        <Link to={detailTo ?? `/internal-team-agents/${detailSlug}`}>
          View detail
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function InternalTeamAgentsMonitor() {
  const { address, connected, connectSolana } = useWalletContext();
  const { hash } = useLocation();
  const allowed = isInternalTeamMonitorWallet(address);

  useEffect(() => {
    if (hash === "#partnership-board") {
      document.getElementById("partnership-board")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  const trendQ = useQuery({
    queryKey: ["internal-team-agents", "trend-scout"],
    queryFn: fetchTrendScoutLatest,
    enabled: allowed,
    staleTime: STALE_MS,
  });

  const partnershipQ = useQuery({
    queryKey: ["internal-team-agents", "partnership-scout"],
    queryFn: fetchPartnershipScoutLatest,
    enabled: allowed,
    staleTime: STALE_MS,
  });

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
                <Link to="/overview">Back to overview</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const trendStatus = queryRowStatus(trendQ);
  const partnershipStatus = queryRowStatus(partnershipQ);
  const anyFetching = trendQ.isFetching || partnershipQ.isFetching;

  return (
    <div className={DASHBOARD_CONTENT_SHELL}>
      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Internal agents
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Trend Scout 06:00 WIB · Partnership Scout 06:15 WIB · Telegram digests
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              void trendQ.refetch();
              void partnershipQ.refetch();
            }}
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

        <Card className="border-border/70 divide-y divide-border/60">
          <CardHeader className="space-y-1 pb-2 pt-4 sm:pt-5">
            <CardTitle className="text-base font-semibold">Internal scouts</CardTitle>
            <CardDescription>
              Daily pipelines for market narrative and on-chain partnership discovery.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-6">
            <AgentRow
              name={requireInternalAgentMeta("trend-scout").name}
              subtitle={requireInternalAgentMeta("trend-scout").subtitle}
              status={trendStatus}
              lastRun={trendQ.data?.savedAt}
              stats={trendScoutStats(trendQ.data?.data ?? undefined)}
              errorMessage={trendQ.isError ? trendQ.error?.message : undefined}
              detailSlug="trend-scout"
            />
            {trendQ.data?.data?.marketSummary ? (
              <div className="mb-4 rounded-lg border border-border/50 bg-muted/15 p-3 text-sm text-muted-foreground">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Trend scout summary
                </p>
                <p className="leading-relaxed">{trendQ.data.data.marketSummary}</p>
              </div>
            ) : null}
            <AgentRow
              name={requireInternalAgentMeta("partnership-scout").name}
              subtitle={requireInternalAgentMeta("partnership-scout").subtitle}
              status={partnershipStatus}
              lastRun={partnershipQ.data?.savedAt}
              stats={partnershipScoutStats(partnershipQ.data?.data ?? undefined)}
              errorMessage={partnershipQ.isError ? partnershipQ.error?.message : undefined}
              detailSlug="partnership-scout"
              detailTo="#partnership-board"
            />
          </CardContent>
        </Card>

        <InternalPartnershipBoard />
      </div>
    </div>
  );
}
