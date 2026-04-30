import { useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { AlphaLeaderboard } from "@/components/terminal/AlphaLeaderboard";
import { NarrativeBuckets } from "@/components/terminal/NarrativeBuckets";
import { RiskWatchlist } from "@/components/terminal/RiskWatchlist";
import { TerminalKpiStrip } from "@/components/terminal/TerminalKpiStrip";
import { TerminalScreener } from "@/components/terminal/TerminalScreener";
import type { NarrativeTag } from "@/components/terminal/types";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export default function TerminalPage() {
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);
  const [narrativeFilter, setNarrativeFilter] = useState<NarrativeTag | null>(null);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  return (
    <div className="flex flex-col gap-4">
      <DashboardPageHeader
        eyebrow={copy.pages.terminalEyebrow}
        title={copy.pages.terminalTitle}
        description={copy.pages.terminalDescription}
      />
      <TerminalKpiStrip />
      <NarrativeBuckets selected={narrativeFilter} onSelect={setNarrativeFilter} />
      <TerminalScreener onSelect={setOpenMarket} narrativeFilter={narrativeFilter} hideInlineNarrativeFilters />
      <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
        <AlphaLeaderboard onSelect={setOpenMarket} />
        <RiskWatchlist onSelect={setOpenMarket} />
      </div>
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
