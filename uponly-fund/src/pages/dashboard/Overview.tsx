import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { RiseHero } from "@/components/rise/RiseHero";
import { UponlySpotlight } from "@/components/rise/UponlySpotlight";
import { TopMoversRails } from "@/components/rise/TopMoversRails";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { GlassCard } from "@/components/rise/RiseShared";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

const quickLinks = [
  { to: "/dashboard/markets", label: "Market screener", desc: "Full sortable universe table" },
  { to: "/dashboard/watchlist", label: "Watchlist", desc: "Pin and track your markets" },
  { to: "/dashboard/compare", label: "Compare", desc: "Side-by-side market metrics" },
  { to: "/dashboard/signals", label: "Signals", desc: "Macro + technical context" },
  { to: "/dashboard/news", label: "News", desc: "Curated crypto headlines feed" },
  { to: "/dashboard/wallet", label: "Wallet lookup", desc: "Portfolio and position breakdown" },
];

export default function DashboardOverview() {
  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <DashboardPageHeader
        title="RISE command center"
        description="One workstation for discovery, analytics, and pre-trade planning across the RISE ecosystem."
      />
      <RiseHero />
      <UponlySpotlight />
      <TopMoversRails onSelect={setOpenMarket} />
      <section>
        <DashboardPageHeader
          title="Quick links"
          description="Jump directly into tooling pages built for daily RISE workflows."
          eyebrow="Navigation"
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
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
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
