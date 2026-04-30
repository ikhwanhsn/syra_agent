import { useReducedMotion, motion } from "framer-motion";
import { Fingerprint, Layers, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fade = (reduce: boolean) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  whileInView: reduce ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
});

const cards = [
  {
    icon: Fingerprint,
    title: "Fund identity",
    body: "Up Only Fund reads like a venture practice—mandate, diligence posture, treasury cadence—distinct from any single vendor so LPs and founders know exactly what sleeve they are interacting with.",
  },
  {
    icon: Layers,
    title: "Separation of sleeves",
    body: "Portfolio allocations, operating treasury, and the liquid $UPONLY reference each serve different risk budgets. We surface them clearly instead of blending charts into one ambiguous ticker story.",
  },
  {
    icon: Scale,
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
      className={cn("scroll-mt-24 mb-20 sm:mb-24", className)}
      aria-labelledby="what-is-uof-heading"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
        Principles
      </p>
      <h2 id="what-is-uof-heading" className="landing-section-title mt-3 max-w-3xl text-foreground">
        How the partnership behaves
      </h2>
      <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-[1.0625rem] md:leading-relaxed">
        We speak LP- and founder-clean: risk budgets, sleeves, and disclosures before hype—because venture reputations
        are earned when markets stress-test them.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8">
        {cards.map((c) => (
          <motion.div key={c.title} {...fade(reduceMotion)}>
            <Card className="landing-principle-card h-full border-border/55 bg-card/45 p-7 shadow-none backdrop-blur-sm transition duration-300 hover:border-uof/35 sm:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/45 bg-background/50">
                <c.icon className="h-5 w-5 text-uof" aria-hidden />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
