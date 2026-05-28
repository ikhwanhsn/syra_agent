import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, RefreshCw, ShieldAlert } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  INTERNAL_TEAM_MONITOR_SOLANA_WALLET,
  isInternalTeamMonitorWallet,
} from "@/constants/internalTeamMonitorWallet";
import {
  getInternalAgentMeta,
  isInternalAgentSlug,
  type InternalAgentSlug,
} from "@/lib/internalAgentsCatalog";
import {
  fetchInternalAgentLatest,
  type PartnershipScoutPayload,
  type TrendScoutPayload,
} from "@/lib/internalTeamAgentsApi";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm text-foreground">{children}</CardContent>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">—</p>;
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 64)}`} className="leading-relaxed">
          {t}
        </li>
      ))}
    </ul>
  );
}

function TrendScoutDetail({ data, savedAt }: { data: TrendScoutPayload; savedAt?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-medium text-foreground">{formatShortDate(savedAt)}</span>
        {data.generatedAt ? (
          <>
            {" "}
            · Generated {formatShortDate(data.generatedAt)}
          </>
        ) : null}
      </p>

      <SectionCard title="Market summary">
        <p className="leading-relaxed">{data.marketSummary || "—"}</p>
      </SectionCard>

      <SectionCard title="Trending themes">
        <BulletList items={data.trendingTopics ?? []} />
      </SectionCard>

      <SectionCard title="Content to post">
        {(data.contentSuggestions ?? []).length === 0 ? (
          <p className="text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-4">
            {(data.contentSuggestions ?? []).map((c, i) => (
              <li key={`${i}-${c.title}`} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.title}</span>
                  <Badge variant="outline">{c.priority}</Badge>
                </div>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Angle:</span> {c.angle}
                </p>
                {c.hook ? (
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Hook:</span> {c.hook}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Platforms: {(c.platforms ?? []).join(", ") || "X"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Features to build">
        {(data.featureSuggestions ?? []).length === 0 ? (
          <p className="text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-4">
            {(data.featureSuggestions ?? []).map((f, i) => (
              <li key={`${i}-${f.title}`} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{f.title}</span>
                  <Badge variant="outline">{f.priority}</Badge>
                  <Badge variant="secondary">{f.surface}</Badge>
                </div>
                {f.why ? <p className="text-muted-foreground leading-relaxed">{f.why}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Caveats">
        <BulletList items={data.risksOrCaveats ?? []} />
      </SectionCard>

      {data.sourceStats ? (
        <p className="text-xs text-muted-foreground">
          Sources: {data.sourceStats.headlineCount ?? 0} headlines · {data.sourceStats.articleCount ?? 0}{" "}
          articles · {data.sourceStats.eventDayCount ?? 0} event days
        </p>
      ) : null}
    </div>
  );
}

function PartnershipScoutDetail({ data, savedAt }: { data: PartnershipScoutPayload; savedAt?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-medium text-foreground">{formatShortDate(savedAt)}</span>
        {data.generatedAt ? <> · Generated {formatShortDate(data.generatedAt)}</> : null}
      </p>

      <SectionCard title="Ecosystem summary">
        <p className="leading-relaxed">{data.ecosystemSummary || "—"}</p>
      </SectionCard>

      <SectionCard title="On-chain themes">
        <BulletList items={data.onchainThemes ?? []} />
      </SectionCard>

      <SectionCard title="Partnership targets">
        {(data.partnershipTargets ?? []).length === 0 ? (
          <p className="text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-4">
            {(data.partnershipTargets ?? []).map((p, i) => (
              <li key={`${i}-${p.name}`} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">{p.priority}</Badge>
                  <Badge variant="secondary">{p.projectType}</Badge>
                </div>
                {p.utility ? <p className="text-muted-foreground">{p.utility}</p> : null}
                {p.whyFitForSyra ? (
                  <p className="mt-2 text-muted-foreground">
                    <span className="font-medium text-foreground">Fit for Syra:</span> {p.whyFitForSyra}
                  </p>
                ) : null}
                {p.collaborationIdea ? (
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Collaboration:</span> {p.collaborationIdea}
                  </p>
                ) : null}
                {p.onchainSignals?.length ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Signals: {p.onchainSignals.join(" · ")}
                  </p>
                ) : null}
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    {p.link}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Quick integrations">
        <BulletList items={data.quickIntegrations ?? []} />
      </SectionCard>

      <SectionCard title="Caveats">
        <BulletList items={data.risksOrCaveats ?? []} />
      </SectionCard>
    </div>
  );
}

function renderPayload(slug: InternalAgentSlug, res: { data?: unknown; savedAt?: string }) {
  const savedAt = res.savedAt;
  if (!res.data) {
    return (
      <Alert>
        <AlertTitle>No data yet</AlertTitle>
        <AlertDescription>Run the pipeline or wait for the daily schedule.</AlertDescription>
      </Alert>
    );
  }
  if (slug === "trend-scout") {
    return <TrendScoutDetail data={res.data as TrendScoutPayload} savedAt={savedAt} />;
  }
  if (slug === "partnership-scout") {
    return <PartnershipScoutDetail data={res.data as PartnershipScoutPayload} savedAt={savedAt} />;
  }
  const _never: never = slug;
  return _never;
}

export default function InternalAgentDetailPage() {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const { address, connected, connectSolana } = useWalletContext();
  const allowed = isInternalTeamMonitorWallet(address);

  const slug = agentSlug && isInternalAgentSlug(agentSlug) ? agentSlug : null;
  const meta = slug ? getInternalAgentMeta(slug) : undefined;

  const q = useQuery({
    queryKey: ["internal-agent-detail", slug],
    queryFn: () => fetchInternalAgentLatest(slug!),
    enabled: Boolean(allowed && slug),
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
                This page is restricted. Sign in and connect the authorized Solana wallet.
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
                This page is only available when the connected Solana wallet matches the authorized address.
              </p>
              <p className="font-mono text-xs opacity-90 break-all">{INTERNAL_TEAM_MONITOR_SOLANA_WALLET}</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/overview">Back to overview</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (slug === "hackathon-scout") {
    return <Navigate to="/internal-team-agents#hackathon-board" replace />;
  }

  if (slug === "partnership-scout") {
    return <Navigate to="/internal-team-agents#partnership-board" replace />;
  }

  if (!slug || !meta) {
    return <Navigate to="/internal-team-agents" replace />;
  }

  return (
    <div className={DASHBOARD_CONTENT_SHELL}>
      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground" asChild>
              <Link to="/internal-team-agents">
                <ArrowLeft className="h-4 w-4" />
                Internal agents
              </Link>
            </Button>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{meta.name}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            {q.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {q.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading latest run…
          </div>
        ) : q.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load data</AlertTitle>
            <AlertDescription>{q.error instanceof Error ? q.error.message : "Unknown error"}</AlertDescription>
          </Alert>
        ) : q.data ? (
          renderPayload(slug, q.data)
        ) : null}
      </div>
    </div>
  );
}
