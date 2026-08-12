"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Nav search trigger. Opens the site CommandPalette (mounted in GlobalNav)
 * on focus, click, or when `/` focuses this input from GlobalNav.
 */
export function GlobalNavAssetSearch({
  className,
  inputRef: externalInputRef,
  onOpenCommandPalette,
}: {
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isAdmin?: boolean;
  onOpenCommandPalette?: () => void;
}) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const openRef = useRef(onOpenCommandPalette);
  openRef.current = onOpenCommandPalette;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const open = () => openRef.current?.();
    el.addEventListener("focus", open);
    return () => el.removeEventListener("focus", open);
  }, [inputRef]);

  return (
    <div className={cn("relative w-full", className)} role="search">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
      <Input
        ref={inputRef}
        type="search"
        autoComplete="off"
        readOnly
        aria-haspopup="dialog"
        aria-label="Open site search"
        placeholder="Search pages…"
        onClick={() => onOpenCommandPalette?.()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.currentTarget.blur();
            return;
          }
          if (e.key.length === 1 || e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            onOpenCommandPalette?.();
          }
        }}
        className={cn(
          "h-9 cursor-pointer rounded-full border-border/50 bg-muted/30 pl-10 pr-12 text-sm shadow-none",
          "transition-[border-color,background-color,box-shadow] duration-200",
          "placeholder:text-muted-foreground/70 hover:border-border/70 hover:bg-muted/45",
          "focus-visible:border-border focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring/40",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80 sm:inline">
        /
      </kbd>
    </div>
  );
}
