"use client";

import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { useTheme } from "@/app/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavbarLogo } from "@/components/NavbarLogo";
import { StakingNav } from "@/components/StakingNav";

export function StakingPageHeader() {
  const { resolved: theme } = useTheme();
  return (
    <header
      className="border-b border-border/60 bg-card/40 backdrop-blur-sm"
      data-theme={theme}
    >
      <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-4">
        <div className="flex min-w-0 w-full items-center justify-between gap-2 lg:w-auto lg:flex-1 lg:justify-start">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <NavbarLogo />
            <span className="truncate text-base font-semibold text-foreground sm:text-lg md:text-xl">
              Syra Staking
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>

        <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain border-t border-border/50 pt-3 [-webkit-overflow-scrolling:touch] lg:flex-1 lg:border-0 lg:pt-0 lg:px-2">
          <StakingNav />
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
