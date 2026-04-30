import { cn } from "@/lib/utils";

const SYRA_HOME = "https://www.syraa.fun/" as const;

type BackedBySyraSectionProps = {
  className?: string;
};

export function BackedBySyraSection({ className }: BackedBySyraSectionProps) {
  return (
    <section
      className={cn("w-full min-w-0 scroll-mt-24", className)}
      aria-labelledby="uof-backed-heading"
    >
      <div className="landing-anchor-card relative overflow-hidden rounded-2xl border border-border/50 bg-card/[0.35] px-6 py-10 shadow-sm sm:rounded-[1.25rem] sm:px-10 sm:py-12 md:px-12 md:py-14">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-uof via-uof/70 to-uof/30"
          aria-hidden
        />
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-uof">Strategic anchor</p>
        <h2
          id="uof-backed-heading"
          className="mt-4 max-w-4xl font-display text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-3xl md:text-[2.125rem] md:leading-[1.1]"
        >
          <span className="uof-wordmark">Up Only Fund</span> is anchored by{" "}
          <a
            href={SYRA_HOME}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-uof/45 underline-offset-[0.18em] transition hover:decoration-uof"
          >
            Syra
          </a>{" "}
          — the operating stack behind execution.
        </h2>
        <p className="mt-5 max-w-3xl text-pretty text-sm font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          Syra seeds treasury capacity and ships agent-grade rails; Up Only Fund publishes allocator mandate, diligence
          posture, and the liquid <span className="font-mono text-foreground/88">$UPONLY</span> sleeve so capital markets
          can price the same growth story founders see on the ground.
        </p>
      </div>
    </section>
  );
}
