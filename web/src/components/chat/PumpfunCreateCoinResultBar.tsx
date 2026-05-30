import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PumpfunCreateCoinResultBarProps {
  mint: string;
  signature?: string;
  tokenSymbol?: string;
  tokenName?: string;
  className?: string;
}

function buildPostOnXUrl(mint: string, signature: string | undefined, tokenSymbol?: string, tokenName?: string): string {
  const pumpUrl = `https://pump.fun/coin/${mint}`;
  const label =
    tokenSymbol?.trim() ? `$${tokenSymbol.trim()}` : tokenName?.trim()?.slice(0, 40) || "New coin";
  const lines = [`Launched ${label} on pump.fun 🚀`, "", pumpUrl];
  if (signature?.trim()) {
    lines.push("", `Tx: https://solscan.io/tx/${signature.trim()}`);
  }
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function PumpfunCreateCoinResultBar({
  mint,
  signature,
  tokenSymbol,
  tokenName,
  className,
}: PumpfunCreateCoinResultBarProps) {
  const mintTrim = mint.trim();
  if (!mintTrim) return null;

  const pumpHref = `https://pump.fun/coin/${mintTrim}`;
  const solscanHref = signature?.trim() ? `https://solscan.io/tx/${signature.trim()}` : null;
  const postOnXHref = buildPostOnXUrl(mintTrim, signature, tokenSymbol, tokenName);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 p-3 ring-1 ring-inset ring-white/[0.04]",
        className,
      )}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
        Quick links
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="outline" size="sm" className="h-10 flex-1 justify-center gap-2 rounded-lg border-border/60 bg-background/80 sm:h-9 sm:min-w-[9.5rem] sm:flex-none" asChild>
          <a href={pumpHref} target="_blank" rel="noopener noreferrer">
            pump.fun
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          </a>
        </Button>
        {solscanHref ? (
          <Button variant="outline" size="sm" className="h-10 flex-1 justify-center gap-2 rounded-lg border-border/60 bg-background/80 sm:h-9 sm:min-w-[9.5rem] sm:flex-none" asChild>
            <a href={solscanHref} target="_blank" rel="noopener noreferrer">
              Solscan
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </a>
          </Button>
        ) : null}
        <Button variant="default" size="sm" className="h-10 flex-1 gap-2 rounded-lg font-semibold shadow-md shadow-primary/20 sm:h-9 sm:min-w-[9.5rem] sm:flex-none" asChild>
          <a href={postOnXHref} target="_blank" rel="noopener noreferrer">
            Post on X
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  );
}
