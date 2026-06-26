import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { SkillCard } from "@/components/earn/SkillCard";
import { SkillForm } from "@/components/earn/SkillForm";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { fetchMySkills } from "@/lib/skillsApi";
import { cn } from "@/lib/utils";

type EarnSkillsPanelProps = {
  skillsQueryKey: readonly unknown[];
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
  onSkillsChanged: () => void;
};

export function EarnSkillsPanel({
  skillsQueryKey,
  connected,
  syraAuthenticated,
  syraAuthReady,
  onSignIn,
  onRequestAuth,
  onSkillsChanged,
}: EarnSkillsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const skillsQ = useQuery({
    queryKey: skillsQueryKey,
    queryFn: fetchMySkills,
    enabled: connected && syraAuthReady && syraAuthenticated,
    staleTime: 30_000,
  });

  const handleCreate = async () => {
    if (!connected) return;
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    setCreateOpen(true);
  };

  const authPending = connected && syraAuthReady && !syraAuthenticated;

  return (
    <section className="space-y-4">
      <EarnPanelHeader
        title="Your API skills"
        action={
          <Button size="sm" variant="outline" onClick={() => void handleCreate()} disabled={!connected}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground">
        For developers — publish an HTTPS API and earn USDC per agent call.
      </p>

      {!connected ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          Connect wallet to publish API skills.
        </p>
      ) : authPending ? (
        <div className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
          <p className="text-sm text-muted-foreground">Sign in to manage API skills.</p>
          <Button size="sm" variant="outline" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : !syraAuthenticated ? null : skillsQ.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : skillsQ.data?.length === 0 ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          No API skills yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {skillsQ.data?.map((skill) => (
            <SkillCard key={skill.id} skill={skill} queryKey={skillsQueryKey} />
          ))}
        </ul>
      )}

      <SkillForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          onSkillsChanged();
        }}
      />
    </section>
  );
}
