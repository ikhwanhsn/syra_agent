"use client";

import type { ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { InternalNarrativeTool } from "@/components/internal/InternalNarrativeTool";
import { InternalProofDropTool } from "@/components/internal/InternalProofDropTool";
import { InternalQuoteResponseTool } from "@/components/internal/InternalQuoteResponseTool";
import { InternalThreadExpanderTool } from "@/components/internal/InternalThreadExpanderTool";
import {
  DEFAULT_INTERNAL_TOOL_ID,
  getInternalTool,
  INTERNAL_TOOL_CATEGORY_LABELS,
  parseInternalToolId,
  toolsByCategory,
  type InternalToolId,
} from "@/components/internal/tools/internalToolsRegistry";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

interface InternalToolsHubProps {
  wallet?: string | null;
}

function renderToolPanel(id: InternalToolId, wallet?: string | null): ReactNode {
  switch (id) {
    case "narrative":
      return <InternalNarrativeTool wallet={wallet} />;
    case "quote-response":
      return <InternalQuoteResponseTool wallet={wallet} />;
    case "thread-expander":
      return <InternalThreadExpanderTool wallet={wallet} />;
    case "proof-drop":
      return <InternalProofDropTool wallet={wallet} />;
    default:
      return null;
  }
}

export function InternalToolsHub({ wallet }: InternalToolsHubProps) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeToolId = parseInternalToolId(searchParams.get("tool"));
  const activeTool = getInternalTool(activeToolId);
  const ActiveIcon = activeTool.icon;
  const grouped = toolsByCategory();

  const setTool = (id: InternalToolId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "tools");
    if (id === DEFAULT_INTERNAL_TOOL_ID) params.delete("tool");
    else params.set("tool", id);
    const q = params.toString();
    navigate(`${pathname}?${q}${hash}`, { replace: true });
  };

  return (
    <section
      role="tabpanel"
      aria-labelledby="internal-tab-tools"
      className="space-y-4 pt-2"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Internal tools</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Utilities for content, ops, and growth. Pick a tool from the rail — new ones plug in here as you ship them.
        </p>
      </div>

      <div className="internal-tools-hub grid min-h-[min(72dvh,720px)] gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card/30 lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <aside
          className="border-b border-border/50 bg-muted/10 lg:border-b-0 lg:border-r"
          aria-label="Tool catalog"
        >
          <div className="hidden px-3 py-3 lg:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/75">Catalog</p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto p-2 lg:hidden">
            {grouped.flatMap((g) => g.tools).map((tool) => {
              const Icon = tool.icon;
              const active = tool.id === activeToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setTool(tool.id)}
                  disabled={tool.status !== "live"}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                      : "border-border/50 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {tool.label}
                </button>
              );
            })}
          </div>

          <nav className="hidden max-h-[min(72dvh,720px)] overflow-y-auto p-2 lg:block">
            {grouped.map(({ category, tools }) => (
              <div key={category} className="mb-3 last:mb-0">
                <p className="mb-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/65">
                  {INTERNAL_TOOL_CATEGORY_LABELS[category]}
                </p>
                <div className="grid gap-1">
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    const active = tool.id === activeToolId;
                    const disabled = tool.status !== "live";
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => setTool(tool.id)}
                        disabled={disabled}
                        className={cn(
                          "w-full rounded-xl border px-2.5 py-2.5 text-left transition-colors",
                          active
                            ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/10"
                            : "border-transparent bg-transparent hover:border-border/50 hover:bg-muted/25",
                          disabled && "cursor-not-allowed opacity-45",
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-[#F3BA2F]/20 text-[#F3BA2F]" : "bg-muted/50 text-muted-foreground",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "block truncate text-sm font-medium",
                                active ? "text-[#F3BA2F]" : "text-foreground/90",
                              )}
                            >
                              {tool.label}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                              {tool.description}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3BA2F]/15 text-[#F3BA2F]">
                <ActiveIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-foreground">{activeTool.label}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{activeTool.description}</p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className={cn(overviewCardShell, "min-h-full rounded-xl p-4 sm:p-5")}>
              {renderToolPanel(activeToolId, wallet)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
