import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { landingViewport, staggerContainerRaise, staggerItem } from "./landingMotion";

const stats = [
  {
    label: "Model",
    value: "Venture + strategic",
    hint: "Capital & operator leverage",
  },
  {
    label: "Universe",
    value: "RISE stack",
    hint: "Native liquidity venues",
  },
  {
    label: "Transparency",
    value: "GP-grade",
    hint: "Mandate & sleeves published",
  },
] as const;

type HomeStatsStripProps = {
  className?: string;
};

/** Institutional ticker — columns stagger in on scroll */
export function HomeStatsStrip({ className }: HomeStatsStripProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(
        "landing-stats-ticker grid grid-cols-1 overflow-hidden rounded-xl border border-border/45 bg-background/40 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] backdrop-blur-sm sm:grid-cols-3",
        className,
      )}
      variants={reduce ? undefined : staggerContainerRaise}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={landingViewport}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          variants={reduce ? undefined : staggerItem}
          className={cn(
            "relative flex flex-col justify-center px-6 py-8 sm:px-8 md:px-10 md:py-10",
            i > 0 &&
              "border-t border-border/45 sm:border-l sm:border-t-0 sm:border-border/45",
          )}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {s.label}
          </p>
          <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl md:text-[1.65rem]">
            {s.value}
          </p>
          <p className="mt-2 text-sm leading-snug text-muted-foreground/95">{s.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
