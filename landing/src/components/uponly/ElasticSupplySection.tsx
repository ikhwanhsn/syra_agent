import { useReducedMotion, motion } from "framer-motion";
import { RISE_DOCS, ExternalLink, SectionEyebrow, itemFade, stagger } from "./primitives";
import { ArrowLeftRight, Flame } from "lucide-react";

export function ElasticSupplySection() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section className="mb-20 min-w-0 scroll-mt-24" aria-labelledby="elastic-heading" id="elastic-supply">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>Elastic supply</SectionEyebrow>
        <h2
          id="elastic-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          Why mint/burn and the bonding curve <span className="text-foreground/80">matter</span>
        </h2>
        <p className="mt-4 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          RISE issues tokens on buys and retires them on sells, with the protocol as counterparty. That is what lets
          reserves accumulate for the floor, instead of LPs yanking support at the worst time. See{" "}
          <ExternalLink href={RISE_DOCS.bondingCurve} className="text-sm sm:text-base">
            Bonding curve
          </ExternalLink>
          .
        </p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-4 min-[500px]:grid-cols-2"
      >
        <motion.div
          {...itemFade(reduce)}
          className="flex min-w-0 gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 min-[500px]:gap-4 min-[500px]:p-5 sm:p-6"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card to-background/30">
            <Flame className="h-5 w-5 text-foreground/80" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground"> Buy → mint at quoted price</h3>
            <p className="mt-1 text-sm text-muted-foreground">Supply expands; protocol quotes your fill.</p>
          </div>
        </motion.div>
        <motion.div
          {...itemFade(reduce)}
          className="flex min-w-0 gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 min-[500px]:gap-4 min-[500px]:p-5 sm:p-6"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card to-background/30">
            <ArrowLeftRight className="h-5 w-5 text-foreground/80" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground"> Sell → burn, permanently</h3>
            <p className="mt-1 text-sm text-muted-foreground">Deflation on exit; reserves adjust per curve rules.</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
