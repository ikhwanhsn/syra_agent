import { useQueries, useQuery } from "@tanstack/react-query";
import { ExternalLink, Lock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnYieldPanelSkeleton } from "@/components/earn/EarnSkeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  type EarnDenom,
  type EarnYieldProduct,
  type EarnYieldUserStatus,
} from "@/lib/earnYieldApi";
import {
  earnProductIcon,
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

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Choose a strategy",
    body: "Pick one that matches how much risk you are comfortable with.",
  },
  {
    step: 2,
    title: "Deposit into your wallet",
    body: "You fund your own agent wallet. Syra never holds your keys.",
  },
  {
    step: 3,
    title: "Syra invests for you",
    body: "The strategy runs automatically. You can pause or stop anytime.",
  },
] as const;

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
      <EarnPanelHeader
        title="Earn on your crypto"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/wallet?wallet=earn">
              Your wallets
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
        }
      />

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Pick a strategy, deposit into your own wallet, and Syra runs it for you. You stay in
        control and can stop anytime. Past results are not a guarantee.
      </p>

      <HowItWorksStrip />

      {boardQ.isLoading ? (
        <EarnYieldPanelSkeleton includeHeader={false} />
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
            <section className="space-y-3" aria-labelledby="earn-yield-available">
              <h2
                id="earn-yield-available"
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                Available now
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {openProducts.map((product) => (
                  <StrategyBrowseCard
                    key={product.id}
                    product={product}
                    active={Boolean(statusByProduct.get(product.id)?.enabled)}
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
              <div className="grid gap-3 sm:grid-cols-2">
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
  active,
}: {
  product: EarnYieldProduct;
  active: boolean;
}) {
  const Icon = earnProductIcon(product);
  const denom = (product.denom || "SOL") as EarnDenom;
  const minDep = product.minDeposit ?? 1;
  const maxDep = product.maxDeposit ?? 5;
  const feePct = product.performanceFeePct ?? 10;
  const detailTo = `/earn/yield/${encodeURIComponent(product.id)}`;
  const pitch = product.summary || product.description;
  const trackSummary = summarizeTrackRecord(product.stats, denom);
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

      <p className="text-sm leading-relaxed text-foreground">{trackSummary}</p>

      <p className="text-xs text-muted-foreground">
        Deposit {minDep}-{maxDep} {denom} · Fee {feePct}% on profit only
      </p>

      <span
        className={cn(
          "mt-auto inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium sm:w-auto",
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

function HowItWorksStrip() {
  return (
    <div
      className={cn(
        overviewCardShell,
        "grid gap-4 p-4 sm:grid-cols-3 sm:gap-3 sm:p-5",
      )}
      aria-label="How earning works"
    >
      {HOW_IT_WORKS_STEPS.map((item) => (
        <div key={item.step} className="flex gap-3 sm:flex-col sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/50 text-[11px] font-semibold tabular-nums text-foreground">
            {item.step}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
