import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { AGENT_WALLET_ACCENT } from "@/lib/agentWalletCatalog";

/** Shared page chrome */
export const walletPageStack = "w-full space-y-6 sm:space-y-8";

export const walletSectionStack = "space-y-4 sm:space-y-5";

export const walletKickerClass = overviewKickerClass;

export const walletHeroCard = cn(
  overviewCardShell,
  "relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6",
);

export const walletPanelCard = cn(
  overviewCardShell,
  "relative overflow-hidden",
);

export const walletSectionTitle = "text-sm font-semibold tracking-tight text-foreground sm:text-base";

export const walletSectionDesc = "mt-0.5 text-xs text-muted-foreground sm:text-sm";

export function walletPageSegmentedRoot(cols: 2 | 3 = 2) {
  return cn(
    "inline-flex w-full min-w-0 rounded-full border border-border/50 bg-muted/25 p-0.5",
    cols === 3 ? "grid grid-cols-3" : "grid-cols-2 grid",
    "sm:w-auto sm:min-w-[12rem]",
  );
}

export function walletPageSegmentedTrigger(active: boolean) {
  return cn(
    "inline-flex min-h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200 sm:min-h-9 sm:px-4 sm:text-sm",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  );
}

export const walletStatTile = cn(
  "rounded-2xl border border-border/40 bg-background/35 px-4 py-3 backdrop-blur-sm",
);

export const walletStatLabel =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const walletStatValue =
  "mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl";

export const walletStatHint = "mt-0.5 text-xs text-muted-foreground";

export const walletHeroValue =
  "font-mono text-[2.5rem] font-semibold tabular-nums leading-none tracking-tight text-foreground sm:text-5xl";

export const walletAgentCard = cn(
  overviewCardShell,
  "overflow-hidden transition-[box-shadow,border-color] duration-200 hover:shadow-md",
);

export const walletTableShell = cn(walletPanelCard, "overflow-hidden");

export const walletPortfolioRow = cn(
  "relative flex items-center gap-3 border-b border-border/30 px-4 py-3.5 last:border-b-0",
  "transition-colors duration-150 hover:bg-muted/10",
);

export const walletPortfolioAssetCell = "flex min-w-0 flex-1 items-center gap-3";

export const walletPortfolioValueCell =
  "shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-foreground";

export const walletPortfolioBalanceSub =
  "font-mono text-[11px] tabular-nums text-muted-foreground";

export const walletPurposePill = (purpose: AgentWalletPurpose) =>
  cn(
    "rounded-full px-2 py-0.5 text-[10px] font-medium",
    AGENT_WALLET_ACCENT[purpose]?.pill ?? "bg-muted text-muted-foreground",
  );
