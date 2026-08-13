import { useQueries, useQuery } from "@tanstack/react-query";
import { Lock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { EarnYieldPanelSkeleton } from "@/components/earn/EarnSkeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  type EarnDenom,
  type EarnYieldProduct,
  type EarnYieldUserStatus,
} from "@/lib/earnYieldApi";
import {
  earnProductIcon,
  fmtEarnBalance,
  riskLevelLabel,
  summarizeTrackRecord,
} from "@/lib/earnYieldUi";
import { cn } from "@/lib/utils";

type EarnYieldPanelProps = {
  anonymousId: string | null | undefined;
  walletAddress: string | null | undefined;
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
};

export function EarnYieldPanel({
  anonymousId,
  walletAddress,
  syraAuthenticated,
}: EarnYieldPanelProps) {
  const boardQ = useQuery({
    queryKey: ["earn", "yield", "board", walletAddress ?? ""],
    queryFn: () => fetchEarnYieldBoard(walletAddress),
    staleTime: 60_000,
  });

  const products = useMemo(() => boardQ.data?.products ?? [], [boardQ.data?.products]);
  const openProducts = useMemo(
    () => products.filter((p) => p.status === "beta"),
    [products],
  );
  const comingSoonProducts = useMemo(
    () => products.filter((p) => p.status !== "beta"),
    [products],
  );

  const statusQueries = useQueries({
    queries: openProducts.map((p) => ({
      queryKey: ["earn", "yield", "status", p.id, anonymousId ?? ""],
      queryFn: () => fetchEarnYieldStatus(anonymousId, p.id),
      enabled: Boolean(anonymousId && syraAuthenticated && p.id),
      staleTime: 15_000,
    })),
  });

  const statusByProduct = useMemo(() => {
    const map = new Map<string, EarnYieldUserStatus>();
    openProducts.forEach((p, i) => {
      const data = statusQueries[i]?.data;
      if (data) map.set(p.id, data);
    });
    return map;
  }, [openProducts, statusQueries]);

  const board = boardQ.data;

  return (
    <div className="space-y-6">
      {boardQ.isLoading ? (
        <EarnYieldPanelSkeleton />
      ) : boardQ.isError ? (
        <div className={cn(overviewCardShell, "space-y-2 p-4")}>
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load yield strategies.</p>
          <p className="text-xs text-muted-foreground">Try refreshing the page in a moment.</p>
        </div>
      ) : products.length === 0 ? (
        <div className={cn(overviewCardShell, "space-y-2 p-5 text-center")}>
          <p className="text-sm font-medium text-foreground">No strategies listed yet</p>
          <p className="text-xs text-muted-foreground">
            Check back soon. New strategies appear here once they are ready.
          </p>
        </div>
      ) : (
        <>
          {openProducts.length > 0 ? (
            <section className="space-y-3" aria-label="Available strategies">
              <div
                className={cn(
                  "grid gap-3",
                  openProducts.length === 1 ? "grid-cols-1" : "sm:grid-cols-2",
                )}
              >
                {openProducts.map((product) => (
                  <StrategyBrowseCard
                    key={product.id}
                    product={product}
                    status={statusByProduct.get(product.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {comingSoonProducts.length > 0 ? (
            <section className="space-y-3" aria-labelledby="earn-yield-coming-soon">
              <h2
                id="earn-yield-coming-soon"
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                Coming soon
              </h2>
              <div
                className={cn(
                  "grid gap-3",
                  comingSoonProducts.length === 1 ? "grid-cols-1" : "sm:grid-cols-2",
                )}
              >
                {comingSoonProducts.map((product) => (
                  <ComingSoonCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}

          {board?.disclosures && board.disclosures.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Disclosures
              </p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {board.disclosures.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StrategyBrowseCard({
  product,
  status,
}: {
  product: EarnYieldProduct;
  status?: EarnYieldUserStatus;
}) {
  const Icon = earnProductIcon(product);
  const denom = (product.denom || "SOL") as EarnDenom;
  const minDep = product.minDeposit ?? 1;
  const maxDep = product.maxDeposit ?? 5;
  const feePct = product.performanceFeePct ?? 10;
  const detailTo = `/earn/yield/${encodeURIComponent(product.id)}`;
  const pitch = product.summary || product.description;
  const trackSummary = summarizeTrackRecord(product.stats, denom);
  const active = Boolean(status?.enabled);
  const deployed = status?.wallet?.deployedSol ?? 0;
  const onChain = status?.wallet?.onChainBalanceSol ?? 0;
  const deposit =
    status?.wallet?.strategyDepositSol ??
    status?.config?.earnDepositSol ??
    status?.config?.publicMaxDepositSol ??
    null;
  const walletTotal =
    status?.wallet?.walletTotalSol ?? (status?.wallet != null ? deployed + onChain : null);
  const ctaLabel = active ? "Manage" : "View strategy";

  return (
    <Link
      to={detailTo}
      className={cn(
        overviewCardShell,
        "flex flex-col gap-4 p-5 transition-colors",
        "hover:border-border/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`${product.label}. ${ctaLabel}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{product.label}</h3>
            {active ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <Play className="h-3 w-3" aria-hidden />
                Active
              </span>
            ) : null}
            {product.riskLevel ? (
              <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                {riskLevelLabel(product.riskLevel)}
              </span>
            ) : null}
            <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              {denom}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{pitch}</p>
        </div>
      </div>

      {active && deposit != null && deposit > 0 ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Your deposit
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {fmtEarnBalance(deposit, denom)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Wallet total
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {fmtEarnBalance(walletTotal, denom)}
              </p>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {deployed > 0
              ? `${fmtEarnBalance(deployed, denom)} in positions · rest waiting`
              : "Deposit allocated · waiting to invest"}
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground">{trackSummary}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Limit {minDep}-{maxDep} {denom} · Fee {feePct}% on profit only
      </p>

      <span
        className={cn(
          "mt-auto inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium",
          "bg-primary text-primary-foreground",
        )}
        aria-hidden
      >
        {ctaLabel}
      </span>
    </Link>
  );
}

function ComingSoonCard({ product }: { product: EarnYieldProduct }) {
  const Icon = earnProductIcon(product);
  const denom = (product.denom || "SOL") as EarnDenom;
  const pitch = product.summary || product.description;

  return (
    <div
      className={cn(overviewCardShell, "relative overflow-hidden p-5")}
      aria-label={`${product.label}, coming soon`}
      role="group"
    >
      <div
        className="pointer-events-none select-none space-y-4 blur-[3px] opacity-60"
        aria-hidden
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{product.label}</p>
              {product.riskLevel ? (
                <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {riskLevelLabel(product.riskLevel)}
                </span>
              ) : null}
              <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                {denom}
              </span>
            </div>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{pitch}</p>
          </div>
        </div>
        <p className="text-sm text-foreground">Still building a track record.</p>
        <div className="h-10 w-full rounded-md bg-muted/40" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/40 px-4">
        <div className="flex max-w-[16rem] flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/95 px-4 py-3 text-center shadow-sm backdrop-blur-sm">
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground">
            Coming soon
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Still being proven before it opens.
          </p>
        </div>
      </div>
    </div>
  );
}
