import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import {
  buildSpreadHistory,
  fetchSpcxConfig,
  fetchSpcxFeed,
  fetchSpcxLatest,
  isNasdaqReferenceFallback,
  isReportStale,
  tickSpcxAgent,
} from "@/lib/spcxApi";
import { useToast } from "@/hooks/use-toast";
import { SpcxHero } from "@/components/spcx/SpcxHero";
import { SpcxQuickStart } from "@/components/spcx/SpcxQuickStart";
import { SpcxPriceCompare } from "@/components/spcx/SpcxPriceCompare";
import { SpcxMetricsRow } from "@/components/spcx/SpcxMetricsRow";
import { SpcxVenueStatusSummary } from "@/components/spcx/SpcxVenueStatusSummary";
import { SpcxScamRadar } from "@/components/spcx/SpcxScamRadar";
import { SpcxMintVerifier } from "@/components/spcx/SpcxMintVerifier";
import { SpcxIpoPlaybook } from "@/components/spcx/SpcxIpoPlaybook";
import { SpcxSwapPanel } from "@/components/spcx/SpcxSwapPanel";
import { SpcxSpreadChart } from "@/components/spcx/SpcxSpreadChart";
import { SpcxAgentTake } from "@/components/spcx/SpcxAgentTake";
import { SpcxVenueCard } from "@/components/spcx/SpcxVenueCard";
import { SpcxRiskCard } from "@/components/spcx/SpcxRiskCard";
import { SpcxSidebar } from "@/components/spcx/SpcxSidebar";
import { SpcxVenueGuide } from "@/components/spcx/SpcxVenueGuide";
import { SpcxMethodology } from "@/components/spcx/SpcxMethodology";
import { SpcxGlossary } from "@/components/spcx/SpcxGlossary";
import { SpcxApiReference } from "@/components/spcx/SpcxApiReference";
import { SpcxErrorState } from "@/components/spcx/SpcxErrorState";
import { SpcxPageSkeleton } from "@/components/spcx/SpcxPageSkeleton";
import { SpcxSection } from "@/components/spcx/SpcxSection";
import {
  spcxTabListClass,
  spcxTabTriggerClass,
} from "@/components/spcx/spcxStyles";

type SpcxTab = "overview" | "buy" | "venues" | "learn";

const TABS: {
  value: SpcxTab;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    value: "overview",
    label: "Start here",
    hint: "Understand prices",
    icon: LayoutDashboard,
  },
  {
    value: "buy",
    label: "Buy safely",
    hint: "Trade step-by-step",
    icon: ShoppingCart,
  },
  {
    value: "venues",
    label: "Where to buy",
    hint: "Compare platforms",
    icon: Building2,
  },
  {
    value: "learn",
    label: "Learn",
    hint: "FAQ & glossary",
    icon: GraduationCap,
  },
];

