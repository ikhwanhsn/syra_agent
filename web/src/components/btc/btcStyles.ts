import { cn } from "@/lib/utils";

export const BTC_ORANGE = "#F7931A";
export const BTC_BLUE = "#2563eb";

export const btcPageShell = "relative flex min-h-0 flex-col";

export const btcCardClass = cn(
  "group relative overflow-hidden rounded-2xl border border-border/50",
  "bg-gradient-to-br from-card/95 via-card/90 to-muted/[0.04]",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_12px_40px_-24px_rgba(0,0,0,0.45)]",
  "backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300",
  "hover:border-border/70 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.5),0_20px_48px_-28px_rgba(0,0,0,0.5)]",
);

export const btcCardInset = cn(
  "rounded-xl border border-border/45 bg-background/35 backdrop-blur-sm",
);

export const btcKickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/75";

export const btcSectionLabelClass =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55";

export const btcPillTrackClass = cn(
  "inline-flex items-center gap-0.5 rounded-full border border-border/55 bg-muted/25 p-0.5 backdrop-blur-sm",
);

export const btcPillButtonClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200",
    active
      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
      : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
  );

export const btcHeroShell = cn(
  "relative overflow-hidden rounded-3xl border border-border/50",
  "bg-gradient-to-br from-card via-card/95 to-muted/[0.08]",
  "shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)]",
);

export const btcIconShell = (accent?: "btc" | "blue" | "neutral") =>
  cn(
    "flex shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm",
    accent === "btc" && "border-[#F7931A]/25 bg-[#F7931A]/10 text-[#F7931A]",
    accent === "blue" && "border-[#2563eb]/25 bg-[#2563eb]/10 text-[#2563eb]",
    (!accent || accent === "neutral") && "border-border/50 bg-background/40 text-muted-foreground",
  );
