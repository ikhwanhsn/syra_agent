import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "@/lib/navigation";
import { AlertTriangle } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  isAdminWallet,
} from "@/constants/adminWallet";
import {
  getInternalAgentMeta,
  isInternalAgentSlug,
  type InternalAgentSlug,
} from "@/lib/internalAgentsCatalog";
import {
  fetchInternalAgentLatest,
  type GrowthAction,
  type GrowthScoutPayload,
  type PartnershipScoutPayload,
  type TrendScoutPayload,
} from "@/lib/internalTeamAgentsApi";
import {
  IdeaCard,
  InsightPanel,
  InternalDetailHero,
  SimpleBulletList,
  formatAgentDate,
  priorityBadgeClass,
  priorityLabel,
} from "@/components/internal/internalAgentUi";
import { ProfileDetailSkeleton } from "@/components/RouteFallback";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { INTERNAL_BASE_PATH, internalPartnershipBoardPath } from "@/lib/internalRoutes";

const STALE_MS = 45_000;

function TrendScoutDetail({ data, savedAt }: { data: TrendScoutPayload; savedAt?: string }) {
  const postCount = data.contentSuggestions?.length ?? 0;
  const featureCount = data.featureSuggestions?.length ?? 0;
  const themeCount = data.trendingTopics?.length ?? 0;

  return (
    <div className="space-y-6">
      <InsightPanel title="What happened in the market">
        <p className="text-muted-foreground">{data.marketSummary || "No summary available yet."}</p>
        {data.generatedAt ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Report generated {formatAgentDate(data.generatedAt)}
            {savedAt ? <> · Saved {formatAgentDate(savedAt)}</> : null}
          </p>
        ) : null}
      </InsightPanel>

      <Tabs defaultValue="themes" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl bg-muted/40 p-1 sm:w-auto">
          <TabsTrigger value="themes" className="rounded-lg text-sm">
            Trends
            {themeCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {themeCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg text-sm">
            Post ideas
            {postCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {postCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-lg text-sm">
            Feature ideas
            {featureCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {featureCount}
              </span>
            ) : null}
          </TabsTrigger>
          {data.risksOrCaveats?.length ? (
            <TabsTrigger value="notes" className="rounded-lg text-sm gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="themes" className="mt-0">
          <InsightPanel title="Trending themes">
            <SimpleBulletList
              items={data.trendingTopics ?? []}
              emptyLabel="No trending themes in the latest run."
            />
          </InsightPanel>
        </TabsContent>

        <TabsContent value="posts" className="mt-0 space-y-3">
          {(data.contentSuggestions ?? []).length === 0 ? (
            <InsightPanel title="Post ideas">
              <p className="text-muted-foreground">No post ideas in the latest run.</p>
            </InsightPanel>
          ) : (
            (data.contentSuggestions ?? []).map((c, i) => (
              <IdeaCard key={`${i}-${c.title}`} title={c.title} priority={c.priority}>
                <p>
                  <span className="font-medium text-foreground">Angle: </span>
                  {c.angle}
                </p>
                {c.hook ? (
                  <p>
                    <span className="font-medium text-foreground">Opening line: </span>
                    {c.hook}
                  </p>
                ) : null}
                <p className="text-xs">
                  Best on: {(c.platforms ?? []).join(", ") || "X"}
                </p>
              </IdeaCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="features" className="mt-0 space-y-3">
          {(data.featureSuggestions ?? []).length === 0 ? (
            <InsightPanel title="Feature ideas">
              <p className="text-muted-foreground">No feature ideas in the latest run.</p>
            </InsightPanel>
          ) : (
            (data.featureSuggestions ?? []).map((f, i) => (
              <IdeaCard key={`${i}-${f.title}`} title={f.title} priority={f.priority} surface={f.surface}>
                {f.why ? <p>{f.why}</p> : null}
              </IdeaCard>
            ))
          )}
        </TabsContent>

        {data.risksOrCaveats?.length ? (
          <TabsContent value="notes" className="mt-0">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Things to keep in mind
              </p>
              <div className="mt-3">
                <SimpleBulletList items={data.risksOrCaveats} />
              </div>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>

      {data.sourceStats ? (
        <p className="text-center text-xs text-muted-foreground">
          Based on {data.sourceStats.headlineCount ?? 0} headlines, {data.sourceStats.articleCount ?? 0}{" "}
          articles, and {data.sourceStats.eventDayCount ?? 0} event days
        </p>
      ) : null}
    </div>
  );
}

function GrowthActionCard({ action }: { action: GrowthAction }) {
  return (
    <IdeaCard title={action.title} priority={action.priority}>
      <p>{action.why}</p>
      <p className="text-xs">
        <span className="font-medium text-foreground">Channel: </span>
        {action.channel}
        {" · "}
        <span className="font-medium text-foreground">Effort: </span>
        {action.effort}
      </p>
      {action.expectedImpact ? (
        <p className="text-xs">
          <span className="font-medium text-foreground">Expected impact: </span>
          {action.expectedImpact}
        </p>
      ) : null}
    </IdeaCard>
  );
}

function GrowthScoutDetail({ data, savedAt }: { data: GrowthScoutPayload; savedAt?: string }) {
  const userCount = data.userAcquisitionActions?.length ?? 0;
  const tvlCount = data.tvlGrowthActions?.length ?? 0;
  const shipCount = data.productPriorities?.length ?? 0;

  return (
    <div className="space-y-6">
      <InsightPanel title="Growth health">
        <p className="text-muted-foreground">{data.growthSummary || "No summary available yet."}</p>
        {data.generatedAt ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Report generated {formatAgentDate(data.generatedAt)}
            {savedAt ? <> · Saved {formatAgentDate(savedAt)}</> : null}
          </p>
        ) : null}
      </InsightPanel>

      {data.metricHighlights?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.metricHighlights.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-border/55 bg-background/40 px-4 py-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{m.value}</p>
              {m.trend ? <p className="mt-0.5 text-xs text-muted-foreground">{m.trend}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl bg-muted/40 p-1 sm:w-auto">
          <TabsTrigger value="users" className="rounded-lg text-sm">
            Grow users
            {userCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {userCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="tvl" className="rounded-lg text-sm">
            Grow TVL
            {tvlCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {tvlCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="ship" className="rounded-lg text-sm">
            Ship next
            {shipCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {shipCount}
              </span>
            ) : null}
          </TabsTrigger>
          {data.risksOrCaveats?.length ? (
            <TabsTrigger value="notes" className="rounded-lg text-sm gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="users" className="mt-0 space-y-3">
          {(data.userAcquisitionActions ?? []).length === 0 ? (
            <InsightPanel title="Grow users">
              <p className="text-muted-foreground">No user acquisition ideas in the latest run.</p>
            </InsightPanel>
          ) : (
            (data.userAcquisitionActions ?? []).map((a, i) => (
              <GrowthActionCard key={`${i}-${a.title}`} action={a} />
            ))
          )}
        </TabsContent>

        <TabsContent value="tvl" className="mt-0 space-y-3">
          {(data.tvlGrowthActions ?? []).length === 0 ? (
            <InsightPanel title="Grow TVL">
              <p className="text-muted-foreground">No TVL growth ideas in the latest run.</p>
            </InsightPanel>
          ) : (
            (data.tvlGrowthActions ?? []).map((a, i) => (
              <GrowthActionCard key={`${i}-${a.title}`} action={a} />
            ))
          )}
        </TabsContent>

        <TabsContent value="ship" className="mt-0 space-y-3">
          {(data.productPriorities ?? []).length === 0 ? (
            <InsightPanel title="Ship next">
              <p className="text-muted-foreground">No product priorities in the latest run.</p>
            </InsightPanel>
          ) : (
            (data.productPriorities ?? []).map((a, i) => (
              <GrowthActionCard key={`${i}-${a.title}`} action={a} />
            ))
          )}
        </TabsContent>

        {data.risksOrCaveats?.length ? (
          <TabsContent value="notes" className="mt-0">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Things to keep in mind
              </p>
              <div className="mt-3">
                <SimpleBulletList items={data.risksOrCaveats} />
              </div>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>

      {data.sourceStats ? (
        <p className="text-center text-xs text-muted-foreground">
          Based on {data.sourceStats.metricCount ?? 0} metrics, {data.sourceStats.socialTweetCount ?? 0} Syra
          social posts, and {data.sourceStats.sectorTweetCount ?? 0} sector tweets
        </p>
      ) : null}
    </div>
  );
}

function PartnershipScoutDetail({ data, savedAt }: { data: PartnershipScoutPayload; savedAt?: string }) {
  return (
    <div className="space-y-6">
      <InsightPanel title="Ecosystem overview">
        <p className="text-muted-foreground">{data.ecosystemSummary || "No summary available yet."}</p>
        {data.generatedAt ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Report generated {formatAgentDate(data.generatedAt)}
            {savedAt ? <> · Saved {formatAgentDate(savedAt)}</> : null}
          </p>
        ) : null}
      </InsightPanel>

      {data.onchainThemes?.length ? (
        <div className="flex flex-wrap gap-2">
          {data.onchainThemes.map((theme) => (
            <Badge key={theme} variant="secondary" className="rounded-full font-normal">
              {theme}
            </Badge>
          ))}
        </div>
      ) : null}

      <InsightPanel title="Partnership targets">
        {(data.partnershipTargets ?? []).length === 0 ? (
          <p className="text-muted-foreground">No targets in the latest run.</p>
        ) : (
          <ul className="space-y-3">
            {(data.partnershipTargets ?? []).map((p, i) => (
              <li
                key={`${i}-${p.name}`}
                className="rounded-xl border border-border/55 bg-background/40 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline" className={cn("text-[10px]", priorityBadgeClass(p.priority))}>
                    {priorityLabel(p.priority)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {p.projectType}
                  </Badge>
                </div>
                {p.utility ? <p className="text-sm text-muted-foreground">{p.utility}</p> : null}
                {p.whyFitForSyra ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-foreground">Why Syra: </span>
                    <span className="text-muted-foreground">{p.whyFitForSyra}</span>
                  </p>
                ) : null}
                {p.collaborationIdea ? (
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-foreground">Idea: </span>
                    <span className="text-muted-foreground">{p.collaborationIdea}</span>
                  </p>
                ) : null}
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    View project →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </InsightPanel>

      <InsightPanel title="Quick integrations">
        <SimpleBulletList
          items={data.quickIntegrations ?? []}
          emptyLabel="No quick integration ideas in the latest run."
        />
      </InsightPanel>

      {data.risksOrCaveats?.length ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Things to keep in mind
          </p>
          <div className="mt-3">
            <SimpleBulletList items={data.risksOrCaveats} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderPayload(slug: InternalAgentSlug, res: { data?: unknown; savedAt?: string }) {
  const savedAt = res.savedAt;
  if (!res.data) {
    return (
      <Alert className="border-border/70">
        <AlertTitle>No report yet</AlertTitle>
        <AlertDescription>
          This agent runs automatically every morning. Check back after the scheduled run, or wait for
          the Telegram digest.
        </AlertDescription>
      </Alert>
    );
  }
  if (slug === "trend-scout") {
    return <TrendScoutDetail data={res.data as TrendScoutPayload} savedAt={savedAt} />;
  }
  if (slug === "growth-scout") {
    return <GrowthScoutDetail data={res.data as GrowthScoutPayload} savedAt={savedAt} />;
  }
  if (slug === "partnership-scout") {
    return <PartnershipScoutDetail data={res.data as PartnershipScoutPayload} savedAt={savedAt} />;
  }
  const _never: never = slug;
  return _never;
}

export default function InternalAgentDetailPage() {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const { address, connected } = useWalletContext();
  const allowed = isAdminWallet(connected, address);

  const slug = agentSlug && isInternalAgentSlug(agentSlug) ? agentSlug : null;
  const meta = slug ? getInternalAgentMeta(slug) : undefined;

  const q = useQuery({
    queryKey: ["internal-agent-detail", slug],
    queryFn: () => fetchInternalAgentLatest(slug!),
    enabled: Boolean(allowed && slug),
    staleTime: STALE_MS,
  });

  if (slug === "partnership-scout") {
    return <Navigate to={internalPartnershipBoardPath()} replace />;
  }

  if (!slug || !meta) {
    return <Navigate to={INTERNAL_BASE_PATH} replace />;
  }

  return (
    <div className={DASHBOARD_CONTENT_SHELL}>
      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-6`}>
        <InternalDetailHero
          name={meta.name}
          description={meta.subtitle}
          lastRun={q.data?.savedAt}
          onRefresh={() => void q.refetch()}
          refreshing={q.isFetching}
        />

        {q.isLoading ? (
          <ProfileDetailSkeleton />
        ) : q.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load report</AlertTitle>
            <AlertDescription>{q.error instanceof Error ? q.error.message : "Unknown error"}</AlertDescription>
          </Alert>
        ) : q.data ? (
          renderPayload(slug, q.data)
        ) : null}
      </div>
    </div>
  );
}
