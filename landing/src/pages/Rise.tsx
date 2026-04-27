/**
 * /rise — Rise ecosystem dashboard & screener.
 *
 * Composition order from top to bottom:
 *   RiseHero          → ecosystem KPIs + ticker tape
 *   UponlySpotlight   → featured UPONLY card with sparkline + CTA
 *   TopMoversRails    → 3 horizontal lanes (volume, gainers, newest)
 *   MarketScreener    → server-paginated screener table (opens drawer)
 *   WalletLookup      → wallet portfolio reader
 *   QuoteCalculator   → buy / sell quote simulator
 *   BorrowSimulator   → borrow capacity simulator
 *
 * No wallet adapter, no transaction signing. All "Trade" affordances deep-link
 * to rise.rich/trade/{mint}.
 */
import { useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { RiseDashboardProvider } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { RiseDashboardJsonLd } from "@/components/rise/RiseDashboardJsonLd";
import { RiseHero } from "@/components/rise/RiseHero";
import { UponlySpotlight } from "@/components/rise/UponlySpotlight";
import { TopMoversRails } from "@/components/rise/TopMoversRails";
import { MarketScreener } from "@/components/rise/MarketScreener";
import { MarketDetailDrawer } from "@/components/rise/MarketDetailDrawer";
import { WalletLookup } from "@/components/rise/WalletLookup";
import { QuoteCalculator } from "@/components/rise/QuoteCalculator";
import { BorrowSimulator } from "@/components/rise/BorrowSimulator";

const PAGE_TITLE = "Rise Ecosystem Dashboard | Syra" as const;
const PAGE_DESC =
  "Live screener for the RISE protocol — every token market, top movers, OHLC, on-chain trades, wallet lookups, and read-only quote / borrow simulators." as const;

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed right-0 left-0 z-[10001] h-0.5 w-full max-w-full origin-left bg-foreground/25 [top:env(safe-area-inset-top,0px)]"
      style={{ scaleX }}
      aria-hidden
    />
  );
}

function SkipLink() {
  return (
    <a
      href="#rise-main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10002] focus:rounded-md focus:border focus:border-border/60 focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:text-foreground focus:shadow"
    >
      Skip to dashboard
    </a>
  );
}

export default function Rise() {
  const reduceMotion = useReducedMotion() ?? false;
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/rise",
  });

  const [openMarket, setOpenMarket] = useState<RiseMarketRow | null>(null);

  return (
    <RiseDashboardProvider>
      <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
        <RiseDashboardJsonLd />
        <SkipLink />
        {!reduceMotion ? <ReadingProgress /> : null}
        <Navbar />
        <main
          className="relative z-10 w-full min-w-0 scroll-mt-20 pt-24 sm:pt-28 pb-24 sm:pb-28 max-sm:pb-[max(5.5rem,calc(4rem+env(safe-area-inset-bottom,0px)))]"
          id="rise-main"
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-success/[0.06] via-background to-background dark:from-success/[0.04]" />
            <div
              className="absolute -top-24 left-1/2 h-[32rem] w-[min(92vw,44rem)] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(closest-side, hsl(var(--ring) / 0.16), transparent 70%)" }}
            />
            <div
              className="absolute right-0 top-48 h-72 w-72 opacity-30 blur-3xl"
              style={{ background: "radial-gradient(closest-side, hsl(var(--success) / 0.12), transparent 70%)" }}
            />
            <div className="absolute inset-0 grid-pattern opacity-[0.18]" aria-hidden />
          </div>

          <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-10 px-3 max-[360px]:px-2.5 min-[500px]:px-5 sm:gap-12 sm:px-6 lg:px-8">
            <RiseHero />
            <UponlySpotlight />
            <TopMoversRails onSelect={setOpenMarket} />
            <MarketScreener onSelect={setOpenMarket} />
            <WalletLookup />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <QuoteCalculator />
              <BorrowSimulator />
            </div>
          </div>
        </main>
        <Footer />
        <MarketDetailDrawer
          market={openMarket}
          open={openMarket !== null}
          onOpenChange={(next) => {
            if (!next) setOpenMarket(null);
          }}
        />
      </div>
    </RiseDashboardProvider>
  );
}
