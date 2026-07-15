import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Code2,
  Copy,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { playgroundApiCardClass } from "@/components/playground/playgroundStyles";
import {
  deleteSkill,
  publishSkill,
  unpublishSkill,
  type SkillRecord,
} from "@/lib/skillsApi";
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

function formatCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function formatPrice(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}

type SkillCardProps = {
  skill: SkillRecord;
  isOwner: boolean;
  queryKeys: readonly (readonly unknown[])[];
  staggerIndex?: number;
};

export function SkillCard({ skill, isOwner, queryKeys, staggerIndex = 0 }: SkillCardProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const invalidate = () => {
    for (const key of queryKeys) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
    void queryClient.invalidateQueries({ queryKey: ["earn", "summary"] });
  };

  const publishM = useMutation({
    mutationFn: () => publishSkill(skill.id),
    onSuccess: invalidate,
  });

  const unpublishM = useMutation({
    mutationFn: () => unpublishSkill(skill.id),
    onSuccess: invalidate,
  });

  const deleteM = useMutation({
    mutationFn: () => deleteSkill(skill.id),
    onSuccess: invalidate,
  });

  const pending = publishM.isPending || unpublishM.isPending || deleteM.isPending;
  const isPublished = skill.status === "published";
  const categoryLabel = CATEGORY_LABELS[skill.category] ?? skill.category;
  const categoryAccent = CATEGORY_ACCENT[skill.category] ?? CATEGORY_ACCENT.general;

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(skill.endpointUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <li
      className={cn(
        playgroundApiCardClass(false),
        "list-none animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
            <span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground ring-1 ring-border/40">
              {skill.upstreamMethod}
            </span>
            {isOwner ? (
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1",
                  isPublished
                    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300",
                )}
              >
                {isPublished ? "Live" : "Draft"}
              </span>
            ) : null}
          </div>

          <span
            className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40"
            title="Agent calls"
          >
            <Users className="h-3 w-3" aria-hidden />
            {formatCalls(skill.useCount)}
          </span>
        </div>

        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/40 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]">
            <Code2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {skill.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {skill.description?.trim() || "x402-ready HTTPS skill for Syra agents."}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Price / call</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {formatPrice(skill.priceUsd)}{" "}
              <span className="text-xs font-medium text-muted-foreground">USDC</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Slug</p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold tracking-tight text-foreground" title={skill.slug}>
              {skill.slug}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 rounded-xl px-2.5 text-muted-foreground"
            onClick={() => void handleCopyEndpoint()}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Endpoint"}
          </Button>

          <div className="flex items-center gap-1">
            {isOwner ? (
              <>
                {isPublished ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-xl"
                    onClick={() => unpublishM.mutate()}
                    disabled={pending}
                  >
                    {unpublishM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unpublish"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl shadow-sm"
                    onClick={() => publishM.mutate()}
                    disabled={pending}
                  >
                    {publishM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publish"}
                    {!publishM.isPending ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteM.mutate()}
                  disabled={pending}
                  title="Delete skill"
                  aria-label="Delete skill"
                >
                  {deleteM.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm" asChild>
                <a href={skill.endpointUrl} target="_blank" rel="noreferrer">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
