import { useQuery } from "@tanstack/react-query";
import { Code2, Plus, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { SkillCard } from "@/components/earn/SkillCard";
import { SkillForm } from "@/components/earn/SkillForm";
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
import { baseAnonymousIdFrom } from "@/lib/agentWalletPurpose";
import {
  fetchMySkills,
  fetchPublishedSkills,
  type SkillRecord,
} from "@/lib/skillsApi";
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

type EarnSkillsPanelProps = {
  anonymousId: string | null;
  skillsQueryKey: readonly unknown[];
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
  onSkillsChanged: () => void;
};

function formatCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function isOwnedBy(skill: SkillRecord, anonymousId: string | null): boolean {
  if (!anonymousId) return false;
  return skill.creatorAnonymousId === baseAnonymousIdFrom(anonymousId);
}

export function EarnSkillsPanel({
  anonymousId,
  skillsQueryKey,
  connected,
  syraAuthenticated,
  syraAuthReady,
  onSignIn,
  onRequestAuth,
  onSkillsChanged,
}: EarnSkillsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [listView, setListView] = useState<ListView>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const publishedQueryKey = ["earn", "skills", "published"] as const;

  const publishedQ = useQuery({
    queryKey: publishedQueryKey,
    queryFn: () => fetchPublishedSkills({ limit: 100 }),
    staleTime: 30_000,
  });

  const mineQ = useQuery({
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
  const loading =
    publishedQ.isLoading || (listView === "yours" && Boolean(mineQ.isLoading && syraAuthenticated));
  const showSkeleton = useMinimumSkeleton(loading);

  const published = publishedQ.data ?? [];
  const mine = mineQ.data ?? [];
  const totalCalls = published.reduce((sum, s) => sum + (s.useCount ?? 0), 0);
  const myCount = mine.length;

  const sourceSkills = listView === "yours" ? mine : published;
  const q = search.trim().toLowerCase();

  const visibleSkills =
    listView === "yours" && (!syraAuthenticated || !connected)
      ? []
      : sourceSkills.filter((s) => {
          if (category !== "all" && s.category !== category) return false;
          if (!q) return true;
          return (
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.endpointUrl.toLowerCase().includes(q)
          );
        });

  const queryKeys = [publishedQueryKey, skillsQueryKey] as const;

  return (
    <section className={cn("space-y-5", playgroundTabPanelEnter)}>
      <div className={playgroundHeroCard}>
        <div className={cn(overviewCardGlow, playgroundHeroGlow)} aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className={overviewKickerClass}>Earn · Developers</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              API skills
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Browse published x402 skills from every creator. Ship your HTTPS API and earn USDC per agent call.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Live skills</p>
              <p className={playgroundStatValue}>{published.length}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Total calls</p>
              <p className={playgroundStatValue}>{formatCalls(totalCalls)}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Yours</p>
              <p className={playgroundStatValue}>{myCount}</p>
            </div>
            <Button
              className="h-11 gap-1.5 rounded-xl px-4 shadow-sm"
              onClick={() => void handleCreate()}
              disabled={!connected}
            >
              <Plus className="h-4 w-4" />
              New skill
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
            placeholder="Search skills, slugs, endpoints…"
            className={playgroundSearchClass}
            aria-label="Search API skills"
          />
        </div>

        <div className={playgroundSegmentedRoot(2)} role="tablist" aria-label="Skill scope">
          <button
            type="button"
            role="tab"
            aria-selected={listView === "all"}
            className={playgroundSegmentedTrigger(listView === "all")}
            onClick={() => setListView("all")}
          >
            All
            {published.length > 0 ? (
              <span className="tabular-nums text-muted-foreground">({published.length})</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listView === "yours"}
            className={playgroundSegmentedTrigger(listView === "yours")}
            onClick={() => setListView("yours")}
            disabled={!connected}
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
              Sign in to publish skills and earn USDC from agent traffic.
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
            Connect a wallet to publish. You can still browse live community skills below.
          </p>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[17rem] animate-pulse rounded-2xl border border-border/40 bg-muted/20"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : listView === "all" && publishedQ.isError ? (
        <div className={playgroundEmptyStateClass}>
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load skills</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The skills marketplace is temporarily unavailable. Try again in a moment.
          </p>
          <Button className="mt-5 rounded-xl" variant="outline" onClick={() => void publishedQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : listView === "yours" && !syraAuthenticated ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Code2 className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">Sign in to see your skills</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your drafts and published skills live here after wallet sign-in.
          </p>
          <Button className="mt-5 rounded-xl" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : visibleSkills.length === 0 ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Code2 className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {listView === "yours"
              ? "No skills of yours yet"
              : q || category !== "all"
                ? "No matches"
                : "Be the first publisher"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {listView === "yours"
              ? "Publish an HTTPS API skill and earn USDC whenever agents call it."
              : q || category !== "all"
                ? "Try a different search or category filter."
                : "Ship a clear, agent-ready API endpoint to start the catalog."}
          </p>
          {listView === "yours" || (!q && category === "all") ? (
            <Button
              className="mt-5 gap-1.5 rounded-xl"
              onClick={() => void handleCreate()}
              disabled={!connected}
            >
              <Plus className="h-4 w-4" />
              New skill
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
          {visibleSkills.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isOwner={isOwnedBy(skill, anonymousId)}
              queryKeys={queryKeys}
              staggerIndex={index}
            />
          ))}
        </ul>
      )}

      <SkillForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          onSkillsChanged();
          void publishedQ.refetch();
          setListView("yours");
        }}
      />
    </section>
  );
}
