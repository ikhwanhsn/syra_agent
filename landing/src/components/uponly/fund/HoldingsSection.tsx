import { useReducedMotion, motion } from "framer-motion";
import { ArrowUpRight, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UP_ONLY_FUND, getFundHoldingRiseUrl } from "@/data/upOnlyFund";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { syraSolscanTokenUrl } from "@/data/agentIdentity";
import { cn } from "@/lib/utils";
import { fadeUp, SectionEyebrow } from "../primitives";

type HoldingsSectionProps = { className?: string };

export function HoldingsSection({ className }: HoldingsSectionProps) {
  const reduce = useReducedMotion() ?? false;
  const holdings = UP_ONLY_FUND.holdings;
  const empty = holdings.length === 0;

  return (
    <motion.section
      {...fadeUp(reduce)}
      className={cn("mb-20 min-w-0", className)}
      id="holdings"
      aria-labelledby="uof-holdings-heading"
    >
      <div className="mb-6 min-w-0 max-w-3xl sm:mb-8">
        <SectionEyebrow>Transparency</SectionEyebrow>
        <h2
          id="uof-holdings-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] min-[500px]:text-2xl sm:text-3xl"
        >
          Positions
        </h2>
        <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          First positions and weights will be published when the fund is operational. This is a disclosure surface, not a
          product pitch.
        </p>
      </div>

      {empty ? (
        <div
          className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/40 to-card/10 px-4 py-10 text-center min-[500px]:px-8"
          role="status"
        >
          <PieChart className="mx-auto h-10 w-10 text-foreground/35" aria-hidden />
          <p className="mt-4 break-words text-pretty text-sm italic leading-relaxed text-muted-foreground/95 sm:text-base">
            First positions to be published when the fund is operational.
          </p>
        </div>
      ) : (
        <ul className="grid min-w-0 gap-3 sm:gap-4">
          {holdings.map((h) => {
            const rise = getFundHoldingRiseUrl(h.riseRichTradeId);
            return (
              <li
                key={`${h.symbol}-${h.mint ?? h.riseRichTradeId ?? "row"}`}
                className="rounded-2xl border border-border/50 bg-card/35 p-4 min-[500px]:p-5"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">
                      {h.name} <span className="text-foreground/90">· ${h.symbol}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base">{h.thesisOneLiner}</p>
                    {h.mint ? (
                      <a
                        href={syraSolscanTokenUrl(h.mint)}
                        className="mt-2 inline-flex min-h-11 w-full min-w-0 break-all py-1 text-xs font-mono text-foreground/90 underline-offset-2 hover:underline min-[500px]:min-h-0 min-[500px]:w-auto min-[500px]:py-0 sm:text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {h.mint}
                        <ArrowUpRight className="ml-0.5 inline h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Weight (ref.)</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-foreground">{formatPct(h.weightPct)}</p>
                    <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Size (ref.)</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                      {formatUsd(h.positionUsd, { compact: false })}
                    </p>
                    {rise ? (
                      <Button asChild variant="secondary" size="sm" className="mt-2 w-full min-[500px]:w-auto">
                        <a href={rise} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                          RISE
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
