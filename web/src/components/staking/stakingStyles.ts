import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

/** Standard outer padding for staking surface cards (panels, hero, metrics). */
export const stakingCardPadding = "p-5 sm:p-6";

/** Standard padding for nested/inset blocks inside a panel. */
export const stakingInsetPadding = "p-4 sm:p-5";

/** Card border shell only — pair with {@link stakingCardBody} for content. */
export const stakingPanelShell = cn(overviewCardShell, "min-w-0");

/** Premium action panel — glass surface for lock form and portfolio. */
export const stakingActionPanel = cn(
  "glass-card relative min-w-0 overflow-hidden rounded-2xl border border-foreground/[0.08]",
);

/** Inner content layer — sits above glow/background with consistent padding. */
export const stakingCardBody = cn("relative z-[1] min-w-0", stakingCardPadding);

/** Hero card shell (no padding on shell). */
export const stakingHeroCard = cn(stakingPanelShell, "relative overflow-hidden");

export const stakingKicker =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80";

export const stakingSectionLabel = stakingKicker;

export const stakingSectionTitle =
  "mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl";

/** Inset bordered block (connect prompt, checklist, alerts). */
export const stakingInsetCard = cn(
  "rounded-xl border border-border/50 bg-muted/15",
  stakingInsetPadding,
);

export const stakingSegmentedRoot = cn(
  "grid w-full grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/25 p-1",
  "sm:inline-grid sm:w-auto sm:min-w-[14rem]",
);

export function stakingSegmentedTrigger(active: boolean) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
  );
}

export const stakingAmountShell = cn(
  "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/55 bg-background/60",
  "shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)]",
  "transition-[border-color,box-shadow] duration-200",
  "focus-within:border-ring/45 focus-within:ring-2 focus-within:ring-ring/15",
  "sm:flex-row sm:items-stretch",
);

/** Position row inside portfolio panel (inset, not a second full panel). */
export const stakingPositionCard = cn(
  stakingInsetCard,
  "bg-background/40 transition-colors duration-200 hover:border-border/70",
);

export const stakingEmptyState = cn(
  "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50",
  "bg-muted/10 text-center sm:min-h-[260px]",
  stakingInsetPadding,
);

export const stakingPrimaryCta = cn(
  "inline-flex w-full min-h-11 items-center justify-center rounded-xl",
  "bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground",
  "shadow-sm transition-[transform,opacity,box-shadow] duration-200",
  "hover:opacity-95 active:scale-[0.99]",
  "disabled:pointer-events-none disabled:opacity-40",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);
