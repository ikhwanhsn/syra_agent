import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const VisionSection = () => (
  <section className="section-shell relative overflow-hidden" id="vision">
    <div className="section-divider" />
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" aria-hidden />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,640px)] h-[min(92vw,640px)] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
      aria-hidden
    />

    <div className={cn(siteShell, "relative z-10")}>
      <FadeIn>
        <div className="panel-glass max-w-3xl mx-auto px-6 sm:px-10 py-12 sm:py-16 text-center">
          <p className="eyebrow mb-5">Vision</p>
          <h2 className="heading-section text-foreground mb-6">
            Building the Future of
            <span className="text-gradient block mt-1">Web3 with AI</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We believe the next generation of the internet will be powered by AI
            agents, decentralized technologies, and global communities.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-4">
            S3Labs exists to make that future accessible to everyone.
          </p>
        </div>
      </FadeIn>
    </div>
  </section>
);

export default VisionSection;
