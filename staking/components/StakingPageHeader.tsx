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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-4">
            <NavbarLogo />
            <span className="text-lg font-semibold text-foreground sm:text-xl">
              Syra Staking
            </span>
          </Link>
          <StakingNav />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
