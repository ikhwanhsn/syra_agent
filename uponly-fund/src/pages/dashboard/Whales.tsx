import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Crown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { useRiseDashboard, useRiseTransactionsBatch } from "@/lib/RiseDashboardContext";
import { EmptyState, GlassCard } from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { WhalesPreview } from "./previews/WhalesPreview";

type WhaleRow = {
  wallet: string;
  walletShort: string;
  txCount: number;
  volumeUsd: number;
};

function WhalesLive() {
  const { aggregate } = useRiseDashboard();
  const addresses = (aggregate.data?.topVolume24h ?? []).slice(0, 8).map((row) => row.mint);
  const txQueries = useRiseTransactionsBatch(addresses, 10);

  const whales = useMemo<WhaleRow[]>(() => {
    const grouped = new Map<string, WhaleRow>();
    for (const tx of txQueries.flatMap((query) => query.data?.transactions ?? [])) {
      if (!tx.wallet) continue;
      const current = grouped.get(tx.wallet) ?? {
        wallet: tx.wallet,
        walletShort: tx.walletShort ?? `${tx.wallet.slice(0, 4)}...${tx.wallet.slice(-4)}`,
        txCount: 0,
        volumeUsd: 0,
      };
      current.txCount += 1;
      current.volumeUsd += tx.amountUsd ?? 0;
      grouped.set(tx.wallet, current);
    }
    return Array.from(grouped.values())
      .sort((a, b) => b.volumeUsd - a.volumeUsd)
      .slice(0, 50);
  }, [txQueries]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title="Whales"
        description="Largest active wallets based on recent transaction volume across top RISE markets."
        eyebrow="Insights"
      />
      <GlassCard>
        {txQueries.every((query) => query.isPending) ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculating wallet flows...
          </p>
        ) : txQueries.some((query) => query.isError) ? (
          <EmptyState
            title="Could not compute whale leaderboard"
            description="Some transaction streams failed. Retry to rebuild the ranking."
            action={
              <Button size="sm" variant="secondary" onClick={() => txQueries.forEach((query) => query.refetch())}>
                Retry
              </Button>
            }
          />
        ) : whales.length === 0 ? (
          <EmptyState title="No whale data yet" description="Waiting for transaction stream from top markets." />
        ) : (
          <div className="flex flex-col gap-2">
            {whales.map((row, index) => (
              <div key={row.wallet} className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/20 px-3 py-2.5 text-xs">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/55 bg-background/50 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <Link
                  to={`/dashboard/wallet?wallet=${encodeURIComponent(row.wallet)}`}
                  className="min-w-0 flex-1 truncate rounded-md px-1 py-0.5 font-mono text-foreground underline-offset-2 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {row.walletShort}
                </Link>
                {index < 3 ? <Crown className="h-3.5 w-3.5 text-amber-400" aria-hidden /> : null}
                <span className="w-24 shrink-0 text-right text-muted-foreground">{formatInt(row.txCount)} tx</span>
                <span className="w-24 shrink-0 text-right font-medium text-foreground">
                  {formatUsd(row.volumeUsd, { compact: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function WhalesPage() {
  return (
    <TokenGate pageTitle="Whales" preview={<WhalesPreview />}>
      <WhalesLive />
    </TokenGate>
  );
}
