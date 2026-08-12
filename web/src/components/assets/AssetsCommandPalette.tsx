import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  CommandPalette,
  type CommandItem,
} from "@/components/interior/command-palette";
import { assetLookupPath } from "@/lib/assetsSearchApi";
import { assetDetailPath, type AssetTableRow } from "@/lib/assetsHub";

interface AssetsCommandPaletteProps {
  rows: readonly AssetTableRow[];
  onOpenChange?: (open: boolean) => void;
}

export function AssetsCommandPalette({ rows, onOpenChange }: AssetsCommandPaletteProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const items = useMemo<CommandItem[]>(() => {
    const board: CommandItem[] = rows.map((row) => ({
      id: row.key,
      label: `${row.symbol} · ${row.name}`,
      hint: row.assetClass === "equity" ? "Stock" : "Crypto",
      keywords: `${row.ref} ${row.name} ${row.symbol}`,
    }));

    return [
      ...board,
      {
        id: "action-btc",
        label: "Open Bitcoin dossier",
        hint: "Lookup",
        keywords: "btc bitcoin crypto",
      },
      {
        id: "action-tsla",
        label: "Open Tesla dossier",
        hint: "Lookup",
        keywords: "tsla tesla equity stock",
      },
    ];
  }, [rows]);

  const runLookup = useCallback(
    (raw: string) => {
      handleOpenChange(false);
      navigate(assetLookupPath(raw));
    },
    [handleOpenChange, navigate],
  );

  const onSelect = useCallback(
    (item: CommandItem) => {
      if (item.id === "action-btc") {
        runLookup("btc");
        return;
      }
      if (item.id === "action-tsla") {
        runLookup("tsla");
        return;
      }
      const row = rows.find((r) => r.key === item.id);
      if (!row) return;
      handleOpenChange(false);
      navigate(assetDetailPath(row));
    },
    [rows, handleOpenChange, navigate, runLookup],
  );

  return (
    <CommandPalette
      open={open}
      onDismiss={() => handleOpenChange(false)}
      autoFocus
      placeholder="Jump to asset or search symbol, mint, URL..."
      emptyLabel="No matching assets on board."
      label="Asset search"
      items={items}
      onSelect={onSelect}
      onQueryEnter={runLookup}
      queryEnterLabel={(q) => `Open dossier for "${q}"`}
    />
  );
}
