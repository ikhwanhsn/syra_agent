"use client";

import type { ReactNode } from "react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { StakingFooter } from "@/components/StakingFooter";
import { StakingNav } from "@/components/StakingNav";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

interface StakingShellProps {
  children: ReactNode;
}

export function StakingShell({ children }: StakingShellProps) {
  return (
    <>
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] min-w-0 max-w-6xl",
        )}
      >
        <div className="mb-6 flex justify-center sm:mb-8">
          <StakingNav />
        </div>
        {children}
        <StakingFooter />
      </div>
    </>
  );
}
