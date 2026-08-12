"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@/lib/navigation";
import {
  CommandPalette,
  type CommandItem,
} from "@/components/interior/command-palette";
import { listSitePages } from "@/lib/sitePageSearch";
import type { AssetTableRow } from "@/lib/assetsHub";
import { assetDetailPath } from "@/lib/assetsHub";

export type SiteCommandPaletteProps = {
  isAdmin?: boolean;
  /** Extra asset rows when available (Assets page can pass these). */
  assetRows?: readonly AssetTableRow[];
  /** Controlled open. When omitted, only the Cmd/Ctrl+K hotkey toggles. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When true, do not register Cmd/Ctrl+K (another palette owns it).
   * Default: suppress on `/assets` routes so AssetsCommandPalette wins.
   */
  suppressHotkey?: boolean;
};

export function SiteCommandPalette({
  isAdmin = false,
  assetRows,
  open: openProp,
  onOpenChange,
  suppressHotkey,
}: SiteCommandPaletteProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);

  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const hotkeyBlocked =
    suppressHotkey ?? (pathname === "/assets" || pathname.startsWith("/assets/"));

  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (hotkeyBlocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeyBlocked, setOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const pages = listSitePages(isAdmin).map((page) => ({
      id: `page:${page.href}`,
      label: page.label,
      hint: page.group ?? (page.external ? "External" : undefined),
      keywords: [page.description, page.href, ...(page.keywords ?? [])]
        .filter(Boolean)
        .join(" "),
    }));

    const assets = (assetRows ?? []).map((row) => ({
      id: `asset:${row.key}`,
      label: `${row.symbol} · ${row.name}`,
      hint: row.assetClass === "equity" ? "Stock" : "Crypto",
      keywords: `${row.ref} ${row.name} ${row.symbol}`,
    }));

    return [...pages, ...assets];
  }, [isAdmin, assetRows]);

  const onSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      if (item.id.startsWith("asset:")) {
        const key = item.id.slice("asset:".length);
        const row = assetRows?.find((r) => r.key === key);
        if (row) navigate(assetDetailPath(row));
        return;
      }
      if (item.id.startsWith("page:")) {
        const href = item.id.slice("page:".length);
        const page = listSitePages(isAdmin).find((p) => p.href === href);
        if (page?.external) {
          window.open(href, "_blank", "noopener,noreferrer");
        } else {
          navigate(href);
        }
      }
    },
    [assetRows, isAdmin, navigate, setOpen],
  );

  return (
    <CommandPalette
      open={open}
      onDismiss={() => setOpen(false)}
      autoFocus
      placeholder="Search pages and jump…"
      emptyLabel="No matching pages."
      label="Site search"
      items={items}
      onSelect={onSelect}
      maxRows={8}
    />
  );
}
