import { cn } from "@/lib/utils";

/** Shared glass card shell for overview surfaces. */
export const overviewCardShell = cn(
  "relative overflow-hidden rounded-2xl border border-border/50",
  "bg-gradient-to-br from-card/95 via-card/88 to-muted/[0.04]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.5),0_24px_48px_-32px_rgba(0,0,0,0.65)]",
  "backdrop-blur-sm",
);

export const overviewCardGlow = "pointer-events-none absolute inset-0 opacity-[0.5]";

export type OverviewAccent = "neutral" | "marketplace" | "alpha" | "experiment" | "internal";

const accentGlow: Record<OverviewAccent, string> = {
  neutral:
    "radial-gradient(520px 180px at 12% -15%, hsl(var(--primary) / 0.07), transparent 55%), radial-gradient(420px 160px at 100% 110%, hsl(var(--muted-foreground) / 0.06), transparent 50%)",
  marketplace:
    "radial-gradient(520px 180px at 12% -15%, hsl(var(--primary) / 0.09), transparent 55%), radial-gradient(380px 140px at 95% 100%, hsl(0 0% 62% / 0.08), transparent 50%)",
  alpha:
    "radial-gradient(520px 200px at 8% -20%, hsl(0 0% 72% / 0.1), transparent 55%), radial-gradient(400px 160px at 100% 120%, hsl(0 0% 48% / 0.08), transparent 50%)",
  experiment:
    "radial-gradient(520px 200px at 15% -20%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(440px 180px at 90% 110%, hsl(0 0% 42% / 0.1), transparent 50%)",
  internal:
    "radial-gradient(480px 180px at 20% -10%, hsl(0 0% 55% / 0.1), transparent 55%), radial-gradient(360px 140px at 100% 100%, hsl(var(--primary) / 0.06), transparent 50%)",
};

export function overviewAccentBackground(accent: OverviewAccent): string {
  return accentGlow[accent];
}

export const overviewPageBackdrop = cn(
  "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
  "[&>*]:absolute",
);

export const overviewKickerClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75";

export const overviewMetricValueClass =
  "font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]";

/** Inner chart surface inside overview cards. */
export const overviewChartPanelShell = cn(
  "relative overflow-hidden rounded-2xl border border-border/55",
  "bg-gradient-to-br from-card/90 via-card/75 to-muted/[0.06]",
  "shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]",
  "backdrop-blur-sm",
);

export const overviewChartTopShine =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent";
