import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RISE_DOCS, SectionEyebrow } from "../primitives";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type FaqItem = { q: string; a: ReactNode };

const ITEMS: FaqItem[] = [
  {
    q: "Is the Up Only Fund a pooled investment I can buy into?",
    a: "In v1, no. The fund is a Syra-backed treasury program described for transparency, not a public offer of securities or a pooled product. That may change in the future; if it does, we will publish a separate legal and product disclosure.",
  },
  {
    q: "What does “backed by Syra” mean?",
    a: "It means the fund is capitalized and overseen in connection with Syra (treasury and program alignment), as described in the Treasury section—not that any return is guaranteed.",
  },
  {
    q: "Will I see the treasury and positions on-chain?",
    a: "The intent is to publish a treasury address and key positions when they are set. Until then, stats on this page remain placeholders (TBA).",
  },
  {
    q: "Does the fund only buy $UPONLY?",
    a: (
      <>
        The mandate is broader: potential projects in the RISE ecosystem. The main $UPONLY tranche and fee policy are
        documented on the{" "}
        <Link to="/uponly" className="font-medium text-foreground/90 underline-offset-2 hover:underline">
          /uponly
        </Link>{" "}
        page.
      </>
    ),
  },
  {
    q: "Is past performance a guide?",
    a: "No. Any future listing of realized P&L is descriptive, not a forecast. Crypto markets and early projects are high risk; outcomes are uncertain.",
  },
  {
    q: "Is this the same as RISE’s protocol guarantees?",
    a: (
      <>
        No. RISE has its own protocol and legal terms. This page is about Syra’s fund narrative and (later) disclosures. Read{" "}
        <a
          className="font-medium text-foreground/90 underline-offset-2 hover:underline"
          href="https://docs.rise.rich/legal/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          RISE terms
        </a>{" "}
        for platform rules.
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section
      className="mb-20 w-full min-w-0 max-w-full scroll-mt-24 rounded-2xl border border-border/40 bg-card/20 px-3 py-8 min-[500px]:rounded-3xl min-[500px]:px-5 min-[500px]:py-10 sm:px-6 md:px-8"
      id="faq"
      aria-labelledby="uof-faq-heading"
    >
      <div className="mb-6 w-full min-w-0 sm:mb-8">
        <SectionEyebrow>Questions we expect</SectionEyebrow>
        <h2
          id="uof-faq-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] sm:text-2xl md:text-3xl"
        >
          Up Only Fund — FAQ
        </h2>
        <a
          href={RISE_DOCS.intro}
          className="mt-3 inline-block min-h-11 w-full min-w-0 break-words py-2.5 text-sm text-foreground/90 underline-offset-2 hover:underline min-[500px]:min-h-0 min-[500px]:w-auto min-[500px]:py-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          RISE introduction
        </a>
      </div>
      <Accordion type="single" collapsible className="w-full min-w-0">
        {ITEMS.map((x, i) => (
          <AccordionItem
            value={`uof-f-${i}`}
            key={x.q}
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
