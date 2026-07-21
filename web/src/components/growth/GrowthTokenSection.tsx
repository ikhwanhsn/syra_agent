"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import { SYRA_BUY_SWAP_URL } from "@/lib/swapNavigation";
import { SYRA_TOKEN_MINT, truncateBase58 } from "@/data/marketing/agentIdentity";
import { SYRA_TOKEN_PAGE_PATH } from "@/content/syraFocus";
import { cn } from "@/lib/utils";
import {
  growthCtaPrimaryClass,
  growthCtaSecondaryClass,
  growthKickerClass,
  growthPanelClass,
  growthProseClass,
  growthSectionTitleClass,
} from "@/components/growth/growthHomeStyles";

const DEXSCREENER_URL = `https://dexscreener.com/solana/${SYRA_TOKEN_MINT}`;
const PUMPFUN_URL = `https://pump.fun/coin/${SYRA_TOKEN_MINT}`;

/**
 * Single-panel $SYRA acquisition block for the growth home — no nested cards.
 */
export function GrowthTokenSection() {
  const [copied, setCopied] = useState(false);

  const copyMint = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SYRA_TOKEN_MINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }, []);

  return (
    <section id="token" className="scroll-mt-24" aria-labelledby="token-heading">
      <div className="mb-8 max-w-xl">
        <p
          className={cn(
            growthKickerClass,
            "mb-2 inline-flex items-center gap-2.5 before:h-px before:w-5 before:bg-foreground/20",
          )}
        >
          $SYRA
        </p>
        <h2 id="token-heading" className={growthSectionTitleClass}>
          The machine-money token
        </h2>
        <p className={cn(growthProseClass, "mt-3")}>
          Utility for the layer agents settle on. Product growth is paid calls; $SYRA rides the same
          rails.
        </p>
      </div>

      <div className={cn(growthPanelClass, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            <p className={growthKickerClass}>Contract</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code
                className="inline-flex max-w-full items-center rounded-xl border border-border/45 bg-background/50 px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground sm:text-xs"
                title={SYRA_TOKEN_MINT}
              >
                <span className="truncate sm:hidden">{truncateBase58(SYRA_TOKEN_MINT, 8, 8)}</span>
                <span className="hidden truncate sm:inline">{SYRA_TOKEN_MINT}</span>
              </code>
              <button
                type="button"
                onClick={() => void copyMint()}
                className={cn(
                  "inline-flex h-10 min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  copied
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                    : "border-border/45 bg-background/40 text-muted-foreground hover:border-border/70 hover:text-foreground",
                )}
                aria-label="Copy $SYRA mint address"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/75">
              Solana mainnet · verify mint before you swap
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-stretch lg:min-w-[280px]">
            <Link to={SYRA_BUY_SWAP_URL} className={cn(growthCtaPrimaryClass, "w-full sm:w-auto")}>
              Swap SOL → $SYRA
            </Link>
            <div className="flex flex-wrap gap-2">
              <a
                href={DEXSCREENER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(growthCtaSecondaryClass, "h-10 min-h-10 flex-1 gap-1.5 px-4 text-xs")}
              >
                DexScreener
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
              <a
                href={PUMPFUN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(growthCtaSecondaryClass, "h-10 min-h-10 flex-1 gap-1.5 px-4 text-xs")}
              >
                Pump.fun
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/35 pt-6">
          <Link
            to={SYRA_TOKEN_PAGE_PATH}
            className="text-sm font-medium text-foreground/85 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Token details
          </Link>
          <Link
            to="/staking"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Stake $SYRA
          </Link>
          <a
            href="https://docs.syraa.fun/docs/token/tokenomics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Tokenomics
            <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
