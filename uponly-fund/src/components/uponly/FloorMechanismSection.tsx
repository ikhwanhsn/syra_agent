import { useReducedMotion, motion } from "framer-motion";
import { RISE_DOCS, ExternalLink, SectionEyebrow, itemFade, stagger } from "./primitives";

/**
 * Simplified “floor ratchets up” vs “unbounded” diagram; pauses when out of view.
 */
function FloorOnlyUpSvg() {
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full min-w-0 max-w-full min-h-[10rem] sm:h-56" aria-hidden>
      <title>Stylized: floor as rising steps; spot price wiggles but stays above</title>
      <text x="8" y="18" className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2 }}>
        RISE FLOOR (RATCHETS UP)
      </text>
      <path
        d="M 20 120 L 60 120 L 60 100 L 100 100 L 100 80 L 140 80 L 140 60 L 180 60 L 180 50 L 220 50 L 220 40 L 260 40 L 300 40"
        fill="none"
        className="stroke-foreground/45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 20 140 L 60 100 L 100 88 L 140 62 L 180 48 L 220 38 L 260 35 L 300 32"
        fill="none"
        className="stroke-success"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="8" y="154" className="fill-foreground/70" style={{ fontSize: 8 }}>
        Per docs: floor can never go down, only up when backed by reserves.
      </text>
    </svg>
  );
}

function UnboundedSvg() {
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full min-w-0 max-w-full min-h-[10rem] sm:h-56" aria-hidden>
      <text x="8" y="18" className="fill-muted-foreground" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2 }}>
        TYPICAL LAUNCH
      </text>
      <path
        d="M 20 40 L 100 32 L 160 100 L 220 130 L 300 145"
        fill="none"
        className="stroke-foreground/35"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <text x="8" y="154" className="fill-foreground/55" style={{ fontSize: 8 }}>
        No protocol floor: price can trend toward zero under stress.
      </text>
    </svg>
  );
}

export function FloorMechanismSection() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section id="how-floor-works" className="mb-20 min-w-0 scroll-mt-24" aria-labelledby="floor-heading">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>How the floor works</SectionEyebrow>
        <h2
          id="floor-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          A floor that <span className="neon-text">only moves up</span>
        </h2>
        <p className="mt-4 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          RISE documentation describes a minimum redemption price for every token, backed by protocol reserves — the
          floor is designed so it cannot decrease. In volatile markets, that is the clearest differentiator from
          “bonding only” memecoin launches.{" "}
          <ExternalLink href={RISE_DOCS.floor} className="text-sm sm:text-base">
            Read the full floor mechanism
          </ExternalLink>
        </p>
      </div>
      <motion.div {...stagger(reduce)} className="grid min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          {...itemFade(reduce)}
          className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/60 to-card/20 p-4 min-[500px]:p-5 sm:p-7"
        >
          <h3 className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">On RISE (simplified model)</h3>
          <FloorOnlyUpSvg />
        </motion.div>
        <motion.div
          {...itemFade(reduce)}
          className="min-w-0 overflow-hidden rounded-2xl border border-border/40 bg-background/20 p-4 min-[500px]:p-5 sm:p-7"
        >
          <h3 className="text-sm font-semibold text-foreground/90 [overflow-wrap:anywhere]">
            Unbounded memecoin curve (contrast)
          </h3>
          <UnboundedSvg />
        </motion.div>
      </motion.div>
      <p className="mt-6 text-xs text-muted-foreground/90 sm:text-sm">
        Illustrations are abstract and non-binding; always verify the latest RISE risk disclosures before trading.
      </p>
    </section>
  );
}
