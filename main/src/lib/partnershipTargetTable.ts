import type { PartnershipTarget } from "@/lib/internalTeamAgentsApi";
import type { PartnershipLead } from "@/lib/partnershipScoutApi";
import { partnershipLeadAsTarget } from "@/lib/partnershipScoutApi";

export type PartnershipTargetSortKey = "name" | "projectType" | "priority" | "utility";

export type PartnershipSortOrder = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function defaultPartnershipSortOrder(key: PartnershipTargetSortKey): PartnershipSortOrder {
  return key === "priority" ? "desc" : "asc";
}

export function filterPartnershipLeads(
  items: readonly PartnershipLead[],
  query: string,
  priorityFilter: string,
  typeFilter: string,
): PartnershipLead[] {
  const targets = items.filter((l) => l.kind === "target");
  const filtered = filterPartnershipTargets(
    targets.map(partnershipLeadAsTarget),
    query,
    priorityFilter,
    typeFilter,
  );
  const names = new Set(filtered.map((t) => t.name));
  return targets.filter((l) => names.has(l.name));
}

export function sortPartnershipLeadTargets(
  items: readonly PartnershipLead[],
  key: PartnershipTargetSortKey,
  order: PartnershipSortOrder,
): PartnershipLead[] {
  const targets = items.filter((l) => l.kind === "target");
  const sorted = sortPartnershipTargets(
    targets.map(partnershipLeadAsTarget),
    key,
    order,
  );
  const orderNames = sorted.map((t) => t.name);
  const byName = new Map(targets.map((l) => [l.name, l]));
  return orderNames.map((n) => byName.get(n)).filter((l): l is PartnershipLead => Boolean(l));
}

export function filterPartnershipTargets(
  items: readonly PartnershipTarget[],
  query: string,
  priorityFilter: string,
  typeFilter: string,
): PartnershipTarget[] {
  const q = query.trim().toLowerCase();
  return items.filter((row) => {
    if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
    if (typeFilter !== "all" && row.projectType !== typeFilter) return false;
    if (!q) return true;
    const haystack = [
      row.name,
      row.projectType,
      row.utility,
      row.whyFitForSyra,
      row.collaborationIdea,
      ...(row.onchainSignals ?? []),
      row.link ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function compareStrings(a: string, b: string, order: PartnershipSortOrder): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return order === "asc" ? cmp : -cmp;
}

function compareNumbers(a: number, b: number, order: PartnershipSortOrder): number {
  return order === "asc" ? a - b : b - a;
}

export function sortPartnershipTargets(
  items: readonly PartnershipTarget[],
  key: PartnershipTargetSortKey,
  order: PartnershipSortOrder,
): PartnershipTarget[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (key) {
      case "name":
        return compareStrings(a.name || "", b.name || "", order);
      case "projectType":
        return compareStrings(a.projectType || "", b.projectType || "", order);
      case "priority":
        return compareNumbers(
          PRIORITY_ORDER[a.priority] ?? 99,
          PRIORITY_ORDER[b.priority] ?? 99,
          order,
        );
      case "utility":
        return compareStrings(a.utility || "", b.utility || "", order);
      default:
        return 0;
    }
  });
  return sorted;
}

export function collectPartnershipProjectTypes(items: readonly PartnershipTarget[]): string[] {
  const set = new Set<string>();
  for (const row of items) {
    const t = row.projectType?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterQuickIntegrations(items: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((text) => text.toLowerCase().includes(q));
}
