import { motion, useScroll, useSpring } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { UpOnlyFundJsonLd } from "@/components/uponly/fund/UpOnlyFundJsonLd";
import { HeroSection } from "@/components/uponly/fund/HeroSection";
import { StatsStrip } from "@/components/uponly/fund/StatsStrip";
import { MandateSection } from "@/components/uponly/fund/MandateSection";
import { TreasurySourceSection } from "@/components/uponly/fund/TreasurySourceSection";
import { StrategySection } from "@/components/uponly/fund/StrategySection";
import { HoldingsSection } from "@/components/uponly/fund/HoldingsSection";
import { UtilityRoadmap } from "@/components/uponly/fund/UtilityRoadmap";
import { RiskDisclosuresSection } from "@/components/uponly/fund/RiskDisclosuresSection";
import { FaqSection } from "@/components/uponly/fund/FaqSection";
import { FinalCta } from "@/components/uponly/fund/FinalCta";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

const PAGE_TITLE = "Up Only Fund (UOF) | Syra-backed RISE ecosystem treasury" as const;
const PAGE_DESC =
  "A Syra-seeded treasury to allocate across the RISE ecosystem, with a published mandate and (when live) on-chain transparency. DYOR — not financial advice." as const;

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

export default function UpOnlyFund() {
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/uponly/fund",
  });

  return (
    <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
      <UpOnlyFundJsonLd />
      <ReadingProgress />
      <Navbar />
      <main
        className="relative z-10 w-full min-w-0 scroll-mt-16 pt-[max(4.5rem,env(safe-area-inset-top,0px)+3.5rem)] pb-24 sm:pt-24 sm:pb-28 max-sm:pb-[max(4.5rem,calc(3.5rem+env(safe-area-inset-bottom,0px)))] min-[1024px]:pt-28 min-[1024px]:pb-32"
        id="uof-main"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-success/[0.07] via-background to-background dark:from-success/[0.04]" />
          <div
            className="absolute -top-24 left-1/2 h-[32rem] w-[min(92vw,44rem)] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, hsl(var(--ring) / 0.16), transparent 70%)",
            }}
          />
          <div
            className="absolute right-0 top-48 h-72 w-72 opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, hsl(var(--success) / 0.12), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern opacity-[0.2]" />
        </div>
        <div className={cn("relative", siteShell)}>
          <HeroSection />
          <StatsStrip />
          <MandateSection />
          <TreasurySourceSection />
          <StrategySection />
          <HoldingsSection />
          <UtilityRoadmap />
          <RiskDisclosuresSection />
          <FaqSection />
          <FinalCta />
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
