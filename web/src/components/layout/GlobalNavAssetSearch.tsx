"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "@/lib/navigation";
import { ArrowRight, ArrowUpRight, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { searchSitePages, type SiteSearchPage } from "@/lib/sitePageSearch";

const PAGE_SUGGESTION_LIMIT = 8;

function PageSuggestionRow({
  page,
  active,
  onSelect,
  onHover,
}: {
  page: SiteSearchPage;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = page.icon ?? FileText;

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors",
        active ? "bg-accent" : "hover:bg-accent/70",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40">
        <Icon className="h-4 w-4 text-foreground/75" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{page.label}</span>
          {page.external ? (
            <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {page.description ?? page.group ?? page.href}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

export function GlobalNavAssetSearch({
  className,
  inputRef: externalInputRef,
  isAdmin = false,
}: {
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isAdmin?: boolean;
}) {
  const navigate = useNavigate();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const pageMatches = useMemo(
    () => searchSitePages(trimmedQuery, isAdmin, PAGE_SUGGESTION_LIMIT),
    [trimmedQuery, isAdmin],
  );

  const noPagesFound = hasQuery && pageMatches.length === 0;

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(0);
  }, []);

  const navigatePage = useCallback(
    (page: SiteSearchPage) => {
      close();
      setQuery("");
      if (page.external) {
        window.open(page.href, "_blank", "noopener,noreferrer");
      } else {
        navigate(page.href);
      }
    },
    [close, navigate],
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  useEffect(() => {
    setHighlight(0);
  }, [pageMatches.length, trimmedQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasQuery) {
      close();
      return;
    }
    const selected = pageMatches[highlight];
    if (open && selected) {
      navigatePage(selected);
      return;
    }
    const top = pageMatches[0];
    if (top) navigatePage(top);
    else close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && hasQuery && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!open || pageMatches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, pageMatches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
  };

  const showPanel = open && hasQuery;

  return (
    <form
      onSubmit={onSubmit}
      className={cn("relative w-full", className)}
      role="search"
      ref={containerRef}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
      <Input
        ref={inputRef}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search pages…"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (next.trim()) setOpen(true);
          else close();
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "h-9 rounded-full border-border/50 bg-muted/30 pl-10 pr-12 text-sm shadow-none",
          "transition-[border-color,background-color,box-shadow] duration-200",
          "placeholder:text-muted-foreground/70 hover:border-border/70 hover:bg-muted/45",
          "focus-visible:border-border focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring/40",
          open && query && "border-border bg-background ring-1 ring-ring/30",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80 sm:inline">
        /
      </kbd>

      {showPanel ? (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-[250] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl",
            "border border-border/50 bg-popover/95 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.35)]",
            "backdrop-blur-xl backdrop-saturate-150",
            "animate-in fade-in-0 zoom-in-[0.98] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "dark:shadow-[0_20px_50px_-16px_rgba(0,0,0,0.65)]",
          )}
        >
          <div className="border-b border-border/40 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pages
            </p>
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-[min(22rem,50vh)] overflow-y-auto p-1.5"
          >
            {pageMatches.length > 0 ? (
              pageMatches.map((page, i) => (
                <li key={page.href}>
                  <PageSuggestionRow
                    page={page}
                    active={i === highlight}
                    onSelect={() => navigatePage(page)}
                    onHover={() => setHighlight(i)}
                  />
                </li>
              ))
            ) : noPagesFound ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No page found.
              </li>
            ) : null}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border/50 bg-background/50 px-1 font-mono">↑↓</kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border/50 bg-background/50 px-1 font-mono">↵</kbd>{" "}
              open
            </span>
          </div>
        </div>
      ) : null}
    </form>
  );
}
