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
      className={cn("mb-20 sm:mb-28", className)}
      aria-labelledby="uof-mission"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-uof">Mission</p>
      <h2
        id="uof-mission"
        className="mt-2 max-w-3xl font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-3xl md:text-[2rem] lg:text-[2.25rem]"
      >
        Make tech-utility allocation in the RISE stack{" "}
        <span className="text-foreground/75">as legible and auditable as a top-tier product org.</span>
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
        <motion.div
          {...fade(reduceMotion)}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/20 p-6 sm:p-8"
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
                Fund the experiments and integrations that make RISE venues easier to use safely: open specs, real
                tooling, and a bias toward durable utility over short-term attention.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          {...fade(reduceMotion)}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/20 p-6 sm:p-8"
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
                Publish the mandate, separate the liquid tranche from the program, and route execution to the venues
                you already know. Syra is behind the curtain on APIs and the agent; Up Only Fund is the story on this
                site.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
