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
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Token</p>
      <h2 id="landing-token-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Buy <span className="uof-wordmark">$UPONLY</span>
      </h2>
      <p className="mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
        The official Syra x RISE token is live on RISE. Verify the mint, then buy from the venue or use the dashboard before trading.
      </p>

      <Card className="mt-8 grid gap-5 border-border/50 bg-gradient-to-b from-card/55 to-card/15 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Token mint</p>
          <code className="mt-2 block break-all rounded-lg border border-border/50 bg-background/40 px-3 py-2 font-mono text-xs text-foreground/90">
            {RISE_UP_ONLY.mint ?? "TBA"}
          </code>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="min-h-10 gap-2" onClick={onCopyMint} disabled={!RISE_UP_ONLY.mint}>
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

        <div className="flex min-w-0 flex-col justify-center gap-3">
          {canBuy && tradeUrl ? (
            <Button asChild size="lg" className="min-h-12">
              <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy on RISE
              </a>
            </Button>
          ) : (
            <Button type="button" size="lg" className="min-h-12" disabled>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy on RISE
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="min-h-12">
            <Link to="/dashboard">Open dashboard first</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Not financial advice. Tokens are volatile; only risk what you can afford to lose.</p>
        </div>
      </Card>
    </section>
  );
}
