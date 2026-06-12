import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GraduationCap } from "lucide-react";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

const TERMS = [
  {
    term: "IPO",
    definition:
      "Initial Public Offering — when a private company like SpaceX first sells shares to the public on a stock exchange.",
  },
  {
    term: "Nasdaq / SPCX",
    definition:
      "Nasdaq is a US stock exchange. SPCX is SpaceX's stock ticker symbol — like a short name you look up to find the price.",
  },
  {
    term: "Token / SPCXx",
    definition:
      "A digital version of stock exposure on the Solana blockchain. It tracks the same company but trades 24/7 like crypto.",
  },
  {
    term: "Spread",
    definition:
      "The gap between the stock price and the token price. A +10% spread means the token costs 10% more than the stock.",
  },
  {
    term: "Mint address",
    definition:
      "A unique ID for a token on Solana — like a serial number. Scammers create fake mints with similar names. Always verify yours.",
  },
  {
    term: "Venue",
    definition:
      "A platform that issues or lists tokenized stock — e.g. xStocks (Kraken/Bybit), Backpack, or Ondo. Each has different rules.",
  },
  {
    term: "Liquidity",
    definition:
      "How much money is available to buy or sell without moving the price a lot. Low liquidity = harder to trade large amounts.",
  },
  {
    term: "Premium vs discount",
    definition:
      "Premium = token costs more than stock. Discount = token costs less. Neither guarantees profit — markets can change fast.",
  },
] as const;

export function SpcxGlossary() {
  return (
    <div className={spcxCardClass}>
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/[0.03] px-5 py-4 sm:px-6">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight">Stock & crypto glossary</h2>
          <p className="text-xs text-muted-foreground">Plain-English definitions for every term on this page</p>
        </div>
      </div>
      <div className="px-2 py-2 sm:px-4">
        <Accordion type="single" collapsible className="w-full">
          {TERMS.map((item) => (
            <AccordionItem key={item.term} value={item.term} className="border-border/35">
              <AccordionTrigger className="px-2 text-left text-sm font-medium hover:no-underline">
                {item.term}
              </AccordionTrigger>
              <AccordionContent className="px-2 text-sm leading-relaxed text-muted-foreground">
                {item.definition}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
