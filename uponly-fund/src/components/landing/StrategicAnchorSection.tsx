import { cn } from "@/lib/utils";

type StrategicAnchorSectionProps = {
  className?: string;
};

export function StrategicAnchorSection({ className }: StrategicAnchorSectionProps) {
  return (
    <section
      className={cn("w-full min-w-0 scroll-mt-24", className)}
      aria-labelledby="uof-backed-heading"
    >
      <blockquote className="landing-institutional-panel relative px-8 py-12 sm:px-12 sm:py-14 md:px-16 md:py-16">
        <p className="landing-eyebrow">Strategic anchor</p>
        <h2
          id="uof-backed-heading"
          className="mt-6 max-w-4xl font-display text-[1.75rem] font-medium leading-[1.14] tracking-[-0.035em] text-foreground sm:text-[2.125rem] md:text-[2.375rem]"
        >
          <span className="uof-wordmark">Up Only Fund</span> deploys onchain capital for high conviction bets—with a
          published 80/20 thesis and selective project disclosures.
        </h2>
        <p className="mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Mandate, portfolio disclosures, and the liquid{" "}
          <span className="font-mono text-foreground/88">$UPONLY</span> sleeve are published here; execution routes
          through Solana venues you can verify on-chain.
        </p>
      </blockquote>
    </section>
  );
}
