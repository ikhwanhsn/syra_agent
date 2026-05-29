import type { TokensDossierPayload } from "@/lib/tokensDossierApi";

export type AssetClass = "crypto" | "equity";

export type AssetSortKey = "name" | "symbol" | "price" | "change24h" | "marketCap" | "volume24h" | "assetClass";
export type AssetSortOrder = "asc" | "desc";

export interface AssetTableRow {
  key: string;
  ref: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  price?: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  imageUrl?: string;
  payload: TokensDossierPayload;
}

export function assetDetailPath(row: Pick<AssetTableRow, "symbol" | "payload">): string {
  return `/assets/${encodeURIComponent(row.symbol.toLowerCase())}?assetId=${encodeURIComponent(row.payload.assetId)}`;
}

export function defaultAssetSortOrder(key: AssetSortKey): AssetSortOrder {
  if (key === "name" || key === "symbol" || key === "assetClass") return "asc";
  return "desc";
}

export function sortAssetRows(
  rows: readonly AssetTableRow[],
  key: AssetSortKey,
  order: AssetSortOrder,
): AssetTableRow[] {
  const dir = order === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "symbol":
        cmp = a.symbol.localeCompare(b.symbol);
        break;
      case "assetClass":
        cmp = a.assetClass.localeCompare(b.assetClass);
        break;
      case "price":
        cmp = (a.price ?? -1) - (b.price ?? -1);
        break;
      case "change24h":
        cmp = (a.change24h ?? -Infinity) - (b.change24h ?? -Infinity);
        break;
      case "marketCap":
        cmp = (a.marketCap ?? 0) - (b.marketCap ?? 0);
        break;
      case "volume24h":
        cmp = (a.volume24h ?? 0) - (b.volume24h ?? 0);
        break;
    }
    return cmp * dir;
  });
}

export function filterAssetRows(
  rows: readonly AssetTableRow[],
  opts: { assetClass: "all" | AssetClass; query: string },
): AssetTableRow[] {
  const q = opts.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (opts.assetClass !== "all" && row.assetClass !== opts.assetClass) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.symbol.toLowerCase().includes(q) ||
      row.ref.toLowerCase().includes(q) ||
      row.payload.assetId.toLowerCase().includes(q)
    );
  });
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function priceLabel(value?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}
