import { useState } from "react";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { MarketScreener } from "@/components/rise/MarketScreener";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function MarketsPage() {
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);
  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_48%_42%_at_85%_18%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_42%_38%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow="Market intelligence"
          title="Market screener"
          description="Full-depth view of every listed RISE market—filter server-side, refine locally, and open any row for charting and flow context."
        />
        <MarketScreener onSelect={setOpenMarket} />
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
