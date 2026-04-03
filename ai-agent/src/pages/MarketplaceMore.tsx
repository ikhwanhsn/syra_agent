import { Puzzle } from "lucide-react";
import { DASHBOARD_CONTENT_SHELL } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { MarketplaceSectionSoon } from "./MarketplaceSectionSoon";

export default function MarketplaceMore() {
  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, "py-4 sm:py-5 lg:py-6")}>
      <h2 className="text-base font-semibold text-foreground mb-0.5">More</h2>
      <MarketplaceSectionSoon
        description="Templates, workflows, and other assets."
        icon={Puzzle}
      />
    </div>
  );
}
