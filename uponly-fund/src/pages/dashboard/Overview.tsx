import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { RiseHero } from "@/components/rise/RiseHero";
import { TopMoversRails } from "@/components/rise/TopMoversRails";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { GlassCard } from "@/components/rise/RiseShared";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

const quickLinks = [
  { to: "/dashboard/markets", label: "Screener" },
  { to: "/dashboard/watchlist", label: "Watchlist" },
  { to: "/dashboard/compare", label: "Compare" },
  { to: "/dashboard/signals", label: "Signals" },
  { to: "/dashboard/news", label: "News" },
  { to: "/dashboard/wallet", label: "Wallet" },
];

export default function DashboardOverview() {
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title="Market overview"
        description="Live RISE market intelligence."
        eyebrow="Live"
      />
      <RiseHero onSelect={setOpenMarket} />
      <TopMoversRails onSelect={setOpenMarket} />
      <section>
        <DashboardPageHeader
          title="Workspace"
          description="Core tools"
          eyebrow="Actions"
          className="mb-3"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <GlassCard key={item.to} className="p-0">
              <Link
                to={item.to}
                className="group block rounded-2xl p-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </GlassCard>
          ))}
        </div>
      </section>
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
