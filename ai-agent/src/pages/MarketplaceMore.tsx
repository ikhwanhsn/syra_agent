import { Puzzle } from "lucide-react";
import { MarketplaceSectionSoon } from "./MarketplaceSectionSoon";

export default function MarketplaceMore() {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <h2 className="text-base font-semibold text-foreground mb-0.5">More</h2>
      <MarketplaceSectionSoon
        description="Templates, workflows, and other assets."
        icon={Puzzle}
      />
    </div>
  );
}
