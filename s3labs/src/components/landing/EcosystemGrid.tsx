import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import SectionHeader from "@/components/landing/SectionHeader";
import { ecosystemPillars } from "@/lib/landingContent";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const EcosystemGrid = () => (
  <section className="section-shell" id="ecosystem">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Ecosystem"
        title={
          <>
            Everything you need
            <span className="text-gradient block mt-1">in one place</span>
          </>
        }
        description="AI products, opportunities, agents, payments, community, and infrastructure—connected."
      />

      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {ecosystemPillars.map((pillar) => (
          <StaggerItem key={pillar.title}>
            <article className="group card-premium-hover p-6 sm:p-7 flex flex-col h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.2)] transition-all">
                <pillar.icon className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
                {pillar.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {pillar.description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

export default EcosystemGrid;
