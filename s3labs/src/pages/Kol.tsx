import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Megaphone, Plus, Sparkles, Trophy, Wallet } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CampaignGrid } from "@/components/kol/CampaignCard";
import { CampaignDetail } from "@/components/kol/CampaignDetail";
import { KolHowItWorks } from "@/components/kol/KolHowItWorks";
import { KolPointsInfo } from "@/components/kol/KolPointsInfo";
import { CampaignNotifySignup } from "@/components/CampaignNotifySignup";
import { MarketplaceStats } from "@/components/kol/MarketplaceStats";
import { isCampaignFinalizing, isCampaignLive } from "@/lib/kolCampaignStatus";
import {
  DEFAULT_KOL_CONFIG,
  fetchCampaignDetail,
  fetchCampaigns,
  fetchKolConfig,
} from "@/lib/kolApi";

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
const ProfileLeaderboard = lazy(() =>
  import("@/components/kol/ProfileLeaderboard").then((m) => ({
    default: m.ProfileLeaderboard,
  })),
);

function TabPanelFallback() {
  return <Skeleton className="h-64 rounded-2xl" />;
}

const VALID_TABS = ["browse", "leaderboard", "create", "earnings"] as const;
type KolTab = (typeof VALID_TABS)[number];

/** Legacy `projects` / `kols` URLs map to the unified leaderboard tab. */
function parseTab(value: string | null): KolTab {
  if (value === "projects" || value === "kols") return "leaderboard";
  if (value && VALID_TABS.includes(value as KolTab)) return value as KolTab;
  return "browse";
}

function KolPageContent() {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCampaignId = searchParams.get("campaign");
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<KolTab>(parseTab(tabFromUrl));

  useEffect(() => {
    setActiveTab(parseTab(tabFromUrl));
  }, [tabFromUrl]);

  const configQuery = useQuery({
    queryKey: ["kol-config"],
    queryFn: fetchKolConfig,
    staleTime: 5 * 60 * 1000,
  });

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns"],
    queryFn: () => fetchCampaigns(),
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
  });

  const handleSelectCampaign = useCallback(
    (id: string) => {
      setSearchParams({ campaign: id });
    },
    [setSearchParams],
  );

  const handleCloseDetail = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("campaign");
      return next;
    });
  }, [setSearchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseTab(value);
      setActiveTab(tab);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "browse") next.delete("tab");
        else next.set("tab", tab);
        return next;
      });
    },
    [setSearchParams],
  );

  const allCampaigns = campaignsQuery.data?.campaigns ?? [];

  const liveCampaigns = useMemo(
    () => allCampaigns.filter((c) => isCampaignLive(c)),
    [allCampaigns],
  );

  const finalizingCampaigns = useMemo(
    () => allCampaigns.filter((c) => isCampaignFinalizing(c)),
    [allCampaigns],
  );

  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  return (
    <div className={cn(pageContent, "pb-20 min-w-0")}>
        <section className="mb-8 sm:mb-10 min-w-0">
          <p className="eyebrow mb-3">KOL Marketplace</p>
          <h1 className="heading-display">
            Post on X, <span className="text-gradient">earn SOL</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed max-w-none w-full">
            Solana projects fund reward pools for posts they want amplified. Reply or quote on X,
            submit your link, and get paid automatically when the campaign ends — your share grows
            with every like and view. You also earn{" "}
            <span className="text-foreground/90 font-medium">S3Labs Points</span> for every campaign
            you join.
          </p>
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 sm:space-y-8 min-w-0">
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
              </TabsList>

              {activeTab === "browse" ? (
                <Button
                  variant="hero"
                  className="w-full rounded-full gap-2 shrink-0 sm:w-auto"
                  onClick={() => handleTabChange("create")}
                >
                  <Plus className="w-4 h-4" />
                  Create campaign
                </Button>
              ) : null}
            </div>

            {campaignsQuery.isError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
                Campaigns couldn&apos;t load right now. Try refreshing — you can still create a new
                campaign from the Create tab.
              </div>
            ) : null}

            <TabsContent value="browse" className="mt-0 space-y-6 focus-visible:outline-none">
              {campaignsQuery.isLoading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">Live campaigns — start earning</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {liveCampaigns.length === 0
                        ? "No live campaigns yet. Check back soon or launch one as a project."
                        : `${liveCampaigns.length} campaign${liveCampaigns.length !== 1 ? "s" : ""} with SOL rewards · pick one, post on X, submit your link`}
                    </p>
                    <CampaignGrid
                      campaigns={liveCampaigns}
                      onSelect={handleSelectCampaign}
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

                  {allCampaigns.some((c) => c.status === "completed") ? (
                    <div>
                      <h2 className="font-semibold text-lg mb-4">Completed</h2>
                      <CampaignGrid
                        campaigns={allCampaigns.filter((c) => c.status === "completed")}
                        onSelect={handleSelectCampaign}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0 space-y-8 focus-visible:outline-none">
              <div>
                <h2 className="font-semibold text-lg mb-1">Leaderboard</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  One wallet, both roles — fund campaigns as a project and earn as a KOL. Rankings
                  update from the same accounts across the marketplace.
                </p>
              </div>

              <Suspense fallback={<TabPanelFallback />}>
                <div>
                  <h3 className="font-semibold text-base mb-1">Top funders</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ranked by total SOL funded across campaigns
                  </p>
                  <ProfileLeaderboard variant="projects" />
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-1">Top earners</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ranked by reputation score from completed campaigns
                  </p>
                  <ProfileLeaderboard variant="kols" />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="create" className="mt-0 focus-visible:outline-none">
              {configQuery.isLoading ? (
                <Skeleton className="h-96 rounded-2xl max-w-2xl" />
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
                  />
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 focus-visible:outline-none">
              <Suspense fallback={<TabPanelFallback />}>
                <EarningsDashboard />
              </Suspense>
            </TabsContent>
          </Tabs>
        )}

        {!selectedCampaignId ? (
          <div className="mt-14 sm:mt-16 space-y-10 border-t border-border/40 pt-12 sm:pt-14">
            <KolHowItWorks />
            <KolPointsInfo />
            <CampaignNotifySignup />
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
