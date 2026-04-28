import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HeroSection } from "@/components/landing/HeroSection";
import { HomeStatsStrip } from "@/components/landing/HomeStatsStrip";
import { BackedBySyraSection } from "@/components/landing/BackedBySyraSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { WhatIsUof } from "@/components/landing/WhatIsUof";
import { ProductSurfaces } from "@/components/landing/ProductSurfaces";
import { InfrastructurePartner } from "@/components/landing/InfrastructurePartner";
import { RiskDisclosure } from "@/components/landing/RiskDisclosure";
import { FinalCta } from "@/components/landing/FinalCta";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const PAGE_TITLE = "Up Only Fund | Tech utility program for the RISE stack" as const;
const PAGE_DESC =
  "Up Only Fund: a mandate-led program for funding tech utility across the RISE ecosystem—infrastructure support from Syra, execution on-venue, published disclosures. DYOR — not financial advice." as const;

const Index = () => {
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/",
  });

  return (
    <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
      <div className="uof-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.4] dark:opacity-25" aria-hidden />
      <Navbar />
      <main
        className="relative z-10 w-full min-w-0 scroll-mt-16 pt-[max(4.5rem,env(safe-area-inset-top,0px)+3.5rem)] pb-12 min-[400px]:pb-14 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20"
        id="uof-landing-main"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 uof-hero-mesh opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-card/30" />
          <div
            className="absolute -left-1/4 top-0 h-[min(100vh,52rem)] w-[min(100vw,56rem)] rounded-full opacity-40 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, hsl(var(--uof) / 0.14), transparent 65%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(closest-side, hsl(var(--ring) / 0.15), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern opacity-[0.12] dark:opacity-[0.18]" />
        </div>
        <div className={cn("relative", siteShell)}>
          <HeroSection />
          <HomeStatsStrip />
          <BackedBySyraSection />
          <MissionSection />
          <WhatIsUof />
          <ProductSurfaces />
          <InfrastructurePartner />
          <RiskDisclosure />
          <FinalCta />
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;
