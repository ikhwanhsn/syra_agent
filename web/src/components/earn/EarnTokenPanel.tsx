import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, ExternalLink, Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { EarnTokenForm } from "@/components/earn/EarnTokenForm";
import { EarnTokenLogo } from "@/components/earn/EarnTokenLogo";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { usePillarAgentWallets } from "@/hooks/usePillarAgentWallets";
import {
  fetchEarnPumpfunLaunches,
  fetchEarnPumpfunMarketplace,
  type EarnPumpfunLaunch,
} from "@/lib/earnPumpfunApi";
import { formatPct } from "@/lib/dashboardOverviewAggregates";
import { formatPortfolioTokenAmount } from "@/lib/format";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type SortMode = "newest" | "mcap";

function formatTokenPriceUsd(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  return `$${formatPortfolioTokenAmount(price).display}`;
}

/** Always short — prevents vol/liq from wrapping or overflowing card cells. */
function formatCardUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  if (abs >= 1) return `$${Math.round(n)}`;
  if (abs > 0) return `$${n.toFixed(2)}`;
  return "—";
}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TokenCard({
  launch,
  staggerIndex = 0,
}: {
  launch: EarnPumpfunLaunch;
  staggerIndex?: number;
}) {
  const pumpUrl = `https://pump.fun/coin/${launch.mint}`;
  const detailPath = `/earn/token/${encodeURIComponent(launch.mint)}`;
  const change24 = launch.priceChange24hPercent;
  const hasChange = change24 != null && Number.isFinite(change24);
  const changeUp = hasChange && change24 > 0;
  const changeDown = hasChange && change24 < 0;

  return (
    <li
      className={cn(
        "group relative list-none overflow-hidden rounded-[1.35rem]",
        "border border-border/40 bg-card/40",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.35)]",
        "transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/70",
        "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_24px_48px_-32px_rgba(0,0,0,0.45)]",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
        aria-hidden
      />

      <Link
        to={detailPath}
        className="absolute inset-0 z-0 rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`View ${launch.name}`}
      />

      <div className="relative z-[1] flex flex-col gap-5 p-5 pointer-events-none sm:p-6">
        <div className="flex items-start gap-4">
          <EarnTokenLogo
            src={launch.imageUri}
            alt={launch.name}
            className="h-14 w-14 rounded-2xl border-border/30 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            iconClassName="h-6 w-6"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
                  {launch.name}
                </h3>
                <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground">
                  ${launch.symbol}
                </p>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/80">
                {formatRelativeTime(launch.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatTokenPriceUsd(launch.priceUsd)}
            </p>
            {hasChange ? (
              <p
                className={cn(
                  "shrink-0 font-mono text-sm font-medium tabular-nums",
                  changeUp && "text-emerald-600 dark:text-emerald-400",
                  changeDown && "text-rose-600 dark:text-rose-400",
                  !changeUp && !changeDown && "text-muted-foreground",
                )}
              >
                {formatPct(change24)}
              </p>
            ) : (
              <p className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground/60">—</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/30 pt-3 sm:gap-3">
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Mcap
              </p>
              <p
                className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-foreground/90"
                title={formatCardUsd(launch.marketCapUsd)}
              >
                {formatCardUsd(launch.marketCapUsd)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Vol
              </p>
              <p
                className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-foreground/90"
                title={formatCardUsd(launch.volume24hUsd)}
              >
                {formatCardUsd(launch.volume24hUsd)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Liq
              </p>
              <p
                className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-foreground/90"
                title={formatCardUsd(launch.liquidityUsd)}
              >
                {formatCardUsd(launch.liquidityUsd)}
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto mt-auto flex items-center justify-end pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 rounded-full px-3.5 text-[13px] text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href={pumpUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              Trade
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </Button>
        </div>
      </div>
    </li>
  );
}

type EarnTokenPanelProps = {
  baseAnonymousId: string | null;
  walletAddress: string | null;
  connected: boolean;
  syraAuthenticated: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
};

export function EarnTokenPanel({
  baseAnonymousId,
  walletAddress,
  connected,
  syraAuthenticated,
  onRequestAuth,
}: EarnTokenPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [launchOpen, setLaunchOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");

  const marketQueryKey = ["earn", "token-marketplace"] as const;
  const myLaunchesQueryKey = ["earn", "token-launches", baseAnonymousId ?? ""] as const;

  const pillars = usePillarAgentWallets(baseAnonymousId, walletAddress ?? "", {
    enabled: Boolean(baseAnonymousId && walletAddress),
    canProvision: connected && syraAuthenticated,
  });
  const earnBalances = pillars.getBalanceForPurpose("earn");

  const marketQ = useQuery({
    queryKey: marketQueryKey,
    queryFn: () => fetchEarnPumpfunMarketplace({ limit: 100 }),
    staleTime: 30_000,
  });

  const myLaunchesQ = useQuery({
    queryKey: myLaunchesQueryKey,
    queryFn: () => fetchEarnPumpfunLaunches(baseAnonymousId!),
    enabled: Boolean(connected && syraAuthenticated && baseAnonymousId),
    staleTime: 30_000,
  });

  const existingMint = myLaunchesQ.data?.launches?.[0]?.mint?.trim() || null;
  const hasExistingToken = Boolean(existingMint);
  const existingTokenPath = existingMint
    ? `/earn/token/${encodeURIComponent(existingMint)}`
    : null;

  const handleLaunch = async () => {
    if (!connected || !baseAnonymousId) {
      notify.error("Connect wallet", "Connect a wallet to launch a token.");
      return;
    }
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    if (existingMint) {
      notify.error("One token per wallet", "You can only create one token per wallet.");
      void navigate(`/earn/token/${encodeURIComponent(existingMint)}`);
      return;
    }
    const sol = earnBalances.solBalance;
    if (sol != null && sol <= 0) {
      notify.error(
        "Fund your Earn wallet",
        `Earn wallet needs SOL for pump.fun creation and the initial buy (current: ${sol.toFixed(4)} SOL). Fund via Earn wallet.`,
      );
      return;
    }
    setLaunchOpen(true);
  };

  const marketplace = marketQ.data?.launches ?? [];
  const showSkeleton = useMinimumSkeleton(marketQ.isLoading);
  const q = search.trim().toLowerCase();

  const visibleLaunches = [...marketplace]
    .filter((l) => {
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.symbol.toLowerCase().includes(q) ||
        l.mint.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortMode === "mcap") {
        const am = a.marketCapUsd != null && Number.isFinite(a.marketCapUsd) ? a.marketCapUsd : -1;
        const bm = b.marketCapUsd != null && Number.isFinite(b.marketCapUsd) ? b.marketCapUsd : -1;
        if (bm !== am) return bm - am;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <section className={cn("space-y-8", playgroundTabPanelEnter)}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-lg">
          <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            Tokens
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Community launches on pump.fun.
          </p>
        </div>
        {hasExistingToken && existingTokenPath ? (
          <Button
            className="h-11 shrink-0 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
            asChild
          >
            <Link to={existingTokenPath}>View your token</Link>
          </Button>
        ) : (
          <Button
            className="h-11 shrink-0 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
            onClick={() => void handleLaunch()}
          >
            <Plus className="h-4 w-4" />
            Launch
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={cn(
              "h-11 rounded-full border-border/40 bg-muted/20 pl-10 pr-4 shadow-none",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-border/60 focus-visible:bg-background/80 focus-visible:ring-1 focus-visible:ring-foreground/10",
            )}
            aria-label="Search token launches"
          />
        </div>

        <div
          className="inline-flex rounded-full border border-border/40 bg-muted/15 p-1"
          role="listbox"
          aria-label="Sort"
        >
          {(
            [
              { value: "newest" as const, label: "New" },
              { value: "mcap" as const, label: "Mcap" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={sortMode === opt.value}
              className={cn(
                "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                sortMode === opt.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setSortMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[15.5rem] animate-pulse rounded-[1.35rem] border border-border/30 bg-muted/15"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : marketQ.isError ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load launches</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Try again in a moment.</p>
          <Button className="mt-6 rounded-full" variant="outline" onClick={() => void marketQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visibleLaunches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/40 bg-muted/20">
            <Coins className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {q ? "No matches" : "Nothing here yet"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {q ? "Try a different search." : "Be the first to launch."}
          </p>
          {q ? (
            <Button className="mt-6 rounded-full" variant="outline" onClick={() => setSearch("")}>
              Clear
            </Button>
          ) : hasExistingToken && existingTokenPath ? (
            <Button className="mt-6 rounded-full" asChild>
              <Link to={existingTokenPath}>View your token</Link>
            </Button>
          ) : (
            <Button className="mt-6 gap-1.5 rounded-full" onClick={() => void handleLaunch()}>
              <Plus className="h-4 w-4" />
              Launch
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLaunches.map((launch, index) => (
            <TokenCard key={launch.id} launch={launch} staggerIndex={index} />
          ))}
        </ul>
      )}

      <EarnTokenForm
        open={launchOpen}
        onOpenChange={setLaunchOpen}
        onLaunched={() => {
          void queryClient.invalidateQueries({ queryKey: marketQueryKey });
          void queryClient.invalidateQueries({ queryKey: myLaunchesQueryKey });
          void pillars.refreshSet();
        }}
      />
    </section>
  );
}
