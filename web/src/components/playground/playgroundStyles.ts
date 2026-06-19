import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

/** Stacking: drawer above global nav (200), below payment modals (500). */
export const PLAYGROUND_DRAWER_Z = "z-[250]";
export const PLAYGROUND_MODAL_Z = "z-[500]";

/** Shared playground page width + padding (Syra APIs + Custom API). */
export const PLAYGROUND_PAGE_CLASS =
  "relative z-[1] mx-auto w-full max-w-[1680px] px-4 py-5 pb-20 sm:px-6 sm:py-8 lg:px-8";

/** Sticky history sidebar max height (below nav + tab bar). */
export const PLAYGROUND_SIDEBAR_STICKY_CLASS =
  "lg:sticky lg:top-[calc(var(--syra-global-nav-height,3.5rem)+var(--playground-tab-bar-height,3.25rem)+1rem)] lg:max-h-[calc(100dvh-var(--syra-global-nav-height,3.5rem)-var(--playground-tab-bar-height,3.25rem)-2rem)] lg:self-start";

export const playgroundKickerClass = overviewKickerClass;

export const playgroundHeroCard = cn(
  overviewCardShell,
  "relative overflow-hidden px-5 py-6 sm:px-8 sm:py-7",
);

export const playgroundHeroGlow =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(520px_180px_at_12%_-15%,hsl(var(--primary)/0.09),transparent_55%),radial-gradient(420px_160px_at_100%_110%,hsl(var(--ring)/0.06),transparent_50%)]";

export const playgroundPanelClass = cn(
  overviewCardShell,
  "overflow-hidden",
);

export const playgroundSectionHeaderClass =
  "flex flex-wrap items-start justify-between gap-4 sm:gap-6";

export const playgroundSectionTitleClass =
  "font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl";

export const playgroundSectionSubtitleClass =
  "mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]";

export const playgroundStatTile = cn(
  "rounded-xl border border-border/45 bg-background/50 px-3.5 py-2.5 backdrop-blur-sm",
  "shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]",
);

export const playgroundStatLabel =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export const playgroundStatValue =
  "mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground";

export const playgroundStatPillClass = cn(
  "inline-flex items-center gap-1.5 rounded-full border border-border/45",
  "bg-background/70 px-3 py-1.5 text-xs font-medium tabular-nums text-foreground",
  "shadow-[inset_0_1px_0_0_hsl(var(--border)/0.4)] backdrop-blur-md",
);

export const playgroundToolbarClass = cn(
  playgroundPanelClass,
  "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
);

export const playgroundSearchClass = cn(
  "h-11 rounded-xl border-border/50 bg-background/80 pl-10 shadow-sm backdrop-blur-sm",
  "transition-[border-color,box-shadow] duration-200",
  "focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/15",
);

export const playgroundFilterRailClass = "playground-filter-rail flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible";

export const playgroundApiCardClass = (active: boolean) =>
  cn(
    "playground-api-card group relative flex min-h-[15.5rem] flex-col overflow-hidden rounded-2xl",
    "border border-border/50 bg-gradient-to-b from-card/95 via-card/90 to-muted/[0.03]",
    "shadow-[0_1px_0_0_hsl(var(--border)/0.45),0_16px_40px_-28px_rgba(0,0,0,0.55)]",
    "backdrop-blur-sm transition-[box-shadow,border-color,transform] duration-300 ease-out",
    "hover:-translate-y-1 hover:border-border/80 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.5),0_24px_48px_-24px_rgba(0,0,0,0.45)]",
    "focus-within:ring-2 focus-within:ring-primary/20",
    active &&
      "border-primary/40 bg-primary/[0.03] shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_20px_48px_-20px_hsl(var(--primary)/0.25)] -translate-y-1 ring-1 ring-primary/15",
  );

export const playgroundChipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium",
    "transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98]",
    active
      ? "border-foreground/10 bg-foreground text-background shadow-sm"
      : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border/60 hover:bg-muted/50 hover:text-foreground",
  );

export function playgroundSegmentedRoot(count: number) {
  return cn(
    "inline-flex w-full min-w-0 rounded-xl border border-border/50 bg-muted/25 p-1 shadow-sm",
    "backdrop-blur-md sm:w-auto",
    count === 3 ? "grid grid-cols-3" : count === 2 ? "grid grid-cols-2" : "flex",
  );
}

export function playgroundSegmentedTrigger(active: boolean) {
  return cn(
    "inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 sm:px-4",
    "text-sm font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
      : "text-muted-foreground hover:bg-background/55 hover:text-foreground",
  );
}

export const playgroundEmptyStateClass = cn(
  playgroundPanelClass,
  "flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20",
);

export const playgroundSkeletonCardClass = cn(
  "rounded-2xl border border-border/40 bg-muted/20",
  "animate-pulse",
);

export const playgroundWalletChipClass = cn(
  "inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.06]",
  "px-3.5 py-2 text-sm font-medium text-foreground backdrop-blur-sm",
  "shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12)]",
);
