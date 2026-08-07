import { GROWTH_CONTENT_SHELL } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export const growthRootClass = "relative min-h-full w-full overflow-x-hidden bg-background";

/** Shared with GrowthFooter, keep home content and footer on the same edge. */
export const growthShellClass = GROWTH_CONTENT_SHELL;

export const growthKickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70";

export const growthSectionTitleClass =
  "font-display text-[1.75rem] font-semibold tracking-[-0.045em] text-foreground sm:text-[2.15rem] lg:text-[2.5rem]";

export const growthProseClass =
  "text-[15px] leading-[1.7] text-muted-foreground sm:text-[16px] sm:leading-[1.75]";

export const growthPanelClass = cn(
  "relative overflow-hidden rounded-2xl border border-border/40",
  "bg-gradient-to-br from-card/[0.98] via-card/90 to-muted/[0.03]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.3),0_32px_72px_-44px_rgba(0,0,0,0.55)]",
  "backdrop-blur-xl",
);

export const growthPanelQuietClass = cn(
  "relative overflow-hidden rounded-2xl border border-border/30",
  "bg-gradient-to-b from-card/65 via-card/35 to-transparent",
);

export const growthStatValueClass =
  "font-display font-semibold tracking-[-0.045em] text-foreground tabular-nums";

export const growthDividerClass =
  "h-px w-full bg-gradient-to-r from-transparent via-border/55 to-transparent";

export const growthCtaPrimaryClass = cn(
  "inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl px-6",
  "bg-primary text-sm font-semibold text-primary-foreground",
  "shadow-[0_1px_0_0_hsl(var(--primary-foreground)/0.12)_inset,0_14px_36px_-16px_hsl(var(--foreground)/0.45)]",
  "transition-[transform,box-shadow,filter] duration-200",
  "hover:brightness-[1.06] hover:shadow-[0_1px_0_0_hsl(var(--primary-foreground)/0.14)_inset,0_18px_40px_-14px_hsl(var(--foreground)/0.5)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "active:scale-[0.98]",
);

export const growthCtaSecondaryClass = cn(
  "inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl border border-border/55 px-6",
  "bg-background/40 text-sm font-semibold text-foreground backdrop-blur-md",
  "transition-[border-color,background-color,transform] duration-200",
  "hover:border-border/80 hover:bg-card/70",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "active:scale-[0.98]",
);
