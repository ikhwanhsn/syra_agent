import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SYRA_HOME = "https://www.syraa.fun/" as const;

type BackedBySyraSectionProps = {
  className?: string;
};

/**
 * High-visibility trust line: program is Syra-backed (distinct from infra partner section below).
 */
export function BackedBySyraSection({ className }: BackedBySyraSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <motion.section
      {...(reduceMotion
        ? {}
        : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mb-20 w-full min-w-0 sm:mb-24", className)}
      aria-labelledby="uof-backed-heading"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-uof/25 bg-gradient-to-br from-card/80 via-card/40 to-background/60 px-5 py-8 shadow-[0_0_0_1px_hsl(var(--uof)/0.08)_inset] sm:rounded-3xl sm:px-8 sm:py-10 md:px-10 md:py-12",
        )}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.22),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,hsl(var(--ring)/0.12),transparent_70%)]"
          aria-hidden
        />
        <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.22em] text-uof">Backed by</p>
        <h2
          id="uof-backed-heading"
          className="relative mt-3 max-w-4xl font-display text-2xl font-extrabold leading-[1.12] tracking-[-0.03em] text-foreground sm:mt-4 sm:text-3xl sm:leading-[1.1] md:text-4xl md:leading-[1.08]"
        >
          <span className="uof-wordmark">Up Only Fund</span> is backed by{" "}
          <a
            href={SYRA_HOME}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-uof/50 underline-offset-[0.2em] transition hover:decoration-uof"
          >
            Syra
          </a>
          .
        </h2>
        <p className="relative mt-4 max-w-2xl text-pretty text-sm font-medium leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
          Syra seeds the treasury and builds the intelligence rails; mandate, disclosures, and the liquid{" "}
          <span className="font-mono text-foreground/85">$UPONLY</span> program narrative stay on this site.
        </p>
      </div>
    </motion.section>
  );
}
