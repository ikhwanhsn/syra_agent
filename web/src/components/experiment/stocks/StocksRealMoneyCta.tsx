import { Link } from "@/lib/navigation";
import { ArrowRight, Sparkles, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

/**
 * Real-money paths that already settle (not Stocks Earn Yield deposits).
 * Stocks News Lab stays paper-only until graduation clears.
 */
export function StocksRealMoneyCta({ className }: { className?: string }) {
  return (
    <section
      className={cn(overviewCardShell, "rounded-3xl p-5 sm:p-6", className)}
      aria-labelledby="stocks-real-money-heading"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn(overviewKickerClass, "text-muted-foreground")}>Real money elsewhere</p>
        <Badge
          variant="outline"
          className="rounded-lg border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
        >
          Not Earn Yield
        </Badge>
      </div>
      <h2
        id="stocks-real-money-heading"
        className="mt-2 text-balance text-lg font-semibold tracking-tight text-foreground"
      >
        Try paid intel or Skills, not Stocks deposits
      </h2>
      <p className="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
        This lab is paper trading only. Earn Yield deposits for Stocks are blocked until a real
        executor and compliance review clear. Use surfaces that already settle USDC today.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/45 bg-background/40 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-sky-500" aria-hidden />
            <p className="text-sm font-semibold">Equity intelligence</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Pay-per-call `/equity` and `/spcx` at $0.02 via x402. Nasdaq vs on-chain spread, not
            strategy deposits.
          </p>
          <Button asChild size="sm" className="mt-3 h-9 rounded-xl">
            <Link to="/marketplace">
              Open marketplace
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/45 bg-background/40 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <Wallet className="h-4 w-4 text-emerald-500" aria-hidden />
            <p className="text-sm font-semibold">Earn Skills</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Call or publish HTTPS APIs agents pay for. Micropayments to creator wallets, not Stocks
            Yield.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3 h-9 rounded-xl">
            <Link to="/earn?track=skills">
              Open Earn Skills
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
