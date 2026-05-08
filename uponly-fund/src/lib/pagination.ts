export type PaginationItem = number | "gap";

export function buildPaginationItems(current: number, total: number): PaginationItem[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const anchor = new Set<number>([1, total, current]);
  for (let d = -2; d <= 2; d += 1) {
    const p = current + d;
    if (p >= 1 && p <= total) anchor.add(p);
  }

  const sorted = [...anchor].sort((a, b) => a - b);
  const out: PaginationItem[] = [];
  let prev = 0;

  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }

  return out;
}
