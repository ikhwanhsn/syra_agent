import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { PromptCard } from "@/components/earn/PromptCard";
import { PromptForm } from "@/components/earn/PromptForm";
import {
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import {
  playgroundChipClass,
  playgroundEmptyStateClass,
  playgroundFilterRailClass,
  playgroundHeroCard,
  playgroundHeroGlow,
  playgroundSearchClass,
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
  playgroundStatLabel,
  playgroundStatTile,
  playgroundStatValue,
  playgroundToolbarClass,
} from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

type ListView = "all" | "yours";

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

function formatUses(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

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
  const [listView, setListView] = useState<ListView>("all");
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

  const allPrompts = promptsQ.data ?? [];
  const totalUses = allPrompts.reduce((sum, p) => sum + (p.useCount ?? 0), 0);
  const myCount = anonymousId
    ? allPrompts.filter((p) => p.anonymousId === anonymousId).length
    : 0;

  const q = search.trim().toLowerCase();
  const visiblePrompts =
    listView === "yours" && !anonymousId
      ? []
      : allPrompts.filter((p) => {
          if (listView === "yours" && anonymousId && p.anonymousId !== anonymousId) return false;
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
    <section className={cn("space-y-5", playgroundTabPanelEnter)}>
      <div className={playgroundHeroCard}>
        <div className={cn(overviewCardGlow, playgroundHeroGlow)} aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className={overviewKickerClass}>Earn · Community</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Playbooks
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Agent-ready strategies from every creator. Run one instantly, or publish yours and earn when others use it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Playbooks</p>
              <p className={playgroundStatValue}>{allPrompts.length}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Total runs</p>
              <p className={playgroundStatValue}>{formatUses(totalUses)}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Yours</p>
              <p className={playgroundStatValue}>{myCount}</p>
            </div>
            <Button
              className="h-11 gap-1.5 rounded-xl px-4 shadow-sm"
              onClick={() => void handleCreate()}
              disabled={!connected || !anonymousId}
            >
              <Plus className="h-4 w-4" />
              New playbook
            </Button>
          </div>
        </div>
      </div>

      <div className={playgroundToolbarClass}>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playbooks, strategies, categories…"
            className={playgroundSearchClass}
            aria-label="Search playbooks"
          />
        </div>

        <div className={playgroundSegmentedRoot(2)} role="tablist" aria-label="Playbook scope">
          <button
            type="button"
            role="tab"
            aria-selected={listView === "all"}
            className={playgroundSegmentedTrigger(listView === "all")}
            onClick={() => setListView("all")}
          >
            All
            {allPrompts.length > 0 ? (
              <span className="tabular-nums text-muted-foreground">({allPrompts.length})</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listView === "yours"}
            className={playgroundSegmentedTrigger(listView === "yours")}
            onClick={() => setListView("yours")}
            disabled={!anonymousId}
          >
            Yours
            {myCount > 0 ? (
              <span className="tabular-nums text-muted-foreground">({myCount})</span>
            ) : null}
          </button>
        </div>
      </div>

      <div className={playgroundFilterRailClass} role="listbox" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="option"
            aria-selected={category === c.value}
            className={playgroundChipClass(category === c.value)}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {authPending ? (
        <div
          className={cn(
            overviewCardShell,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Sign in to publish playbooks and earn from agent runs.
            </p>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : null}

      {!connected ? (
        <div
          className={cn(
            overviewCardShell,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5",
          )}
        >
          <p className="text-sm text-muted-foreground">
            Connect a wallet to publish. You can still browse and run any community playbook.
          </p>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[15.5rem] animate-pulse rounded-2xl border border-border/40 bg-muted/20"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : promptsQ.isError ? (
        <div className={playgroundEmptyStateClass}>
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load playbooks</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Something went wrong fetching the community catalog. Try again in a moment.
          </p>
          <Button className="mt-5 rounded-xl" variant="outline" onClick={() => void promptsQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visiblePrompts.length === 0 ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <BookMarked className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {listView === "yours"
              ? "No playbooks of yours yet"
              : q || category !== "all"
                ? "No matches"
                : "Be the first creator"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {listView === "yours"
              ? "Publish a trading or research strategy and earn when agents run it."
              : q || category !== "all"
                ? "Try a different search or category filter."
                : "Share a clear, agent-ready playbook to kickstart the catalog."}
          </p>
          {listView === "yours" || (!q && category === "all") ? (
            <Button
              className="mt-5 gap-1.5 rounded-xl"
              onClick={() => void handleCreate()}
              disabled={!connected || !anonymousId}
            >
              <Plus className="h-4 w-4" />
              New playbook
            </Button>
          ) : (
            <Button
              className="mt-5 rounded-xl"
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
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
            setListView("yours");
          }}
        />
      ) : null}
    </section>
  );
}
