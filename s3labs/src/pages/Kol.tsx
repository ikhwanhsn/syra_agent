import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Megaphone, Plus, Sparkles, Trophy, Users, Wallet } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CampaignGrid } from "@/components/kol/CampaignCard";
import { CampaignDetail } from "@/components/kol/CampaignDetail";
import { CreateCampaignForm } from "@/components/kol/CreateCampaignForm";
import { EarningsDashboard } from "@/components/kol/EarningsDashboard";
import { KolHowItWorks } from "@/components/kol/KolHowItWorks";
import { MarketplaceStats } from "@/components/kol/MarketplaceStats";
import { ProfileLeaderboard } from "@/components/kol/ProfileLeaderboard";
import {
  DEFAULT_KOL_CONFIG,
  fetchCampaignDetail,
  fetchCampaigns,
  fetchKolConfig,
} from "@/lib/kolApi";

const VALID_TABS = ["browse", "projects", "kols", "create", "earnings"] as const;
type KolTab = (typeof VALID_TABS)[number];

function parseTab(value: string | null): KolTab {
  if (value && VALID_TABS.includes(value as KolTab)) return value as KolTab;
  return "browse";
}

function KolPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCampaignId = searchParams.get("campaign");
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<KolTab>(parseTab(tabFromUrl));

  const configQuery = useQuery({
    queryKey: ["kol-config"],
    queryFn: fetchKolConfig,
  });

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns"],
    queryFn: () => fetchCampaigns(),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const detailQuery = useQuery({
    queryKey: ["kol-campaign", selectedCampaignId],
    queryFn: () => fetchCampaignDetail(selectedCampaignId!),
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

  const activeCampaigns = useMemo(
    () => (campaignsQuery.data?.campaigns ?? []).filter((c) => c.status === "active"),
    [campaignsQuery.data?.campaigns],
  );

  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  return (
    <div className={cn(pageContent, "pb-20")}>
        <section className="mb-10 max-w-3xl min-w-0">
          <p className="eyebrow mb-3">KOL Marketplace</p>
          <h1 className="heading-display">
            Post on X, <span className="text-gradient">earn SOL</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Solana projects fund reward pools for posts they want amplified. Reply or quote on X,
            submit your link, and get paid automatically when the campaign ends — your share grows
            with every like and view.
          </p>
        </section>

        {!selectedCampaignId ? (
          <>
            <section className="mb-10">
              <MarketplaceStats />
            </section>
            <KolHowItWorks />
          </>
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
            onClose={handleCloseDetail}
            onRefresh={() => {
              detailQuery.refetch();
              campaignsQuery.refetch();
            }}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="panel-glass rounded-full p-1 h-auto flex-wrap w-full sm:w-fit max-w-full justify-start">
                <TabsTrigger value="browse" className="rounded-full gap-2">
                  <Megaphone className="w-4 h-4" />
                  Browse
                </TabsTrigger>
                <TabsTrigger value="projects" className="rounded-full gap-2">
                  <Trophy className="w-4 h-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="kols" className="rounded-full gap-2">
                  <Users className="w-4 h-4" />
                  KOLs
                </TabsTrigger>
                <TabsTrigger value="create" className="rounded-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  For Projects
                </TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full gap-2">
                  <Wallet className="w-4 h-4" />
                  My Earnings
                </TabsTrigger>
              </TabsList>

              {activeTab === "browse" ? (
                <Button
                  variant="hero"
                  className="rounded-full gap-2 shrink-0"
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
                campaign from the For Projects tab.
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
                      {activeCampaigns.length === 0
                        ? "No live campaigns yet. Check back soon or launch one as a project."
                        : `${activeCampaigns.length} campaign${activeCampaigns.length !== 1 ? "s" : ""} with SOL rewards · pick one, post on X, submit your link`}
                    </p>
                    <CampaignGrid
                      campaigns={activeCampaigns}
                      onSelect={handleSelectCampaign}
                    />
                  </div>

                  {(campaignsQuery.data?.campaigns ?? []).some((c) => c.status === "completed") ? (
                    <div>
                      <h2 className="font-semibold text-lg mb-4">Completed</h2>
                      <CampaignGrid
                        campaigns={(campaignsQuery.data?.campaigns ?? []).filter(
                          (c) => c.status === "completed",
                        )}
                        onSelect={handleSelectCampaign}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="projects" className="mt-0 space-y-4 focus-visible:outline-none">
              <div>
                <h2 className="font-semibold text-lg mb-1">Project leaderboard</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Ranked by total SOL funded across campaigns
                </p>
                <ProfileLeaderboard variant="projects" />
              </div>
            </TabsContent>

            <TabsContent value="kols" className="mt-0 space-y-4 focus-visible:outline-none">
              <div>
                <h2 className="font-semibold text-lg mb-1">KOL leaderboard</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Ranked by reputation score earned from completed campaigns
                </p>
                <ProfileLeaderboard variant="kols" />
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-0 focus-visible:outline-none">
              {configQuery.isLoading ? (
                <Skeleton className="h-96 rounded-2xl max-w-2xl" />
              ) : (
                <CreateCampaignForm
                  minRewardSol={config.minRewardSol}
                  minKolRewardSol={config.minKolRewardSol}
                  minDurationDays={config.minDurationDays}
                  maxDurationDays={config.maxDurationDays}
                  poolWalletAddress={config.poolWalletAddress}
                  onCreated={() => {
                    campaignsQuery.refetch();
                    handleTabChange("browse");
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 focus-visible:outline-none">
              <EarningsDashboard />
            </TabsContent>
          </Tabs>
        )}
    </div>
  );
}

const Kol = () => (
  <SitePageShell>
    <KolPageContent />
  </SitePageShell>
);

export default Kol;
