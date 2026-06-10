import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { Link, useLocation, useNavigate, useSearchParams } from "@/lib/navigation";

import { Lock, ShieldAlert } from "lucide-react";

import { useWalletContext } from "@/contexts/WalletContext";

import {

  INTERNAL_TEAM_MONITOR_SOLANA_WALLET,

  isInternalTeamMonitorWallet,

} from "@/constants/internalTeamMonitorWallet";

import { requireInternalAgentMeta } from "@/lib/internalAgentsCatalog";

import {

  AGENT_ICONS,

  AgentOverviewCard,

  InternalAgentsHero,

  type AgentRunStatus,

} from "@/components/internal/internalAgentUi";

import { InternalPartnershipBoard } from "@/components/internal/InternalPartnershipBoard";

import {

  InternalTabBar,

  internalTabToParam,

  parseInternalTab,

  type InternalTab,

} from "@/components/internal/InternalTabBar";

import { InfoLiveMetricsDashboard } from "@/components/info/InfoLiveMetricsDashboard";

import {

  internalAgentPath,

  internalPartnershipBoardPath,

} from "@/lib/internalRoutes";

import {

  fetchGrowthScoutLatest,

  fetchPartnershipScoutLatest,

  fetchTrendScoutLatest,

  type GrowthScoutPayload,

  type PartnershipScoutPayload,

  type TrendScoutPayload,

} from "@/lib/internalTeamAgentsApi";

import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";



const STALE_MS = 45_000;



function trendScoutStats(payload: TrendScoutPayload | null | undefined) {

  if (!payload) return [];

  const stats: { label: string; value: string | number }[] = [];

  const topics = payload.trendingTopics?.length ?? 0;

  const content = payload.contentSuggestions?.length ?? 0;

  const features = payload.featureSuggestions?.length ?? 0;

  if (topics > 0) stats.push({ label: "Trends", value: topics });

  if (content > 0) stats.push({ label: "Post ideas", value: content });

  if (features > 0) stats.push({ label: "Features", value: features });

  return stats;

}



function growthScoutStats(payload: GrowthScoutPayload | null | undefined) {

  if (!payload) return [];

  const stats: { label: string; value: string | number }[] = [];

  const users = payload.userAcquisitionActions?.length ?? 0;

  const tvl = payload.tvlGrowthActions?.length ?? 0;

  const ship = payload.productPriorities?.length ?? 0;

  if (users > 0) stats.push({ label: "User ideas", value: users });

  if (tvl > 0) stats.push({ label: "TVL ideas", value: tvl });

  if (ship > 0) stats.push({ label: "Ship next", value: ship });

  return stats;

}



function partnershipScoutStats(payload: PartnershipScoutPayload | null | undefined) {

  if (!payload) return [];

  const stats: { label: string; value: string | number }[] = [];

  const targets = payload.partnershipTargets?.length ?? 0;

  const integrations = payload.quickIntegrations?.length ?? 0;

  if (targets > 0) stats.push({ label: "Partners", value: targets });

  if (integrations > 0) stats.push({ label: "Quick wins", value: integrations });

  if (payload.newSaved != null) stats.push({ label: "New saved", value: payload.newSaved });

  return stats;

}



function queryRunStatus(q: {

  isLoading: boolean;

  isError: boolean;

  data?: { data?: unknown | null };

}): AgentRunStatus {

  if (q.isLoading) return "loading";

  if (q.isError) return "error";

  if (!q.data?.data) return "waiting";

  return "ready";

}



