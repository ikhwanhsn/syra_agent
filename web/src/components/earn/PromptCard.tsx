import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
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

function formatUses(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
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

  return (
    <li
      className={cn(
        "group relative list-none overflow-hidden rounded-[1.35rem]",
        "border border-border/40 bg-card/40",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.35)]",
        "transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/70",
        "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_24px_48px_-32px_rgba(0,0,0,0.45)]",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/30 bg-muted/20 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <BookOpen className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
                  {prompt.title}
                </h3>
                <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground">
                  {categoryLabel}
                </p>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/80">
                {formatUses(prompt.useCount)} runs
              </span>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {prompt.description?.trim() || "Ready-to-run strategy for Syra agents."}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-3">
          {isOwner ? (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground"
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
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
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
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-9 gap-1.5 rounded-full px-4 text-[13px] shadow-none"
            onClick={handleUse}
          >
            Run
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </div>
      </div>
    </li>
  );
}
