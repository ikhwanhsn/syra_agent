import { forwardRef } from "react";
import type { MetricShareSectionPayload, MetricShareItem, MetricShareVariantIndex } from "@/components/info/metricsShare/types";
import { renderMetricShareLayout } from "@/components/info/metricsShare/renderMetricShareLayout";

export type MetricsShareCardProps = {
  variantIndex: MetricShareVariantIndex;
  mode: "per-item" | "section";
  section: MetricShareSectionPayload;
  item: MetricShareItem;
};

export const MetricsShareCard = forwardRef<HTMLDivElement, MetricsShareCardProps>(
  function MetricsShareCard({ variantIndex, mode, section, item }, ref) {
    return (
      <div ref={ref} className="metrics-share-export-root">
        {renderMetricShareLayout(section.sectionId, variantIndex, { section, item }, mode)}
      </div>
    );
  },
);
