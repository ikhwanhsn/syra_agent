import type { LucideIcon } from "lucide-react";
import { Info, Settings } from "lucide-react";
import { SITE_NAV_GROUPS, SITE_NAV_MORE } from "@/lib/siteNav";

export type SiteSearchPage = {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  external?: boolean;
  group?: string;
  keywords: string[];
};

const EXTRA_PAGES: Omit<SiteSearchPage, "keywords"> & { keywords: string[] }[] = [
  {
    href: "/settings",
    label: "Settings",
    description: "Agent preferences and wallet",
    icon: Settings,
    group: "Agent",
    keywords: ["settings", "config", "preferences", "wallet"],
  },
  {
    href: "/about",
    label: "About Syra",
    description: "Product overview and mission",
    icon: Info,
    group: "Agent",
    keywords: ["about", "info", "syra"],
  },
];

function pathTokens(href: string): string[] {
  const path = href.replace(/^https?:\/\/[^/]+/i, "");
  return path
    .split(/[/\-_]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

function buildSearchablePages(isAdmin: boolean): SiteSearchPage[] {
  const seen = new Set<string>();
  const pages: SiteSearchPage[] = [];

  const add = (page: SiteSearchPage) => {
    const key = page.external ? page.href : page.href.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    pages.push(page);
  };

  for (const group of SITE_NAV_GROUPS) {
    if (group.href) {
      add({
        href: group.href,
        label: group.label,
        icon: group.icon,
        group: group.label,
        keywords: [group.id, group.label, ...pathTokens(group.href)],
      });
    }
    for (const item of group.items ?? []) {
      if (item.adminOnly && !isAdmin) continue;
      add({
        href: item.href,
        label: item.label,
        description: item.description,
        icon: item.icon,
        external: item.external,
        group: group.label,
        keywords: [
          group.id,
          group.label,
          item.label,
          ...(item.description ? [item.description] : []),
          ...pathTokens(item.href),
        ],
      });
    }
  }

  for (const item of SITE_NAV_MORE) {
    add({
      href: item.href,
      label: item.label,
      description: item.description,
      icon: item.icon,
      external: item.external,
      group: "More",
      keywords: [item.label, ...pathTokens(item.href)],
    });
  }

  for (const extra of EXTRA_PAGES) {
    add(extra);
  }

  return pages;
}

function scorePage(page: SiteSearchPage, q: string): number {
  const label = page.label.toLowerCase();
  const desc = (page.description ?? "").toLowerCase();
  const group = (page.group ?? "").toLowerCase();
  const href = page.href.toLowerCase();
  const keywords = page.keywords.map((k) => k.toLowerCase());

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (group.includes(q)) return 50;
  if (desc.includes(q)) return 45;
  if (href.includes(q)) return 40;
  if (keywords.some((k) => k === q)) return 55;
  if (keywords.some((k) => k.startsWith(q))) return 35;
  if (keywords.some((k) => k.includes(q))) return 25;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allHay = [label, desc, group, href, ...keywords].join(" ");
    if (tokens.every((t) => allHay.includes(t))) return 30;
  }

  return 0;
}

export function searchSitePages(
  query: string,
  isAdmin: boolean,
  limit = 6,
): SiteSearchPage[] {
  const pages = buildSearchablePages(isAdmin);
  const q = query.trim().toLowerCase();

  if (!q) return [];

  return pages
    .map((page) => ({ page, score: scorePage(page, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ page }) => page);
}
