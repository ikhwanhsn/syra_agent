import type { ComponentType } from "react";
import type { MetricShareLayoutProps, MetricShareVariantIndex } from "@/components/info/metricsShare/types";
import {
  HEADLINE_ITEM_LAYOUTS,
  MONETIZATION_ITEM_LAYOUTS,
} from "@/components/info/metricsShare/layouts/itemLayouts";
import { SECTION_LAYOUTS } from "@/components/info/metricsShare/layouts/sectionLayouts";

const ITEM_LAYOUTS: Record<string, readonly ComponentType<MetricShareLayoutProps>[]> = {
  headline: HEADLINE_ITEM_LAYOUTS,
  monetization: MONETIZATION_ITEM_LAYOUTS,
};

export function renderMetricShareLayout(
  sectionId: string,
  variantIndex: MetricShareVariantIndex,
  props: MetricShareLayoutProps,
  mode: "per-item" | "section",
) {
  const idx = variantIndex;
  if (mode === "per-item") {
    const layouts = ITEM_LAYOUTS[sectionId];
    const Layout = layouts?.[idx];
    if (!Layout) return null;
    return <Layout {...props} />;
  }
  const layouts = SECTION_LAYOUTS[sectionId];
  const Layout = layouts?.[idx];
  if (!Layout) return null;
  return <Layout {...props} />;
}
