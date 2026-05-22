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
          <span className="uof-wordmark">Up Only Fund</span> is the{" "}
          <span className="text-foreground/85">Smart Agent Fund on Solana</span>—a standalone allocator brand with a live,
          profitable book.
        </h2>
        <p className="mt-5 max-w-3xl text-pretty text-sm font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          Mandate, portfolio disclosures, and the liquid <span className="font-mono text-foreground/88">$UPONLY</span>{" "}
          sleeve are published here; execution routes through Solana venues you can verify on-chain. Treat dashboards and
          APIs as tooling, not a guarantee of third-party uptime—always confirm contracts and program status yourself.
        </p>
      </div>
    </section>
  );
}
