import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, ExternalLink, Wallet, Zap } from "lucide-react";
import { usePublicMetrics } from "@/lib/publicMetricsApi";
import { cn } from "@/lib/utils";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function MetricCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border p-5 backdrop-blur-sm",
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border/60 bg-card/40",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );
}

export default function MetricsPage() {
  const { data, isLoading, isError, error } = usePublicMetrics();

  useEffect(() => {
    document.title = "Syra Metrics · Live x402 traction";
    return () => {
      document.title = "Machine Money for Agents | Syra";
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(600px_240px_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Live · on-chain verifiable</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Syra x402 Metrics</h1>
          <p className="max-w-2xl text-muted-foreground">
            Public traction for the Solana money layer — paid API calls, USDC settled, unique agent wallets.
            Same transparency model as{" "}
            <a
              href="https://blockrun.ai/metrics"
              className="text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              BlockRun
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/reference/scalper"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/50 px-3 py-1.5 text-sm hover:bg-card"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Reference agent
            </Link>
            <a
              href="https://api.syraa.fun/api/metrics"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/50 px-3 py-1.5 text-sm hover:bg-card"
              target="_blank"
              rel="noreferrer"
            >
              JSON API
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading metrics…</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load metrics"}
          </p>
        ) : null}

        {data ? (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total paid calls"
                value={formatNum(data.lifetime.totalCalls)}
                hint={`${formatNum(data.last24h.calls)} last 24h`}
                highlight
              />
              <MetricCard
                label="USDC settled"
                value={`$${data.lifetime.totalUsdSettled.toLocaleString()}`}
                hint={`$${data.last24h.usdSettled.toFixed(2)} last 24h`}
                highlight
              />
              <MetricCard
                label="Unique paying wallets"
                value={formatNum(data.lifetime.uniquePayingWallets)}
              />
              <MetricCard
                label="Avg per call"
                value={`$${data.lifetime.avgUsdPerCall.toFixed(4)}`}
              />
            </div>

            <section className="rounded-2xl border border-border/60 bg-card/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Treasury addresses</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{data.verifyOnChain.hint}</p>
              <dl className="space-y-3 text-sm">
                {data.treasury.base ? (
                  <div>
                    <dt className="text-muted-foreground">Base USDC</dt>
                    <dd className="font-mono text-xs break-all sm:text-sm">
                      {data.treasury.base}
                      {data.verifyOnChain.explorers.base ? (
                        <a
                          href={data.verifyOnChain.explorers.base}
                          className="ml-2 text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Basescan
                        </a>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                {data.treasury.solana ? (
                  <div>
                    <dt className="text-muted-foreground">Solana USDC</dt>
                    <dd className="font-mono text-xs break-all sm:text-sm">
                      {data.treasury.solana}
                      {data.verifyOnChain.explorers.solana ? (
                        <a
                          href={data.verifyOnChain.explorers.solana}
                          className="ml-2 text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Solscan
                        </a>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {data.byPath.length > 0 ? (
              <section className="rounded-2xl border border-border/60 bg-card/30 p-5">
                <h2 className="mb-4 font-semibold">Top endpoints</h2>
                <ul className="space-y-2 text-sm">
                  {data.byPath.slice(0, 10).map((row) => (
                    <li key={row.path} className="flex justify-between gap-4">
                      <span className="font-mono text-muted-foreground">{row.path}</span>
                      <span className="tabular-nums">{formatNum(row.count)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.recentCalls.length > 0 ? (
              <section className="rounded-2xl border border-border/60 bg-card/30 p-5">
                <h2 className="mb-4 font-semibold">Recent paid calls</h2>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {data.recentCalls.slice(0, 8).map((call, i) => (
                    <li key={`${call.at}-${i}`} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                      <span className="font-mono text-muted-foreground">{call.path}</span>
                      <span className="tabular-nums">
                        ${call.amountUsd.toFixed(4)} · {call.payer ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Updated {new Date(data.updatedAt).toLocaleString()} · Machine-readable:{" "}
              <a href="https://api.syraa.fun/api/live/calls" className="text-primary hover:underline">
                SSE live feed
              </a>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
