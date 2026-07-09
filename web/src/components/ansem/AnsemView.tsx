import { useMemo } from "react";

import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { PLAYGROUND_CONTENT_SHELL } from "@/components/playground/playgroundStyles";
import { AnsemHero } from "@/components/ansem/AnsemHero";
import { AnsemStatGrid } from "@/components/ansem/AnsemStatGrid";
import { AnsemChart } from "@/components/ansem/AnsemChart";
import { AnsemTokenIntel } from "@/components/ansem/AnsemTokenIntel";
import { AnsemHolderPulse } from "@/components/ansem/AnsemHolderPulse";
import { AnsemSocialRadar } from "@/components/ansem/AnsemSocialRadar";
import { AnsemCommunityHub } from "@/components/ansem/AnsemCommunityHub";
import { AnsemVibesSection } from "@/components/ansem/AnsemVibesSection";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { pickAnsemHolderCount, useAnsemCommunity, useAnsemHolderCount } from "@/lib/ansemCommunityApi";
import { useAnsemMarket } from "@/lib/ansemMarketApi";
import { PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export function AnsemView() {
  const marketQ = useAnsemMarket();
  const communityQ = useAnsemCommunity();
  const holderCountQ = useAnsemHolderCount();

  const marketLoading = useMinimumSkeleton(marketQ.isPending && !marketQ.data);
  const communityLoading = useMinimumSkeleton(communityQ.isPending && !communityQ.data);
  const holdersLoading = useMinimumSkeleton(
    holderCountQ.isPending && holderCountQ.data == null && !pickAnsemHolderCount(communityQ.data?.data ?? null),
  );

  const community = communityQ.data?.data ?? null;

  const holderCount = useMemo(
    () => pickAnsemHolderCount(community, holderCountQ.data),
    [community, holderCountQ.data],
  );

  return (
    <div className="relative flex min-h-full min-w-0 w-full flex-col overflow-x-hidden">
      <OverviewPageBackdrop />

      <div
        className={cn(
          PLAYGROUND_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "min-w-0 space-y-6 pb-14 sm:space-y-8",
        )}
      >
        <AnsemHero market={marketQ.data} isLoading={marketLoading} />

        <AnsemStatGrid
          market={marketQ.data}
          holderCount={holderCount}
          holdersLoading={holdersLoading}
          isLoading={marketLoading}
        />

        <AnsemChart market={marketQ.data} isLoading={marketLoading} />

        <AnsemTokenIntel community={community} market={marketQ.data} isLoading={communityLoading} />

        <AnsemHolderPulse
          community={community}
          holderCount={holderCount}
          holdersLoading={holdersLoading}
          isLoading={communityLoading}
        />

        <AnsemSocialRadar community={community} isLoading={communityLoading} />

        <AnsemCommunityHub social={community?.social} isLoading={communityLoading} />

        <AnsemVibesSection />
      </div>
    </div>
  );
}
