import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { TokenAvatar } from "@/components/rise/RiseShared";

type MarketSearchPickerProps = {
  options: RiseMarketRow[];
  value: string;
  onValueChange: (mint: string) => void;
  triggerPlaceholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function MarketSearchPicker({
  options,
  value,
  onValueChange,
  triggerPlaceholder,
  searchPlaceholder = "Search symbol or name...",
  disabled = false,
  id,
  className,
}: MarketSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => options.find((row) => row.mint === value) ?? null, [options, value]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((row) => row.symbol.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle));
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled || options.length === 0}
          className={className ?? "h-11 w-full justify-between rounded-xl border-border/55 bg-background/40 shadow-inner"}
        >
          <span className="min-w-0 truncate text-left">
            {selected ? `$${selected.symbol} - ${selected.name}` : triggerPlaceholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border-border/60 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg border-border/55 pl-8"
          />
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background/35">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matching markets.</p>
          ) : (
            filtered.map((row) => (
              <button
                key={row.mint}
                type="button"
                className="flex h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors hover:bg-muted/50"
                onClick={() => {
                  onValueChange(row.mint);
                  setOpen(false);
                }}
              >
                <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
                <span className="min-w-0 truncate font-medium">${row.symbol}</span>
                <span className="min-w-0 truncate text-xs text-muted-foreground">{row.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
