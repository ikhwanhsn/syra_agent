export type PageToken = number | "ellipsis";

/** Compact page list with ellipses (1 … 4 5 6 … 20). */
export function buildPageTokens(current: number, totalPages: number): PageToken[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const tokens: PageToken[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(totalPages - 1, current + 1);

  if (windowStart > 2) tokens.push("ellipsis");
  for (let p = windowStart; p <= windowEnd; p += 1) tokens.push(p);
  if (windowEnd < totalPages - 1) tokens.push("ellipsis");
  tokens.push(totalPages);
  return tokens;
}

export function paginateSlice<T>(items: readonly T[], page: number, pageSize: number): {
  slice: T[];
  totalItems: number;
  totalPages: number;
  safePage: number;
  rangeStart: number;
  rangeEnd: number;
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;
  const slice = items.slice(offset, offset + pageSize);
  const rangeStart = totalItems === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + pageSize, totalItems);
  return { slice, totalItems, totalPages, safePage, rangeStart, rangeEnd };
}
