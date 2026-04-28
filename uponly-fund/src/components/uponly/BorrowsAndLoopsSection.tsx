import { useReducedMotion, motion } from "framer-motion";
import { RISE_DOCS, ExternalLink, SectionEyebrow, itemFade, stagger } from "./primitives";
import { RISE_UP_ONLY } from "@/data/riseUpOnly";
import { CircleDollarSign, Lock, Repeat2 } from "lucide-react";

export function BorrowsAndLoopsSection() {
  const reduce = useReducedMotion() ?? false;
  const o = RISE_UP_ONLY.originationFeePct;
  return (
    <section className="mb-20 min-w-0 scroll-mt-24" aria-labelledby="borrow-heading" id="borrows-loops">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>Capital efficiency</SectionEyebrow>
        <h2
          id="borrow-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          Borrows and loops: <span className="text-foreground/80">0% interest</span> by design
        </h2>
        <p className="mt-4 text-muted-foreground sm:text-base sm:leading-relaxed">
          RISE offers borrowing from day one against the floor, not the market, with a one-time origination fee
          (documented as {o}%) and no running interest. Loops are how traders compound exposure with their eyes open —
          the protocol is explicit that upside and downside are still <em>not</em> the same.{" "}
          <ExternalLink href={RISE_DOCS.borrowsAndLoops} className="text-sm sm:text-base">
            Read borrows &amp; loops
          </ExternalLink>
        </p>
      </div>
      <motion.ol
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-4 min-[500px]:grid-cols-3"
      >
        {[
          { icon: Lock, step: "1", label: "Deposit", text: "Lock your tokens. Collateral is evaluated against the floor, not a fragile oracle mark." },
          { icon: CircleDollarSign, step: "2", label: "Origination fee", text: `One-time fee of ${o}% in the RISE spec — not recurring interest.` },
          { icon: Repeat2, step: "3", label: "Loop (optional)", text: "Re-buy with borrowed funds to add exposure, knowing liquidation isn’t the forced unwind mechanism." },
        ].map((s) => (
          <motion.li
            key={s.step}
            {...itemFade(reduce)}
            className="flex min-w-0 flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 p-4 min-[500px]:p-5"
          >
            <span className="text-xs font-mono text-muted-foreground/90">Step {s.step}</span>
            <s.icon className="mt-3 h-6 w-6 text-foreground/80" />
            <h3 className="mt-2 font-semibold text-foreground">{s.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </motion.li>
        ))}
      </motion.ol>
      <div className="mt-8 min-w-0 max-w-full rounded-2xl border border-border/40 bg-muted/10 p-4 sm:p-6">
        <p className="text-sm font-medium text-foreground">Worked example (illustrative only, not a quote)</p>
        <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-sm">
          Suppose you have ${formatExample(10_000)} in tokens. After paying the {o}% origination fee, you can deploy
          borrowed notional to buy more — the protocol is designed so your borrow never exceeds a loss bound tied to
          the floor, not a volatile AMM mark. DYOR; the numbers here are a teaching aid, not a forecast.
        </p>
      </div>
    </section>
  );
}

function formatExample(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n,
  );
}
