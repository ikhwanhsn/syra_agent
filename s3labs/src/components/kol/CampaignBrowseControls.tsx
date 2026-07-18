import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  KOL_CAMPAIGN_SORT_OPTIONS,
  type KolCampaignSort,
} from "@/lib/kolCampaignSort";
import { cn } from "@/lib/utils";

interface CampaignBrowseControlsProps {
  sort: KolCampaignSort;
  onSortChange: (sort: KolCampaignSort) => void;
  className?: string;
}

export function CampaignBrowseControls({
  sort,
  onSortChange,
  className,
}: CampaignBrowseControlsProps) {
  const activeLabel =
    KOL_CAMPAIGN_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "group h-11 w-full justify-between gap-3 rounded-full border-border/50 bg-gradient-to-b from-background via-background to-muted/35 px-2.5 pr-3.5 shadow-sm backdrop-blur-sm",
            "hover:border-primary/35 hover:bg-background hover:shadow-md",
            "data-[state=open]:border-primary/40 data-[state=open]:shadow-md data-[state=open]:ring-2 data-[state=open]:ring-primary/15",
            "min-[400px]:w-auto min-[400px]:min-w-[11.5rem]",
            className,
          )}
          aria-label={`Sort campaigns: ${activeLabel}`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15 group-data-[state=open]:bg-primary/15">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sort
              </span>
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {activeLabel}
              </span>
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,15.5rem)] rounded-2xl border-border/60 bg-popover/95 p-1.5 shadow-elevated backdrop-blur-md"
      >
        <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Sort campaigns
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1 bg-border/60" />
        {KOL_CAMPAIGN_SORT_OPTIONS.map((option) => {
          const active = option.value === sort;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium",
                "focus:bg-primary/10 focus:text-foreground",
                active && "bg-primary/8 text-foreground",
              )}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{option.label}</span>
                {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
