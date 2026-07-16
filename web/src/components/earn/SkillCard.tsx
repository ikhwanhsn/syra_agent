import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Code2,
  Copy,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
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
            <Code2 className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
                  {skill.title}
                </h3>
                <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground">
                  {categoryLabel}
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  <span className="font-mono text-[12px] uppercase">{skill.upstreamMethod}</span>
                </p>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/80">
                {formatCalls(skill.useCount)} calls
              </span>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {skill.description?.trim() || "x402-ready HTTPS skill for Syra agents."}
        </p>

        <div className="space-y-3">
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatPrice(skill.priceUsd)}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">USDC</span>
          </p>
          <div className="grid grid-cols-2 gap-3 border-t border-border/30 pt-3">
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Slug
              </p>
              <p className="mt-0.5 truncate font-mono text-[13px] font-medium text-foreground/90" title={skill.slug}>
                {skill.slug}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Status
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground/90">
                {isPublished ? "Live" : "Draft"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => void handleCopyEndpoint()}
          >
            <Copy className="h-3.5 w-3.5 opacity-60" />
            {copied ? "Copied" : "Endpoint"}
          </Button>

          <div className="flex items-center gap-1">
            {isOwner ? (
              <>
                {isPublished ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-full px-3 text-[13px]"
                    onClick={() => unpublishM.mutate()}
                    disabled={pending}
                  >
                    {unpublishM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unpublish"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 gap-1.5 rounded-full px-4 text-[13px] shadow-none"
                    onClick={() => publishM.mutate()}
                    disabled={pending}
                  >
                    {publishM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publish"}
                    {!publishM.isPending ? <ArrowUpRight className="h-3.5 w-3.5 opacity-70" /> : null}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
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
              <Button
                size="sm"
                variant="ghost"
                className="h-9 gap-1.5 rounded-full px-3.5 text-[13px] text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href={skill.endpointUrl} target="_blank" rel="noreferrer">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
