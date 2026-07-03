import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnPanelListSkeleton } from "@/components/earn/EarnSkeleton";
import { PromptCard } from "@/components/earn/PromptCard";
import { PromptForm } from "@/components/earn/PromptForm";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

type EarnPromptPanelProps = {
  anonymousId: string | null;
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
};

export function EarnPromptPanel({
  anonymousId,
  connected,
  syraAuthenticated,
  syraAuthReady,
  onSignIn,
  onRequestAuth,
}: EarnPromptPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserPromptItem | null>(null);

  const queryKey = ["earn", "prompts", anonymousId ?? ""] as const;

  const promptsQ = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await userPromptsApi.list({ anonymousId: anonymousId ?? undefined, limit: 50 });
      return res.prompts;
    },
    enabled: Boolean(anonymousId),
    staleTime: 30_000,
  });

  const handleCreate = async () => {
    if (!connected || !anonymousId) return;
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    setEditing(null);
    setCreateOpen(true);
  };

  const authPending = connected && syraAuthReady && !syraAuthenticated;
  const showSkeleton = useMinimumSkeleton(promptsQ.isLoading);

  return (
    <section className="space-y-4">
      <EarnPanelHeader
        title="Your playbooks"
        action={
          <Button size="sm" onClick={() => void handleCreate()} disabled={!connected || !anonymousId}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />

      {!connected ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          Connect wallet to create playbooks.
        </p>
      ) : authPending ? (
        <div className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
          <p className="text-sm text-muted-foreground">Sign in to manage playbooks.</p>
          <Button size="sm" variant="outline" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : showSkeleton ? (
        <EarnPanelListSkeleton rows={3} />
      ) : promptsQ.data?.length === 0 ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          No playbooks yet. Share a trading or research strategy to earn when agents use it.
        </p>
      ) : (
        <ul className="space-y-2">
          {promptsQ.data?.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              anonymousId={anonymousId!}
              queryKey={queryKey}
              onEdit={(p) => {
                setEditing(p);
                setCreateOpen(true);
              }}
            />
          ))}
        </ul>
      )}

      {anonymousId ? (
        <PromptForm
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setEditing(null);
          }}
          anonymousId={anonymousId}
          initial={editing}
          onCreated={() => {
            void queryClient.invalidateQueries({ queryKey });
            void queryClient.invalidateQueries({ queryKey: ["earn", "summary"] });
          }}
        />
      ) : null}
    </section>
  );
}
