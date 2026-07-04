import { SitePageShell } from "@/components/landing/SitePageShell";
import HeroSection from "@/components/HeroSection";
import EcosystemStats from "@/components/landing/EcosystemStats";
import AboutEcosystem from "@/components/landing/AboutEcosystem";
import EcosystemGrid from "@/components/landing/EcosystemGrid";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import WhyS3Labs from "@/components/landing/WhyS3Labs";
import VisionSection from "@/components/landing/VisionSection";
import CTASection from "@/components/CTASection";
import TelegramCommunityModal from "@/components/TelegramCommunityModal";
import { useTelegramPopup } from "@/hooks/useTelegramPopup";

function LandingContent() {
  const { open: telegramOpen, dismiss: dismissTelegram, setOpen: setTelegramOpen } =
    useTelegramPopup();

  return (
    <>
      <HeroSection />
      <EcosystemStats />
      <AboutEcosystem />
      <EcosystemGrid />
      <FeaturedProducts />
      <WhyS3Labs />
      <VisionSection />
      <CTASection />
      <TelegramCommunityModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        onDismiss={dismissTelegram}
      />
    </>
  );
}

const Index = () => (
  <SitePageShell>
    <LandingContent />
  </SitePageShell>
);

export default Index;
