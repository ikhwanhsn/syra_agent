import type { HackathonLead, HackathonLeadStatus } from "@/lib/hackathonScoutApi";

export type HackathonSortKey =
  | "title"
  | "organizer"
  | "status"
  | "relevance"
  | "deadline"
  | "discovered";

export type HackathonSortOrder = "asc" | "desc";

export function defaultHackathonSortOrder(key: HackathonSortKey): HackathonSortOrder {
  return key === "discovered" || key === "relevance" ? "desc" : "asc";
}

export function filterHackathonLeads(
  items: readonly HackathonLead[],
  query: string,
  minRelevance: number,
): HackathonLead[] {
  const q = query.trim().toLowerCase();
  return items.filter((lead) => {
    if (lead.relevanceScore < minRelevance) return false;
    if (!q) return true;
    const haystack = [
      lead.title,
      lead.organizer,
      lead.description,
      lead.relevanceReason,
      lead.authorHandle,
      lead.prizePool,
      lead.deadline,
      ...(lead.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function compareStrings(a: string, b: string, order: HackathonSortOrder): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return order === "asc" ? cmp : -cmp;
}

function compareNumbers(a: number, b: number, order: HackathonSortOrder): number {
  return order === "asc" ? a - b : b - a;
}

function parseDeadlineSort(deadline: string | null | undefined): number {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const t = Date.parse(deadline);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

const STATUS_ORDER: Record<HackathonLeadStatus, number> = {
  new: 0,
  interested: 1,
  participate: 2,
  applied: 3,
  skip: 4,
  archived: 5,
};

export function sortHackathonLeads(
  items: readonly HackathonLead[],
  key: HackathonSortKey,
  order: HackathonSortOrder,
): HackathonLead[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (key) {
      case "title":
        return compareStrings(a.title || "", b.title || "", order);
      case "organizer":
        return compareStrings(a.organizer || "", b.organizer || "", order);
      case "status":
        return compareNumbers(STATUS_ORDER[a.status] ?? 99, STATUS_ORDER[b.status] ?? 99, order);
      case "relevance":
        return compareNumbers(a.relevanceScore ?? 0, b.relevanceScore ?? 0, order);
      case "deadline":
        return compareNumbers(parseDeadlineSort(a.deadline), parseDeadlineSort(b.deadline), order);
      case "discovered": {
        const ta = Date.parse(a.discoveredAt || "") || 0;
        const tb = Date.parse(b.discoveredAt || "") || 0;
        return compareNumbers(ta, tb, order);
      }
      default:
        return 0;
    }
  });
  return sorted;
}

export function collectHackathonTags(items: readonly HackathonLead[]): string[] {
  const set = new Set<string>();
  for (const lead of items) {
    for (const t of lead.tags ?? []) {
      const trimmed = t.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
