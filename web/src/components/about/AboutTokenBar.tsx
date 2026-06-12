"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink, ShoppingBag } from "lucide-react";
import { QWERTI_MAGIC_LINK } from "@/data/qwerti";
import { SYRA_TOKEN_MINT, truncateBase58 } from "@/data/marketing/agentIdentity";
import { cn } from "@/lib/utils";

const DEXSCREENER_URL = `https://dexscreener.com/solana/${SYRA_TOKEN_MINT}`;
const PUMPFUN_URL = `https://pump.fun/coin/${SYRA_TOKEN_MINT}`;

const BUY_VENUES = [
  { id: "dexscreener", label: "DexScreener", href: DEXSCREENER_URL },
  { id: "pumpfun", label: "Pump.fun", href: PUMPFUN_URL },
] as const;

export function AboutTokenBar() {
  const [copied, setCopied] = useState(false);

  const copyMint = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SYRA_TOKEN_MINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard denied
    }
  }, []);

  return (
    <div className="about-token-dock" aria-label="$SYRA token contract and buy links">
      <div className="about-token-dock-inner">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 text-foreground/55" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
                Get $SYRA
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <code
                className="about-token-address inline-flex max-w-full items-center rounded-lg border border-border/45 bg-background/55 px-3 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur-sm sm:text-xs"
                title={SYRA_TOKEN_MINT}
              >
                <span className="truncate sm:hidden">{truncateBase58(SYRA_TOKEN_MINT, 8, 8)}</span>
                <span className="hidden truncate sm:inline">{SYRA_TOKEN_MINT}</span>
              </code>
              <button
                type="button"
                onClick={() => void copyMint()}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2",
                  "text-[11px] font-medium transition-all duration-200",
                  copied
                    ? "border-success/35 bg-success/10 text-success"
                    : "border-border/45 bg-background/40 text-muted-foreground hover:border-border/70 hover:text-foreground",
                )}
                title="Copy mint address"
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={QWERTI_MAGIC_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="about-token-venue about-token-venue-primary inline-flex items-center gap-1.5"
            >
              Qwerti
              <ExternalLink className="h-3 w-3 opacity-40" aria-hidden />
            </a>
            {BUY_VENUES.map(({ id, label, href }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="about-token-venue inline-flex items-center gap-1.5"
              >
                {label}
                <ExternalLink className="h-3 w-3 opacity-40" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
