import { ArrowUpDown } from "lucide-react";

import {
  DiscoveryFilterPills,
  type DiscoveryPillOption,
} from "@/components/discovery/DiscoveryFilterPills";
import {
  KOL_CAMPAIGN_SORT_OPTIONS,
  type KolCampaignSort,
} from "@/lib/kolCampaignSort";

const SORT_PILLS: DiscoveryPillOption<KolCampaignSort>[] = KOL_CAMPAIGN_SORT_OPTIONS.map(
  (option) => ({
    value: option.value,
    label: option.label,
  }),
);

interface CampaignBrowseControlsProps {
  sort: KolCampaignSort;
  onSortChange: (sort: KolCampaignSort) => void;
}

export function CampaignBrowseControls({
  sort,
  onSortChange,
}: CampaignBrowseControlsProps) {
  return (
    <div className="panel-glass rounded-2xl border border-border/60 px-4 py-3 sm:px-5 sm:py-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowUpDown className="w-4 h-4 text-primary shrink-0" aria-hidden />
        <span className="font-medium text-foreground">Sort campaigns</span>
      </div>
      <DiscoveryFilterPills
        options={SORT_PILLS}
        value={sort}
        onChange={onSortChange}
        label="Sort by"
        scrollable
        className="space-y-0 [&>p]:sr-only"
      />
    </div>
  );
}
