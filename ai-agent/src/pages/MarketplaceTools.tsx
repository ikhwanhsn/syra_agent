import { Wrench } from "lucide-react";
import { MarketplaceSectionSoon } from "./MarketplaceSectionSoon";

export default function MarketplaceTools() {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
      <h2 className="text-base font-semibold text-foreground mb-0.5">Tools & integrations</h2>
      <MarketplaceSectionSoon
        description="Connect external data and tools to your agent."
        icon={Wrench}
      />
    </div>
  );
}
