import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HERO_COIN = "/images/experiment/rise_uponly.png" as const;

type HeroIllustrationProps = {
  className?: string;
};

/**
 * Hero art: brand coin + growth motif — balances copy on large screens, stacks on small.
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[min(20rem,88vw)] items-center justify-center lg:mx-0 lg:max-w-none",
        "min-h-[14rem] sm:min-h-[16rem] lg:min-h-[20rem] lg:w-full",
        className,
      )}
      aria-hidden
    >
      {/* Back glow */}
      <div
        className="absolute left-1/2 top-1/2 h-[min(100%,20rem)] w-[min(100%,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.22),transparent_72%)] blur-[2px] sm:h-80 sm:w-80"
        style={{ minHeight: "12rem", minWidth: "12rem" }}
      />
      <div
        className="absolute -right-2 bottom-2 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.08),transparent_70%)] blur-xl sm:bottom-4 sm:right-0"
        style={{ zIndex: 0 }}
      />

      {/* Chart + trend SVG (decorative) */}
      <svg
        className="absolute inset-0 h-full w-full sm:scale-105"
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 24 248 L 72 200 L 118 220 L 168 132 L 228 88 L 288 104 L 348 32"
          stroke="hsl(var(--uof) / 0.35)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 24 248 L 72 200 L 118 220 L 168 132 L 228 88 L 288 104 L 348 32 L 352 32"
          stroke="hsl(var(--uof) / 0.65)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g opacity="0.85">
          <rect x="100" y="256" width="20" height="32" rx="2" fill="hsl(var(--uof) / 0.25)" />
          <rect x="132" y="240" width="20" height="48" rx="2" fill="hsl(var(--uof) / 0.35)" />
          <rect x="164" y="224" width="20" height="64" rx="2" fill="hsl(var(--uof) / 0.45)" />
          <rect x="196" y="208" width="20" height="80" rx="2" fill="hsl(var(--uof) / 0.5)" />
        </g>
      </svg>

      {/* Framed card behind coin */}
      <div
        className="relative z-[1] w-[min(16rem,72vw)] rounded-[2.25rem] border border-border/40 bg-gradient-to-br from-card/50 via-card/20 to-transparent p-1 shadow-[0_24px_64px_-24px_hsl(0_0%_0%_/_0.5)] backdrop-blur-[2px] sm:w-[17.5rem]"
        style={{ marginTop: "-0.5rem" }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-border/20 bg-gradient-to-b from-background/30 to-background/5 p-4 sm:p-5">
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-25" />
          <motion.div
            className="relative z-[1] flex aspect-square w-full max-w-[13rem] items-center justify-center sm:max-w-56"
            initial={false}
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 5.5, repeat: Infinity, ease: "easeInOut" as const }
            }
          >
            <div className="absolute -inset-2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.2),transparent_70%)] blur-md" />
            <img
              src={HERO_COIN}
              alt=""
              width={224}
              height={224}
              className="relative h-auto w-full max-w-full object-contain drop-shadow-[0_0_32px_hsl(var(--uof)/0.35)]"
              decoding="async"
              fetchPriority="high"
            />
          </motion.div>
          <p className="relative z-[1] mt-1 text-center font-mono text-[0.55rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/80 sm:mt-2 sm:text-[0.6rem]">
            Mandate · disclosure · RISE
          </p>
        </div>
      </div>
    </div>
  );
}
