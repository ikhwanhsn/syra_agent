import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhoWeHelp from "@/components/WhoWeHelp";
import MissionSection from "@/components/MissionSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorks from "@/components/HowItWorks";
import WhyUsSection from "@/components/WhyUsSection";
import CTASection from "@/components/CTASection";
import ApplicationModal from "@/components/ApplicationModal";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import EventsSection from "@/components/EventsSection";
import FounderTestimonials from "@/components/FounderTestimonials";
import TeamSection from "@/components/TeamSection";
import LimitedSpotsSection from "@/components/LimitedSpotsSection";
import ComparisonSection from "@/components/ComparisonSectionProps";
import ScrollToTop from "@/components/ScrollToTop";
import CommunitySection from "@/components/CommunitySection";
import TelegramCommunityModal from "@/components/TelegramCommunityModal";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { useTelegramPopup } from "@/hooks/useTelegramPopup";

const LandingContent = () => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { open: telegramOpen, dismiss: dismissTelegram, setOpen: setTelegramOpen } = useTelegramPopup();
  const location = useLocation();

  const handleApplyClick = () => {
    setIsModalOpen(true);
  };

  // When navigating to /#events (e.g. back from events page), scroll to events section
  useEffect(() => {
    if (location.hash !== "#events") return;
    const timeoutId = setTimeout(() => {
      document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.hash]);

  return (
    <div className={`relative min-h-screen ${theme === "light" ? "landing-light-bg" : "bg-background"}`}>
      <MeteorEffect />
      <MouseEffects />
      <div className="relative z-10 pb-4">
        <Header onApplyClick={handleApplyClick} />
      <main>
        <HeroSection onApplyClick={handleApplyClick} />
        <WhoWeHelp />
        <MissionSection />
        <BenefitsSection />
        <ComparisonSection onApplyClick={handleApplyClick} />
        <HowItWorks />
        <ProjectsShowcase onApplyClick={handleApplyClick} />
        <EventsSection />
        <CommunitySection />
        <FounderTestimonials />
        <TeamSection />
        <WhyUsSection />
        {/* <LimitedSpotsSection onApplyClick={handleApplyClick} /> */}
        <CTASection onApplyClick={handleApplyClick} />
        <FAQSection />
      </main>
      <Footer />
      <ScrollToTop />
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <TelegramCommunityModal
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        onDismiss={dismissTelegram}
      />
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LandingContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default Index;
