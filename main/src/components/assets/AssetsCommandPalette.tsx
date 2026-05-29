import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { Building2, Coins, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { parseAssetLookupInput } from "@/lib/tokensDossierApi";
import { assetDetailPath, type AssetTableRow } from "@/lib/assetsHub";

interface AssetsCommandPaletteProps {
  rows: readonly AssetTableRow[];
  onOpenChange?: (open: boolean) => void;
}

export function AssetsCommandPalette({ rows, onOpenChange }: AssetsCommandPaletteProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
    onOpenChange?.(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.symbol.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.ref.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const runLookup = (raw: string) => {
    const parsed = parseAssetLookupInput(raw);
    if (!parsed) return;
    const sp = new URLSearchParams();
    if (parsed.ref) sp.set("ref", parsed.ref);
    if (parsed.assetId) sp.set("assetId", parsed.assetId);
    if (parsed.mint) sp.set("mint", parsed.mint);
    if (parsed.q) sp.set("q", parsed.q);
    handleOpenChange(false);
    navigate(`/assets/lookup?${sp.toString()}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Jump to asset or search symbol, mint, URL…"
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              runLookup(query.trim());
            }
          }}
        />
        <CommandList>
          <CommandEmpty>No matching assets on board.</CommandEmpty>
          {query.trim() ? (
            <CommandGroup heading="Lookup">
              <CommandItem value={`lookup-${query}`} onSelect={() => runLookup(query.trim())}>
                <Search className="mr-2 h-4 w-4" aria-hidden />
                Open dossier for &quot;{query.trim()}&quot;
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Board">
            {filtered.map((row) => (
            <CommandItem
              key={row.key}
              value={`${row.symbol} ${row.name} ${row.ref}`}
              onSelect={() => {
                handleOpenChange(false);
                navigate(assetDetailPath(row));
              }}
            >
              {row.assetClass === "equity" ? (
                <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
              ) : (
                <Coins className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
              )}
              <span className="font-medium">{row.symbol}</span>
              <span className="ml-2 truncate text-muted-foreground">{row.name}</span>
            </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runLookup("btc")}>
            <Search className="mr-2 h-4 w-4" aria-hidden />
            Open Bitcoin dossier
          </CommandItem>
          <CommandItem onSelect={() => runLookup("tsla")}>
            <Search className="mr-2 h-4 w-4" aria-hidden />
            Open Tesla dossier
          </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          Type any symbol and press Enter to open lookup
          <CommandShortcut>↵</CommandShortcut>
        </span>
      </div>
    </CommandDialog>
  );
}
