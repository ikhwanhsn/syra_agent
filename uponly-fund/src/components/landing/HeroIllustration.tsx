import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LANDING_EASE } from "./landingMotion";

const HERO_COIN = "/images/experiment/rise_uponly.png" as const;

const TREND_PATH =
  "M 32 200 C 80 168 120 176 160 128 C 200 88 248 96 288 56 C 312 36 336 28 360 20" as const;

type HeroIllustrationProps = {
  className?: string;
};

/**
 * Hero visual — single framed panel with clipped chart backdrop and centered coin.
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        "landing-hero-visual-ring relative mx-auto w-full",
        className,
      )}
      aria-hidden
    >
      <motion.div
        className="landing-institutional-panel relative overflow-hidden"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: LANDING_EASE }}
      >
        {/* Chart backdrop — clipped inside panel */}
        <div className="pointer-events-none absolute inset-0">
          <svg
            className="h-full w-full"
            viewBox="0 0 400 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <defs>
              <linearGradient id="uof-hero-trend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--uof))" stopOpacity="0.15" />
                <stop offset="55%" stopColor="hsl(var(--uof))" stopOpacity="0.45" />
                <stop offset="100%" stopColor="hsl(var(--uof))" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="uof-hero-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--uof))" stopOpacity="0.12" />
                <stop offset="100%" stopColor="hsl(var(--uof))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[72, 108, 144].map((y, i) => (
              <line
                key={y}
                x1="24"
                x2="376"
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeOpacity={0.35}
                strokeWidth="1"
                strokeDasharray={i === 1 ? "4 6" : undefined}
              />
            ))}

            <motion.path
              d={`${TREND_PATH} L 360 220 L 32 220 Z`}
              fill="url(#uof-hero-fill)"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: LANDING_EASE }}
            />
            <motion.path
              d={TREND_PATH}
              stroke="url(#uof-hero-trend)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: LANDING_EASE }}
            />

            {[
              { cx: 160, cy: 128 },
              { cx: 288, cy: 56 },
              { cx: 360, cy: 20 },
            ].map((dot, i) => (
              <motion.circle
                key={`${dot.cx}-${dot.cy}`}
                cx={dot.cx}
                cy={dot.cy}
                r="4"
                fill="hsl(var(--uof))"
                initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                animate={reduceMotion ? undefined : { opacity: 0.9, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.5 + i * 0.12, ease: LANDING_EASE }}
              />
            ))}
          </svg>

          <motion.div
            className="absolute left-1/2 top-[38%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.18),transparent_70%)] blur-md"
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }
            }
            transition={
              reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }
          />
        </div>

        {/* Coin + caption */}
        <div className="relative z-[1] flex flex-col items-center px-6 pb-6 pt-8 sm:px-8 sm:pb-7 sm:pt-10">
          <motion.div
            className="relative flex aspect-square w-[min(72%,11.5rem)] items-center justify-center sm:w-[min(68%,12.5rem)]"
            animate={
              reduceMotion
                ? undefined
                : { y: [0, -6, 0], rotate: [0, 0.6, 0, -0.4, 0] }
            }
            transition={
              reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <img
              src={HERO_COIN}
              alt=""
              width={200}
              height={200}
              className="h-auto w-full object-contain drop-shadow-[0_8px_32px_hsl(var(--uof)/0.35)]"
              decoding="async"
              fetchPriority="high"
            />
          </motion.div>

          <p className="mt-4 text-center font-mono text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90 sm:mt-5 sm:text-[0.62rem]">
            Onchain Capital · Solana
          </p>

          {/* 80/20 sleeve bar */}
          <div className="mt-5 w-full max-w-[14rem] sm:mt-6">
            <div className="flex items-center justify-between gap-2 text-[0.58rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span>80% Utility</span>
              <span>20% Asymmetric</span>
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-sm bg-muted/50">
              <div className="h-full w-[80%] bg-uof/85" />
              <div className="h-full w-[20%] bg-foreground/20" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
