import { useReducedMotion, motion } from "framer-motion";
import { RISE_DOCS, SectionEyebrow, itemFade, stagger } from "./primitives";
import { Brain, Rocket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UseCaseCards() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section className="mb-20 min-w-0" aria-labelledby="archetype-heading" id="use-cases">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>Fit</SectionEyebrow>
        <h2
          id="archetype-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          Are you a trader, a holder, or a degen (with a thesis)?
        </h2>
        <p className="mt-3 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          Pick your lane. None of this implies profit — it frames how the protocol is meant to be used, per RISE docs.
        </p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3"
      >
        {[
          {
            icon: Brain,
            title: "The trader",
            text: "You want transparent execution, clear floor and borrow parameters, and an honest comparison against pump-style curves. Start with the RISE buy/sell guides.",
            href: "https://docs.rise.rich/guides/buy-sell",
            cta: "How to trade on RISE",
          },
          {
            icon: Wallet,
            title: "The long-term holder",
            text: "You care that Syra-allocated fee liquidity is 50% canonical $SYRA and 50% $UPONLY, published on this page, not buried in a Discord post.",
            href: "#on-chain-details",
            cta: "Jump to on-chain details",
            internal: true,
          },
          {
            icon: Rocket,
            title: "The convicted degen",
            text: "If you are sizing loops, the protocol is explicit: amplification is real, risk is real — the absence of liquidation is not a substitute for good judgment. Read the docs twice.",
            href: RISE_DOCS.borrowsAndLoops,
            cta: "Borrows & loops",
          },
        ].map((c) => (
          <motion.div
            key={c.title}
            {...itemFade(reduce)}
            className="flex h-full min-w-0 flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 p-4 min-[500px]:p-5"
          >
            <c.icon className="h-6 w-6 text-foreground/80" />
            <h3 className="mt-3 font-semibold text-foreground">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.text}</p>
            {"internal" in c && c.internal ? (
              <Button asChild variant="secondary" className="mt-4 w-full" size="sm">
                <a href={c.href} className="w-full text-center">
                  {c.cta}
                </a>
              </Button>
            ) : (
              <Button asChild variant="secondary" className="mt-4 w-full" size="sm">
                <a href={c.href} className="w-full text-center" target="_blank" rel="noopener noreferrer">
                  {c.cta}
                </a>
              </Button>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
