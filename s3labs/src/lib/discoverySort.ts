export const JOB_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "salary_high", label: "Highest salary" },
  { value: "salary_low", label: "Lowest salary" },
] as const;

export type JobSortKey = (typeof JOB_SORT_OPTIONS)[number]["value"];

export const DEFAULT_JOB_SORT: JobSortKey = "newest";

export const EVENT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "upcoming", label: "Upcoming soon" },
  { value: "relevance", label: "Most relevant" },
  { value: "oldest", label: "Oldest" },
] as const;

export type EventSortKey = (typeof EVENT_SORT_OPTIONS)[number]["value"];

export const DEFAULT_EVENT_SORT: EventSortKey = "newest";

export const HACKATHON_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "deadline", label: "Deadline soon" },
  { value: "prize_high", label: "Highest prize" },
  { value: "relevance", label: "Most relevant" },
  { value: "oldest", label: "Oldest" },
] as const;

export type HackathonSortKey = (typeof HACKATHON_SORT_OPTIONS)[number]["value"];

export const DEFAULT_HACKATHON_SORT: HackathonSortKey = "newest";

function parseSort<T extends string>(
  value: string | null | undefined,
  options: readonly { value: T }[],
  fallback: T,
): T {
  if (value && options.some((option) => option.value === value)) {
    return value as T;
  }
  return fallback;
}

export function parseJobSort(value: string | null | undefined): JobSortKey {
  return parseSort(value, JOB_SORT_OPTIONS, DEFAULT_JOB_SORT);
}

export function parseEventSort(value: string | null | undefined): EventSortKey {
  return parseSort(value, EVENT_SORT_OPTIONS, DEFAULT_EVENT_SORT);
}

export function parseHackathonSort(
  value: string | null | undefined,
): HackathonSortKey {
  return parseSort(value, HACKATHON_SORT_OPTIONS, DEFAULT_HACKATHON_SORT);
}
