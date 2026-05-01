import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

/** X (Twitter) mark — single-color, scales with `currentColor`. */
function IconBrandX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Telegram mark — circle + plane; uses `currentColor` for flexibility in sidebar themes. */
function IconBrandTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

type DockLinkVariant = "x" | "telegram" | "trade";

const dockRing =
  "shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)_inset,0_8px_28px_-18px_hsl(0_0%_0%/0.55)] dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_12px_40px_-22px_hsl(0_0%_0%/0.75)]";

function variantIcon(variant: DockLinkVariant) {
  switch (variant) {
    case "x":
      return <IconBrandX className="h-[17px] w-[17px]" />;
    case "telegram":
      return <IconBrandTelegram className="h-[18px] w-[18px]" />;
    case "trade":
      return <ExternalLink className="h-[17px] w-[17px] stroke-[2.25]" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return null;
  }
}

function variantIconWrapClass(variant: DockLinkVariant): string {
  switch (variant) {
    case "x":
      return "bg-[hsl(0_0%_98%/0.06)] text-foreground ring-1 ring-white/[0.08] group-hover:bg-[hsl(0_0%_100%/0.1)] group-hover:ring-white/[0.14]";
    case "telegram":
      return "bg-[#229ED9]/12 text-[#229ED9] ring-1 ring-[#229ED9]/22 group-hover:bg-[#229ED9]/18 group-hover:ring-[#229ED9]/35";
    case "trade":
      return "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/22 dark:text-emerald-400 group-hover:bg-emerald-500/14 group-hover:ring-emerald-500/32";
    default:
      return "";
  }
}

export type SidebarOutboundDockProps = {
  dictionary: DashboardDictionary["sidebarFooter"];
  xUrl: string;
  telegramUrl: string;
  riseTradeUrl: string | null;
  compact: boolean;
};

export function SidebarOutboundDock({ dictionary, xUrl, telegramUrl, riseTradeUrl, compact }: SidebarOutboundDockProps) {
  type Row = {
    key: string;
    href: string;
    variant: DockLinkVariant;
    aria: string;
    label: string;
    hint: string;
  };

  const rows: Row[] = [
    { key: "x", href: xUrl, variant: "x", aria: dictionary.xAria, label: dictionary.xLabel, hint: dictionary.xHint },
    {
      key: "tg",
      href: telegramUrl,
      variant: "telegram",
      aria: dictionary.telegramAria,
      label: dictionary.telegramLabel,
      hint: dictionary.telegramHint,
    },
  ];
  if (riseTradeUrl) {
    rows.push({
      key: "rise",
      href: riseTradeUrl,
      variant: "trade",
      aria: dictionary.riseTradeAria,
      label: dictionary.riseTradeLabel,
      hint: dictionary.riseTradeHint,
    });
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col gap-1 rounded-2xl border border-sidebar-border/70 bg-gradient-to-b from-background/[0.55] to-background/[0.35] p-1.5 backdrop-blur-xl",
          dockRing,
        )}
      >
        {rows.map((row) => (
          <Tooltip key={row.key} delayDuration={280}>
            <TooltipTrigger asChild>
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={row.aria}
                className={cn(
                  "group relative flex h-11 w-full items-center justify-center rounded-xl outline-none transition-[transform,background-color,box-shadow] duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  "hover:bg-sidebar-accent/25 active:scale-[0.98]",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-[transform,box-shadow] duration-200",
                    "group-hover:scale-[1.04] motion-reduce:group-hover:scale-100",
                    variantIconWrapClass(row.variant),
                  )}
                >
                  {variantIcon(row.variant)}
                </span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="border-border/55 px-3 py-2 text-xs font-medium shadow-xl">
              <p>{row.aria}</p>
              <p className="mt-0.5 text-[0.65rem] font-normal text-muted-foreground">{row.hint}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-sidebar-border/75 bg-gradient-to-b from-background/[0.5] via-background/[0.38] to-background/[0.28] p-1 shadow-sm backdrop-blur-xl",
        dockRing,
      )}
    >
      <div className="flex flex-col gap-0.5 p-0.5">
        {rows.map((row) => (
          <a
            key={row.key}
            href={row.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={row.aria}
            className={cn(
              "group relative flex min-h-[3.25rem] items-center gap-3 rounded-xl px-2.5 py-2 outline-none transition-[background-color,transform,box-shadow] duration-200",
              "border border-transparent hover:border-sidebar-border/90 hover:bg-sidebar-accent/20 hover:shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              "active:scale-[0.995]",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-[transform,box-shadow] duration-200",
                "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
                variantIconWrapClass(row.variant),
              )}
            >
              {variantIcon(row.variant)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-sidebar-foreground">{row.label}</span>
              </span>
              <span className="mt-0.5 block truncate text-[0.65rem] leading-snug text-muted-foreground/90">{row.hint}</span>
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-muted-foreground/35 opacity-0 transition-[opacity,transform,color] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-muted-foreground/65 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
              aria-hidden
            />
          </a>
        ))}
      </div>
    </div>
  );
}
