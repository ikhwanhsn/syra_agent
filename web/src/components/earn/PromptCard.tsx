import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Loader2,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { playgroundApiCardClass } from "@/components/playground/playgroundStyles";
import { userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  live_data: "Live data",
  research: "Research",
  trading: "Trading",
  learning: "Learning",
  tools: "Tools",
};

const CATEGORY_ACCENT: Record<string, string> = {
  general: "bg-muted/50 text-muted-foreground ring-border/40",
  live_data: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  research: "bg-teal-500/10 text-teal-800 ring-teal-500/20 dark:text-teal-300",
  trading: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  learning: "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300",
  tools: "bg-orange-500/10 text-orange-800 ring-orange-500/20 dark:text-orange-300",
};

function formatUses(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function shortCreatorId(id: string): string {
  if (id.length <= 10) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

type PromptCardProps = {
  prompt: UserPromptItem;
  anonymousId: string | null;
  queryKey: readonly unknown[];
  onEdit: (prompt: UserPromptItem) => void;
  staggerIndex?: number;
};

export function PromptCard({
  prompt,
  anonymousId,
  queryKey,
  onEdit,
  staggerIndex = 0,
}: PromptCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwner = Boolean(anonymousId && prompt.anonymousId === anonymousId);

  const deleteM = useMutation({
    mutationFn: () => {
      if (!anonymousId) throw new Error("Sign in required");
      return userPromptsApi.delete(prompt.id, anonymousId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["earn", "summary"] });
    },
  });

  const handleUse = () => {
    void userPromptsApi.recordUse(prompt.id).catch(() => {});
    void queryClient.invalidateQueries({ queryKey });
    navigate("/", { state: { prompt: prompt.prompt } });
  };

  const categoryLabel = CATEGORY_LABELS[prompt.category] ?? prompt.category;
  const categoryAccent = CATEGORY_ACCENT[prompt.category] ?? CATEGORY_ACCENT.general;

  return (
    <li
      className={cn(playgroundApiCardClass(false), "list-none animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500")}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1",
                categoryAccent,
              )}
            >
              {categoryLabel}
            </span>
            {isOwner ? (
              <span className="inline-flex rounded-md bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary ring-1 ring-primary/20">
                Yours
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40"
              title="Times used"
            >
              <Users className="h-3 w-3" aria-hidden />
              {formatUses(prompt.useCount)}
            </span>
            {isOwner ? (
              <div className="flex items-center opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => onEdit(prompt)}
                  disabled={deleteM.isPending}
                  title="Edit playbook"
                  aria-label="Edit playbook"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteM.mutate()}
                  disabled={deleteM.isPending}
                  title="Delete playbook"
                  aria-label="Delete playbook"
                >
                  {deleteM.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/40 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]">
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {prompt.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {prompt.description?.trim() || "Ready-to-run strategy for Syra agents."}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <p className="min-w-0 truncate font-mono text-[11px] text-muted-foreground/80" title={prompt.anonymousId}>
            {isOwner ? "You" : shortCreatorId(prompt.anonymousId)}
          </p>
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
            onClick={handleUse}
          >
            Run
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
