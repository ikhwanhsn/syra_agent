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

export const playgroundApiCardClass = (active: boolean) =>
  cn(
    "relative flex flex-col rounded-xl border border-border/60 bg-card p-3.5",
    "transition-[box-shadow,border-color,background-color] duration-200 ease-out",
    "hover:border-border hover:shadow-soft",
    active && "border-primary/50 bg-primary/[0.03] shadow-glow-sm ring-1 ring-primary/20",
  );

export const playgroundChipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
    "transition-[transform,background-color,color] duration-200 ease-out",
    "active:scale-95",
    active
      ? "scale-100 bg-foreground text-background shadow-sm"
      : "bg-muted/50 text-muted-foreground hover:scale-[1.02] hover:bg-muted hover:text-foreground",
  );
