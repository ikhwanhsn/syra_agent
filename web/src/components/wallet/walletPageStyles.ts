import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { AGENT_WALLET_ACCENT } from "@/lib/agentWalletCatalog";

/** Shared page chrome */
export const walletPageStack = "w-full space-y-8 sm:space-y-10";

export const walletSectionStack = "space-y-4 sm:space-y-5";

export const walletKickerClass = overviewKickerClass;

export const walletHeroCard = cn(
  overviewCardShell,
  "relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8",
);

export const walletPanelCard = cn(
  overviewCardShell,
  "relative overflow-hidden",
);

export const walletSectionTitle = "text-base font-semibold tracking-tight text-foreground sm:text-lg";

export const walletSectionDesc = "mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground";

export function walletPageSegmentedRoot(cols: 2 | 3 = 2) {
  return cn(
    "inline-flex w-full min-w-0 rounded-xl border border-border/55 bg-muted/30 p-1 shadow-sm",
    cols === 3 ? "grid grid-cols-3" : "grid grid-cols-2",
    "sm:w-auto sm:min-w-[14rem]",
  );
}

export function walletPageSegmentedTrigger(active: boolean) {
  return cn(
    "inline-flex min-h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 sm:min-h-10 sm:px-4 sm:text-sm",
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
  );
}

export const walletStatTile = cn(
  "rounded-xl border border-border/50 bg-background/40 px-4 py-3 backdrop-blur-sm",
);

export const walletStatLabel =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export const walletStatValue =
  "mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl";

export const walletStatHint = "mt-0.5 text-xs text-muted-foreground";

export const walletInfoCallout = cn(
  "flex gap-3 rounded-xl border border-border/45 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground",
);

export const walletAgentCard = cn(
  overviewCardShell,
  "overflow-hidden ring-1 ring-inset transition-[box-shadow,border-color] duration-200 hover:shadow-md",
);

export const walletTableShell = cn(walletPanelCard, "overflow-hidden");

export const walletTableHeader = cn(
  "hidden border-b border-border/45 bg-muted/15 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
  "lg:grid lg:grid-cols-[minmax(0,1.4fr)_7rem_9rem_8rem_2.5rem] lg:items-center lg:gap-4",
);

export const walletPortfolioRow = cn(
  "relative grid grid-cols-1 gap-3 border-b border-border/35 px-4 py-4 last:border-b-0",
  "transition-colors duration-150 hover:bg-muted/15",
  "lg:grid-cols-[minmax(0,1.4fr)_7rem_9rem_8rem_2.5rem] lg:items-center lg:gap-4 lg:py-3.5",
);

export const walletPortfolioAssetCell = "flex min-w-0 items-center gap-3";

export const walletPortfolioMetricCell = "flex flex-col gap-0.5 lg:items-end";

export const walletPortfolioMetricLabel = "text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:sr-only";

export const walletPortfolioMetricValue = "font-mono text-sm font-semibold tabular-nums text-foreground";

export const walletPortfolioMetricSub = "font-mono text-xs tabular-nums text-muted-foreground";

export const walletPurposePill = (purpose: AgentWalletPurpose) =>
  cn(
    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
    AGENT_WALLET_ACCENT[purpose]?.pill ?? "bg-muted text-muted-foreground",
  );
