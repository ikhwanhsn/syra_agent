import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LANDING_EASE } from "./landingMotion";

/** Deterministic 0–1 from index (stable across SSR / hydration). */
function pr(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233 + 31.414) * 43758.5453123;
  return v - Math.floor(v);
}

type Candle = {
  cx: number;
  bullish: boolean;
  yOpen: number;
  yClose: number;
  yHigh: number;
  yLow: number;
  /** Final “send it” candles — extra tall + long upper wick */
  pump?: boolean;
};

const PUMP_TAIL = 4;

/**
 * Zigzag (bull + bear) with long-term uptrend; last {@link PUMP_TAIL} candles rip vertically (macro pump).
 * SVG y grows downward: smaller y = “higher” price.
 */
function buildVolatileUptrendCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let fairValue = 545;

  for (let i = 0; i < count; i++) {
    const cx = 32 + i * 49;
    const pump = i >= count - PUMP_TAIL;

    if (pump) {
      const rank = i - (count - PUMP_TAIL) + 1;
      const open = fairValue + (pr(i, 2) - 0.5) * 14;
      const bodyLift = 62 + rank * 22 + pr(i, 3) * 42;
      const close = open - bodyLift;
      const bodyTop = Math.min(open, close);
      const bodyBot = Math.max(open, close);
      const wickReach = 95 + rank * 28 + pr(i, 6) * 48;
      let yHigh = bodyTop - wickReach;
      if (yHigh < 28) yHigh = 28 + pr(i, 9) * 18;
      const yLow = bodyBot + 6 + pr(i, 7) * 14;
      fairValue -= 10 + rank * 5 + pr(i, 5) * 6;

      out.push({
        cx,
        bullish: true,
        pump: true,
        yOpen: open,
        yClose: close,
        yHigh,
        yLow,
      });
      continue;
    }

    const bearish = pr(i, 1) > 0.42;
    const open = fairValue + (pr(i, 2) - 0.5) * 28;

    let close: number;
    if (bearish) {
      close = open + 10 + pr(i, 3) * 34;
    } else {
      close = open - (12 + pr(i, 4) * 36);
    }

    fairValue -= 4.5 + pr(i, 5) * 5.5;

    const bodyTop = Math.min(open, close);
    const bodyBot = Math.max(open, close);
    const yHigh = bodyTop - (5 + pr(i, 6) * 18);
    const yLow = bodyBot + (5 + pr(i, 7) * 20);

    out.push({
      cx,
      bullish: !bearish,
      yOpen: open,
      yClose: close,
      yHigh,
      yLow,
    });
  }

  return out;
}

