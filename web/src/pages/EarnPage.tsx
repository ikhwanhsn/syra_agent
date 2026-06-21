import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { SkillCard } from "@/components/earn/SkillCard";
import { SkillForm } from "@/components/earn/SkillForm";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { fetchEarnSummary } from "@/lib/pillarsApi";
import { fetchMySkills } from "@/lib/skillsApi";
import { cn } from "@/lib/utils";

export default function EarnPage() {
  const { address, connected } = useWalletContext();
  const { anonymousId } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const key = anonymousId ?? address ?? "";
  const skillsQueryKey = ["earn", "skills", key] as const;

  /** Privy connect ≠ Syra JWT — silently restore session when wallet is already linked. */
  useEffect(() => {
    if (!syraAuthReady || !connected || !address) return;
    void ensureSyraAuth();
  }, [syraAuthReady, connected, address, ensureSyraAuth]);

  const summaryQ = useQuery({
    queryKey: ["earn", "summary", key],
    queryFn: () => fetchEarnSummary(key),
    enabled: Boolean(key),
    staleTime: 60_000,
  });

  const skillsQ = useQuery({
    queryKey: skillsQueryKey,
    queryFn: fetchMySkills,
    enabled: Boolean(key) && syraAuthReady && syraAuthenticated,
    staleTime: 30_000,
  });

  const data = summaryQ.data?.data;
  const earnings = data?.earnings ?? [];
  const skills = skillsQ.data ?? [];

  const handleCreateSkill = async () => {
    if (!connected) return;
    if (!syraAuthenticated) {
      const session = await requestSyraAuth();
      if (!session) return;
      void queryClient.invalidateQueries({ queryKey: skillsQueryKey });
    }
    setCreateOpen(true);
  };

  const handleSignIn = () => {
    void requestSyraAuth().then((session) => {
      if (session) void queryClient.invalidateQueries({ queryKey: skillsQueryKey });
    });
  };

  const skillsAuthPending = connected && syraAuthReady && !syraAuthenticated;

  return (
    <PillarLayout
      embedded
      title="Earn"
      tagline="Agents monetize skills"
      description="Publish skills as paid Syra x402 endpoints. Other agents pay USDC directly to your earn wallet on every call."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void handleCreateSkill()} disabled={!connected}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create skill
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/wallet?wallet=earn">Earn wallet</Link>
          </Button>
        </div>
      }
    >
      {!key ? (
        <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
          Connect wallet to view earnings and publish skills.
        </div>
      ) : summaryQ.isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className={cn(overviewCardShell, "p-6 lg:col-span-1")}>
              <Coins className="mb-3 h-6 w-6 text-primary" aria-hidden />
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">${(data?.pendingUsd ?? 0).toFixed(4)}</p>
              <p className="mt-4 text-sm text-muted-foreground">Paid out</p>
              <p className="text-xl font-semibold">${(data?.paidUsd ?? 0).toFixed(4)}</p>
            </div>
            <div className={cn(overviewCardShell, "p-6 lg:col-span-2")}>
              <h2 className="mb-4 text-lg font-semibold">Recent attributions</h2>
              {earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No skill earnings yet. Publish a skill endpoint — when other agents call it, USDC
                  settles to your earn wallet and shows up here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {earnings.map(
                    (e: {
                      id: string;
                      paidPath: string;
                      creatorShareUsd: number;
                      status: string;
                      sourceType?: string;
                    }) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-muted-foreground">{e.paidPath}</span>
                        <span className="shrink-0 font-medium">${e.creatorShareUsd.toFixed(4)}</span>
                        <span className="shrink-0 text-xs uppercase text-muted-foreground">
                          {e.status}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </div>

          <section className={cn(overviewCardShell, "p-6")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Your skills</h2>
                <p className="text-sm text-muted-foreground">
                  Published endpoints are listed in GET /skills and /.well-known/x402 discovery.
                </p>
              </div>
              {!syraAuthReady ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : skillsAuthPending ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Approve wallet sign-in to manage skills.
                  </p>
                  <Button size="sm" variant="outline" onClick={handleSignIn}>
                    Sign in with wallet
                  </Button>
                </div>
              ) : skillsQ.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            {skillsAuthPending ? (
              <p className="text-sm text-muted-foreground">
                Your wallet is connected. One quick signature links it to Syra so you can publish
                skill endpoints.
              </p>
            ) : !syraAuthenticated ? null : skills.length === 0 && !skillsQ.isLoading ? (
              <p className="text-sm text-muted-foreground">
                No skills yet. Create one to expose your upstream API as a paid Syra endpoint.
              </p>
            ) : (
              <ul className="space-y-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} queryKey={skillsQueryKey} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <SkillForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: skillsQueryKey });
          void queryClient.invalidateQueries({ queryKey: ["earn", "summary", key] });
        }}
      />
    </PillarLayout>
  );
}
