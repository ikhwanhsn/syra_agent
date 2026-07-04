import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import SectionHeader from "@/components/landing/SectionHeader";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { ecosystemStats } from "@/lib/landingContent";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const EcosystemStats = () => (
  <section className="section-shell pt-0 sm:pt-0 lg:pt-8" aria-label="Ecosystem metrics">
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Ecosystem"
        title={
          <>
            Trusted by the
            <span className="text-gradient block mt-1">Web3 community</span>
          </>
        }
        description="Real activity across products, opportunities, and AI-powered experiences."
        className="mb-8 sm:mb-10 lg:mb-12"
      />

      <div className="panel-glass px-4 sm:px-8 py-8 sm:py-10 max-w-5xl mx-auto">
        <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
          {ecosystemStats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="text-center px-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gradient">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    format={stat.format ?? "plain"}
                  />
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  </section>
);

export default EcosystemStats;
