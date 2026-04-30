import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HeroSection } from "@/components/landing/HeroSection";
import { HomeStatsStrip } from "@/components/landing/HomeStatsStrip";
import { BackedBySyraSection } from "@/components/landing/BackedBySyraSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { WhatIsUof } from "@/components/landing/WhatIsUof";
import { RiskDisclosure } from "@/components/landing/RiskDisclosure";
import { FinalCta } from "@/components/landing/FinalCta";
import { TokenSection } from "@/components/landing/TokenSection";
import { LandingBackdropArt } from "@/components/landing/LandingBackdropArt";
import { LandingBand, LandingRule } from "@/components/landing/LandingLayout";
import { WhyUpOnly } from "@/components/uponly/WhyUpOnly";
import { MandateSection } from "@/components/uponly/fund/MandateSection";
import { TreasurySourceSection } from "@/components/uponly/fund/TreasurySourceSection";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const PAGE_TITLE =
  "Up Only Fund | Venture & strategic capital for the RISE ecosystem" as const;
const PAGE_DESC =
  "Up Only Fund deploys capital and strategy alongside high-conviction teams on RISE—venture-style growth allocation with published mandate and live market tools. DYOR — not financial advice." as const;

const Index = () => {
  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: "/",
  });

  return (
    <div className="relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-background">
      <div
        className="uof-grain pointer-events-none fixed inset-0 z-[1] opacity-[0.35] dark:opacity-[0.18]"
        aria-hidden
      />
      <LandingBackdropArt className="fixed inset-0 z-[3]" />
      <Navbar />
      <main
        className="relative z-10 w-full min-w-0 scroll-mt-16 pb-16 md:pb-24"
        id="uof-landing-main"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 uof-hero-mesh opacity-[0.52]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/48 to-muted/[0.1] dark:via-background/38" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_-15%,hsl(var(--foreground)/0.045),transparent_58%)]"
            aria-hidden
          />
          <div
            className="absolute -left-[20%] top-0 h-[min(90vh,48rem)] w-[min(95vw,52rem)] rounded-full opacity-[0.38] blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--uof) / 0.14), transparent 68%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 h-[26rem] w-[26rem] translate-x-1/4 opacity-[0.18] blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--ring) / 0.16), transparent 72%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern-accent opacity-[0.07] dark:opacity-[0.11]" />
        </div>

        {/* Hero — pt clears fixed navbar (safe area + nav mt + bar height + buffer) */}
        <section
          id="uof-landing-hero-zone"
          className="relative scroll-mt-[7.5rem] border-b border-border/30 sm:scroll-mt-[8rem] lg:scroll-mt-[8.5rem]"
        >
          <div
            className={cn(
              siteShell,
              "min-h-[min(88vh,50rem)] pb-16 pt-[max(7rem,calc(env(safe-area-inset-top,0px)+5.75rem))] sm:pb-20 sm:pt-[max(7.5rem,calc(env(safe-area-inset-top,0px)+6.25rem))] md:min-h-0 md:pb-24 lg:pb-28 lg:pt-[max(8rem,calc(env(safe-area-inset-top,0px)+6.75rem))]",
            )}
          >
            <HeroSection />
          </div>
        </section>

        <LandingBand
          variant="muted"
          scrollReveal={false}
          contentClassName="!py-12 md:!py-16 lg:!py-20"
        >
          <HomeStatsStrip />
        </LandingBand>

        <LandingBand variant="transparent">
          <BackedBySyraSection className="mb-0 sm:mb-0" />
          <LandingRule />
          <MissionSection className="mb-0 sm:mb-0" />
        </LandingBand>

        <LandingBand variant="surface">
          <WhatIsUof className="mb-0 sm:mb-0" />
        </LandingBand>

        <LandingBand variant="transparent">
          <TokenSection className="mb-0 sm:mb-0" />
        </LandingBand>

        <LandingBand variant="muted">
          <WhyUpOnly className="mb-0 sm:mb-0" />
        </LandingBand>

        <LandingBand variant="deep">
          <MandateSection className="mb-0 sm:mb-0" />
          <LandingRule />
          <TreasurySourceSection className="mb-0 sm:mb-0" />
        </LandingBand>

        <LandingBand variant="transparent" contentClassName="!py-12 md:!py-16">
          <RiskDisclosure className="mb-0" />
        </LandingBand>

        <LandingBand variant="cta" contentClassName="!pb-20 md:!pb-28">
          <FinalCta className="mb-0 sm:mb-0" />
        </LandingBand>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;