export default function InternalTeamAgentsMonitor() {

  const { address, connected, connectSolana } = useWalletContext();

  const { hash, pathname } = useLocation();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const tab = parseInternalTab(searchParams.get("tab"));

  const allowed = isInternalTeamMonitorWallet(address);



  const setTab = (next: InternalTab) => {

    const params = new URLSearchParams(searchParams);

    const param = internalTabToParam(next);

    if (param) params.set("tab", param);

    else params.delete("tab");

    const q = params.toString();

    const path = q ? `${pathname}?${q}` : pathname;

    navigate(`${path}${hash}`, { replace: true });

  };



  useEffect(() => {

    if (hash === "#partnership-board" && tab !== "agents") {

      setTab("agents");

    }

  }, [hash, tab]);



  useEffect(() => {

    if (hash === "#partnership-board") {

      document.getElementById("partnership-board")?.scrollIntoView({ behavior: "smooth", block: "start" });

    }

  }, [hash, tab]);



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



  const growthQ = useQuery({

    queryKey: ["internal-team-agents", "growth-scout"],

    queryFn: fetchGrowthScoutLatest,

    enabled: allowed,

    staleTime: STALE_MS,

  });



  if (!connected) {

    return (

      <div className={DASHBOARD_CONTENT_SHELL}>

        <div className={PAGE_PADDING_TOP_MEDIUM}>

          <Alert className="max-w-xl border-border/80 bg-muted/20">

            <Lock className="h-4 w-4" />

            <AlertTitle>Connect your wallet</AlertTitle>

            <AlertDescription className="space-y-3 pt-1">

              <p className="text-sm text-muted-foreground">

                This page is for the Syra team only. Connect the authorized Solana wallet to continue.

              </p>

              <Button type="button" size="sm" onClick={() => void connectSolana()}>

                Connect wallet

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

              <p>Your wallet is not authorized to view this page.</p>

              <p className="font-mono text-xs opacity-90 break-all">

                {INTERNAL_TEAM_MONITOR_SOLANA_WALLET}

              </p>

              <Button variant="outline" size="sm" className="mt-2" asChild>

                <Link to="/overview">Go to overview</Link>

              </Button>

            </AlertDescription>

          </Alert>

        </div>

      </div>

    );

  }



  const trendMeta = requireInternalAgentMeta("trend-scout");

  const partnershipMeta = requireInternalAgentMeta("partnership-scout");

  const growthMeta = requireInternalAgentMeta("growth-scout");

  const anyFetching = trendQ.isFetching || partnershipQ.isFetching || growthQ.isFetching;



  return (

    <div className={DASHBOARD_CONTENT_SHELL}>

      <div className={`${PAGE_PADDING_TOP_MEDIUM} space-y-6`}>

        <InternalAgentsHero

          onRefresh={tab === "agents" ? () => {

            void trendQ.refetch();

            void partnershipQ.refetch();

            void growthQ.refetch();

          } : undefined}

          refreshing={tab === "agents" ? anyFetching : false}

        />



        <InternalTabBar active={tab} onChange={setTab} />



        {tab === "metrics" ? (

          <section

            id="product-growth"

            role="tabpanel"

            aria-labelledby="internal-tab-metrics"

            className="scroll-mt-24 space-y-4 pt-2"

          >

            <div>

              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">

                Product growth

              </h2>

              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">

                Live production metrics — x402 volume, users, agent engagement, playground adoption, and API health.

              </p>

            </div>

            <InfoLiveMetricsDashboard />

          </section>

        ) : null}



        {tab === "agents" ? (

          <div

            role="tabpanel"

            aria-labelledby="internal-tab-agents"

            className="space-y-10 pt-2"

          >

            <section className="space-y-4">

              <div>

                <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">

                  Internal agents

                </h2>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">

                  Automated research that runs every morning — market trends, growth ideas, and partnership targets.

                </p>

              </div>

              <div className="grid gap-5 lg:grid-cols-3">

                <AgentOverviewCard

                  icon={AGENT_ICONS["trend-scout"]}

                  name={trendMeta.name}

                  description={trendMeta.subtitle}

                  schedule={trendMeta.schedule}

                  status={queryRunStatus(trendQ)}

                  lastRun={trendQ.data?.savedAt}

                  stats={trendScoutStats(trendQ.data?.data ?? undefined)}

                  highlight={trendQ.data?.data?.marketSummary}

                  href={internalAgentPath("trend-scout")}

                  ctaLabel="Read full report"

                />

                <AgentOverviewCard

                  icon={AGENT_ICONS["growth-scout"]}

                  name={growthMeta.name}

                  description={growthMeta.subtitle}

                  schedule={growthMeta.schedule}

                  status={queryRunStatus(growthQ)}

                  lastRun={growthQ.data?.savedAt}

                  stats={growthScoutStats(growthQ.data?.data ?? undefined)}

                  highlight={growthQ.data?.data?.growthSummary}

                  href={internalAgentPath("growth-scout")}

                  ctaLabel="See growth plan"

                />

                <AgentOverviewCard

                  icon={AGENT_ICONS["partnership-scout"]}

                  name={partnershipMeta.name}

                  description={partnershipMeta.subtitle}

                  schedule={partnershipMeta.schedule}

                  status={queryRunStatus(partnershipQ)}

                  lastRun={partnershipQ.data?.savedAt}

                  stats={partnershipScoutStats(partnershipQ.data?.data ?? undefined)}

                  highlight={partnershipQ.data?.data?.ecosystemSummary}

                  href={internalPartnershipBoardPath()}

                  ctaLabel="Browse partners"

                />

              </div>

            </section>



            <InternalPartnershipBoard />

          </div>

        ) : null}

      </div>

    </div>

  );

}

