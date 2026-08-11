import { useState } from "react";
import { ChevronDown, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/lib/chatStructuredUi";

export function MessageSources({ sources }: { sources: ChatSource[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;
  const preview = sources.slice(0, 3);

  return (
    <div className="space-y-2" aria-label="Sources">
      <button
        type="button"
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground touch-manipulation hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Link2 className="h-3.5 w-3.5" aria-hidden />
        {sources.length} source{sources.length === 1 ? "" : "s"}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {sources.map((src) => (
            <li key={src.url}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] flex-col rounded-xl border border-border/50 bg-background/20 px-3 py-2 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="line-clamp-2 text-sm font-medium text-foreground">
                  {src.title}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {src.origin || src.url}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {preview.map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-border/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {src.origin || src.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
