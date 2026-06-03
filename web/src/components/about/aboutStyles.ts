import { cn } from "@/lib/utils";

export const aboutRootClass = "about-root relative min-h-full w-full";

export const aboutCardClass = cn(
  "about-card relative overflow-hidden rounded-2xl border border-border/45",
  "bg-gradient-to-br from-card/98 via-card/92 to-muted/[0.06]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.45),0_20px_50px_-28px_rgba(0,0,0,0.55)]",
  "backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300",
  "hover:border-border/65 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.55),0_28px_56px_-24px_rgba(0,0,0,0.5)]",
);

export const aboutKickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70";

export const aboutSectionTitleClass =
  "font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl lg:text-[1.65rem]";
