import { SyraApiCard } from "@/components/playground/SyraApiCard";
import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import type { PartnerBrandGroup } from "@/lib/marketplaceCatalog";
import { marketplaceApiDetailPath } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

interface MarketplacePartnerGroupsProps {
  groups: PartnerBrandGroup[];
  flowPath: (url: string) => string;
}

export function MarketplacePartnerGroups({
  groups,
  flowPath,
}: MarketplacePartnerGroupsProps) {
  let staggerIndex = 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      {groups.map((group) => (
        <section key={group.brand.slug} aria-labelledby={`partner-brand-${group.brand.slug}`}>
          <div className="mb-3 flex items-baseline gap-2 border-b border-border/40 pb-2">
            <h3
              id={`partner-brand-${group.brand.slug}`}
              className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg"
            >
              {group.brand.name}
            </h3>
            <span className="text-xs tabular-nums text-muted-foreground">
              {group.flows.length} {group.flows.length === 1 ? "API" : "APIs"}
            </span>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            {group.flows.map((flow) => {
              const path = flowPath(flow.url);
              const index = staggerIndex++;
              return (
                <SyraApiCard
                  key={flow.id}
                  flow={flow}
                  path={path}
                  detailHref={marketplaceApiDetailPath(flow.id)}
                  groupName={group.brand.name}
                  staggerIndex={index}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
