import type { EventCategory } from "@/lib/eventsApi";
import type { JobCategory } from "@/lib/jobsApi";

export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface CalendarDateParts {
  month: string;
  day: string;
  weekday: string;
}

export function parseCalendarDate(
  iso: string | null | undefined,
  dateText?: string,
): CalendarDateParts | null {
  if (dateText?.trim()) {
    const parsed = new Date(dateText);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        month: parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
        day: String(parsed.getDate()),
        weekday: parsed.toLocaleDateString(undefined, { weekday: "short" }),
      };
    }
  }

  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
  };
}

export function formatPrizeAmount(
  prizePool: string | null | undefined,
  prizeAmountUsd: number | null | undefined,
): string {
  if (prizePool?.trim()) return prizePool.trim();
  if (prizeAmountUsd != null && prizeAmountUsd > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(prizeAmountUsd);
  }
  return "Prize TBD";
}

export function openStateLabel(openState: string | null | undefined): string | null {
  if (!openState) return null;
  if (openState === "open") return "Open now";
  if (openState === "closed") return "Closed";
  return openState.charAt(0).toUpperCase() + openState.slice(1);
}

export const JOB_CATEGORY_STYLES: Record<
  JobCategory,
  { accent: string; badge: string; label: string }
> = {
  web3: {
    accent: "bg-violet-500",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    label: "Web3",
  },
  crypto: {
    accent: "bg-amber-500",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    label: "Crypto",
  },
  tech: {
    accent: "bg-sky-500",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    label: "Tech",
  },
};

export const EVENT_CATEGORY_STYLES: Record<
  EventCategory,
  { accent: string; badge: string; label: string }
> = {
  tech: {
    accent: "from-sky-500/20 to-cyan-500/10",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    label: "Tech",
  },
  crypto: {
    accent: "from-amber-500/20 to-orange-500/10",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    label: "Crypto",
  },
  web3: {
    accent: "from-violet-500/20 to-purple-500/10",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    label: "Web3",
  },
};

export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
