import { cn } from "@/lib/utils";

export const spcxCardClass = cn(
  "relative overflow-hidden rounded-2xl border border-border/45",
  "bg-gradient-to-br from-card/98 via-card/92 to-muted/[0.05]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.45),0_20px_50px_-28px_rgba(0,0,0,0.45)]",
  "backdrop-blur-sm",
);

export const spcxCardQuietClass = cn(
  "relative overflow-hidden rounded-2xl border border-border/40",
  "bg-gradient-to-br from-card/80 via-card/65 to-transparent",
);

export const spcxKickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75";

export const spcxSectionTitleClass =
  "font-display text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl";

export const spcxSectionDescClass = "text-sm leading-relaxed text-muted-foreground";

export const spcxMetricValueClass =
  "font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]";

export const spcxTabListClass =
  "grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-border/50 bg-muted/30 p-1.5 sm:grid-cols-4";

export const spcxTabTriggerClass = cn(
  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5",
  "text-center transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm",
  "data-[state=active]:ring-1 data-[state=active]:ring-border/60",
);
