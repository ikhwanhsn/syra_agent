import { useReducedMotion, motion } from "framer-motion";
import { BookOpen, Layers, LineChart, Shield } from "lucide-react";
import { RISE_DOCS, FeatureCard, ExternalLink, itemFade, SectionEyebrow, stagger } from "./primitives";
import { RISE_UP_ONLY } from "@/data/riseUpOnly";

export function WhyUpOnly() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section className="mb-20 min-w-0 scroll-mt-24" aria-labelledby="why-uponly-heading" id="why-uponly">
      <div className="mb-10 min-w-0 max-w-3xl">
        <SectionEyebrow>Why this token</SectionEyebrow>
        <h2
          id="why-uponly-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          The <span className="neon-text">$UPONLY</span> thesis: structure over hype
        </h2>
        <p className="mt-4 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed md:text-lg">
          ${RISE_UP_ONLY.symbol} is our dedicated RISE tranche to experience{" "}
          <ExternalLink href={RISE_DOCS.intro} className="text-foreground/90 text-sm sm:text-base">
            floor pricing
          </ExternalLink>
          , <ExternalLink href={RISE_DOCS.borrowsAndLoops} className="text-foreground/90 text-sm sm:text-base">
            interest-free borrow
          </ExternalLink>
          , and <ExternalLink href={RISE_DOCS.bondingCurve} className="text-foreground/90 text-sm sm:text-base">
            protocol-owned liquidity
          </ExternalLink>{" "}
          in one place — not as a one-off experiment, but as a public milestone toward a{" "}
          <span className="text-foreground/90 font-medium">$100M</span> fully diluted reference.
        </p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-4 min-[500px]:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            icon: Shield,
            title: "Rising floor (per RISE design)",
            body: (
              <>
                The protocol states every token on RISE has a floor that only ratchets up, backed by reserves — not
                a marketing line. <ExternalLink href={RISE_DOCS.floor} className="text-sm">Floor mechanism</ExternalLink>
              </>
            ),
          },
          {
            icon: BookOpen,
            title: "0% borrow interest, no liquidation (as designed)",
            body: (
              <>
                Borrowing is capped at floor value so solvency holds without a liquidation engine. See{" "}
                <ExternalLink href={RISE_DOCS.borrowsAndLoops} className="text-sm">Borrows &amp; loops</ExternalLink>.
              </>
            ),
          },
          {
            icon: Layers,
            title: "Protocol is the counterparty",
            body: (
              <>
                Buys mint; sells burn. Liquidity is not fragmented across LPs. Source:{" "}
                <ExternalLink href={RISE_DOCS.intro} className="text-sm">Introduction</ExternalLink>.
              </>
            ),
          },
          {
            icon: LineChart,
            title: "A measurable milestone",
            body: (
              <>
                We use a transparent, published path — Genesis → $5M → $25M → $100M — so the community and partners
                share a single North Star, not a vibe metric.
              </>
            ),
          },
        ].map(({ icon, title, body }, i) => (
          <motion.div key={i} {...itemFade(reduce)} className="h-full">
            <FeatureCard icon={icon} title={title} className="h-full">
              {body}
            </FeatureCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
