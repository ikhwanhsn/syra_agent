import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Coins,
  ExternalLink,
  Loader2,
  Plus,
  Rocket,
  Search,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { EarnTokenForm } from "@/components/earn/EarnTokenForm";
import { EarnTokenLogo } from "@/components/earn/EarnTokenLogo";
import {
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import {
  playgroundApiCardClass,
  playgroundChipClass,
  playgroundEmptyStateClass,
  playgroundFilterRailClass,
  playgroundHeroCard,
  playgroundHeroGlow,
  playgroundSearchClass,
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
  playgroundStatLabel,
  playgroundStatTile,
  playgroundStatValue,
  playgroundToolbarClass,
} from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { usePillarAgentWallets } from "@/hooks/usePillarAgentWallets";
import { siblingAnonymousId } from "@/lib/agentWalletPurpose";
import {
  collectEarnPumpfunFees,
  fetchEarnPumpfunLaunches,
  fetchEarnPumpfunMarketplace,
  shortenMint,
  type EarnPumpfunLaunch,
} from "@/lib/earnPumpfunApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type ListView = "all" | "yours";
type SortMode = "newest" | "claimed";

function formatSolFromLamports(lamports: string | null | undefined): string | null {
  if (!lamports) return null;
  const n = Number(lamports);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n / 1e9).toFixed(n >= 1e8 ? 2 : 4);
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
  isOwner,
  collecting,
  onCollect,
  staggerIndex = 0,
}: {
  launch: EarnPumpfunLaunch;
  isOwner: boolean;
  collecting: boolean;
  onCollect: (mint: string) => void;
  staggerIndex?: number;
}) {
  const buySol = formatSolFromLamports(launch.initialBuyLamports);
  const claimed = Boolean(launch.lastFeeCollectSignature || launch.lastFeeCollectedAt);
  const pumpUrl = `https://pump.fun/coin/${launch.mint}`;

  const detailPath = `/earn/token/${encodeURIComponent(launch.mint)}`;

  return (
    <li
      className={cn(
        playgroundApiCardClass(false),
        "list-none animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
              pump.fun
            </span>
            {isOwner ? (
              <span className="inline-flex rounded-md bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary ring-1 ring-primary/20">
                Yours
              </span>
            ) : null}
            {claimed ? (
              <span className="inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                Fees claimed
              </span>
            ) : null}
          </div>
          <span className="rounded-md bg-muted/40 px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40">
            {formatRelativeTime(launch.createdAt)}
          </span>
        </div>

        <Link to={detailPath} className="mb-3 flex items-start gap-3 rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
          <EarnTokenLogo
            src={launch.imageUri}
            alt={launch.name}
            className="h-12 w-12 rounded-xl"
            iconClassName="h-5 w-5"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary">
              {launch.name}{" "}
              <span className="font-mono text-sm font-medium text-muted-foreground">${launch.symbol}</span>
            </h3>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={launch.mint}>
              {shortenMint(launch.mint)}
            </p>
          </div>
        </Link>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Initial buy</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {buySol ?? "—"}{" "}
              {buySol ? <span className="text-xs font-medium text-muted-foreground">SOL</span> : null}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Creator</p>
            <p
              className="mt-0.5 truncate font-mono text-sm font-semibold tracking-tight text-foreground"
              title={launch.earnAgentAddress}
            >
              {isOwner ? "You" : launch.earnAgentAddress ? shortenMint(launch.earnAgentAddress) : "Creator"}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
          <Button size="sm" variant="ghost" className="h-9 gap-1.5 rounded-xl px-2.5 text-muted-foreground" asChild>
            <Link to={detailPath}>
              Details
            </Link>
          </Button>

          {isOwner ? (
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm"
              disabled={collecting}
              onClick={() => onCollect(launch.mint)}
            >
              {collecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim fees"}
              {!collecting ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
            </Button>
          ) : (
            <Button size="sm" className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm" asChild>
              <a href={pumpUrl} target="_blank" rel="noreferrer">
                Trade
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
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
  onSignIn,
  onRequestAuth,
}: EarnTokenPanelProps) {
  const queryClient = useQueryClient();
  const { syraAuthReady } = useSyraAuth();
  const [launchOpen, setLaunchOpen] = useState(false);
  const [collectingMint, setCollectingMint] = useState<string | null>(null);
  const [listView, setListView] = useState<ListView>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");

  const mineQueryKey = ["earn", "token-launches", baseAnonymousId] as const;
  const marketQueryKey = ["earn", "token-marketplace"] as const;

  const earnAnonymousId = baseAnonymousId ? siblingAnonymousId(baseAnonymousId, "earn") : null;

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

  const mineQ = useQuery({
    queryKey: mineQueryKey,
    queryFn: () => fetchEarnPumpfunLaunches(baseAnonymousId!),
    enabled: Boolean(baseAnonymousId) && syraAuthenticated,
    staleTime: 30_000,
  });

  const collectMutation = useMutation({
    mutationFn: (mint: string) => collectEarnPumpfunFees(mint),
    onMutate: (mint) => setCollectingMint(mint),
    onSettled: () => setCollectingMint(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mineQueryKey });
      void queryClient.invalidateQueries({ queryKey: marketQueryKey });
      void pillars.refreshSet();
    },
  });

  const handleLaunch = async () => {
    if (!connected || !baseAnonymousId) return;
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
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

  const authPending = connected && syraAuthReady && !syraAuthenticated;
  const marketplace = marketQ.data?.launches ?? [];
  const mine = mineQ.data?.launches ?? [];
  const resolvedEarnId = mineQ.data?.earnAnonymousId ?? earnAnonymousId;

  const loading =
    marketQ.isLoading || (listView === "yours" && Boolean(mineQ.isLoading && syraAuthenticated));
  const showSkeleton = useMinimumSkeleton(loading);

  const source = listView === "yours" ? mine : marketplace;
  const q = search.trim().toLowerCase();

  const visibleLaunches =
    listView === "yours" && (!syraAuthenticated || !connected)
      ? []
      : [...source]
          .filter((l) => {
            if (!q) return true;
            return (
              l.name.toLowerCase().includes(q) ||
              l.symbol.toLowerCase().includes(q) ||
              l.mint.toLowerCase().includes(q) ||
              (l.earnAgentAddress ?? "").toLowerCase().includes(q)
            );
          })
          .sort((a, b) => {
            if (sortMode === "claimed") {
              const ac = a.lastFeeCollectedAt ? 1 : 0;
              const bc = b.lastFeeCollectedAt ? 1 : 0;
              if (bc !== ac) return bc - ac;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

  const claimedCount = marketplace.filter((l) => l.lastFeeCollectSignature || l.lastFeeCollectedAt).length;
  const mineMints = new Set(mine.map((l) => l.mint));

  return (
    <section className={cn("space-y-5", playgroundTabPanelEnter)}>
      <div className={playgroundHeroCard}>
        <div className={cn(overviewCardGlow, playgroundHeroGlow)} aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className={overviewKickerClass}>Earn · Tokens</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Token launches
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Browse community pump.fun launches from every creator. Launch from your earn wallet and claim trading fees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Launches</p>
              <p className={playgroundStatValue}>{marketplace.length}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Fees claimed</p>
              <p className={playgroundStatValue}>{claimedCount}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Yours</p>
              <p className={playgroundStatValue}>{mine.length}</p>
            </div>
            <Button variant="outline" className="h-11 gap-1.5 rounded-xl px-4 shadow-sm" asChild>
              <Link to="/wallet?wallet=earn">
                <Wallet className="h-4 w-4" />
                Earn wallet
              </Link>
            </Button>
            <Button
              className="h-11 gap-1.5 rounded-xl px-4 shadow-sm"
              onClick={() => void handleLaunch()}
              disabled={!connected || !baseAnonymousId}
            >
              <Plus className="h-4 w-4" />
              Launch
            </Button>
          </div>
        </div>
      </div>

      {connected && syraAuthenticated ? (
        <div className={cn(overviewCardShell, "grid gap-3 p-4 sm:grid-cols-3 sm:p-5")}>
          <div className="rounded-xl border border-border/40 bg-background/45 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Earn SOL</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
              {earnBalances.solBalance != null ? earnBalances.solBalance.toFixed(4) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/45 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Earn USDC</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
              {earnBalances.usdcBalance != null ? earnBalances.usdcBalance.toFixed(2) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/45 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your launches</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">{mine.length}</p>
          </div>
        </div>
      ) : authPending ? (
        <div
          className={cn(
            overviewCardShell,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Rocket className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Sign in to launch tokens and claim creator fees to your earn wallet.
            </p>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : !connected ? (
        <div
          className={cn(
            overviewCardShell,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5",
          )}
        >
          <p className="text-sm text-muted-foreground">
            Connect a wallet to launch. You can still browse community tokens below.
          </p>
        </div>
      ) : null}

      <div className={playgroundToolbarClass}>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ticker, mint…"
            className={playgroundSearchClass}
            aria-label="Search token launches"
          />
        </div>

        <div className={playgroundSegmentedRoot(2)} role="tablist" aria-label="Token scope">
          <button
            type="button"
            role="tab"
            aria-selected={listView === "all"}
            className={playgroundSegmentedTrigger(listView === "all")}
            onClick={() => setListView("all")}
          >
            All
            {marketplace.length > 0 ? (
              <span className="tabular-nums text-muted-foreground">({marketplace.length})</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listView === "yours"}
            className={playgroundSegmentedTrigger(listView === "yours")}
            onClick={() => setListView("yours")}
            disabled={!connected}
          >
            Yours
            {mine.length > 0 ? (
              <span className="tabular-nums text-muted-foreground">({mine.length})</span>
            ) : null}
          </button>
        </div>
      </div>

      <div className={playgroundFilterRailClass} role="listbox" aria-label="Sort launches">
        {(
          [
            { value: "newest", label: "Newest" },
            { value: "claimed", label: "Fees claimed" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={sortMode === opt.value}
            className={playgroundChipClass(sortMode === opt.value)}
            onClick={() => setSortMode(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[17rem] animate-pulse rounded-2xl border border-border/40 bg-muted/20"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : listView === "all" && marketQ.isError ? (
        <div className={playgroundEmptyStateClass}>
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load launches</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The token marketplace is temporarily unavailable. Try again in a moment.
          </p>
          <Button className="mt-5 rounded-xl" variant="outline" onClick={() => void marketQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : listView === "yours" && !syraAuthenticated ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Rocket className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">Sign in to see your tokens</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your launches and fee claims appear here after wallet sign-in.
          </p>
          <Button className="mt-5 rounded-xl" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : visibleLaunches.length === 0 ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Coins className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {listView === "yours"
              ? "No tokens of yours yet"
              : q
                ? "No matches"
                : "Be the first launcher"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {listView === "yours"
              ? "Launch a pump.fun coin from your earn wallet and claim creator fees as it trades."
              : q
                ? "Try a different search."
                : "Ship a token from your earn wallet to seed the community catalog."}
          </p>
          {listView === "yours" || !q ? (
            <Button
              className="mt-5 gap-1.5 rounded-xl"
              onClick={() => void handleLaunch()}
              disabled={!connected || !baseAnonymousId}
            >
              <Plus className="h-4 w-4" />
              Launch token
            </Button>
          ) : (
            <Button className="mt-5 rounded-xl" variant="outline" onClick={() => setSearch("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLaunches.map((launch, index) => (
            <TokenCard
              key={launch.id}
              launch={launch}
              isOwner={
                listView === "yours" ||
                mineMints.has(launch.mint) ||
                Boolean(resolvedEarnId && launch.earnAnonymousId === resolvedEarnId)
              }
              collecting={collectingMint === launch.mint}
              onCollect={(mint) => collectMutation.mutate(mint)}
              staggerIndex={index}
            />
          ))}
        </ul>
      )}

      <EarnTokenForm
        open={launchOpen}
        onOpenChange={setLaunchOpen}
        onLaunched={() => {
          void queryClient.invalidateQueries({ queryKey: mineQueryKey });
          void queryClient.invalidateQueries({ queryKey: marketQueryKey });
          void pillars.refreshSet();
          setListView("yours");
        }}
      />
    </section>
  );
}
