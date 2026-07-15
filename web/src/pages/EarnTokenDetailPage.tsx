import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EarnTokenLogo } from "@/components/earn/EarnTokenLogo";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import {
  playgroundHeroCard,
  playgroundHeroGlow,
  playgroundStatLabel,
  playgroundStatTile,
  playgroundStatValue,
} from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import {
  collectEarnPumpfunFees,
  fetchEarnPumpfunTokenDetail,
  shortenMint,
} from "@/lib/earnPumpfunApi";
import { siblingAnonymousId } from "@/lib/agentWalletPurpose";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

function formatSolFromLamports(lamports: string | null | undefined): string | null {
  if (!lamports) return null;
  const n = Number(lamports);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n / 1e9).toFixed(n >= 1e8 ? 2 : 4);
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function EarnTokenDetailPage() {
  const { mint: mintParam } = useParams<{ mint: string }>();
  const mint = mintParam ? decodeURIComponent(mintParam).trim() : "";
  const { anonymousId } = useAgentWallet();
  const { syraAuthenticated, requestSyraAuth } = useSyraAuth();
  const queryClient = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["earn", "token-detail", mint],
    queryFn: () => fetchEarnPumpfunTokenDetail(mint),
    enabled: Boolean(mint),
    staleTime: 30_000,
  });

  const launch = detailQ.data;
  const earnId = anonymousId ? siblingAnonymousId(anonymousId, "earn") : null;
  const isOwner = Boolean(
    launch?.earnAnonymousId && earnId && launch.earnAnonymousId === earnId,
  );
  const pumpUrl = mint ? `https://pump.fun/coin/${mint}` : null;
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : null;
  const buySol = formatSolFromLamports(launch?.initialBuyLamports);

  const collectMutation = useMutation({
    mutationFn: () => collectEarnPumpfunFees(mint),
    onSuccess: (data) => {
      if (data.submitError) {
        notify.error("Fee claim issue", data.submitError);
      } else {
        notify.success("Creator fees claimed");
      }
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-detail", mint] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-launches"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-marketplace"] });
    },
    onError: (e: Error) => {
      notify.error("Claim failed", e.message || "Could not claim fees");
    },
  });

  const copyMint = async () => {
    if (!mint) return;
    try {
      await navigator.clipboard.writeText(mint);
      notify.success("Mint copied");
    } catch {
      notify.error("Copy failed", "Could not copy mint to clipboard");
    }
  };

  return (
    <PillarLayout
      embedded
      tagline="Earn · Token"
      title={launch?.name || "Token"}
      description={
        launch
          ? `$${launch.symbol} · launched via Syra earn wallet on pump.fun`
          : "Pump.fun launch details"
      }
      actions={
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl">
          <Link to="/earn?track=token">
            <ArrowLeft className="h-3.5 w-3.5" />
            Marketplace
          </Link>
        </Button>
      }
    >
      {!mint ? (
        <div className={cn(overviewCardShell, "px-6 py-12 text-center")}>
          <p className="font-display text-lg font-semibold">Missing mint</p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link to="/earn?track=token">Back to tokens</Link>
          </Button>
        </div>
      ) : detailQ.isLoading ? (
        <div className={cn(overviewCardShell, "flex min-h-[40vh] items-center justify-center gap-3")}>
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading token…</p>
        </div>
      ) : detailQ.isError || !launch ? (
        <div className={cn(overviewCardShell, "px-6 py-12 text-center")}>
          <p className="font-display text-lg font-semibold">Token not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This mint is not in the Syra earn catalog, or the link is invalid.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-xl">
            <Link to="/earn?track=token">Back to tokens</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          <section className={cn(playgroundHeroCard)}>
            <div className={playgroundHeroGlow} aria-hidden />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
              <EarnTokenLogo
                src={launch.imageUri}
                alt={launch.name}
                className="h-28 w-28 rounded-2xl sm:h-36 sm:w-36"
                iconClassName="h-10 w-10"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
                    pump.fun
                  </span>
                  {isOwner ? (
                    <span className="inline-flex rounded-md bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary ring-1 ring-primary/20">
                      Yours
                    </span>
                  ) : null}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {launch.name}
                  </h2>
                  <p className="mt-1 font-mono text-base font-medium text-muted-foreground">
                    ${launch.symbol}
                  </p>
                </div>
                {launch.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {launch.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button size="sm" className="h-9 gap-1.5 rounded-xl" asChild>
                    <a href={pumpUrl!} target="_blank" rel="noreferrer">
                      Trade on pump.fun
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl" asChild>
                    <a href={solscanUrl!} target="_blank" rel="noreferrer">
                      Solscan
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {isOwner ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 gap-1.5 rounded-xl"
                      disabled={collectMutation.isPending || !syraAuthenticated}
                      onClick={() => {
                        if (!syraAuthenticated) {
                          void requestSyraAuth();
                          return;
                        }
                        collectMutation.mutate();
                      }}
                    >
                      {collectMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Rocket className="h-3.5 w-3.5" />
                      )}
                      Claim fees
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Initial buy</p>
              <p className={playgroundStatValue}>
                {buySol ?? "—"}
                {buySol ? <span className="ml-1 text-sm font-medium text-muted-foreground">SOL</span> : null}
              </p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Launched</p>
              <p className={cn(playgroundStatValue, "text-base sm:text-lg")}>{formatDate(launch.createdAt)}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Fees claimed</p>
              <p className={cn(playgroundStatValue, "text-base sm:text-lg")}>
                {launch.lastFeeCollectedAt ? formatDate(launch.lastFeeCollectedAt) : "Not yet"}
              </p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Creator wallet</p>
              <p
                className={cn(playgroundStatValue, "truncate font-mono text-base")}
                title={launch.earnAgentAddress}
              >
                {isOwner ? "You" : shortenMint(launch.earnAgentAddress || "")}
              </p>
            </div>
          </section>

          <section className={cn(overviewCardShell, "space-y-4 p-5 sm:p-6")}>
            <h3 className="font-display text-base font-semibold tracking-tight">On-chain</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Mint
                  </p>
                  <p className="mt-0.5 truncate font-mono text-sm" title={launch.mint}>
                    {launch.mint}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-lg" onClick={() => void copyMint()}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              {launch.launchSignature ? (
                <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Launch signature
                  </p>
                  <a
                    href={`https://solscan.io/tx/${launch.launchSignature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-sm text-primary hover:underline"
                  >
                    {shortenMint(launch.launchSignature)}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              ) : null}
              {launch.metadataUri ? (
                <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Metadata
                  </p>
                  <a
                    href={launch.metadataUri}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm text-primary hover:underline"
                  >
                    {launch.metadataUri}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </PillarLayout>
  );
}
