import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RISE_DOCS, SectionEyebrow } from "./primitives";
import { RISE_UP_ONLY, getRiseRichTradeUrl } from "@/data/riseUpOnly";

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Can the floor 'break' like an AMM can rug?",
    a: "Per RISE documentation, the floor is a protocol-enforced minimum backed by reserves (not a promise in Discord). It is designed to withstand the entire supply being sold to the floor. Always read the current legal terms and your own risk tolerance.",
  },
  {
    q: "What happens if the RISE platform is unavailable?",
    a: "This page is a Syra-hosted explainer, not a guarantee of uptime for third-party infrastructure. Your positions live on Solana; verify contracts and the official RISE front-end status.",
  },
  {
    q: "Is $UPONLY the same as the canonical $SYRA token?",
    a: "No. $UPONLY is the RISE tranche. Canonical $SYRA remains the community token on the Pump.fun reference, with 50% of Syra-allocated fee liquidity; $UPONLY receives the other 50% per the policy on this page.",
  },
  {
    q: "Is borrowing free?",
    a: `No ongoing interest is described in the RISE borrow spec, but a one-time origination fee of ${RISE_UP_ONLY.originationFeePct}% applies. This is not 'free' capital — it is a different cost structure than AMM per-block funding.`,
  },
  {
    q: "If I loop, can I still lose money?",
    a: "Yes. RISE is explicit that loops amplify gain and loss relative to capital. 'No liquidation' is not the same as 'no risk'.",
  },
  {
    q: "Is this financial advice?",
    a: "No. This page is educational. Crypto assets can go to zero. DYOR.",
  },
  {
    q: "Do you guarantee the $100M target?",
    a: "The $100M level is a published milestone for narrative and product alignment — not a forecast, not a security offering, and not a promise of performance. Market cap depends on public trading and sentiment.",
  },
  {
    q: "How do I buy the token right now?",
    a: (() => {
      const u = getRiseRichTradeUrl(RISE_UP_ONLY);
      if (u && RISE_UP_ONLY.buyOnRiseEnabled) {
        return `The primary CTA on this page links to the official RISE trade page: ${u}. You can also paste the published mint in any Solana explorer (see On-chain details).`;
      }
      return "Enable buy in riseUpOnly.ts and set riseRichTradeId when the RISE market is available.";
    })(),
  },
];

export function FaqSection() {
  return (
    <section
      className="mt-10 mb-20 w-full min-w-0 max-w-full scroll-mt-24 rounded-2xl border border-border/40 bg-card/20 px-3 py-8 min-[500px]:mt-12 min-[500px]:rounded-3xl min-[500px]:px-5 min-[500px]:py-10 sm:mt-14 sm:px-6 md:px-8"
      id="faq"
      aria-labelledby="faq-heading"
    >
      <div className="mb-6 w-full min-w-0 sm:mb-8">
        <SectionEyebrow>Objections, answered</SectionEyebrow>
        <h2
          id="faq-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] sm:text-2xl md:text-3xl"
        >
          Questions serious buyers ask
        </h2>
        <a
          href={RISE_DOCS.security}
          className="mt-3 inline-block min-h-11 w-full min-w-0 break-words py-2.5 text-sm text-foreground/90 underline-offset-2 hover:underline min-[500px]:min-h-0 min-[500px]:w-auto min-[500px]:py-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read RISE security documentation
        </a>
      </div>
      <Accordion type="single" collapsible className="w-full min-w-0">
        {ITEMS.map((x, i) => (
          <AccordionItem
            value={`f-${i}`}
            key={i}
            className="w-full min-w-0 border-border/40 last:border-b-0"
          >
            <AccordionTrigger className="w-full min-h-[2.75rem] items-start gap-3 py-4 pl-0 pr-0 text-left text-foreground hover:no-underline sm:min-h-12 sm:gap-4 sm:pr-1 sm:text-sm md:gap-5 md:text-base [&>svg]:shrink-0">
              <span className="min-w-0 flex-1 text-balance break-words leading-snug">{x.q}</span>
            </AccordionTrigger>
            <AccordionContent className="break-words text-muted-foreground sm:text-sm sm:leading-relaxed">
              {x.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
