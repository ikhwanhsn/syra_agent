import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { WhatIsSyra } from "@/components/WhatIsSyra";
import { ProductModules } from "@/components/ProductModules";
import { ApiX402Section } from "@/components/ApiX402Section";
import { LiveDashboard } from "@/components/LiveDashboard";
import { WhySyra } from "@/components/WhySyra";
import { TokenSection } from "@/components/TokenSection";
import { Roadmap } from "@/components/Roadmap";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { VoteSupportModal } from "@/components/VoteSupportModal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <VoteSupportModal />
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
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
