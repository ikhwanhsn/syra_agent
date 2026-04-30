import { useReducedMotion, motion } from "framer-motion";
import { Target, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";

const fade = (reduce: boolean) => ({
  initial: reduce ? false : { opacity: 0, y: 14 },
  whileInView: reduce ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-20%" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

type MissionSectionProps = {
  className?: string;
};

export function MissionSection({ className }: MissionSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <section
      className={cn("scroll-mt-24 mb-20 sm:mb-28", className)}
      aria-labelledby="uof-mission"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-uof">Mission</p>
      <h2
        id="uof-mission"
        className="landing-section-title mt-3 max-w-4xl text-foreground"
      >
        Back RISE-native winners with{" "}
        <span className="text-foreground/78">capital and strategy at institutional rigor.</span>
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
        <motion.div
          {...fade(reduceMotion)}
          className="landing-mission-card relative overflow-hidden rounded-xl border border-border/55 bg-card/40 p-7 sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.2),transparent)]"
            aria-hidden
          />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/60">
              <Target className="h-4 w-4 text-uof" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                North star
              </h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Identify teams with structural edges on RISE—then fund distribution, liquidity, and integrations so they
                scale like venture-backed companies, not one-off launches.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          {...fade(reduceMotion)}
          className="landing-mission-card relative overflow-hidden rounded-xl border border-border/55 bg-card/40 p-7 sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,hsl(var(--ring)/0.18),transparent)]"
            aria-hidden
          />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/60">
              <Telescope className="h-4 w-4 text-foreground/80" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                How we work
              </h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Publish mandate and treasury intent like a GP memo; separate the liquid <span className="font-mono text-foreground/85">$UPONLY</span>{" "}
                sleeve from program wallets; route execution through venues you can verify on-chain. Syra ships infra—Up
                Only Fund owns allocator narrative and disclosures here.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
