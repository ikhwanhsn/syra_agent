import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus, Search } from "lucide-react";
import { useState } from "react";
import { PromptCard } from "@/components/earn/PromptCard";
import { PromptForm } from "@/components/earn/PromptForm";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "trading", label: "Trading" },
  { value: "research", label: "Research" },
  { value: "live_data", label: "Live data" },
  { value: "learning", label: "Learning" },
  { value: "tools", label: "Tools" },
  { value: "general", label: "General" },
] as const;

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
  onRequestAuth,
}: EarnPromptPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserPromptItem | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const queryKey = ["earn", "prompts", "all"] as const;

  const promptsQ = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await userPromptsApi.list({ limit: 100 });
      return res.prompts;
    },
    staleTime: 30_000,
  });

  const handleCreate = async () => {
    if (!connected || !anonymousId) {
      notify.error("Connect wallet", "Connect a wallet to publish a playbook.");
      return;
    }
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    setEditing(null);
    setCreateOpen(true);
  };

  const showSkeleton = useMinimumSkeleton(promptsQ.isLoading);
  const allPrompts = promptsQ.data ?? [];
  const q = search.trim().toLowerCase();

  const visiblePrompts = allPrompts.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <section className={cn("space-y-8", playgroundTabPanelEnter)}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-lg">
          <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            Playbooks
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Agent-ready strategies from the community.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
          onClick={() => void handleCreate()}
        >
          <Plus className="h-4 w-4" />
          New playbook
        </Button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={cn(
              "h-11 rounded-full border-border/40 bg-muted/20 pl-10 pr-4 shadow-none",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-border/60 focus-visible:bg-background/80 focus-visible:ring-1 focus-visible:ring-foreground/10",
            )}
            aria-label="Search playbooks"
          />
        </div>

        <div
          className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border/40 bg-muted/15 p-1"
          role="listbox"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="option"
              aria-selected={category === c.value}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                category === c.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[14rem] animate-pulse rounded-[1.35rem] border border-border/30 bg-muted/15"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : promptsQ.isError ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load playbooks</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Try again in a moment.</p>
          <Button className="mt-6 rounded-full" variant="outline" onClick={() => void promptsQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visiblePrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/40 bg-muted/20">
            <BookMarked className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {q || category !== "all" ? "No matches" : "Nothing here yet"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {q || category !== "all" ? "Try a different search or filter." : "Publish the first playbook."}
          </p>
          {q || category !== "all" ? (
            <Button
              className="mt-6 rounded-full"
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear
            </Button>
          ) : (
            <Button className="mt-6 gap-1.5 rounded-full" onClick={() => void handleCreate()}>
              <Plus className="h-4 w-4" />
              New playbook
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePrompts.map((prompt, index) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              anonymousId={anonymousId}
              queryKey={queryKey}
              staggerIndex={index}
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
