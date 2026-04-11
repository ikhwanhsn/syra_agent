/**
 * Tailwind classes for trading experiment run log chips.
 * Tuned for contrast on tinted pill backgrounds in both light and dark UI.
 */
export function explorerRunStatusBadgeClass(status: string): string {
  switch (status) {
    case "win":
      return "border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-950/55 dark:text-emerald-100";
    case "loss":
      return "border-rose-500/50 bg-rose-500/15 text-rose-950 dark:border-rose-400/55 dark:bg-rose-950/55 dark:text-rose-100";
    case "open":
      return "border-amber-500/50 bg-amber-500/15 text-amber-950 dark:border-amber-400/50 dark:bg-amber-950/55 dark:text-amber-100";
    case "expired":
      return "border-zinc-500/50 bg-zinc-500/12 text-zinc-900 dark:border-zinc-400/40 dark:bg-zinc-950/55 dark:text-zinc-200";
    case "skipped_invalid_levels":
      return "border-border bg-muted text-foreground dark:bg-muted/80 dark:text-zinc-100";
    case "error":
      return "border-destructive/60 bg-destructive/15 text-destructive dark:border-red-400/50 dark:bg-red-950/60 dark:text-red-50";
    default:
      return "border-border/70 bg-muted/80 text-foreground dark:bg-muted/60 dark:text-zinc-100";
  }
}

export function explorerSignalBadgeClass(signal: string): string {
  const u = signal.trim().toUpperCase();
  if (u === "BUY") {
    return "border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-950/55 dark:text-emerald-100";
  }
  if (u === "SELL") {
    return "border-rose-500/50 bg-rose-500/15 text-rose-950 dark:border-rose-400/55 dark:bg-rose-950/55 dark:text-rose-100";
  }
  return "border-border/70 bg-muted/80 text-foreground dark:bg-muted/60 dark:text-zinc-100";
}
