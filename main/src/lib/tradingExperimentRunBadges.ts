/**
 * Tailwind classes for trading experiment run log chips.
 *
 * This app defaults to dark UI on `:root` and uses `html.light` for light mode (not `dark` class),
 * so `dark:` variants from Tailwind never apply. Use light text by default and `light:` for sun mode.
 */
export function explorerRunStatusBadgeClass(status: string): string {
  switch (status) {
    case "win":
      return "border-emerald-500/45 bg-emerald-500/15 text-emerald-100 light:border-emerald-500/50 light:bg-emerald-500/12 light:text-emerald-950";
    case "loss":
      return "border-rose-500/45 bg-rose-500/15 text-rose-100 light:border-rose-500/50 light:bg-rose-500/12 light:text-rose-950";
    case "open":
      return "border-amber-500/45 bg-amber-500/15 text-amber-100 light:border-amber-500/50 light:bg-amber-500/12 light:text-amber-950";
    case "expired":
      return "border-zinc-500/50 bg-zinc-500/15 text-zinc-200 light:border-zinc-400/60 light:bg-zinc-500/10 light:text-zinc-900";
    case "skipped_invalid_levels":
      return "border-border bg-muted/90 text-zinc-100 light:border-border light:bg-muted light:text-foreground";
    case "error":
      return "border-red-500/45 bg-red-950/50 text-red-100 light:border-red-500/55 light:bg-red-500/12 light:text-red-950";
    default:
      return "border-border/80 bg-muted/80 text-zinc-200 light:border-border/70 light:bg-muted/90 light:text-foreground";
  }
}

export function explorerSignalBadgeClass(signal: string): string {
  const u = signal.trim().toUpperCase();
  if (u === "BUY") {
    return "border-emerald-500/45 bg-emerald-500/15 text-emerald-100 light:border-emerald-500/50 light:bg-emerald-500/12 light:text-emerald-950";
  }
  if (u === "SELL") {
    return "border-rose-500/45 bg-rose-500/15 text-rose-100 light:border-rose-500/50 light:bg-rose-500/12 light:text-rose-950";
  }
  return "border-border/80 bg-muted/80 text-zinc-200 light:border-border/70 light:bg-muted/90 light:text-foreground";
}