/** Smoothed path through mids — quadratic beziers for softer “macro uptrend” line */
function buildSmoothTrendPath(candles: Candle[]): string {
  if (candles.length < 2) return "";
  const pts = candles.map((c) => ({
    x: c.cx,
    y: (c.yOpen + c.yClose) / 2,
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx = (prev.x + cur.x) / 2;
    const cy = (prev.y + cur.y) / 2 - (pr(i, 9) - 0.5) * 8;
    d += ` Q ${cx} ${cy} ${cur.x} ${cur.y}`;
  }
  return d;
}

/**
 * Candle wallpaper: bull/bear bodies + smoothed uptrend + pump tail — use `fixed inset-0 z-[3]` under main content.
 */
export function LandingBackdropArt({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;

  const candles = useMemo(() => buildVolatileUptrendCandles(22), []);
  const trendPath = useMemo(() => buildSmoothTrendPath(candles), [candles]);

  return (
    <div
      className={cn(
        "pointer-events-none inset-0 overflow-hidden [transform:translateZ(0)]",
        className,
      )}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 5%, black 97%, transparent 100%), linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 5%, black 97%, transparent 100%), linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
      aria-hidden
    >
      {/* Primary strip — live drift + tape scroll */}
      <motion.div
        className="absolute -left-[6%] top-[8%] h-[85vh] min-h-[520px] w-[130%] min-w-[960px] max-w-[1500px] opacity-[0.22] dark:opacity-[0.28]"
        animate={
          reduce
            ? undefined
            : {
                x: [0, -18, 0, 12, 0],
                y: [0, -10, 4, -6, 0],
                opacity: [0.18, 0.32, 0.22, 0.3, 0.18],
              }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1100 620"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            <linearGradient id="uof-candle-bull" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--uof))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="hsl(var(--uof))" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="uof-candle-bear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0.26" />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.62" />
            </linearGradient>
            <linearGradient id="uof-trend-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--uof))" stopOpacity="0.35" />
              <stop offset="50%" stopColor="hsl(var(--uof))" stopOpacity="0.65" />
              <stop offset="100%" stopColor="hsl(var(--uof))" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          <motion.path
            d={trendPath}
            stroke="url(#uof-trend-stroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
            animate={
              reduce
                ? undefined
                : {
                    opacity: [0.45, 0.85, 0.55, 0.78, 0.45],
                  }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: 6.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />

          {candles.map((c, i) => {
            const bodyTop = Math.min(c.yOpen, c.yClose);
            const bodyBot = Math.max(c.yOpen, c.yClose);
            const bodyH = Math.max(bodyBot - bodyTop, 5);
            const w = c.pump ? 26 : 20;
            const fill = c.bullish ? "url(#uof-candle-bull)" : "url(#uof-candle-bear)";
            const wick = c.bullish ? "hsl(var(--uof) / 0.55)" : "hsl(var(--destructive) / 0.52)";
            const stroke = c.bullish ? "hsl(var(--uof) / 0.42)" : "hsl(var(--destructive) / 0.4)";

            return (
              <motion.g
                key={`${c.cx}-${i}`}
                animate={
                  reduce
                    ? undefined
                    : c.pump
                      ? {
                          y: [0, -9, 4, -5, 0],
                          x: [0, 2.5, -1.5, 1, 0],
                        }
                      : {
                          y: [0, -4, 2, -2, 0],
                          x: [0, 1.5, -1, 0.5, 0],
                        }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: c.pump
                          ? 2.2 + pr(i, 11) * 1.4
                          : 2.8 + pr(i, 11) * 2.2,
                        repeat: Infinity,
                        ease: LANDING_EASE,
                        delay: i * 0.11,
                      }
                }
              >
                <line
                  x1={c.cx}
                  x2={c.cx}
                  y1={c.yHigh}
                  y2={c.yLow}
                  stroke={wick}
                  strokeWidth={c.pump ? "2.5" : "2"}
                  strokeLinecap="round"
                />
                <motion.rect
                  x={c.cx - w / 2}
                  y={bodyTop}
                  width={w}
                  height={bodyH}
                  rx={c.pump ? 3 : 2.5}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={c.pump ? "1.25" : "1"}
                  animate={
                    reduce
                      ? undefined
                      : c.pump
                        ? {
                            opacity: [0.72, 1, 0.82, 0.98, 0.72],
                          }
                        : {
                            opacity: [0.65, 1, 0.72, 0.95, 0.65],
                          }
                  }
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: c.pump
                            ? 1.35 + pr(i, 12) * 0.9
                            : 1.8 + pr(i, 12) * 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: pr(i, 13) * 0.8,
                        }
                  }
                />
              </motion.g>
            );
          })}
        </svg>
      </motion.div>

      {/* Secondary spark — volatile mini path, long-term still up */}
      <motion.div
        className="absolute -right-[2%] bottom-[6%] h-56 w-[min(90vw,44rem)] opacity-[0.14] dark:opacity-[0.18]"
        animate={
          reduce
            ? undefined
            : {
                x: [0, -14, 6, -8, 0],
                y: [0, 6, -4, 5, 0],
                opacity: [0.12, 0.22, 0.15, 0.2, 0.12],
              }
        }
        transition={
          reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <svg viewBox="0 0 400 200" className="h-full w-full" aria-hidden>
          <path
            d="M 16 178 L 52 155 L 88 165 L 118 130 L 158 142 L 198 108 L 238 118 L 278 82 L 318 92 L 342 68 L 368 38 L 388 22"
            stroke="hsl(var(--uof) / 0.55)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 16 188 L 52 168 L 88 178 L 118 148 L 158 158 L 198 128 L 238 138 L 278 98 L 318 108 L 342 88 L 368 62 L 388 48"
            stroke="hsl(var(--destructive) / 0.35)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </motion.div>
    </div>
  );
}
