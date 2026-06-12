import { cn } from "@/lib/utils";

export function walletPageSegmentedRoot(cols: 2 | 3 = 2) {
  return cn(
    "grid w-full gap-1 rounded-xl border border-border/50 bg-muted/25 p-1",
    cols === 3 ? "grid-cols-3 sm:inline-grid sm:w-auto sm:min-w-[20rem]" : "grid-cols-2 sm:inline-grid sm:w-auto sm:min-w-[16rem]",
  );
}

export function walletPageSegmentedTrigger(active: boolean) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
  );
}

export const walletPortfolioRow = cn(
  "relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-3",
  "transition-[background,border-color,box-shadow] duration-200",
  "hover:border-border/50 hover:bg-muted/20",
);
