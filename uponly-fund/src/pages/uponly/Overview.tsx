import { useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { UpOnlyJsonLd } from "@/components/uponly/UpOnlyJsonLd";
import { HeroSection } from "@/components/uponly/HeroSection";
import { WhyUpOnly } from "@/components/uponly/WhyUpOnly";
import { FloorMechanismSection } from "@/components/uponly/FloorMechanismSection";
import { ElasticSupplySection } from "@/components/uponly/ElasticSupplySection";
import { BorrowsAndLoopsSection } from "@/components/uponly/BorrowsAndLoopsSection";
import { CompetitiveMatrix } from "@/components/uponly/CompetitiveMatrix";
import { UseCaseCards } from "@/components/uponly/UseCaseCards";
import { MilestoneRoadmap } from "@/components/uponly/MilestoneRoadmap";
import { TokenDetailsSection } from "@/components/uponly/TokenDetailsSection";
import { FaqSection } from "@/components/uponly/FaqSection";
import { FinalCta } from "@/components/uponly/FinalCta";
import { StickyBuyBar } from "@/components/uponly/StickyBuyBar";
import { RiseUpOnlyMarketProvider } from "@/lib/RiseUpOnlyMarketContext";
import { motion, useScroll, useSpring } from "framer-motion";

const PAGE_TITLE = "Up Only ($UPONLY) | Syra × RISE — Road to $100M" as const;
const PAGE_DESC =
  "The Syra × RISE $UPONLY tranche: protocol floor, elastic supply, 0% borrow interest per RISE design, and a public milestone toward $100M market cap. DYOR — not financial advice." as const;

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

export default function UpOnly() {
  const reduceMotion = useReducedMotion() ?? false;
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/uponly/overview",
  });

  return (
    <RiseUpOnlyMarketProvider>
    <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
      <UpOnlyJsonLd />
      <ReadingProgress />
      <Navbar />
      <main
        className="relative z-10 w-full min-w-0 scroll-mt-16 pt-[max(4.5rem,env(safe-area-inset-top,0px)+3.5rem)] pb-24 sm:pt-24 sm:pb-28 max-sm:pb-[max(6.5rem,calc(4.5rem+env(safe-area-inset-bottom,0px)))] min-[1024px]:pt-28 min-[1024px]:pb-32"
        id="uponly-main"
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
          <WhyUpOnly />
          <FloorMechanismSection />
          <ElasticSupplySection />
          <BorrowsAndLoopsSection />
          <CompetitiveMatrix />
          <UseCaseCards />
          <MilestoneRoadmap />
          <TokenDetailsSection reduceMotion={reduceMotion} />
          <FaqSection />
          <FinalCta />
        </div>
      </main>
      <Footer />
      <StickyBuyBar />
    </div>
    </RiseUpOnlyMarketProvider>
  );
}
