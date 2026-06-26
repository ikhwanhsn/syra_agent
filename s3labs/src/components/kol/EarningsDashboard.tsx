import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { ExternalLink } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import { fetchWalletEarnings } from "@/lib/kolApi";
import { shortenAddress } from "@/lib/solanaKol";
import { Badge } from "@/components/ui/badge";

function formatSol(sol: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(sol);
}

export function EarningsDashboard() {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["kol-earnings", address],
    queryFn: () => fetchWalletEarnings(address!),
    enabled: Boolean(address),
  });

  return (
    <div className="space-y-6">
      <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">My Earnings</p>
            <h2 className="heading-section">KOL wallet dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Projected rewards update daily. Final payout is sent automatically at campaign snapshot.
            </p>
          </div>
        </div>

        {!address ? (
          <p className="text-sm text-muted-foreground mt-6">Connect your wallet from the navbar to view earnings.</p>
        ) : isLoading ? (
          <div className="mt-6">
            <PageLoader label="Loading earnings" variant="inline" />
          </div>
        ) : data ? (
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Projected (active)</p>
              <p className="text-2xl font-semibold text-primary mt-1">
                {formatSol(data.totals.projectedSol)} SOL
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid out</p>
              <p className="text-2xl font-semibold mt-1">{formatSol(data.totals.paidSol)} SOL</p>
            </div>
          </div>
        ) : null}

        {address && data ? (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-muted-foreground hover:text-primary mt-4"
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        ) : null}
      </div>

      {data?.active.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">Active campaigns</h3>
          <div className="grid gap-3">
            {data.active.map((row) => (
              <div
                key={row.submission.id}
                className="panel-glass rounded-xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{row.campaign.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{row.submission.authorHandle} · score {row.submission.latestScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-semibold">
                    {formatSol(row.submission.projectedSol)} SOL
                  </p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {row.submission.mode}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data?.paid.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">Paid history</h3>
          <div className="grid gap-3">
            {data.paid.map((row) => (
              <div
                key={row.submission.id}
                className="panel-glass rounded-xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{row.campaign.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {shortenAddress(row.submission.kolWallet, 6)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatSol(row.payout?.sol ?? 0)} SOL</p>
                  {row.payout?.txSignature ? (
                    <a
                      href={`https://solscan.io/tx/${row.payout.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1"
                    >
                      View tx
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
