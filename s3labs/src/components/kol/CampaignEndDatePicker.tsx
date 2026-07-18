import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CampaignEndDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDurationDays: number;
  maxDurationDays: number;
  disabled?: boolean;
  /** Hide the duration caption under the trigger (parent can show its own). */
  hideSummary?: boolean;
  className?: string;
  triggerClassName?: string;
}

const rangeClassNames = {
  day_range_start:
    "day-range-start !rounded-l-md !rounded-r-none bg-primary/30 text-primary font-semibold hover:bg-primary/30 hover:text-primary focus:bg-primary/30 focus:text-primary",
  day_range_middle:
    "day-range-middle !rounded-none bg-primary/15 text-foreground aria-selected:bg-primary/15 aria-selected:text-foreground hover:bg-primary/20 hover:text-foreground focus:bg-primary/15 focus:text-foreground",
  day_range_end:
    "day-range-end !rounded-r-md !rounded-l-none bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
  cell: "[&:has(.day-range-middle)]:bg-primary/10 [&:has(.day-range-start)]:bg-primary/10 [&:has(.day-range-end)]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
} as const;

export function CampaignEndDatePicker({
  value,
  onChange,
  minDurationDays,
  maxDurationDays,
  disabled,
  hideSummary = false,
  className,
  triggerClassName,
}: CampaignEndDatePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const minEndDate = useMemo(() => addDays(today, minDurationDays), [today, minDurationDays]);
  const maxEndDate = useMemo(() => addDays(today, maxDurationDays), [today, maxDurationDays]);
  const endDate = startOfDay(value);
  const durationDays = differenceInCalendarDays(endDate, today);

  const selectedRange: DateRange = useMemo(
    () => ({ from: today, to: endDate }),
    [today, endDate],
  );

  const handleSelect = (range: DateRange | undefined) => {
    const picked = range?.to ?? range?.from;
    if (!picked) return;

    const day = startOfDay(picked);
    if (day < minEndDate || day > maxEndDate) return;
    onChange(day);
  };

  return (
    <div className={cn("space-y-2 w-full min-w-0", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 rounded-xl border-border/50 bg-background/50 font-normal h-11 px-4 shadow-sm",
              !value && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-left">
              {format(endDate, "EEE, MMM d, yyyy")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 panel-glass border-border/60" align="start">
          <div className="px-3 pt-3 pb-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/30 ring-1 ring-primary/25" />
              Today
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-gradient-to-r from-primary/20 via-primary/15 to-primary" />
              Campaign period
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary ring-1 ring-primary/40" />
              End date
            </span>
          </div>
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            disabled={(date) => {
              const day = startOfDay(date);
              return day < minEndDate || day > maxEndDate;
            }}
            defaultMonth={endDate}
            initialFocus
            classNames={rangeClassNames}
          />
          <div className="border-t border-border/60 px-3 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {minDurationDays}–{maxDurationDays} days ·{" "}
              <span className="text-primary/90 font-medium">
                {format(today, "MMM d")} → {format(endDate, "MMM d")}
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs rounded-lg"
              onClick={() => onChange(addDays(today, 7))}
            >
              7 days
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {!hideSummary ? (
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground/80 font-medium">
            {durationDays} day{durationDays === 1 ? "" : "s"}
          </span>
          {" · "}Campaign ends {format(endDate, "MMM d, yyyy")}
        </p>
      ) : null}
    </div>
  );
}

export function durationDaysFromEndDate(endDate: Date): number {
  return differenceInCalendarDays(startOfDay(endDate), startOfDay(new Date()));
}

export function defaultCampaignEndDate(days = 7): Date {
  return addDays(startOfDay(new Date()), days);
}
