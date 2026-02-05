/**
 * Flat search index for the docs navbar command palette.
 * Built from docs nav + API doc titles for better discoverability.
 */

import { navigation } from "./docsNav";
import { apiDocs } from "./apiDocs";
import type { NavItem } from "./docsNav";

export interface SearchEntry {
  title: string;
  href: string;
  category: string;
  /** Searchable text (title + category for better matching) */
  keywords: string;
}

function flattenNav(items: NavItem[], category: string): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const item of items) {
    if (item.href) {
      entries.push({
        title: item.title,
        href: item.href,
        category,
        keywords: `${item.title} ${category}`.toLowerCase(),
      });
    }
    if (item.items?.length) {
      entries.push(...flattenNav(item.items, item.title));
    }
  }
  return entries;
}

const navEntries: SearchEntry[] = [];
for (const section of navigation) {
  if (section.items) {
    navEntries.push(...flattenNav(section.items, section.title));
  }
}

// Add API doc titles so "News API", "Research API" etc. also match
const apiEntries: SearchEntry[] = Object.entries(apiDocs).map(([slug, doc]) => ({
  title: doc.title,
  href: `/docs/api/${slug}`,
  category: "API",
  keywords: `${doc.title} API ${slug}`.toLowerCase(),
}));

// Dedupe by href+title so we don't show same page twice when nav title matches API title
const seen = new Set<string>();
export const searchIndex: SearchEntry[] = [
  ...navEntries,
  ...apiEntries.filter((e) => {
    const key = `${e.href}::${e.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }),
];

/**
 * Filter entries by query (case-insensitive substring match on title and keywords).
 */
export function searchDocs(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return searchIndex;
  return searchIndex.filter((e) => e.title.toLowerCase().includes(q) || e.keywords.includes(q));
}
