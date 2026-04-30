import { useMemo, useState } from "react";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { MarketScreener } from "@/components/rise/MarketScreener";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import FloorScannerPage from "@/pages/dashboard/FloorScanner";
import ComparePage from "@/pages/dashboard/Compare";
import WatchlistPage from "@/pages/dashboard/Watchlist";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

const TAB_VALUES = ["screener", "floor-scanner", "compare", "watchlist"] as const;
type MarketTab = (typeof TAB_VALUES)[number];

function parseTab(value: string | null): MarketTab {
  if (value && TAB_VALUES.includes(value as MarketTab)) return value as MarketTab;
  return "screener";
}

export default function MarketsPage() {
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  const setActiveTab = (tab: string) => {
    const nextTab = parseTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "screener") nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    const query = nextParams.toString();
    navigate({ pathname: "/market", search: query ? `?${query}` : "" }, { replace: true });
  };

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_48%_42%_at_85%_18%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_42%_38%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={copy.pages.marketEyebrow}
          title={copy.pages.marketTitle}
          description={copy.pages.marketDescription}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card/50 p-1">
            <TabsTrigger value="screener" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.screener}
            </TabsTrigger>
            <TabsTrigger value="floor-scanner" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.floorScanner}
            </TabsTrigger>
            <TabsTrigger value="compare" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.compare}
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.watchlist}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screener" className="mt-4">
            <MarketScreener onSelect={setOpenMarket} />
          </TabsContent>
          <TabsContent value="floor-scanner" className="mt-4">
            <FloorScannerPage />
          </TabsContent>
          <TabsContent value="compare" className="mt-4">
            <ComparePage />
          </TabsContent>
          <TabsContent value="watchlist" className="mt-4">
            <WatchlistPage />
          </TabsContent>
        </Tabs>
        <MarketDetailDrawer
          market={openMarket}
          open={openMarket !== null}
          onOpenChange={(next) => {
            if (!next) setOpenMarket(null);
          }}
        />
      </div>
    </div>
  );
}
