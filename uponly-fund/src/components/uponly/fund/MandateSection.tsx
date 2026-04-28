import { useReducedMotion, motion } from "framer-motion";
import { fadeUp, SectionEyebrow } from "../primitives";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

type MandateSectionProps = { className?: string };

export function MandateSection({ className }: MandateSectionProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.section
      {...fadeUp(reduce)}
      className={cn("mb-20 min-w-0", className)}
      id="mandate"
      aria-labelledby="uof-mandate-heading"
    >
      <div className="mb-6 min-w-0 max-w-3xl">
        <SectionEyebrow>Objective</SectionEyebrow>
        <h2
          id="uof-mandate-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] min-[500px]:text-2xl sm:text-3xl md:text-4xl"
        >
          Mandate: ecosystem allocation, not a price thesis
        </h2>
        <p className="mt-3 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          <strong className="font-medium text-foreground/90">Up Only Fund</strong> is a Syra-backed treasury program to support and learn from
          high-potential work on RISE. We describe structure and intent clearly; we do not predict market direction. Any
          investment outcome is <strong className="font-medium text-foreground/90">probabilistic and uncertain</strong>—sizing
          and diligence are on you if you transact in related markets.
        </p>
      </div>
      <ul className="space-y-3 sm:space-y-4">
        {[
          "Source of truth: on-chain and published disclosures—this page is a mirror, not the contract.",
          "Mandate: long-term support for the RISE ecosystem, including (but not limited to) tokens and teams aligned with the protocol’s documented mechanics.",
          "Not financial advice, not a pooled investment product for the public in v1—transparency and education first.",
        ].map((line) => (
          <li
            key={line}
            className="flex gap-3 rounded-2xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 p-4 min-[500px]:p-5"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
              <Target className="h-4 w-4 text-success" aria-hidden />
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              {line}
            </span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
