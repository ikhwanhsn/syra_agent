import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingSectionHeader } from "./LandingSectionHeader";

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
      className={cn("scroll-mt-24", className)}
      aria-labelledby="uof-mission"
    >
      <LandingSectionHeader
        eyebrow="Mission"
        title="Conviction-first allocation on Solana"
        id="uof-mission"
      />
      <div className="mt-12 grid min-w-0 gap-px overflow-hidden rounded-md border border-border/50 bg-border/40 md:grid-cols-2">
        <motion.div
          {...fade(reduceMotion)}
          className="min-w-0 bg-card/45 px-5 py-8 min-[400px]:px-8 min-[400px]:py-10 sm:px-10 sm:py-12"
        >
          <p className="landing-eyebrow">North star</p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            80% of capital backs utility tokens with working products, real onchain demand, and structural edges on
            Solana—projects we would hold with conviction, not chase for momentum.
          </p>
        </motion.div>
        <motion.div
          {...fade(reduceMotion)}
          className="min-w-0 bg-card/45 px-5 py-8 min-[400px]:px-8 min-[400px]:py-10 sm:px-10 sm:py-12"
        >
          <p className="landing-eyebrow">Asymmetric sleeve</p>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            20% targets clean onchain memecoins—verified liquidity, no-rug mechanics, and genuine momentum. Small
            sizing, high selectivity. The liquid{" "}
            <span className="font-mono text-foreground/85">$UPONLY</span> sleeve sits alongside, not inside, the
            allocation book.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
