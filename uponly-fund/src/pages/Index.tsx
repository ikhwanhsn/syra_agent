import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HeroSection } from "@/components/landing/HeroSection";
import { ThesisAllocationSection } from "@/components/landing/ThesisAllocationSection";
import { SolanaEcosystemStrip } from "@/components/landing/SolanaEcosystemStrip";
import { StrategicAnchorSection } from "@/components/landing/StrategicAnchorSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { WhatIsUof } from "@/components/landing/WhatIsUof";
import { RiskDisclosure } from "@/components/landing/RiskDisclosure";
import { FinalCta } from "@/components/landing/FinalCta";
import { TokenSection } from "@/components/landing/TokenSection";
import { LandingBand, LandingRule } from "@/components/landing/LandingLayout";
import { WhyUpOnly } from "@/components/uponly/WhyUpOnly";
import { MandateSection } from "@/components/uponly/fund/MandateSection";
import { TreasurySourceSection } from "@/components/uponly/fund/TreasurySourceSection";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const PAGE_TITLE =
  "Up Only Fund | Onchain Capital for High Conviction Bets" as const;
const PAGE_DESC =
  "Up Only Fund is onchain capital for high conviction bets on Solana—80% utility tokens with real traction, 20% clean onchain memecoins with verified liquidity. Published mandate and allocation thesis. DYOR — not financial advice." as const;

const Index = () => {
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/",
  });

  return (
    <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
      <div
        className="uof-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.15] dark:opacity-[0.08]"
        aria-hidden
      />
      <Navbar />
      <main
        className="relative z-10 w-full min-w-0 max-w-full scroll-mt-16 overflow-x-clip pb-16 max-sm:pb-[max(4rem,calc(3rem+env(safe-area-inset-bottom,0px)))] md:pb-24"
        id="uof-landing-main"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/[0.08]" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--foreground)/0.03),transparent_60%)]"
            aria-hidden
          />
        </div>

        <section
          id="uof-landing-hero-zone"
          className="relative scroll-mt-[5.5rem] border-b border-border/35"
        >
          <div
            className={cn(
              siteShell,
              "pb-16 pt-[max(5.5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] min-[400px]:pb-20 min-[400px]:pt-[max(6rem,calc(env(safe-area-inset-top,0px)+4.75rem))] sm:pb-24 sm:pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] lg:pb-28 lg:pt-[max(7rem,calc(env(safe-area-inset-top,0px)+5.75rem))]",
            )}
          >
            <HeroSection />
          </div>
        </section>

        <LandingBand variant="surface">
          <ThesisAllocationSection />
        </LandingBand>

        <LandingBand variant="muted" contentClassName="!py-12 md:!py-16">
          <SolanaEcosystemStrip />
        </LandingBand>

        <LandingBand variant="transparent">
          <StrategicAnchorSection className="mb-0" />
          <LandingRule />
          <MissionSection className="mb-0" />
        </LandingBand>

        <LandingBand variant="surface">
          <WhatIsUof className="mb-0" />
        </LandingBand>

        <LandingBand variant="transparent">
          <TokenSection className="mb-0" />
        </LandingBand>

        <LandingBand variant="muted">
          <WhyUpOnly className="mb-0" />
        </LandingBand>

        <LandingBand variant="deep">
          <MandateSection className="mb-0" />
          <LandingRule />
          <TreasurySourceSection className="mb-0" />
        </LandingBand>

        <LandingBand variant="transparent" contentClassName="!py-12 md:!py-16">
          <RiskDisclosure className="mb-0" />
        </LandingBand>

        <LandingBand variant="cta" contentClassName="!pb-20 md:!pb-28">
          <FinalCta className="mb-0" />
        </LandingBand>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;