export default function SpcxAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<SpcxTab>("overview");

  const configQ = useQuery({
    queryKey: ["spcx-config"],
    queryFn: fetchSpcxConfig,
  });

  const latestQ = useQuery({
    queryKey: ["spcx-latest"],
    queryFn: fetchSpcxLatest,
    refetchInterval: 30_000,
  });

  const feedQ = useQuery({
    queryKey: ["spcx-feed"],
    queryFn: () => fetchSpcxFeed(50),
    refetchInterval: 45_000,
  });

  const tickMut = useMutation({
    mutationFn: tickSpcxAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spcx-latest"] });
      queryClient.invalidateQueries({ queryKey: ["spcx-feed"] });
      queryClient.invalidateQueries({ queryKey: ["spcx-telegram-preview"] });
      toast({
        title: "Prices updated",
        description: "Latest SpaceX data refreshed.",
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: e.message,
      });
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await tickMut.mutateAsync();
    } finally {
      setRefreshing(false);
    }
  }, [tickMut]);

  const goToBuy = useCallback(() => setActiveTab("buy"), []);

  const report = latestQ.data;
  const spreadHistory = useMemo(
    () => buildSpreadHistory(feedQ.data?.entries ?? []),
    [feedQ.data?.entries],
  );
  const stale = report ? isReportStale(report.computedAt) : false;
  const nasdaqFallback = report ? isNasdaqReferenceFallback(report) : false;

  return (
    <div
      className={cn(
        DASHBOARD_CONTENT_SHELL,
        PAGE_PADDING_TOP_STANDARD,
        PAGE_SAFE_AREA_BOTTOM,
        "flex min-h-0 flex-col",
      )}
    >
      <SpcxHero
        config={configQ.data}
        report={report}
        refreshing={refreshing || tickMut.isPending}
        onRefresh={handleRefresh}
        onBuyClick={goToBuy}
      />

      {latestQ.isLoading && <SpcxPageSkeleton />}

      {latestQ.isError && (
        <SpcxErrorState
          message={
            latestQ.error instanceof Error
              ? latestQ.error.message
              : "Unknown error"
          }
          onRetry={() => latestQ.refetch()}
          retrying={latestQ.isFetching}
        />
      )}

      {report && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SpcxTab)}
          className="space-y-6"
        >
          <div className="-mx-1 rounded-2xl border border-border/50 bg-background/90 p-2 shadow-sm">
            <TabsList className={spcxTabListClass}>
              {TABS.map(({ value, label, hint, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={spcxTabTriggerClass}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
                    <Icon className="hidden h-3.5 w-3.5 sm:inline" />
                    {label}
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {hint}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {(stale || nasdaqFallback) && (
            <div className="space-y-2">
              {stale ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Prices may be outdated — last update was over 5 minutes ago.
                  Tap Refresh.
                </div>
              ) : null}
              {nasdaqFallback ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Stock price is using IPO reference — live Nasdaq feed is
                  temporarily offline.
                </div>
              ) : null}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <SpcxQuickStart onGetStarted={goToBuy} />
                <SpcxPriceCompare report={report} />
                <SpcxMetricsRow report={report} />
                <SpcxAgentTake report={report} />
                <SpcxIpoPlaybook venues={report.venues} />
                <SpcxSpreadChart data={spreadHistory} />
              </TabsContent>

              <TabsContent value="buy" className="mt-0 space-y-6">
                <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Buy in 3 steps:</strong>{" "}
                    Check for fake tokens below, verify your token ID, then
                    complete the purchase. Never skip step 1 or 2.
                  </p>
                </div>
                <SpcxScamRadar report={report} />
                <SpcxMintVerifier report={report} />
                <SpcxSwapPanel report={report} />
              </TabsContent>

              <TabsContent value="venues" className="mt-0 space-y-6">
                <SpcxVenueStatusSummary report={report} />
                <SpcxIpoPlaybook venues={report.venues} />
                <SpcxSection
                  id="spcx-venues"
                  kicker="Full comparison"
                  title="Every platform we track"
                  description="Each card shows price, how easy it is to trade, and whether it's open right now."
                  icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {report.venues.map((v) => (
                      <SpcxVenueCard key={`${v.venue}-${v.symbol}`} venue={v} />
                    ))}
                  </div>
                </SpcxSection>
                <SpcxVenueGuide venues={report.venues} />
              </TabsContent>

              <TabsContent value="learn" className="mt-0 space-y-6">
                <SpcxGlossary />
                <SpcxMethodology config={configQ.data} />
                <SpcxRiskCard report={report} />
                <SpcxApiReference />
              </TabsContent>
            </div>

            <SpcxSidebar
              entries={feedQ.data?.entries ?? []}
              loading={feedQ.isLoading || feedQ.isFetching}
              error={
                feedQ.isError
                  ? feedQ.error instanceof Error
                    ? feedQ.error.message
                    : "Failed to load feed"
                  : null
              }
              onRetry={() => feedQ.refetch()}
              retrying={feedQ.isFetching}
            />
          </div>
        </Tabs>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border/50 bg-muted/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-muted-foreground">
          Your one-stop SpaceX IPO page — prices, safety checks, and buying
          guides in plain English.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-xl"
          asChild
        >
          <a
            href="https://docs.syraa.fun"
            target="_blank"
            rel="noopener noreferrer"
          >
            Developer API
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </a>
        </Button>
      </div>
    </div>
  );
}
