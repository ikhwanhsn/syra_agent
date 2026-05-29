import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

/** Shared shells for LP experiment page surfaces */
export const lpTableShell = cn(
  overviewCardShell,
  "overflow-hidden rounded-3xl ring-1 ring-violet-500/10",
);

export const lpTabsList = cn(
  "grid h-auto w-full rounded-2xl border border-border/50 bg-background/40 p-1 backdrop-blur-md",
);

export const lpTabsTrigger = cn(
  "h-9 gap-1.5 rounded-xl text-xs text-muted-foreground transition-colors",
  "data-[state=active]:bg-background/90 data-[state=active]:text-foreground data-[state=active]:shadow-sm",
  "sm:h-10 sm:text-sm",
);

export const lpVioletBadge = cn(
  "rounded-lg border-violet-500/30 bg-violet-500/10 text-[10px] font-semibold uppercase tracking-wide",
  "text-violet-800 dark:text-violet-200",
);

export const lpTableHead = cn(
  overviewKickerClass,
  "h-10 text-[10px] font-semibold normal-case tracking-[0.14em]",
);

export const lpMetaPanel = cn(
  "rounded-2xl border border-border/50 bg-background/30 p-4 backdrop-blur-sm",
);

export type LpNoticeVariant = "info" | "caution" | "success" | "danger";

const noticeShell: Record<LpNoticeVariant, string> = {
  info: "border-violet-500/25 bg-violet-500/[0.07] dark:bg-violet-500/[0.12]",
  caution: "border-border/55 bg-muted/35 dark:bg-muted/25",
  success: "border-emerald-500/25 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.1]",
  danger: "border-destructive/25 bg-destructive/[0.06] dark:bg-destructive/[0.1]",
};

const noticeIcon: Record<LpNoticeVariant, string> = {
  info: "text-violet-600 dark:text-violet-400",
  caution: "text-muted-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-destructive",
};

const noticeText: Record<LpNoticeVariant, string> = {
  info: "text-foreground/90",
  caution: "text-muted-foreground",
  success: "text-foreground/90",
  danger: "text-destructive/90 dark:text-red-200",
};

export function lpNoticeClass(variant: LpNoticeVariant) {
  return {
    shell: cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5", noticeShell[variant]),
    icon: cn("mt-0.5 h-4 w-4 shrink-0", noticeIcon[variant]),
    text: cn("text-sm leading-relaxed", noticeText[variant]),
  };
}
