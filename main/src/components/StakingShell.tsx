"use client";

import type { ReactNode } from "react";
import { StakingBackground } from "@/components/StakingBackground";
import { StakingFooter } from "@/components/StakingFooter";

interface StakingShellProps {
  children: ReactNode;
}

export function StakingShell({ children }: StakingShellProps) {
  return (
    <div className="relative min-h-[100dvh] min-w-0 overflow-x-clip text-foreground">
      <StakingBackground />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8">
        {children}
        <StakingFooter />
      </div>
    </div>
  );
}
