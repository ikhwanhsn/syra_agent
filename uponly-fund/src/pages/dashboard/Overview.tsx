import { useState } from "react";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { TopMoversRails } from "@/components/rise/TopMoversRails";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { UponlySpotlight } from "@/components/rise/UponlySpotlight";
import { FundCommandHero } from "@/components/dashboard/FundCommandHero";
import { AllocationPanel } from "@/components/dashboard/AllocationPanel";
import { AgentActivityFeed } from "@/components/dashboard/AgentActivityFeed";
import { useLanguage } from "@/lib/LanguageContext";

export default function DashboardOverview() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <FundCommandHero />
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationPanel className="lg:col-span-2" onSelect={setOpenMarket} />
        <AgentActivityFeed />
      </div>
      <TopMoversRails
        onSelect={setOpenMarket}
        eyebrow={isZh ? "ALPHA 轨道" : "ALPHA RAILS"}
        title={isZh ? "今日 Alpha 候选" : "Today's alpha picks"}
        description={isZh ? "按 24h 信号评分对 RISE 全市场排序。" : "Ranked by 24h signal score across the RISE universe."}
      />
      <UponlySpotlight />
      <MarketDetailDrawer
        market={openMarket}
        open={openMarket !== null}
        onOpenChange={(next) => {
          if (!next) setOpenMarket(null);
        }}
      />
    </div>
  );
}
