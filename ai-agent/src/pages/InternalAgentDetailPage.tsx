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
  type AgentTeamLatestPayload,
  type GrowthSectorNarrativePayload,
  type GrowthSyraMarketPayload,
  type GrowthSyraSocialPayload,
  type X402XTrendsLatestPayload,
} from "@/lib/internalTeamAgentsApi";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n,
  );
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

function BulletList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (items.length === 0) return <p className="text-muted-foreground">—</p>;
  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag className={ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5"}>
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 64)}`} className="leading-relaxed">
          {t}
        </li>
      ))}
    </ListTag>
  );
}

function AgentTeamDetail({ data, savedAt }: { data: AgentTeamLatestPayload; savedAt?: string }) {
  const internal = data.internal;
  const business = data.business;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {data.savedAt || savedAt ? (
          <span>
            Last saved: <span className="font-mono text-foreground">{formatShortDate(data.savedAt ?? savedAt)}</span>
          </span>
        ) : null}
        {data.crawledAt ? (
          <span>
            Crawled: <span className="font-mono text-foreground">{formatShortDate(data.crawledAt)}</span>
          </span>
        ) : null}
      </div>

      <SectionCard title="Internal research">
        {internal?.summary ? <p className="leading-relaxed whitespace-pre-wrap">{internal.summary}</p> : null}
        {internal?.generatedAt ? (
          <p className="text-xs text-muted-foreground">Generated: {formatShortDate(internal.generatedAt)}</p>
        ) : null}
        {internal?.recommendations && internal.recommendations.length > 0 ? (
          <>
            <Separator />
            <p className="font-medium text-foreground">Recommendations</p>
            <ul className="space-y-4">
              {internal.recommendations.map((r, i) => (
                <li key={`${r.title ?? i}-${i}`} className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <p className="font-medium">{r.title ?? "Untitled"}</p>
                  {r.category ? (
                    <Badge variant="outline" className="mt-1 font-normal">
                      {r.category}
                    </Badge>
                  ) : null}
                  {r.why ? <p className="mt-2 text-muted-foreground leading-relaxed">{r.why}</p> : null}
                  {r.surface ? (
                    <p className="mt-2 text-xs font-mono break-all text-muted-foreground">{r.surface}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {internal?.risks && internal.risks.length > 0 ? (
          <>
            <Separator />
            <p className="font-medium text-foreground">Risks</p>
            <BulletList items={internal.risks} />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="Business strategy">
        {business?.marketPosition ? (
          <p className="leading-relaxed whitespace-pre-wrap">{business.marketPosition}</p>
        ) : null}
        {business?.generatedAt ? (
          <p className="text-xs text-muted-foreground">Generated: {formatShortDate(business.generatedAt)}</p>
        ) : null}
        {business?.gtmRecommendations && business.gtmRecommendations.length > 0 ? (
          <>
            <Separator />
            <p className="font-medium">GTM recommendations</p>
            <ul className="space-y-3">
              {business.gtmRecommendations.map((g, i) => (
                <li key={`${g.title ?? i}`} className="rounded-md border border-border/50 p-3">
                  <p className="font-medium">{g.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {g.horizon ? <span>Horizon: {g.horizon}</span> : null}
                    {g.channel ? <span>Channel: {g.channel}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {business?.monetizationIdeas && business.monetizationIdeas.length > 0 ? (
          <>
            <Separator />
            <p className="font-medium">Monetization ideas</p>
            <ul className="list-disc space-y-2 pl-5">
              {business.monetizationIdeas.map((m) => (
                <li key={m.title}>{m.title}</li>
              ))}
            </ul>
          </>
        ) : null}
        {business?.competitiveRisks && business.competitiveRisks.length > 0 ? (
          <>
            <Separator />
            <p className="font-medium">Competitive risks</p>
            <BulletList items={business.competitiveRisks} />
          </>
        ) : null}
      </SectionCard>

      {data.surfaces && data.surfaces.length > 0 ? (
        <SectionCard title="Surfaces crawled">
          <ul className="space-y-2 font-mono text-xs break-all">
            {data.surfaces.map((u) => (
              <li key={u}>
                <a href={u} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {data.baseUrls && data.baseUrls.length > 0 ? (
        <SectionCard title="Base URLs">
          <BulletList items={data.baseUrls} />
        </SectionCard>
      ) : null}
    </div>
  );
}

function X402Detail({ data, savedAt }: { data: X402XTrendsLatestPayload; savedAt?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-mono text-foreground">{formatShortDate(savedAt ?? data.generatedAt)}</span>
        {data.tweetsSampled != null ? (
          <>
            {" "}
            · Posts sampled: <span className="tabular-nums text-foreground">{data.tweetsSampled}</span>
          </>
        ) : null}
      </p>
      {data.summary ? (
        <SectionCard title="Summary">
          <p className="leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </SectionCard>
      ) : null}
      {data.bullets && data.bullets.length > 0 ? (
        <SectionCard title="Trend bullets">
          <ul className="space-y-4">
            {data.bullets.map((b) => (
              <li key={b.title} className="rounded-md border border-border/60 bg-muted/15 p-3">
                <p className="font-medium">{b.title}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">{b.detail}</p>
                {b.evidenceTweetIds?.length ? (
                  <p className="mt-2 text-xs font-mono text-muted-foreground">
                    Evidence: {b.evidenceTweetIds.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
      {data.watchlist && data.watchlist.length > 0 ? (
        <SectionCard title="Watchlist">
          <BulletList items={data.watchlist} />
        </SectionCard>
      ) : null}
      {data.noiseOrCaveats && data.noiseOrCaveats.length > 0 ? (
        <SectionCard title="Noise & caveats">
          <BulletList items={data.noiseOrCaveats} />
        </SectionCard>
      ) : null}
    </div>
  );
}

function GrowthMarketDetail({ data, savedAt }: { data: GrowthSyraMarketPayload; savedAt?: string }) {
  const s = data.sourceStats;
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-mono text-foreground">{formatShortDate(savedAt ?? data.generatedAt)}</span>
      </p>
      {data.summary ? (
        <SectionCard title="Summary">
          <p className="leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </SectionCard>
      ) : null}
      <SectionCard title="Assessments">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Liquidity</span>
            <p className="font-medium capitalize">{data.liquidityAssessment ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Volume</span>
            <p className="font-medium capitalize">{data.volumeAssessment ?? "—"}</p>
          </div>
        </div>
        {s ? (
          <>
            <Separator />
            <p className="font-medium">Source stats</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">DEX pairs</dt>
                <dd className="font-mono tabular-nums">{s.dexPairCount ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Best liquidity (USD)</dt>
                <dd className="font-mono">{formatUsd(s.bestLiquidityUsd ?? undefined)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Best volume 24h</dt>
                <dd className="font-mono">{formatUsd(s.bestVolumeH24 ?? undefined)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Best FDV</dt>
                <dd className="font-mono">{formatUsd(s.bestFdv ?? undefined)}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </SectionCard>
      {data.bullSignals && data.bullSignals.length > 0 ? (
        <SectionCard title="Bull signals">
          <BulletList items={data.bullSignals} ordered />
        </SectionCard>
      ) : null}
      {data.riskSignals && data.riskSignals.length > 0 ? (
        <SectionCard title="Risk signals">
          <BulletList items={data.riskSignals} ordered />
        </SectionCard>
      ) : null}
      {data.growthActions && data.growthActions.length > 0 ? (
        <SectionCard title="Growth actions">
          <BulletList items={data.growthActions} ordered />
        </SectionCard>
      ) : null}
      {data.oneLineNorthStar ? (
        <SectionCard title="North star">
          <p className="font-medium leading-relaxed">{data.oneLineNorthStar}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function GrowthSocialDetail({ data, savedAt }: { data: GrowthSyraSocialPayload; savedAt?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-mono text-foreground">{formatShortDate(savedAt ?? data.generatedAt)}</span>
        {data.tweetsSampled != null ? (
          <>
            {" "}
            · Posts sampled: <span className="tabular-nums text-foreground">{data.tweetsSampled}</span>
          </>
        ) : null}
        {data.sentiment ? (
          <>
            {" "}
            · Sentiment:{" "}
            <Badge variant="secondary" className="align-middle font-normal">
              {data.sentiment}
            </Badge>
          </>
        ) : null}
      </p>
      {data.summary ? (
        <SectionCard title="Summary">
          <p className="leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </SectionCard>
      ) : null}
      {data.topThemes && data.topThemes.length > 0 ? (
        <SectionCard title="Top themes">
          <BulletList items={data.topThemes} />
        </SectionCard>
      ) : null}
      {data.communitySignals && data.communitySignals.length > 0 ? (
        <SectionCard title="Community signals">
          <BulletList items={data.communitySignals} ordered />
        </SectionCard>
      ) : null}
      {data.risks && data.risks.length > 0 ? (
        <SectionCard title="Risks">
          <BulletList items={data.risks} ordered />
        </SectionCard>
      ) : null}
      {data.bullets && data.bullets.length > 0 ? (
        <SectionCard title="Evidence bullets">
          <ul className="space-y-4">
            {data.bullets.map((b) => (
              <li key={b.title} className="rounded-md border border-border/60 bg-muted/15 p-3">
                <p className="font-medium">{b.title}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">{b.detail}</p>
                {b.evidenceTweetIds?.length ? (
                  <p className="mt-2 text-xs font-mono text-muted-foreground">
                    Evidence: {b.evidenceTweetIds.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
      {data.recommendedActions && data.recommendedActions.length > 0 ? (
        <SectionCard title="Recommended actions">
          <BulletList items={data.recommendedActions} ordered />
        </SectionCard>
      ) : null}
    </div>
  );
}

function GrowthSectorDetail({ data, savedAt }: { data: GrowthSectorNarrativePayload; savedAt?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Last saved: <span className="font-mono text-foreground">{formatShortDate(savedAt ?? data.generatedAt)}</span>
        {data.tweetsSampled != null ? (
          <>
            {" "}
            · Posts sampled: <span className="tabular-nums text-foreground">{data.tweetsSampled}</span>
          </>
        ) : null}
      </p>
      {data.macroHeadline ? (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Macro</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed">{data.macroHeadline}</p>
          </CardContent>
        </Card>
      ) : null}
      {data.summary ? (
        <SectionCard title="Summary">
          <p className="leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </SectionCard>
      ) : null}
      {data.tailwindThemes && data.tailwindThemes.length > 0 ? (
        <SectionCard title="Tailwind themes">
          <BulletList items={data.tailwindThemes} />
        </SectionCard>
      ) : null}
      {data.headwindThemes && data.headwindThemes.length > 0 ? (
        <SectionCard title="Headwind themes">
          <BulletList items={data.headwindThemes} />
        </SectionCard>
      ) : null}
      {data.positioningIdeasForSyra && data.positioningIdeasForSyra.length > 0 ? (
        <SectionCard title="Positioning ideas for Syra">
          <BulletList items={data.positioningIdeasForSyra} ordered />
        </SectionCard>
      ) : null}
      {data.bullets && data.bullets.length > 0 ? (
        <SectionCard title="Bullets">
          <ul className="space-y-4">
            {data.bullets.map((b) => (
              <li key={b.title} className="rounded-md border border-border/60 bg-muted/15 p-3">
                <p className="font-medium">{b.title}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">{b.detail}</p>
                {b.evidenceTweetIds?.length ? (
                  <p className="mt-2 text-xs font-mono text-muted-foreground">
                    Evidence: {b.evidenceTweetIds.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}

function renderPayload(slug: InternalAgentSlug, res: Awaited<ReturnType<typeof fetchInternalAgentLatest>>) {
  const savedAt = res.savedAt;
  const payload = res.data;
  if (!payload) return <p className="text-sm text-muted-foreground">No run data yet.</p>;

  switch (slug) {
    case "agent-team":
      return <AgentTeamDetail data={payload as AgentTeamLatestPayload} savedAt={savedAt} />;
    case "x402-pulse":
      return <X402Detail data={payload as X402XTrendsLatestPayload} savedAt={savedAt} />;
    case "growth-syra-market":
      return <GrowthMarketDetail data={payload as GrowthSyraMarketPayload} savedAt={savedAt} />;
    case "growth-syra-social":
      return <GrowthSocialDetail data={payload as GrowthSyraSocialPayload} savedAt={savedAt} />;
    case "growth-sector-narrative":
      return <GrowthSectorDetail data={payload as GrowthSectorNarrativePayload} savedAt={savedAt} />;
    default: {
      const _never: never = slug;
      return _never;
    }
  }
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
                <Link to="/dashboard/overview">Back to overview</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!slug || !meta) {
    return <Navigate to="/dashboard/internal-team-agents" replace />;
  }

  return (
    <div className={DASHBOARD_CONTENT_SHELL}>
      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground" asChild>
              <Link to="/dashboard/internal-team-agents">
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
