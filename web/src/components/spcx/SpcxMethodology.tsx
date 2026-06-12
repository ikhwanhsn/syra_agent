import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { SpcxConfig } from "@/lib/spcxApi";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

const FAQ_ITEMS = [
  {
    q: "What is SpaceX stock (SPCX)?",
    a: "SPCX is the ticker symbol for SpaceX when it goes public on the Nasdaq stock exchange. It works like buying Apple (AAPL) or Tesla (TSLA) — you own a share of the company.",
  },
  {
    q: "What is SPCXx on Solana?",
    a: "SPCXx is a tokenized version of SpaceX exposure on the Solana blockchain. It tracks the same company but trades 24/7 like crypto. Different platforms issue it — we track the official ones.",
  },
  {
    q: "How do I buy on this page?",
    a: "Go to the Buy safely tab, verify the token is not a scam, then use the buy panel to swap USDC or SOL for SPCXx. You need a connected wallet with funds.",
  },
  {
    q: "Why are some tokens marked as scams?",
    a: "Anyone can create a token with a similar name. We hide pools whose price is wildly different from the real stock price — those are almost always fakes.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Syra shows data to help you compare prices and avoid scams. IPO markets are volatile. Always do your own research and only invest what you can afford to lose.",
  },
  {
    q: "Where does the stock price come from?",
    a: "We pull live Nasdaq data from Yahoo Finance. If that fails, we use the IPO reference price ($135 by default) until the feed recovers.",
  },
];

export function SpcxMethodology({ config }: { config?: SpcxConfig }) {
  return (
    <Card className={spcxCardClass}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03]">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Common questions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4 rounded-xl border border-border/40 bg-muted/[0.04] p-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">How we get data:</strong> Stock price from Nasdaq
            (via Yahoo Finance), token price from verified DEX pools, halt status from xStocks.
          </p>
          {config?.ipoReferencePriceUsd != null ? (
            <p className="mt-2">
              <strong className="text-foreground">Backup price:</strong> $
              {config.ipoReferencePriceUsd} IPO reference when live Nasdaq is unavailable.
            </p>
          ) : null}
          <p className="mt-2">
            <strong className="text-foreground">Scam protection:</strong> We only show token prices
            within a reasonable range of the stock price.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.q} value={item.q} className="border-border/35">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
