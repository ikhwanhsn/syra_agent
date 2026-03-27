import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  type ExperimentSupportedToken,
  EXPERIMENT_SUPPORTED_TOKENS,
  filterExperimentSupportedTokens,
} from "@/lib/experimentSupportedTokens";

interface ExperimentTokenComboboxProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ExperimentTokenCombobox({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
}: ExperimentTokenComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filtered = filterExperimentSupportedTokens(value);
  const q = value.trim();
  const suggestions: ExperimentSupportedToken[] =
    open && !disabled
      ? filtered.length > 0
        ? filtered
        : q === ""
          ? [...EXPERIMENT_SUPPORTED_TOKENS]
          : []
      : [];

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(0);
  }, []);

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
    if (open) setHighlight(0);
  }, [value, open]);

  const selectSlug = (slug: string) => {
    onChange(slug);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      selectSlug(suggestions[highlight].slug);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative" ref={containerRef}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search or pick a token…"
          className="pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {open && !disabled && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((t, i) => (
              <li key={t.slug} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none",
                    i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/80",
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSlug(t.slug)}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{t.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && !disabled && q !== "" && suggestions.length === 0 ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
            No matching preset. Your text is sent as the token slug.
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {EXPERIMENT_SUPPORTED_TOKENS.length} Binance spot presets; custom slugs still work if the pair exists.
      </p>
    </div>
  );
}
