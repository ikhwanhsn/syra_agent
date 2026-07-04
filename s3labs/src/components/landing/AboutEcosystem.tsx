import { FadeIn } from "@/components/discovery/motion/FadeIn";
import EcosystemNetwork from "@/components/landing/EcosystemNetwork";
import SectionHeader from "@/components/landing/SectionHeader";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const AboutEcosystem = () => (
  <section className="section-shell bg-gradient-subtle" id="about-ecosystem">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
        <FadeIn>
          <SectionHeader
            align="left"
            eyebrow="What is S3Labs"
            title={
              <>
                The Home of
                <span className="text-gradient block mt-1">
                  Web3 Opportunities
                </span>
              </>
            }
            description="S3Labs brings together AI-powered products, opportunities, communities, and tools into one ecosystem—helping anyone in Web3 discover, build, and earn faster."
            className="mb-0"
          />
        </FadeIn>

        <FadeIn delay={0.15}>
          <EcosystemNetwork />
        </FadeIn>
      </div>
    </div>
  </section>
);

export default AboutEcosystem;
