import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Megaphone, Plus, Sparkles, Wallet } from "lucide-react";

import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import TelegramCommunityModal from "@/components/TelegramCommunityModal";
import { useTelegramPopup } from "@/hooks/useTelegramPopup";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SolanaWalletProvider } from "@/providers/SolanaWalletProvider";
import { CampaignGrid } from "@/components/kol/CampaignCard";
import { CampaignDetail } from "@/components/kol/CampaignDetail";
import { CreateCampaignForm } from "@/components/kol/CreateCampaignForm";
import { EarningsDashboard } from "@/components/kol/EarningsDashboard";
import {
  DEFAULT_KOL_CONFIG,
  fetchCampaignDetail,
  fetchCampaigns,
  fetchKolConfig,
} from "@/lib/kolApi";

function KolPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCampaignId = searchParams.get("campaign");
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === "projects" || tabFromUrl === "earnings" ? tabFromUrl : "browse",
  );
  const [applyOpen, setApplyOpen] = useState(false);
  const telegram = useTelegramPopup();

  const configQuery = useQuery({
    queryKey: ["kol-config"],
    queryFn: fetchKolConfig,
  });

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns"],
    queryFn: () => fetchCampaigns(),
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
    setSearchParams({});
  }, [setSearchParams]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const activeCampaigns = useMemo(
    () => (campaignsQuery.data?.campaigns ?? []).filter((c) => c.status === "active"),
    [campaignsQuery.data?.campaigns],
  );

  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  return (
    <div className="relative min-h-screen bg-background isolate">
      <MeteorEffect />
      <MouseEffects />

      <Header onApplyClick={() => setApplyOpen(true)} />

      <main className="relative z-[1] container pt-28 pb-20">
        <section className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">KOL Marketplace</p>
          <h1 className="heading-display">
            Connect projects with <span className="text-gradient">KOLs on X</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Projects fund SOL rewards for posts they want amplified. KOLs earn pro-rata by
            engagement and get paid automatically at snapshot.
          </p>
        </section>

        {selectedCampaignId && detailQuery.data ? (
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
              <TabsList className="panel-glass rounded-full p-1 h-auto flex-wrap w-fit">
                <TabsTrigger value="browse" className="rounded-full gap-2">
                  <Megaphone className="w-4 h-4" />
                  Browse
                </TabsTrigger>
                <TabsTrigger value="projects" className="rounded-full gap-2">
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
                  onClick={() => setActiveTab("projects")}
                >
                  <Plus className="w-4 h-4" />
                  Create campaign
                </Button>
              ) : null}
            </div>

            {campaignsQuery.isError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
                Could not load campaigns from the API. You can still create a campaign — deploy the
                latest API or use dev proxy to sync listings.
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
                    <h2 className="font-semibold text-lg mb-1">Active campaigns</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {activeCampaigns.length} live · engagement updates daily
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

            <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
              {configQuery.isLoading ? (
                <Skeleton className="h-96 rounded-2xl max-w-2xl" />
              ) : (
                <CreateCampaignForm
                  minRewardSol={config.minRewardSol}
                  maxDurationDays={config.maxDurationDays}
                  poolWalletAddress={config.poolWalletAddress}
                  onCreated={() => {
                    campaignsQuery.refetch();
                    setActiveTab("browse");
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 focus-visible:outline-none">
              <EarningsDashboard />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
      <ApplicationModal open={applyOpen} onOpenChange={setApplyOpen} />
      <TelegramCommunityModal open={telegram.open} onOpenChange={telegram.setOpen} />
    </div>
  );
}

const Kol = () => (
  <ThemeProvider>
    <SolanaWalletProvider>
      <KolPageContent />
    </SolanaWalletProvider>
  </ThemeProvider>
);

export default Kol;
