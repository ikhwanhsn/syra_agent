import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { disableLpReal, enableLpReal, type LpRealState } from "@/lib/lpAgentRealApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";

type Props = {
  state: LpRealState | undefined;
  isLoading?: boolean;
  className?: string;
  /** compact: icon buttons only on small screens */
  layout?: "default" | "compact";
};

export function LpRealAgentToggle({ state, isLoading, className, layout = "default" }: Props) {
  const { anonymousId } = useAgentWallet();
  const { ensureSyraAuth } = useSyraAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const config = state?.config;
  const enabled = Boolean(config?.enabled);
  const minBank = state?.minBankSol ?? config?.targetBankSol ?? 10;
  const balance = state?.onChainBalanceSol ?? 0;
  const deployed = state?.deployedSol ?? 0;
  const totalCapital = state?.totalCapitalSol ?? balance + deployed;
  const canEnable = state?.canEnable ?? totalCapital >= minBank - 1e-9;
  const canTurnOn = state?.canTurnOn ?? canEnable;
  const isOperator = state?.isOperator ?? false;

  const toggleMutation = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const auth = await ensureSyraAuth();
      const sessionAnonymousId = auth?.anonymousId ?? anonymousId;
      if (!sessionAnonymousId) {
        throw new Error("wallet_sign_in_required");
      }
      if (nextEnabled) return enableLpReal(sessionAnonymousId);
      return disableLpReal({ closeAll: false, anonymousId: sessionAnonymousId });
    },
    onSuccess: (_data, nextEnabled) => {
      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });
      toast({
        title: nextEnabled ? "LP Real Agent is on" : "LP Real Agent is off",
        description: nextEnabled
          ? "The agent will open positions on the next signal tick."
          : "No new positions will be opened.",
      });
    },
    onError: (err: Error) => {
      const msg = err.message || "Request failed";
      const friendly = msg.includes("insufficient_balance")
        ? `Need ${formatSol(minBank)} SOL total capital (wallet + deployed) or ~1.2 SOL wallet to start.`
        : msg.includes("agent_wallet_not_found")
          ? "Create and fund a Solana agent wallet in Settings first."
          : msg.includes("wallet_sign_in_required")
            ? "Connect your wallet with the button in the top bar, then try again."
            : msg;
      toast({ title: "Could not update agent", description: friendly, variant: "destructive" });
    },
  });

  const pending = toggleMutation.isPending || isLoading;

  if (!isOperator) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Create a Solana agent wallet in Settings to run real on-chain LP. You need at least{" "}
        {formatSol(minBank)} SOL total book (wallet + deployed) to enable.
      </p>
    );
  }

  const handleTurnOn = () => {
    if (!canTurnOn) {
      toast({
        title: "Not enough SOL",
        description: `Total capital ${formatSol(totalCapital)} (${formatSol(balance)} wallet + ${formatSol(deployed)} deployed). Need ${formatSol(minBank)} book or ~${formatSol(state?.minWalletToStartSol ?? 1.2)} wallet to start.`,
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
    <div className={cn("flex flex-col gap-2", className)}>
      {enabled ? (
        <Button
          type="button"
          variant="outline"
          size={layout === "compact" ? "sm" : "default"}
          className="rounded-xl gap-2"
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
          size={layout === "compact" ? "sm" : "default"}
          className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
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
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Need {formatSol(minBank)} total capital · current {formatSol(totalCapital)}
        </p>
      ) : !enabled && canTurnOn && !canEnable ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Starter mode — wallet has {formatSol(balance)}. Agent will open only when the {formatSol(minBank)} book is
          met.
        </p>
      ) : null}
    </div>
  );
}
