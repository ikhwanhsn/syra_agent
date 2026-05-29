import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Loader2, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";

import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils";

import { disableLpReal, enableLpReal, type LpRealState } from "@/lib/lpAgentRealApi";

import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { formatSolWithUsd } from "@/lib/lpRealDisplay";



type Props = {

  state: LpRealState | undefined;

  /** Reference SOL/USD for display (from lab state). */

  solUsd?: number;

  isLoading?: boolean;

  className?: string;

  /** compact: icon buttons only on small screens */

  layout?: "default" | "compact";

};



export function LpRealAgentToggle({ state, solUsd, isLoading, className, layout = "default" }: Props) {
  const { lpAnonymousId } = useAgentWallet();
  const { ensureSyraAuth, requestSyraAuth } = useSyraAuth();

  const { toast } = useToast();

  const queryClient = useQueryClient();



  const config = state?.config;

  const enabled = Boolean(config?.enabled);

  const minEntry =
    state?.minWalletToStartSol ??
    (config?.maxPositionSol ?? 1) + (config?.reserveSolForFees ?? 0.05) + 0.15;

  const balance = state?.onChainBalanceSol ?? 0;

  const openCount = state?.openPositionsCount ?? 0;

  const canOpenNew = state?.canOpenNewPositions ?? state?.canEnable ?? false;

  const canTurnOn = state?.canTurnOn ?? (canOpenNew || openCount > 0);

  const isOperator = state?.isOperator ?? false;



  const resolveAuth = async () => {

    const passive = await ensureSyraAuth();

    if (passive?.anonymousId) return passive;

    return requestSyraAuth();

  };



  const toggleMutation = useMutation({

    mutationFn: async (nextEnabled: boolean) => {

      const auth = await resolveAuth();
      if (!auth?.anonymousId && !lpAnonymousId) {
        throw new Error("wallet_sign_in_required");
      }

      const lpId = lpAnonymousId ?? `${auth!.anonymousId}:lp`;

      if (nextEnabled) return enableLpReal(lpId);

      return disableLpReal({ closeAll: false, anonymousId: lpId });

    },

    onSuccess: (_data, nextEnabled) => {

      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });

      toast({

        title: nextEnabled ? "LP Real Agent is on" : "LP Real Agent is off",

        description: nextEnabled

          ? "The agent will open positions on the next signal tick when wallet balance allows."

          : "No new pools will open. Existing positions keep running until the system closes them.",

      });

    },

    onError: (err: Error) => {

      const msg = err.message || "Request failed";

      const friendly = msg.includes("insufficient_balance")

        ? `Need ~${formatSol(minEntry)} SOL in the agent wallet to enter a pool.`

        : msg.includes("agent_wallet_not_found")

          ? "Create and fund a Solana agent wallet first."

          : msg.includes("wallet_sign_in_required") || msg.includes("auth_required")

            ? "Connect your wallet and approve the sign-in message, then try again."

            : msg.includes("anonymous_id_mismatch")

              ? "Session mismatch — sign out, reconnect your wallet, and try again."

              : msg;

      toast({ title: "Could not update agent", description: friendly, variant: "destructive" });

    },

  });



  const pending = toggleMutation.isPending || isLoading;

  const size = layout === "compact" ? "sm" : "default";



  if (!isOperator) {

    return (

      <p className={cn("text-xs text-muted-foreground", className)}>

        Create a Solana agent wallet to run real on-chain LP. Fund it with at least ~

        {formatSolWithUsd(minEntry, solUsd)} to enter your first pool.

      </p>

    );

  }



  const handleTurnOn = () => {

    if (!canTurnOn) {

      toast({

        title: "Not enough SOL",

        description: `Wallet ${formatSolWithUsd(balance, solUsd)} (${formatSolWithUsd(state?.availableSol ?? Math.max(0, balance - 0.05), solUsd)} available for entry). Need ~${formatSolWithUsd(minEntry, solUsd)} to turn on.`,

        variant: "destructive",

      });

      return;

    }

    toggleMutation.mutate(true);

  };



  const handleTurnOff = () => {

    toggleMutation.mutate(false);

  };



  return (

    <div className={cn("flex w-full flex-col gap-2", className)}>

      {enabled ? (

        <Button

          type="button"

          variant="outline"

          size={size}

          className={cn(

            "h-11 w-full gap-2 rounded-xl border-border/55 bg-background/45 font-medium backdrop-blur-md",

            "transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-background/60",

          )}

          disabled={pending}

          onClick={handleTurnOff}

        >

          {pending ? (

            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />

          ) : (

            <PowerOff className="h-4 w-4" aria-hidden />

          )}

          Turn off agent

        </Button>

      ) : (

        <Button

          type="button"

          size={size}

          className={cn(

            "h-11 w-full gap-2 rounded-xl border border-violet-500/30 font-semibold text-white",

            "bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_1px_0_0_hsl(var(--background)/0.35),0_10px_28px_-10px_hsl(262_83%_45%/0.65)]",

            "transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:from-violet-400 hover:to-violet-500 hover:shadow-[0_12px_32px_-10px_hsl(262_83%_45%/0.75)]",

            "disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none",

          )}

          disabled={pending || !canTurnOn}

          onClick={handleTurnOn}

        >

          {pending ? (

            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />

          ) : (

            <Power className="h-4 w-4" aria-hidden />

          )}

          Turn on agent

        </Button>

      )}

      {!enabled && !canTurnOn ? (

        <p className="text-center text-xs text-muted-foreground">

          Need ~{formatSolWithUsd(minEntry, solUsd)} · current {formatSolWithUsd(balance, solUsd)}

        </p>

      ) : !enabled && canTurnOn && !canOpenNew ? (

        <p className="text-center text-xs text-muted-foreground">

          {openCount > 0

            ? `${openCount} open position${openCount === 1 ? "" : "s"} — add wallet SOL to open more slots.`

            : `Wallet ${formatSolWithUsd(balance, solUsd)} — deposit ~${formatSolWithUsd(minEntry, solUsd)} to enter a pool.`}

        </p>

      ) : null}

    </div>

  );

}

