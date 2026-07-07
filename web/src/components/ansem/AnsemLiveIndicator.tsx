import { cn } from "@/lib/utils";

export function AnsemLiveIndicator({
  fetchedAt,
  className,
}: {
  fetchedAt?: string | null;
  className?: string;
}) {
  const label = fetchedAt
    ? `Updated ${new Date(fetchedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    : "Syncing…";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md",
        className,
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">Live</span>
      <span className="text-muted-foreground/80">·</span>
      <span>{label}</span>
    </div>
  );
}
