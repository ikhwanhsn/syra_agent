import { RISE_DOCS, ExternalLink, SectionEyebrow } from "./primitives";
import { Check, Minus, X } from "lucide-react";

type Cap = "yes" | "partial" | "no";
const ROWS: [string, Cap, Cap, Cap, Cap][] = [
  ["Permissionless", "yes", "yes", "yes", "yes"],
  ["Easy token creation", "yes", "yes", "no", "yes"],
  ["Protocol floor price (per design)", "no", "no", "no", "yes"],
  ["In-platform borrow day one", "no", "no", "no", "yes"],
  ["Sole protocol counterparty for swaps (RISE design)", "no", "no", "no", "yes"],
] as const;

function Cell({ v }: { v: Cap }) {
  if (v === "yes")
    return (
      <span className="inline-flex items-center justify-center text-success">
        <Check className="h-4 w-4" aria-label="Yes" />
      </span>
    );
  if (v === "partial")
    return (
      <span className="inline-flex text-muted-foreground" title="Partially">
        <Minus className="h-4 w-4" />
      </span>
    );
  return (
    <span className="inline-flex text-muted-foreground" aria-label="No">
      <X className="h-4 w-4" />
    </span>
  );
}

export function CompetitiveMatrix() {
  return (
    <section className="mb-20 min-w-0" aria-labelledby="compare-heading" id="comparison">
      <div className="mb-4 min-w-0 max-w-3xl sm:mb-8">
        <SectionEyebrow>Landscape</SectionEyebrow>
        <h2
          id="compare-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] min-[500px]:text-2xl sm:text-3xl md:text-4xl"
        >
          Why <span className="neon-text">$UPONLY</span> is not a generic launch
        </h2>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base sm:leading-relaxed">
          The following columns compare familiar venues at a glance. RISE’s claims come from the{" "}
          <ExternalLink href={RISE_DOCS.intro}>public introduction</ExternalLink>; for Raydium, features reflect a
          typical CPMM pool experience (no protocol-native floor in the RISE sense).
        </p>
      </div>
      <p className="mb-2 text-xs text-muted-foreground sm:hidden">Swipe to see all columns</p>
      <div
        className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain scroll-smooth rounded-2xl border border-border/60 bg-card/20 shadow-[0_1px_0_0_hsl(0_0%_100%/0.03)_inset] [-webkit-overflow-scrolling:touch] touch-pan-x [scrollbar-gutter:stable] backdrop-blur-sm"
        role="region"
        aria-label="Feature comparison table"
      >
        <table className="w-full min-w-[17.5rem] border-collapse text-left text-xs [overflow-wrap:anywhere] sm:min-w-[32rem] sm:text-sm md:min-w-[36rem]">
          <caption className="sr-only">Feature comparison: Pump.fun, Bonk.fun, Raydium AMM, RISE</caption>
          <thead>
            <tr className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
              <th
                className="sticky left-0 z-10 w-[40%] min-w-[7rem] max-w-[10rem] bg-gradient-to-b from-card/95 from-muted/30 to-transparent px-3 py-3 text-xs font-semibold text-foreground shadow-[4px_0_12px_-4px_hsl(0_0%_0%/0.2)] [overflow-wrap:anywhere] sm:min-w-[8rem] sm:max-w-none sm:px-4 sm:py-3.5 sm:pr-6 sm:text-sm md:px-6"
                scope="col"
              >
                Capability
              </th>
                <th
                  className="z-[1] w-[10%] min-w-[1.5rem] px-0.5 py-2.5 text-center text-[0.6rem] font-medium leading-tight text-muted-foreground [overflow-wrap:anywhere] min-[400px]:px-1.5 min-[500px]:px-3.5 min-[500px]:py-3.5 min-[500px]:text-sm sm:px-6"
                  scope="col"
                  title="Pump.fun"
                >
                Pump
              </th>
                <th
                  className="z-[1] w-[10%] min-w-[1.5rem] px-0.5 py-2.5 text-center text-[0.6rem] font-medium leading-tight text-muted-foreground [overflow-wrap:anywhere] min-[400px]:px-1.5 min-[500px]:px-3.5 min-[500px]:py-3.5 min-[500px]:text-sm sm:px-6"
                  scope="col"
                  title="Bonk.fun"
                >
                Bonk
              </th>
                <th
                  className="z-[1] w-[10%] min-w-[1.5rem] px-0.5 py-2.5 text-center text-[0.6rem] font-medium leading-tight text-muted-foreground [overflow-wrap:anywhere] min-[400px]:px-1.5 min-[500px]:px-3.5 min-[500px]:py-3.5 min-[500px]:text-sm sm:px-6"
                  scope="col"
                >
                <span className="hidden sm:inline">Raydium (AMMs)</span>
                  <span className="sm:hidden" title="Raydium AMMs">Raydium</span>
              </th>
                <th
                  className="z-[1] w-[10%] min-w-[1.5rem] px-0.5 py-2.5 text-center text-[0.6rem] font-semibold text-foreground [overflow-wrap:anywhere] min-[400px]:px-1.5 min-[500px]:px-3.5 min-[500px]:py-3.5 min-[500px]:text-sm sm:px-6"
                  scope="col"
                >
                RISE
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {ROWS.map(([label, a, b, c, d]) => (
              <tr key={label} className="hover:bg-muted/10">
                <th
                  className="sticky left-0 z-10 w-[40%] min-w-[7rem] max-w-[10rem] bg-card/90 px-3 py-2.5 text-left text-xs font-medium text-foreground [overflow-wrap:anywhere] shadow-[2px_0_8px_-2px_hsl(0_0%_0%/0.12)] backdrop-blur-sm sm:min-w-[8rem] sm:max-w-none sm:px-4 sm:py-3.5 sm:text-sm md:px-6"
                  scope="row"
                >
                  {label}
                </th>
                <td className="px-0.5 py-2 text-center min-[500px]:px-4 min-[500px]:py-3.5 sm:px-6">
                  <div className="inline-flex w-full min-w-0 items-center justify-center sm:inline-flex">
                    <Cell v={a} />
                  </div>
                </td>
                <td className="px-0.5 py-2 text-center min-[500px]:px-4 min-[500px]:py-3.5 sm:px-6">
                  <div className="inline-flex w-full min-w-0 items-center justify-center sm:inline-flex">
                    <Cell v={b} />
                  </div>
                </td>
                <td className="px-0.5 py-2 text-center min-[500px]:px-4 min-[500px]:py-3.5 sm:px-6">
                  <div className="inline-flex w-full min-w-0 items-center justify-center sm:inline-flex">
                    <Cell v={c} />
                  </div>
                </td>
                <td className="px-0.5 py-2 text-center min-[500px]:px-4 min-[500px]:py-3.5 sm:px-6">
                  <div className="inline-flex w-full min-w-0 items-center justify-center sm:inline-flex">
                    <span className="font-semibold text-foreground">
                      <Cell v={d} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
