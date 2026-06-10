import { cn } from "@/lib/utils";

/** Stacking: drawer above global nav (200), below payment modals (500). */
export const PLAYGROUND_DRAWER_Z = "z-[250]";
export const PLAYGROUND_MODAL_Z = "z-[500]";

/** Shared playground page width + padding (Syra APIs + Custom API). */
export const PLAYGROUND_PAGE_CLASS =
  "mx-auto w-full max-w-[1800px] px-4 py-4 pb-16 sm:px-6 sm:py-6";

/** Sticky history sidebar max height (below nav + tab bar). */
export const PLAYGROUND_SIDEBAR_STICKY_CLASS =
  "lg:sticky lg:top-[calc(var(--syra-global-nav-height,3.5rem)+var(--playground-tab-bar-height,3.25rem)+1rem)] lg:max-h-[calc(100dvh-var(--syra-global-nav-height,3.5rem)-var(--playground-tab-bar-height,3.25rem)-2rem)] lg:self-start";

export const playgroundSectionHeaderClass =
  "flex flex-wrap items-start justify-between gap-4";

export const playgroundSectionTitleClass =
  "text-lg font-semibold tracking-tight text-foreground sm:text-xl";

export const playgroundSectionSubtitleClass =
  "mt-1 text-sm text-muted-foreground";

export const playgroundStatPillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground shadow-sm backdrop-blur-sm";

export const playgroundSearchClass =
  "h-11 rounded-xl border-border/50 bg-background/80 pl-10 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] focus-visible:border-primary/40 focus-visible:ring-primary/20";

export const playgroundApiCardClass = (active: boolean) =>
  cn(
    "playground-api-card group relative flex flex-col rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm",
    "transition-[box-shadow,border-color,background-color,transform] duration-200 ease-out",
    "hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-soft",
    active &&
      "border-primary/45 bg-primary/[0.04] shadow-glow-sm ring-1 ring-primary/20 -translate-y-0.5",
  );

export const playgroundChipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium",
    "transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-out",
    "active:scale-95",
    active
      ? "scale-100 border-foreground/10 bg-foreground text-background shadow-sm"
      : "border-transparent bg-muted/40 text-muted-foreground hover:border-border/50 hover:bg-muted/70 hover:text-foreground",
  );
