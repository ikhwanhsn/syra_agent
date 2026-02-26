import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { WhatIsSyra } from "@/components/WhatIsSyra";
import { ProductModules } from "@/components/ProductModules";
import { ApiX402Section } from "@/components/ApiX402Section";
import { LiveDashboard } from "@/components/LiveDashboard";
import { WhySyra } from "@/components/WhySyra";
import { TokenSection } from "@/components/TokenSection";
import { Roadmap } from "@/components/Roadmap";
import { PartnersAndIntegrations } from "@/components/PartnersAndIntegrations";
import { Testimonials } from "@/components/Testimonials";
import { ArticlesSection } from "@/components/ArticlesSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <WhatIsSyra />
        <ProductModules />
        <ApiX402Section />
        <LiveDashboard />
        <WhySyra />
        <TokenSection />
        <Roadmap />
        <PartnersAndIntegrations />
        <Testimonials />
        <ArticlesSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
