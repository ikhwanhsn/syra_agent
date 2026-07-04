import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import SectionHeader from "@/components/landing/SectionHeader";
import { whyPoints } from "@/lib/landingContent";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const WhyS3Labs = () => (
  <section className="section-shell" id="why">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Why S3Labs"
        title={
          <>
            Why Choose
            <span className="text-gradient block mt-1">S3Labs?</span>
          </>
        }
        description="An AI-first ecosystem designed for everyone in Web3."
      />

      <Stagger className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {whyPoints.map((point) => (
          <StaggerItem key={point.title}>
            <article className="group card-premium-hover p-6 sm:p-7 flex gap-4 h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <point.icon className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);

export default WhyS3Labs;
