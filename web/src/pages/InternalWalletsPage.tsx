import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { ArrowLeft, Loader2, Search, Wallet } from "lucide-react";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { fetchInternalAgentWallets } from "@/lib/internalAgentWalletsApi";
import {
  AGENT_WALLET_SLOTS,
  PILLAR_WALLET_PURPOSES,
  shortenAgentAddress,
} from "@/lib/agentWalletCatalog";
import { cn } from "@/lib/utils";

function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InternalWalletsPage() {
  const { connected, address } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["internal-agent-wallets", search],
    queryFn: () => fetchInternalAgentWallets({ limit: 50, q: search || undefined }),
    enabled: allowed,
    staleTime: 30_000,
  });

  return (
    <AdminDashboardGate featureLabel="Internal agent wallets">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1.5" asChild>
              <Link to="/internal">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Internal team
              </Link>
            </Button>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Wallet className="h-6 w-6 text-primary" aria-hidden />
              Agent wallet sets
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All pillar wallets (earn, treasury, invest, spend, grow) across agents — balances and provisioning source.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              className="pl-9"
              placeholder="Search wallet or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {q.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            Loading wallet sets…
          </div>
        ) : q.isError ? (
          <div className={cn(overviewCardShell, "p-8 text-center text-sm text-destructive")}>
            {(q.error as Error).message}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {q.data?.total ?? 0} agent sets · showing {q.data?.agents.length ?? 0}
            </p>
            {(q.data?.agents ?? []).map((agent) => (
              <div key={agent.baseAnonymousId} className={cn(overviewCardShell, "overflow-hidden p-5")}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {shortenAgentAddress(agent.walletAddress ?? agent.baseAnonymousId)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Base: <span className="font-mono">{agent.baseAnonymousId}</span>
                      {agent.provisionedVia ? ` · via ${agent.provisionedVia}` : ""}
                      {agent.payerAddress ? ` · payer ${shortenAgentAddress(agent.payerAddress)}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{agent.chain}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {PILLAR_WALLET_PURPOSES.map((purpose) => {
                    const row = agent.wallets[purpose];
                    const slot = AGENT_WALLET_SLOTS.find((s) => s.id === purpose);
                    return (
                      <div
                        key={purpose}
                        className="rounded-xl border border-border/60 bg-muted/10 px-3 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {slot?.shortLabel ?? purpose}
                        </p>
                        {row ? (
                          <>
                            <p className="mt-1 font-mono text-xs text-foreground/90">
                              {shortenAgentAddress(row.agentAddress)}
                            </p>
                            <p className="mt-2 font-mono text-sm font-semibold tabular-nums">
                              {formatUsd(row.balances?.usdcBalance)}
                            </p>
                            <p className="text-xs tabular-nums text-muted-foreground">
                              {row.balances?.solBalance != null
                                ? `${row.balances.solBalance.toFixed(3)} SOL`
                                : "— SOL"}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">Not provisioned</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {agent.wallets.lp ? (
                  <div className="mt-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-fuchsia-700 dark:text-fuchsia-400">LP (internal)</span>
                    {" · "}
                    <span className="font-mono">{shortenAgentAddress(agent.wallets.lp.agentAddress)}</span>
                    {" · "}
                    {formatUsd(agent.wallets.lp.balances?.usdcBalance)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardGate>
  );
}
