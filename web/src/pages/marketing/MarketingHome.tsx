import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { WhatIsSyra } from "@/components/marketing/WhatIsSyra";
import { ProductModules } from "@/components/marketing/ProductModules";
import { ApiX402Section } from "@/components/marketing/ApiX402Section";
import { LiveDashboard } from "@/components/marketing/LiveDashboard";
import { WhySyra } from "@/components/marketing/WhySyra";
import { TokenSection } from "@/components/marketing/TokenSection";
import { StakingSection } from "@/components/marketing/StakingSection";
import { Roadmap } from "@/components/marketing/Roadmap";
import { PartnersAndIntegrations } from "@/components/marketing/PartnersAndIntegrations";
import { Testimonials } from "@/components/marketing/Testimonials";
import { ArticlesSection } from "@/components/marketing/ArticlesSection";
import { FAQ } from "@/components/marketing/FAQ";
import { Footer } from "@/components/marketing/Footer";

const MarketingHome = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <PartnersAndIntegrations />
        <WhatIsSyra />
        <ProductModules />
        <ApiX402Section />
        <LiveDashboard />
        <WhySyra />
        <TokenSection />
        <StakingSection />
        <Roadmap />
        <Testimonials />
        <ArticlesSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default MarketingHome;
