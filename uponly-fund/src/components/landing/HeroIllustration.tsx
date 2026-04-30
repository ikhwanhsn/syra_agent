import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LANDING_EASE } from "./landingMotion";

const HERO_COIN = "/images/experiment/rise_uponly.png" as const;

const CHART_PATH =
  "M 24 248 L 72 200 L 118 220 L 168 132 L 228 88 L 288 104 L 348 32" as const;

const BARS = [
  { x: 100, y: 256, w: 20, h: 32, fill: "0.25" },
  { x: 132, y: 240, w: 20, h: 48, fill: "0.35" },
  { x: 164, y: 224, w: 20, h: 64, fill: "0.45" },
  { x: 196, y: 208, w: 20, h: 80, fill: "0.5" },
] as const;

type HeroIllustrationProps = {
  className?: string;
};

/**
 * Hero art: coin + chart motif — path draw, bar stagger, ambient pulse (respects reduced motion).
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-full flex-col items-center justify-center",
        "min-h-[14rem] sm:min-h-[17rem] lg:min-h-[20rem]",
        className,
      )}
      aria-hidden
    >
      {/* Ambient glow — slow breathe */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,20rem)] w-[min(100%,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.22),transparent_72%)] blur-[2px] sm:h-80 sm:w-80"
        style={{ minHeight: "12rem", minWidth: "12rem" }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.55, 0.85, 0.55],
                scale: [1, 1.04, 1],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="pointer-events-none absolute -right-2 bottom-2 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.08),transparent_70%)] blur-xl sm:bottom-4 sm:right-0"
        style={{ zIndex: 0 }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 6, 0],
                y: [0, -4, 0],
                opacity: [0.6, 0.9, 0.6],
              }
        }
        transition={
          reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Chart — line draw + bars */}
      <svg
        className="absolute inset-0 h-full w-full sm:scale-105"
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d={CHART_PATH}
          stroke="hsl(var(--uof) / 0.35)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.15, ease: LANDING_EASE }}
        />
        <motion.path
          d={`${CHART_PATH} L 352 32`}
          stroke="hsl(var(--uof) / 0.65)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : 0.2, ease: LANDING_EASE }}
        />
        <g>
          {BARS.map((b, i) => (
            <motion.rect
              key={`${b.x}-${b.y}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="2"
              fill={`hsl(var(--uof) / ${b.fill})`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 0.85 }}
              transition={{
                delay: reduceMotion ? 0 : 0.65 + i * 0.09,
                duration: 0.45,
                ease: LANDING_EASE,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Framed card + coin */}
      <motion.div
        className="relative z-[1] mx-auto w-[min(16rem,85vw)] rounded-[2.25rem] border border-border/40 bg-gradient-to-br from-card/50 via-card/20 to-transparent p-1 shadow-[0_24px_64px_-24px_hsl(0_0%_0%_/_0.5)] backdrop-blur-[2px] sm:w-[17.5rem]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: LANDING_EASE }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-border/20 bg-gradient-to-b from-background/30 to-background/5 p-4 sm:p-5">
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-25" />
          <motion.div
            className="relative z-[1] flex aspect-square w-full max-w-[13rem] items-center justify-center sm:max-w-56"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -7, 0],
                    rotate: [0, 0.8, 0, -0.6, 0],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <motion.div
              className="absolute -inset-2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.2),transparent_70%)] blur-md"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.45, 0.75, 0.45],
                      scale: [1, 1.06, 1],
                    }
              }
              transition={
                reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
            />
            <motion.img
              src={HERO_COIN}
              alt=""
              width={224}
              height={224}
              className="relative h-auto w-full max-w-full object-contain drop-shadow-[0_0_32px_hsl(var(--uof)/0.35)]"
              decoding="async"
              fetchPriority="high"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      filter: [
                        "drop-shadow(0 0 28px hsl(var(--uof) / 0.32))",
                        "drop-shadow(0 0 40px hsl(var(--uof) / 0.45))",
                        "drop-shadow(0 0 28px hsl(var(--uof) / 0.32))",
                      ],
                    }
              }
              transition={
                reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </motion.div>
          <motion.p
            className="relative z-[1] mt-2 text-center font-mono text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/85 sm:mt-3 sm:text-[0.62rem]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.85, duration: 0.4 }}
          >
            Allocator mandate · disclosure · RISE
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
