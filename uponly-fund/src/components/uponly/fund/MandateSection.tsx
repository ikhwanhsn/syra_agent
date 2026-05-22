import { motion, useReducedMotion } from "framer-motion";
import { SectionEyebrow } from "../primitives";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import { landingViewport, staggerContainer, staggerItemSm } from "@/components/landing/landingMotion";

type MandateSectionProps = { className?: string };

export function MandateSection({ className }: MandateSectionProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <section
      className={cn("mb-20 min-w-0", className)}
      id="mandate"
      aria-labelledby="uof-mandate-heading"
    >
      <div className="mb-6 min-w-0 max-w-3xl">
        <SectionEyebrow>Objective</SectionEyebrow>
        <h2
          id="uof-mandate-heading"
          className="landing-section-title text-balance break-words max-w-4xl"
        >
          Mandate: Solana venture outcomes, not promotional timing
        </h2>
        <p className="mt-3 text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          <strong className="font-medium text-foreground/90">Up Only Fund</strong> behaves like a venture/strategic hedge desk on Solana—we deploy
          capital and hands-on strategy inside our mandate to accelerate credible teams. We publish structure and intent;
          we do not forecast markets. Any outcome is{" "}
          <strong className="font-medium text-foreground/90">probabilistic and uncertain</strong>—your diligence matters if you touch{" "}
          <span className="font-mono text-foreground/85">$UPONLY</span> or related venues.
        </p>
      </div>
      <motion.ul
        className="space-y-3 sm:space-y-4"
        variants={reduce ? undefined : staggerContainer}
        initial={reduce ? false : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={landingViewport}
      >
        {[
          "Source of truth remains on-chain plus disclosures published here—this site mirrors intent; contracts define settlement.",
          "Mandate: multi-year backing for Solana-native founders—capital for liquidity and distribution, operator support where agent analytics and execution tooling compound outcomes.",
          "Not personalized investment advice; not an open-ended pooled vehicle for retail subscribers in v1—education and sleeve transparency first.",
        ].map((line) => (
          <motion.li
            key={line}
            variants={reduce ? undefined : staggerItemSm}
            className="flex gap-3 rounded-2xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 p-4 min-[500px]:p-5"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
              <Target className="h-4 w-4 text-success" aria-hidden />
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              {line}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
