"use client";

import { ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import { usePublicMetrics } from "@/lib/publicMetricsApi";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthPanelClass,
  growthProseClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

function formatUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatSyra(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortSig(sig: string) {
  if (sig.length <= 12) return sig;
  return `${sig.slice(0, 6)}…${sig.slice(-4)}`;
}

/**
 * Live "Revenue → $SYRA" proof panel — buyback totals + recent Solscan txs.
 */
export function GrowthBuybackProofPanel({ className }: { className?: string }) {
  const { data, isPending, isError } = usePublicMetrics();
  const buyback = data?.buyback;
  const rewards = data?.rewards;

  return (
    <div className={cn(growthPanelClass, "p-6 sm:p-8", className)} aria-labelledby="buyback-proof-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={growthKickerClass}>On-chain proof</p>
          <h3 id="buyback-proof-heading" className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
            Revenue → $SYRA
          </h3>
          <p className={cn(growthProseClass, "mt-2 max-w-xl text-sm")}>
            ~80% of settled x402 USDC goes to Jupiter buys. $SYRA acquired is the live treasury holding
            (verify the wallet on Solscan). Tokens fund usage rewards — not burned.
          </p>
        </div>
        <Link
          to="/rewards"
          className="text-sm font-medium text-foreground/85 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          View rewards →
        </Link>
      </div>

      {isPending && (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Loading buyback metrics…
        </p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-muted-foreground" role="alert">
          Buyback metrics unavailable. Retry shortly or check Solscan for the treasury wallet.
        </p>
      )}

      {buyback && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className={growthKickerClass}>Buyback spent</p>
              <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
                {formatUsd(buyback.totalBuybackUsdSpent)}
              </p>
            </div>
            <div>
              <p className={growthKickerClass}>$SYRA in treasury</p>
              <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
                {formatSyra(buyback.totalSyraAcquired ?? buyback.treasurySyraBalance)}
              </p>
            </div>
            <div>
              <p className={growthKickerClass}>Reward earners</p>
              <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
                {rewards?.uniqueEarners?.toLocaleString() ?? "—"}
              </p>
            </div>
          </div>

          {buyback.treasuryWallet && (
            <p className="mt-4 text-xs text-muted-foreground/80">
              Treasury:{" "}
              <a
                href={`https://solscan.io/account/${buyback.treasuryWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline-offset-2 hover:underline"
              >
                {shortSig(buyback.treasuryWallet)}
              </a>
              {buyback.lastBuybackSolscan && (
                <>
                  {" · "}
                  <a
                    href={buyback.lastBuybackSolscan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    Last buyback
                    <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                  </a>
                </>
              )}
            </p>
          )}

          {buyback.recentBuybacks?.length > 0 && (
            <div className="mt-6 border-t border-border/35 pt-5">
              <p className={growthKickerClass}>Recent buybacks</p>
              <ul className="mt-3 space-y-2" aria-label="Recent $SYRA buyback transactions">
                {buyback.recentBuybacks.slice(0, 5).map((tx) => (
                  <li
                    key={tx.swapSignature}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {formatUsd(tx.buybackUsd)}
                      {tx.syraAcquired != null ? ` → ${formatSyra(tx.syraAcquired)} $SYRA` : ""}
                      {tx.source && tx.source !== "x402_scheduler" ? (
                        <span className="ml-1 text-xs text-muted-foreground/70">(manual)</span>
                      ) : null}
                    </span>
                    {tx.solscanUrl ? (
                      <a
                        href={tx.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-foreground/80 underline-offset-2 hover:underline"
                      >
                        {shortSig(tx.swapSignature)}
                        <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortSig(tx.swapSignature)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!buyback.recentBuybacks?.length && buyback.totalBuybackUsdSpent === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              No production buybacks recorded yet. As paid API volume settles, flushes appear here with
              Solscan links.
            </p>
          )}
        </>
      )}
    </div>
  );
}
