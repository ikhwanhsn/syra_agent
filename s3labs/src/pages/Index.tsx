import { SitePageShell } from "@/components/landing/SitePageShell";
import HeroSection from "@/components/HeroSection";
import LandingPillars from "@/components/landing/LandingPillars";
import PlatformShowcase from "@/components/landing/PlatformShowcase";
import PortfolioHighlight from "@/components/landing/PortfolioHighlight";
import FounderQuoteStrip from "@/components/landing/FounderQuoteStrip";
import CTASection from "@/components/CTASection";
import TelegramCommunityModal from "@/components/TelegramCommunityModal";
import { useTelegramPopup } from "@/hooks/useTelegramPopup";

function LandingContent() {
  const { open: telegramOpen, dismiss: dismissTelegram, setOpen: setTelegramOpen } = useTelegramPopup();

  return (
    <>
      <HeroSection />
      <LandingPillars />
      <PlatformShowcase />
      <PortfolioHighlight />
      <FounderQuoteStrip />
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
