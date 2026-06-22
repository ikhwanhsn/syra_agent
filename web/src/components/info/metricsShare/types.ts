export type MetricShareItem = {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  numeric?: number;
};

export type MetricShareChartPoint = {
  date: string;
  value: number;
};

export type MetricShareChartSeries = {
  label: string;
  color: string;
  accent: string;
  data: MetricShareChartPoint[];
};

export type MetricShareVariantIndex = 0 | 1 | 2;

export type MetricShareVariantMeta = {
  index: MetricShareVariantIndex;
  id: string;
  label: string;
  description: string;
};

export type MetricShareSectionPayload = {
  sectionId: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
  badge?: string;
  items: MetricShareItem[];
  charts?: MetricShareChartSeries[];
  heroValue?: string;
  heroLabel?: string;
  heroHint?: string;
};

export type MetricShareCardSpec = {
  id: string;
  label: string;
  item: MetricShareItem;
};

export type MetricShareSectionBundle = {
  sectionId: string;
  sectionTitle: string;
  mode: "per-item" | "section";
  updatedAt: string;
  badge?: string;
  cards: MetricShareCardSpec[];
  section?: MetricShareSectionPayload;
};

export const METRIC_SHARE_WIDTH = 1200;
export const METRIC_SHARE_HEIGHT = 675;

export const PER_ITEM_SHARE_SECTIONS = new Set(["headline", "monetization", "x402-headline"]);

export type MetricShareLayoutProps = {
  section: MetricShareSectionPayload;
  item: MetricShareItem;
};
