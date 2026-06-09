import { useReducedMotion, motion } from "framer-motion";
import { FUND_THESIS } from "@/data/fundThesis";
import { cn } from "@/lib/utils";
import { LandingSectionHeader } from "./LandingSectionHeader";
import { LANDING_EASE } from "./landingMotion";

type ThesisAllocationSectionProps = {
  className?: string;
};

export function ThesisAllocationSection({ className }: ThesisAllocationSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="thesis"
      className={cn("scroll-mt-24", className)}
      aria-labelledby="uof-thesis-heading"
    >
      <LandingSectionHeader
        eyebrow="Allocation thesis"
        title={FUND_THESIS.headline}
        description={FUND_THESIS.summary}
        id="uof-thesis-heading"
      />

      <div className="landing-institutional-panel mt-12 overflow-hidden">
        <div className="flex h-3">
          <motion.div
            className="h-full bg-uof"
            initial={reduceMotion ? false : { width: 0 }}
            whileInView={reduceMotion ? undefined : { width: "80%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: LANDING_EASE }}
            aria-hidden
          />
          <motion.div
            className="h-full bg-foreground/20"
            initial={reduceMotion ? false : { width: 0 }}
            whileInView={reduceMotion ? undefined : { width: "20%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.15, ease: LANDING_EASE }}
            aria-hidden
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2">
          {FUND_THESIS.sleeves.map((sleeve, i) => (
            <motion.article
              key={sleeve.id}
              className={cn(
                "min-w-0 px-5 py-8 min-[400px]:px-7 min-[400px]:py-9 sm:px-10 sm:py-11",
                i > 0 && "border-t border-border/45 lg:border-l lg:border-t-0",
              )}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: LANDING_EASE }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="landing-eyebrow">{sleeve.label}</p>
                <span className="landing-stat-numeral text-uof">{sleeve.weightPct}%</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-[-0.02em] text-foreground sm:text-2xl">
                {sleeve.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                {sleeve.description}
              </p>
              <ul className="mt-6 space-y-3 border-t border-border/40 pt-6">
                {sleeve.criteria.map((criterion) => (
                  <li
                    key={criterion}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span
                      className="mt-2 h-px w-3 shrink-0 bg-foreground/30"
                      aria-hidden
                    />
                    {criterion}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
