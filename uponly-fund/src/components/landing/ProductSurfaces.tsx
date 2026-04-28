import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, Building2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const items = [
  {
    to: "/uponly/overview" as const,
    kicker: "Tranche",
    title: "$UPONLY",
    desc: "The liquid story: market context, tranche design, and the path to the public milestone.",
    icon: Sparkles,
  },
  {
    to: "/uponly/fund" as const,
    kicker: "Treasury",
    title: "Program & mandate",
    desc: "Sources, allocation mindset, and the disclosures you should read before drawing conclusions.",
    icon: Building2,
  },
  {
    to: "/uponly/rise" as const,
    kicker: "Liquidity",
    title: "RISE markets",
    desc: "Screener, structures, and read-only simulators—signed execution stays on-venue.",
    icon: BarChart3,
  },
] as const;

const fade = (reduce: boolean) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  whileInView: reduce ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
});

type ProductSurfacesProps = {
  className?: string;
};

export function ProductSurfaces({ className }: ProductSurfacesProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <section className={cn("mb-20 sm:mb-24", className)} aria-labelledby="product-surfaces-heading">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Surfaces
      </p>
      <h2
        id="product-surfaces-heading"
        className="mt-2 max-w-2xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Three entry points
      </h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
        Pick the surface that matches your job: token narrative, program treasury, or live market data.
      </p>
      <ul className="mt-10 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-3 lg:gap-5">
        {items.map((item) => (
          <motion.li key={item.to} {...fade(reduceMotion)} className="h-full min-h-0">
            <Link to={item.to} className="group block h-full min-h-0">
              <Card className="relative h-full min-h-[13.5rem] overflow-hidden border-border/45 bg-gradient-to-b from-card/55 to-card/15 p-6 transition duration-500 hover:border-uof/20 sm:min-h-[15rem] sm:p-7">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background: "radial-gradient(closest-side, hsl(var(--uof) / 0.12), transparent 70%)",
                  }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
                      {item.kicker}
                    </p>
                    <h3 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {item.title}
                    </h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 transition group-hover:border-uof/20">
                    <item.icon className="h-5 w-5 text-foreground/85" aria-hidden />
                  </span>
                </div>
                <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5">
                  {item.desc}
                </p>
                <p className="relative mt-5 flex items-center gap-1.5 text-xs font-medium text-uof">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </p>
              </Card>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
