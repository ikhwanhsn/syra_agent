"use client";

import { useMemo, useState } from "react";
import { BookMarked, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatContextChunk } from "@/lib/chatStructuredUi";

function charLabel(text: string): string {
  const n = text.length;
  return `${n.toLocaleString()} character${n === 1 ? "" : "s"}`;
}

function sourceLabel(chunk: ChatContextChunk): string {
  if (chunk.role === "assistant") return "Past assistant reply";
  if (chunk.role === "user") return "Past user message";
  return "Past context";
}

function scoreLabel(chunk: ChatContextChunk): string | null {
  if (typeof chunk.rerankScore === "number" && Number.isFinite(chunk.rerankScore)) {
    return `rerank ${chunk.rerankScore.toFixed(2)}`;
  }
  if (typeof chunk.score === "number" && Number.isFinite(chunk.score)) {
    return `match ${chunk.score.toFixed(2)}`;
  }
  return null;
}

export function ContextCards({
  chunks,
  className,
}: {
  chunks: ChatContextChunk[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const safe = useMemo(
    () =>
      chunks.filter(
        (c) => c && typeof c.text === "string" && c.text.trim().length > 0,
      ),
    [chunks],
  );

  if (!safe.length) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/45 bg-muted/15",
        className,
      )}
      aria-label="Retrieved context"
    >
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BookMarked className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Context
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/80">
          {safe.length} chunk{safe.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="space-y-2 border-t border-border/35 px-3 pb-3 pt-2">
          {safe.map((chunk, i) => {
            const key = chunk.id || chunk.messageId || `chunk-${i}`;
            const score = scoreLabel(chunk);
            return (
              <li
                key={key}
                className="rounded-xl border border-border/50 bg-background/20 px-3 py-2.5"
              >
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-foreground">
                    {sourceLabel(chunk)}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {charLabel(chunk.text)}
                    {score ? ` · ${score}` : ""}
                  </span>
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                  {chunk.text.trim()}
                </p>
                <p className="mt-2 truncate text-[11px] text-muted-foreground/70">
                  Memory · {chunk.modality || "text"}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1.5 border-t border-border/35 px-3 py-2">
          {safe.slice(0, 3).map((chunk, i) => (
            <span
              key={chunk.id || chunk.messageId || `preview-${i}`}
              className="inline-flex max-w-full items-center truncate rounded-full border border-border/40 px-2 py-1 text-[11px] text-muted-foreground"
            >
              {sourceLabel(chunk)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
