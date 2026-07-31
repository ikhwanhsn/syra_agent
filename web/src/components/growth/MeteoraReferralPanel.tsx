import { ArrowUpRight, Gift } from "lucide-react";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  getMeteoraReferralCode,
  meteoraReferralUrl,
} from "@/lib/meteoraReferral";
import { cn } from "@/lib/utils";

type MeteoraReferralPanelProps = {
  className?: string;
  /** Compact layout for embedding inside cards / denser pages. */
  compact?: boolean;
};

/**
 * Drives human LPs to link Syra's Meteora Referral Staking code.
 * Attribution happens on Meteora after the user connects their wallet.
 * Only SOL/USDC-quote DLMM pools are eligible; referrer rewards are capped by MET stake.
 */
export function MeteoraReferralPanel({ className, compact = false }: MeteoraReferralPanelProps) {
  const code = getMeteoraReferralCode();
  const href = meteoraReferralUrl(code);

  return (
    <aside
      className={cn(
        overviewCardShell,
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
        className,
      )}
      aria-labelledby="meteora-referral-heading"
    >
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("marketplace") }}
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                overviewKickerClass,
                "inline-flex items-center gap-1.5",
              )}
            >
              <Gift className="h-3.5 w-3.5 text-violet-500" aria-hidden />
              Meteora referral
            </span>
            <span className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {code}
            </span>
          </div>
          <h2
            id="meteora-referral-heading"
            className={cn(
              "font-display font-semibold tracking-tight text-foreground",
              compact ? "text-base sm:text-lg" : "text-lg sm:text-xl",
            )}
          >
            Link once, earn +2% on your LP fees
          </h2>
          <p
            className={cn(
              "max-w-xl leading-relaxed text-muted-foreground",
              compact ? "text-xs sm:text-sm" : "text-sm",
            )}
          >
            Open Syra&apos;s Meteora referral link, connect your wallet, and link the code.
            Eligible SOL/USDC-quote DLMM positions earn an extra 2% of protocol fees on top of
            normal LP fees. Referrer rewards are capped by MET stake.
          </p>
        </div>

        <Button
          asChild
          className={cn(
            "h-11 shrink-0 gap-2 rounded-xl bg-violet-600 px-4 font-medium text-white hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 sm:h-10",
            compact && "w-full sm:w-auto",
          )}
        >
          <a href={href} target="_blank" rel="noopener noreferrer">
            Link referral on Meteora
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      </div>
    </aside>
  );
}
