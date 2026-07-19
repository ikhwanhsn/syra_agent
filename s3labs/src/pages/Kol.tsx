import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { FolderKanban, Megaphone, Plus, Search, Sparkles, Trophy, Wallet } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CampaignBrowseControls } from "@/components/kol/CampaignBrowseControls";
import { CampaignBrowseSkeleton, CampaignGrid } from "@/components/kol/CampaignCard";
import { CampaignDetail } from "@/components/kol/CampaignDetail";
import { KolAudienceSplit } from "@/components/kol/KolAudienceSplit";
import { KolHowItWorks } from "@/components/kol/KolHowItWorks";
import { KolPointsInfo } from "@/components/kol/KolPointsInfo";
import { CampaignTelegramNotify } from "@/components/CampaignTelegramNotify";
import { CampaignEmailNotify } from "@/components/CampaignEmailNotify";
import { MarketplaceStats } from "@/components/kol/MarketplaceStats";
import { isCampaignFinalizing, isCampaignLive } from "@/lib/kolCampaignStatus";
import {
  parseKolCampaignSort,
  sortKolCampaigns,
  type KolCampaignSort,
} from "@/lib/kolCampaignSort";
import {
  DEFAULT_KOL_CONFIG,
  fetchCampaignDetail,
  fetchCampaigns,
  fetchKolConfig,
} from "@/lib/kolApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { captureReferralFromSearch, claimIfNeeded } from "@/lib/referralCapture";

const CreateCampaignForm = lazy(() =>
  import("@/components/kol/CreateCampaignForm").then((m) => ({
    default: m.CreateCampaignForm,
  })),
);
const EarningsDashboard = lazy(() =>
  import("@/components/kol/EarningsDashboard").then((m) => ({
    default: m.EarningsDashboard,
  })),
);
const KolEarningsCheckPanel = lazy(() =>
  import("@/components/kol/KolEarningsCheckPanel").then((m) => ({
    default: m.KolEarningsCheckPanel,
  })),
);
const ProfileLeaderboard = lazy(() =>
  import("@/components/kol/ProfileLeaderboard").then((m) => ({
    default: m.ProfileLeaderboard,
  })),
);
const ProjectDashboard = lazy(() =>
  import("@/components/kol/ProjectDashboard").then((m) => ({
    default: m.ProjectDashboard,
  })),
);

function TabPanelFallback() {
  return <Skeleton className="h-64 rounded-2xl" />;
}

const VALID_TABS = ["browse", "leaderboard", "projects", "create", "earnings", "check"] as const;
type KolTab = (typeof VALID_TABS)[number];

/** Legacy `kols` URL maps to leaderboard; `projects` is now the creator dashboard. */
function parseTab(value: string | null): KolTab {
  if (value === "kols") return "leaderboard";
  if (value && VALID_TABS.includes(value as KolTab)) return value as KolTab;
  return "browse";
}

