import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Copy, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RISE_UP_ONLY, getRiseRichTradeUrl } from "@/data/riseUpOnly";
import { cn } from "@/lib/utils";

type TokenSectionProps = {
  className?: string;
};

export function TokenSection({ className }: TokenSectionProps) {
  const [copied, setCopied] = useState(false);
  const tradeUrl = getRiseRichTradeUrl(RISE_UP_ONLY);
  const canBuy = RISE_UP_ONLY.buyOnRiseEnabled && tradeUrl !== null;

  const onCopyMint = async () => {
    if (!RISE_UP_ONLY.mint) return;
    try {
      await navigator.clipboard.writeText(RISE_UP_ONLY.mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail in strict browser modes; keep silent.
    }
  };

  return (
    <section id="landing-token" className={cn("mb-20 scroll-mt-24 sm:mb-24", className)} aria-labelledby="landing-token-heading">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Liquid sleeve</p>
      <h2 id="landing-token-heading" className="landing-section-title mt-3 text-foreground">
        Align with <span className="uof-wordmark">$UPONLY</span>
      </h2>
      <p className="mt-4 max-w-3xl text-pretty text-sm text-muted-foreground sm:text-base md:text-[1.0625rem] md:leading-relaxed">
        The liquid <span className="font-mono text-foreground/88">$UPONLY</span> sleeve lets markets participate alongside
        our Solana allocator mandate—venue-native liquidity with on-chain verification. Confirm the mint, then trade or
        prep inside the command dashboard.
      </p>

      <Card className="landing-token-panel mt-10 grid gap-0 overflow-hidden rounded-xl border border-border/50 bg-card/45 p-0 sm:mt-12 lg:grid-cols-[1.15fr_minmax(0,0.95fr)]">
        <div className="min-w-0 border-border/45 p-6 sm:p-8 lg:border-r lg:py-10">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Token mint</p>
          <code className="mt-3 block break-all rounded-lg border border-border/55 bg-background/50 px-3.5 py-2.5 font-mono text-[0.8125rem] leading-relaxed text-foreground/92">
            {RISE_UP_ONLY.mint ?? "TBA"}
          </code>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="min-h-10 gap-2 rounded-lg" onClick={onCopyMint} disabled={!RISE_UP_ONLY.mint}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy mint"}
            </Button>
            {RISE_UP_ONLY.mint ? (
              <a
                href={`https://solscan.io/token/${RISE_UP_ONLY.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
              >
                View on Solscan
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3 border-t border-border/45 bg-muted/[0.12] p-6 sm:p-8 lg:border-t-0 lg:py-10">
          {canBuy && tradeUrl ? (
            <Button asChild size="lg" className="min-h-12 rounded-lg font-semibold">
              <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy on RISE
              </a>
            </Button>
          ) : (
            <Button type="button" size="lg" className="min-h-12 rounded-lg" disabled>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy on RISE
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="min-h-12 rounded-lg border-border/60 bg-background/60 font-medium">
            <Link to="/terminal">Open dashboard first</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Not financial advice. Tokens are volatile; only risk what you can afford to lose.</p>
        </div>
      </Card>
    </section>
  );
}
