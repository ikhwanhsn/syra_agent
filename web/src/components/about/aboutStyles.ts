import { cn } from "@/lib/utils";

export const aboutRootClass = "about-root relative min-h-full w-full";

export const aboutHeroClass = cn(
  "about-hero relative overflow-hidden rounded-[1.75rem] border border-border/40 sm:rounded-[2rem]",
  "bg-gradient-to-b from-card/98 via-card/94 to-muted/[0.04]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_32px_80px_-36px_rgba(0,0,0,0.65)]",
  "backdrop-blur-xl",
);

export const aboutCardClass = cn(
  "about-card relative overflow-hidden rounded-2xl border border-border/40",
  "bg-gradient-to-br from-card/[0.98] via-card/90 to-muted/[0.05]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_16px_48px_-28px_rgba(0,0,0,0.5)]",
  "backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 ease-out",
  "hover:border-border/60 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.5),0_24px_56px_-24px_rgba(0,0,0,0.48)]",
);

export const aboutCardQuietClass = cn(
  "about-card-quiet relative overflow-hidden rounded-2xl border border-border/30",
  "bg-gradient-to-br from-card/75 via-card/60 to-transparent",
  "transition-[border-color,background-color,transform,box-shadow] duration-300 ease-out",
  "hover:border-border/50 hover:bg-card/85 hover:shadow-[0_12px_40px_-28px_rgba(0,0,0,0.35)]",
);

export const aboutKickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground/65";

export const aboutSectionKickerClass = cn(
  aboutKickerClass,
  "inline-flex items-center gap-2.5 before:h-px before:w-6 before:bg-gradient-to-r before:from-foreground/25 before:to-transparent",
);

export const aboutSectionTitleClass =
  "font-display text-[1.35rem] font-semibold tracking-[-0.035em] text-foreground sm:text-2xl lg:text-[1.85rem]";

export const aboutDisplayTitleClass =
  "font-display text-[2.15rem] font-semibold leading-[1.06] tracking-[-0.05em] text-foreground sm:text-[2.75rem] lg:text-[3.35rem] xl:text-[3.5rem]";

export const aboutProseClass = "text-[15px] leading-[1.75] text-muted-foreground sm:text-[16px]";

export const aboutStatValueClass =
  "font-display font-semibold tracking-[-0.03em] text-foreground [font-variant-numeric:tabular-nums]";

export const aboutSectionDividerClass = "mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border/50 to-transparent";
