import { Wrench } from "lucide-react";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { MarketplaceSectionSoon } from "./MarketplaceSectionSoon";

export default function MarketplaceTools() {
  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM)}>
      <h2 className="text-base font-semibold text-foreground mb-0.5">Tools & integrations</h2>
      <MarketplaceSectionSoon
        description="Connect external data and tools to your agent."
        icon={Wrench}
      />
    </div>
  );
}
