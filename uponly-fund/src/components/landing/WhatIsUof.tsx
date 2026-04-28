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
    title: "Identity",
    body: "Up Only Fund is its own program narrative—mandate, treasury, and published intent—so you can reason about the fund without conflating it with any single vendor brand.",
  },
  {
    icon: Layers,
    title: "Separation of surfaces",
    body: "The liquid tranche, the treasury program, and the RISE screener are three different jobs. We link them, but we do not smear them into one product shape.",
  },
  {
    icon: Scale,
    title: "Rules, not romance",
    body: "The goal is institutional legibility: what is funded, under what policy, and where risk is owned—before any marketing gloss.",
  },
] as const;

type WhatIsUofProps = {
  className?: string;
};

export function WhatIsUof({ className }: WhatIsUofProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <section
      className={cn("mb-20 sm:mb-24", className)}
      aria-labelledby="what-is-uof-heading"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Principles
      </p>
      <h2
        id="what-is-uof-heading"
        className="mt-2 max-w-2xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        How we think
      </h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        If this reads more like a product spec than a hype page, that is the point. We are optimizing for the kind of
        people who underwrite with checklists.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        {cards.map((c) => (
          <motion.div key={c.title} {...fade(reduceMotion)}>
            <Card className="h-full border-border/50 bg-gradient-to-b from-card/50 to-card/[0.2] p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:border-uof/25 sm:p-7">
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
