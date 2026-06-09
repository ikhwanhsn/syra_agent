import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { landingViewport, staggerContainerRaise, staggerItem } from "./landingMotion";

const stats = [
  {
    label: "Strategy",
    value: "80 / 20",
    hint: "Conviction utility · asymmetric memecoin",
  },
  {
    label: "Network",
    value: "Solana",
    hint: "Onchain-native allocation",
  },
  {
    label: "Disclosure",
    value: "Published",
    hint: "Mandate, thesis & sleeves",
  },
] as const;

type HomeStatsStripProps = {
  className?: string;
};

export function HomeStatsStrip({ className }: HomeStatsStripProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(
        "grid min-w-0 grid-cols-1 overflow-hidden rounded-md border border-border/50 bg-card/30 min-[480px]:grid-cols-3",
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
            "flex min-w-0 flex-col justify-center px-4 py-5 min-[480px]:px-5 min-[480px]:py-6 sm:px-6",
            i > 0 && "border-t border-border/45 min-[480px]:border-l min-[480px]:border-t-0",
          )}
        >
          <p className="landing-eyebrow">{s.label}</p>
          <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
            {s.value}
          </p>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{s.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
