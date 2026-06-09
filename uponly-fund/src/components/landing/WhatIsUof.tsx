import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingSectionHeader } from "./LandingSectionHeader";

const fade = (reduce: boolean) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  whileInView: reduce ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
});

const cards = [
  {
    title: "Fund identity",
    body: "Up Only Fund reads like an institutional allocator—mandate, diligence posture, treasury cadence—distinct from any single vendor so LPs and founders know exactly what sleeve they are interacting with.",
  },
  {
    title: "80/20 sleeve split",
    body: "80% high-conviction utility tokens and 20% asymmetric memecoin plays each carry distinct risk budgets. We surface the split clearly instead of blending allocations into one ambiguous ticker story.",
  },
  {
    title: "Risk-first disclosure",
    body: "Institutional legibility wins: what we fund, where leverage sits, and how outcomes might behave before anyone sizes exposure.",
  },
] as const;

type WhatIsUofProps = {
  className?: string;
};

export function WhatIsUof({ className }: WhatIsUofProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <section
      className={cn("scroll-mt-24", className)}
      aria-labelledby="what-is-uof-heading"
    >
      <LandingSectionHeader
        eyebrow="Principles"
        title="How the partnership behaves"
        description="We speak LP- and founder-clean: risk budgets, sleeves, and disclosures before hype—because allocator reputations are earned when markets stress-test them."
        id="what-is-uof-heading"
      />
      <div className="mt-12 grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-md border border-border/50 bg-border/40 min-[640px]:grid-cols-3">
        {cards.map((c) => (
          <motion.div key={c.title} {...fade(reduceMotion)}>
            <article className="h-full min-w-0 bg-card/45 px-5 py-8 min-[400px]:px-7 min-[400px]:py-9 sm:px-8 sm:py-10">
              <h3 className="font-display text-base font-medium text-foreground">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
