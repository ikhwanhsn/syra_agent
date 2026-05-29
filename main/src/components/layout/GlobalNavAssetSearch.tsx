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
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Coins,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { filterAssetRows, assetDetailPath, type AssetTableRow } from "@/lib/assetsHub";
import {
  assetLookupPath,
  assetSearchHitPath,
  fetchAssetsSearch,
  type AssetSearchHit,
} from "@/lib/assetsSearchApi";
import { useAssetsHubRows } from "@/hooks/useAssetsHubRows";
import { formatPct } from "@/lib/dashboardOverviewAggregates";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SEARCH_DEBOUNCE_MS = 220;

type SuggestionItem =
  | { kind: "board"; row: AssetTableRow }
  | { kind: "remote"; hit: AssetSearchHit }
  | { kind: "lookup"; query: string };

function formatPrice(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

function SuggestionRow({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: SuggestionItem;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  if (item.kind === "lookup") {
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
          <Search className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Search for &ldquo;{item.query}&rdquo;</span>
          <span className="block text-xs text-muted-foreground">Open asset dossier lookup</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
      </button>
    );
  }

  const symbol =
    item.kind === "board" ? item.row.symbol : item.hit.symbol;
  const name = item.kind === "board" ? item.row.name : item.hit.name;
  const assetClass =
    item.kind === "board" ? item.row.assetClass : undefined;
  const imageUrl = item.kind === "board" ? item.row.imageUrl : item.hit.imageUrl;
  const price = item.kind === "board" ? item.row.price : undefined;
  const change = item.kind === "board" ? item.row.change24h : undefined;

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
      <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-border/50">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="rounded-lg bg-muted/60 text-[10px] font-semibold">
          {symbol.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight">{symbol}</span>
          <span className="truncate text-sm text-muted-foreground">{name}</span>
        </span>
        {price != null ? (
          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatPrice(price)}</span>
            {change != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" aria-hidden />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden />
                )}
                {formatPct(change)}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {assetClass === "equity" ? (
          <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
        ) : (
          <Coins className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
      </span>
    </button>
  );
}

export function GlobalNavAssetSearch({
  className,
  inputRef: externalInputRef,
}: {
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const boardQ = useAssetsHubRows();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const remoteQ = useQuery({
    queryKey: ["assets-search", debouncedQuery] as const,
    queryFn: () => fetchAssetsSearch(debouncedQuery, 8),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const boardMatches = useMemo(() => {
    const rows = boardQ.data ?? [];
    if (!debouncedQuery) return rows.slice(0, 6);
    return filterAssetRows(rows, { assetClass: "all", query: debouncedQuery }).slice(0, 6);
  }, [boardQ.data, debouncedQuery]);

  const remoteMatches = useMemo(() => {
    const hits = remoteQ.data ?? [];
    const boardIds = new Set(boardMatches.map((r) => r.payload.assetId.toLowerCase()));
    return hits.filter((h) => !boardIds.has(h.assetId.toLowerCase())).slice(0, 6);
  }, [remoteQ.data, boardMatches]);

  const suggestions = useMemo((): SuggestionItem[] => {
    const items: SuggestionItem[] = [];
    for (const row of boardMatches) items.push({ kind: "board", row });
    for (const hit of remoteMatches) items.push({ kind: "remote", hit });
    const q = debouncedQuery || query.trim();
    if (q.length >= 1) items.push({ kind: "lookup", query: q });
    return items;
  }, [boardMatches, remoteMatches, debouncedQuery, query]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(0);
  }, []);

  const navigateItem = useCallback(
    (item: SuggestionItem) => {
      close();
      setQuery("");
      if (item.kind === "board") {
        router.push(assetDetailPath(item.row));
      } else if (item.kind === "remote") {
        router.push(assetSearchHitPath(item.hit));
      } else {
        router.push(assetLookupPath(item.query));
      }
    },
    [close, router],
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
  }, [suggestions.length, debouncedQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/assets");
      close();
      return;
    }
    if (open && suggestions[highlight]) {
      navigateItem(suggestions[highlight]);
      return;
    }
    router.push(assetLookupPath(q));
    close();
    setQuery("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
  };

  const showPanel = open && (query.length > 0 || boardMatches.length > 0);
  const isSearching = debouncedQuery.length >= 2 && remoteQ.isFetching;

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
        placeholder="Search assets…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
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
      {isSearching ? (
        <Loader2
          className="pointer-events-none absolute right-10 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : null}
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80 sm:inline">
        /
      </kbd>

      {showPanel ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[250] overflow-hidden rounded-2xl",
            "border border-border/50 bg-popover/95 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.35)]",
            "backdrop-blur-xl backdrop-saturate-150",
            "animate-in fade-in-0 zoom-in-[0.98] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "dark:shadow-[0_20px_50px_-16px_rgba(0,0,0,0.65)]",
          )}
        >
          <div className="border-b border-border/40 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {debouncedQuery ? "Suggestions" : "Popular on board"}
            </p>
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-[min(22rem,50vh)] overflow-y-auto p-1.5"
          >
            {suggestions.length === 0 && !isSearching ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No assets found. Press Enter to run a full lookup.
              </li>
            ) : (
              suggestions.map((item, i) => (
                <li key={
                  item.kind === "board"
                    ? `board-${item.row.key}`
                    : item.kind === "remote"
                      ? `remote-${item.hit.assetId}`
                      : `lookup-${item.query}`
                }>
                  <SuggestionRow
                    item={item}
                    active={i === highlight}
                    onSelect={() => navigateItem(item)}
                    onHover={() => setHighlight(i)}
                  />
                </li>
              ))
            )}
            {isSearching && suggestions.length === 0 ? (
              <li className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching Tokens.xyz…
              </li>
            ) : null}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border/50 bg-background/50 px-1 font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border border-border/50 bg-background/50 px-1 font-mono">↵</kbd> open
            </span>
          </div>
        </div>
      ) : null}
    </form>
  );
}
