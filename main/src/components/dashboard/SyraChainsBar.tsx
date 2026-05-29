import { useQuery } from "@tanstack/react-query";
import { fetchSyraChains, type SyraChainInfo } from "@/lib/syraChainsApi";
import { chainBadgeClass, chainLabel, type AgentChain } from "@/lib/agentWalletUi";
import { cn } from "@/lib/utils";

function statusDot(status: SyraChainInfo["status"]) {
  if (status === "active") return "bg-emerald-400";
  if (status === "limited") return "bg-amber-400";
  return "bg-muted-foreground/50";
}

export function SyraChainsBar({ className }: { className?: string }) {
  const { data: chains = [], isLoading, isError } = useQuery({
    queryKey: ["syra-chains"],
    queryFn: fetchSyraChains,
    staleTime: 60_000,
  });

  if (isError) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2",
        className,
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Networks
      </span>
      {isLoading ? (
        <span className="text-xs text-muted-foreground">Loading…</span>
      ) : (
        chains.map((c) => (
          <span
            key={c.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
              chainBadgeClass(c.id as AgentChain),
            )}
            title={c.note}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(c.status))} aria-hidden />
            {chainLabel(c.id as AgentChain)}
          </span>
        ))
      )}
    </div>
  );
}
