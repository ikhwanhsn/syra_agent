import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnTokenForm } from "@/components/earn/EarnTokenForm";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { usePillarAgentWallets } from "@/hooks/usePillarAgentWallets";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import {
  collectEarnPumpfunFees,
  fetchEarnPumpfunLaunches,
  shortenMint,
  type EarnPumpfunLaunch,
} from "@/lib/earnPumpfunApi";
import { cn } from "@/lib/utils";

function TokenRow({
  launch,
  collecting,
  onCollect,
}: {
  launch: EarnPumpfunLaunch;
  collecting: boolean;
  onCollect: (mint: string) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {launch.name}{" "}
          <span className="font-mono text-muted-foreground">${launch.symbol}</span>
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground" title={launch.mint}>
          {shortenMint(launch.mint)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" disabled={collecting} onClick={() => onCollect(launch.mint)}>
          {collecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim fees"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://pump.fun/coin/${launch.mint}`} target="_blank" rel="noreferrer">
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
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

  const queryKey = ["earn", "token-launches", baseAnonymousId] as const;

  const pillars = usePillarAgentWallets(baseAnonymousId, walletAddress ?? "", {
    enabled: Boolean(baseAnonymousId && walletAddress),
    canProvision: connected && syraAuthenticated,
  });
  const earnBalances = pillars.getBalanceForPurpose("earn");

  const launchesQ = useQuery({
    queryKey,
    queryFn: () => fetchEarnPumpfunLaunches(baseAnonymousId!),
    enabled: Boolean(baseAnonymousId) && syraAuthenticated,
    staleTime: 30_000,
  });

  const collectMutation = useMutation({
    mutationFn: (mint: string) => collectEarnPumpfunFees(mint),
    onMutate: (mint) => setCollectingMint(mint),
    onSettled: () => setCollectingMint(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void pillars.refreshSet();
    },
  });

  const handleLaunch = async () => {
    if (!connected || !baseAnonymousId) return;
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    setLaunchOpen(true);
  };

  const authPending = connected && syraAuthReady && !syraAuthenticated;
  const launches = launchesQ.data?.launches ?? [];

  return (
    <section className="space-y-4">
      <EarnPanelHeader
        title="Your tokens"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/wallet?wallet=earn">Earn wallet</Link>
            </Button>
            <Button size="sm" onClick={() => void handleLaunch()} disabled={!connected || !baseAnonymousId}>
              <Plus className="h-4 w-4" />
              Launch
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        Launch a pump.fun token from your earn wallet and claim creator fees when it trades.
      </p>

      {!connected ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          Connect wallet to launch tokens.
        </p>
      ) : authPending ? (
        <div className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
          <p className="text-sm text-muted-foreground">Sign in to launch tokens.</p>
          <Button size="sm" variant="outline" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : syraAuthenticated && earnBalances.solBalance != null ? (
        <div className={cn(overviewCardShell, "grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-3")}>
          <div>
            <p className="text-muted-foreground">Earn SOL</p>
            <p className="font-semibold tabular-nums">{earnBalances.solBalance.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Earn USDC</p>
            <p className="font-semibold tabular-nums">
              {earnBalances.usdcBalance != null ? earnBalances.usdcBalance.toFixed(2) : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Launched</p>
            <p className="font-semibold tabular-nums">{launches.length}</p>
          </div>
        </div>
      ) : null}

      {!syraAuthenticated ? null : launchesQ.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : launches.length === 0 ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          No tokens yet. Launch one on pump.fun to earn creator fees from trading volume.
        </p>
      ) : (
        <ul className="space-y-2">
          {launches.map((launch) => (
            <TokenRow
              key={launch.id}
              launch={launch}
              collecting={collectingMint === launch.mint}
              onCollect={(mint) => collectMutation.mutate(mint)}
            />
          ))}
        </ul>
      )}

      <EarnTokenForm
        open={launchOpen}
        onOpenChange={setLaunchOpen}
        onLaunched={() => {
          void queryClient.invalidateQueries({ queryKey });
          void pillars.refreshSet();
        }}
      />
    </section>
  );
}