function KolPageContent() {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCampaignId = searchParams.get("campaign");
  const tabFromUrl = searchParams.get("tab");
  const sortFromUrl = searchParams.get("sort");
  const [activeTab, setActiveTab] = useState<KolTab>(parseTab(tabFromUrl));
  const [campaignSort, setCampaignSort] = useState<KolCampaignSort>(() =>
    parseKolCampaignSort(sortFromUrl),
  );
  const appliedSort = useDebouncedValue(campaignSort, 450);
  const isSortPending = campaignSort !== appliedSort;

  useEffect(() => {
    setActiveTab(parseTab(tabFromUrl));
  }, [tabFromUrl]);

  useEffect(() => {
    setCampaignSort(parseKolCampaignSort(sortFromUrl));
  }, [sortFromUrl]);

  useEffect(() => {
    captureReferralFromSearch(searchParams.toString());
  }, [searchParams]);

  useEffect(() => {
    if (!wallet.connected || !walletAddress) return;
    void claimIfNeeded(walletAddress);
  }, [wallet.connected, walletAddress]);

  const configQuery = useQuery({
    queryKey: ["kol-config", walletAddress ?? null],
    queryFn: () => fetchKolConfig({ wallet: walletAddress }),
    staleTime: 5 * 60 * 1000,
  });

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns", walletAddress ?? null],
    queryFn: () => fetchCampaigns({ wallet: walletAddress }),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const detailQuery = useQuery({
    queryKey: ["kol-campaign", selectedCampaignId, walletAddress],
    queryFn: () =>
      fetchCampaignDetail(selectedCampaignId!, {
        wallet: walletAddress,
      }),
    enabled: Boolean(selectedCampaignId),
    refetchInterval: (query) => {
      const status = query.state.data?.campaign?.status;
      return status === "active" ? 5 * 60 * 1000 : false;
    },
  });

  const handleSelectCampaign = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("campaign", id);
          return next;
        },
        { preventScrollReset: true },
      );
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    },
    [setSearchParams],
  );

  const handleCloseDetail = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("campaign");
        return next;
      },
      { preventScrollReset: true },
    );
  }, [setSearchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseTab(value);
      setActiveTab(tab);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "browse") next.delete("tab");
          else next.set("tab", tab);
          if (tab !== "check") next.delete("handle");
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  /** Hero CTAs sit above the fold — bring the tab strip into view after switching. */
  const goToTab = useCallback(
    (value: KolTab) => {
      handleTabChange(value);
      requestAnimationFrame(() => {
        const el = document.getElementById("kol-marketplace-tabs");
        if (!el) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    },
    [handleTabChange],
  );

  const handleSortChange = useCallback(
    (sort: KolCampaignSort) => {
      setCampaignSort(sort);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (sort === "newest") next.delete("sort");
          else next.set("sort", sort);
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const allCampaigns = campaignsQuery.data?.campaigns ?? [];

  const liveCampaigns = useMemo(
    () => sortKolCampaigns(
      allCampaigns.filter((c) => isCampaignLive(c)),
      appliedSort,
    ),
    [allCampaigns, appliedSort],
  );

  const finalizingCampaigns = useMemo(
    () => sortKolCampaigns(
      allCampaigns.filter((c) => isCampaignFinalizing(c)),
      appliedSort,
    ),
    [allCampaigns, appliedSort],
  );

  const completedCampaigns = useMemo(
    () => sortKolCampaigns(
      allCampaigns.filter((c) => c.status === "completed"),
      appliedSort,
    ),
    [allCampaigns, appliedSort],
  );

  const pendingDepositCampaigns = useMemo(() => {
    if (!walletAddress) return [];
    const wallet = walletAddress.trim();
    return sortKolCampaigns(
      allCampaigns.filter(
        (c) =>
          c.status === "pending_deposit" &&
          c.projectWallet.trim() === wallet,
      ),
      appliedSort,
    );
  }, [allCampaigns, appliedSort, walletAddress]);

  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  return (
    <div className={cn(pageContent, "pb-20 min-w-0")}>
        <section className="mb-8 sm:mb-10 min-w-0 space-y-6">
          <div>
            <p className="eyebrow mb-3">KOL Marketplace</p>
            <h1 className="heading-display">
              Projects fund reach.{" "}
              <span className="text-gradient">KOLs compete for SOL</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed w-full max-w-none">
              Put up a SOL pool on your X post — or verify X, reply/quote, and
              submit your link to earn (1 per campaign). Engagement updates about
              every 6 hours; we rank by fair engagement and pay automatically.
              Unused pool SOL is refunded to projects. Everyone earns{" "}
              <span className="text-foreground/90 font-medium">S3Labs Points</span>.
            </p>
          </div>
          {!selectedCampaignId ? (
            <KolAudienceSplit
              onCreate={() => goToTab("create")}
              onBrowse={() => goToTab("browse")}
            />
          ) : null}
        </section>

        {!selectedCampaignId ? (
          <section className="mb-8 sm:mb-10">
            <MarketplaceStats />
          </section>
        ) : null}

        {selectedCampaignId && detailQuery.isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-40 rounded-full" />
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : selectedCampaignId && detailQuery.isError ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 space-y-4">
            <h2 className="font-semibold text-lg tracking-tight">Campaign unavailable</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This campaign may still be waiting on its creator to fund the reward pool, or the link
              is invalid. Unfunded drafts are only visible to the wallet that created them.
            </p>
            <Button variant="outline" className="rounded-full" onClick={handleCloseDetail}>
              Back to campaigns
            </Button>
          </div>
        ) : selectedCampaignId && detailQuery.data ? (
          <CampaignDetail
            campaign={detailQuery.data.campaign}
            leaderboard={detailQuery.data.leaderboard}
            viewerClaimEligibility={detailQuery.data.viewerClaimEligibility}
            onClose={handleCloseDetail}
            onRefresh={() => {
              detailQuery.refetch();
              campaignsQuery.refetch();
            }}
          />
        ) : (
          <Tabs
            id="kol-marketplace-tabs"
            value={activeTab}
            onValueChange={handleTabChange}
            className="scroll-mt-[6.5rem] space-y-6 sm:space-y-8 min-w-0"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
              <TabsList className="panel-glass scrollbar-hide h-auto w-full max-w-full justify-start overflow-x-auto rounded-full p-1 sm:w-fit sm:flex-wrap sm:overflow-visible">
                <TabsTrigger value="browse" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Browse
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="projects" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Mine</span>
                  <span className="hidden sm:inline">My campaigns</span>
                </TabsTrigger>
                <TabsTrigger value="create" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Launch</span>
                  <span className="hidden sm:inline">Create</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Earnings</span>
                  <span className="hidden sm:inline">My Earnings</span>
                </TabsTrigger>
                <TabsTrigger value="check" className="shrink-0 rounded-full gap-1.5 px-3 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">Check</span>
                  <span className="hidden sm:inline">Check by X</span>
                </TabsTrigger>
              </TabsList>

              {activeTab === "browse" ? (
                <div className="flex w-full shrink-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center sm:w-auto">
                  {allCampaigns.length > 0 ? (
                    <CampaignBrowseControls
                      sort={campaignSort}
                      onSortChange={handleSortChange}
                      className="w-full min-[400px]:w-auto"
                    />
                  ) : null}
                  <Button
                    variant="hero"
                    className="h-11 w-full shrink-0 gap-2 rounded-full min-[400px]:w-auto"
                    onClick={() => handleTabChange("create")}
                  >
                    <Plus className="w-4 h-4" />
                    Create campaign
                  </Button>
                </div>
              ) : null}
            </div>

            {campaignsQuery.isError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
                Campaigns couldn&apos;t load right now. Try refreshing — you can still create a new
                campaign from the Create tab.
              </div>
            ) : null}

            <TabsContent value="browse" className="mt-0 space-y-6 focus-visible:outline-none">
              {campaignsQuery.isLoading || isSortPending ? (
                <CampaignBrowseSkeleton count={campaignsQuery.isLoading ? 3 : 6} />
              ) : (
                <>
                  {pendingDepositCampaigns.length > 0 ? (
                    <div>
                      <h2 className="font-semibold text-lg mb-1">
                        Your draft — finish payment
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        You created this campaign but haven’t funded it yet. Open it and confirm the
                        SOL deposit to go live.
                      </p>
                      <CampaignGrid
                        campaigns={pendingDepositCampaigns}
                        onSelect={handleSelectCampaign}
                      />
                    </div>
                  ) : null}

                  <div>
                    <h2 className="font-semibold text-lg mb-1">Live campaigns — start earning</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {liveCampaigns.length === 0
                        ? "No live campaigns yet. Check back soon or launch one as a project."
                        : `${liveCampaigns.length} campaign${liveCampaigns.length !== 1 ? "s" : ""} with SOL rewards · pick one, reply or quote on X`}
                    </p>
                    <CampaignGrid
                      campaigns={liveCampaigns}
                      onSelect={handleSelectCampaign}
                      highlightTopRewards
                    />
                  </div>

                  {finalizingCampaigns.length > 0 ? (
                    <div>
                      <h2 className="font-semibold text-lg mb-1">Ending — payouts processing</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        These campaigns have ended and rewards are being calculated and distributed.
                      </p>
                      <CampaignGrid
                        campaigns={finalizingCampaigns}
                        onSelect={handleSelectCampaign}
                      />
                    </div>
                  ) : null}

                  {completedCampaigns.length > 0 ? (
                    <div>
                      <h2 className="font-semibold text-lg mb-4">Completed</h2>
                      <CampaignGrid
                        campaigns={completedCampaigns}
                        onSelect={handleSelectCampaign}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0 space-y-8 focus-visible:outline-none">
              <div>
                <h2 className="font-semibold text-lg mb-1">Marketplace leaderboard</h2>
                <p className="w-full text-sm text-muted-foreground">
                  One wallet, both roles — fund campaigns as a project and earn as a KOL.
                </p>
              </div>

              <Suspense fallback={<TabPanelFallback />}>
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    Hire reach — invite these KOLs
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Top earners by reputation. Invite them when you launch a campaign.
                  </p>
                  <ProfileLeaderboard variant="kols" />
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-1">Top funders</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ranked by total SOL funded across campaigns
                  </p>
                  <ProfileLeaderboard variant="projects" />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
              <Suspense fallback={<TabPanelFallback />}>
                <ProjectDashboard
                  onSelectCampaign={handleSelectCampaign}
                  onCreate={() => handleTabChange("create")}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="create" className="mt-0 focus-visible:outline-none">
              {configQuery.isLoading ? (
                <Skeleton className="h-96 w-full rounded-2xl" />
              ) : (
                <Suspense fallback={<TabPanelFallback />}>
                  <CreateCampaignForm
                    minRewardSol={config.minRewardSol}
                    minKolRewardSol={config.minKolRewardSol}
                    platformFeeSol={config.platformFeeSol}
                    minDurationDays={config.minDurationDays}
                    maxDurationDays={config.maxDurationDays}
                    poolWalletAddress={config.poolWalletAddress}
                    onCreated={() => {
                      campaignsQuery.refetch();
                      handleTabChange("browse");
                    }}
                    onOpenCampaign={(id) => handleSelectCampaign(id)}
                  />
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 focus-visible:outline-none space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Want totals without connecting a wallet? Look up any X account that joined campaigns.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 shrink-0"
                  onClick={() => handleTabChange("check")}
                >
                  <Search className="w-3.5 h-3.5" />
                  Check by X
                </Button>
              </div>
              <Suspense fallback={<TabPanelFallback />}>
                <EarningsDashboard />
              </Suspense>
            </TabsContent>

            <TabsContent value="check" className="mt-0 focus-visible:outline-none">
              <Suspense fallback={<TabPanelFallback />}>
                <KolEarningsCheckPanel />
              </Suspense>
            </TabsContent>
          </Tabs>
        )}

        {!selectedCampaignId ? (
          <div className="mt-14 sm:mt-16 space-y-10 border-t border-border/40 pt-12 sm:pt-14">
            <KolHowItWorks />
            <KolPointsInfo />
            <CampaignTelegramNotify />
            <CampaignEmailNotify />
          </div>
        ) : null}
    </div>
  );
}

const Kol = () => (
  <SitePageShell>
    <KolPageContent />
  </SitePageShell>
);

export default Kol;
