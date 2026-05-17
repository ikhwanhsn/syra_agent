"use client";

import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavbarLogo } from "@/components/NavbarLogo";
import { StakingNav } from "@/components/StakingNav";

const LANDING_URL = "https://www.syraa.fun";
const DOCS_URL = "https://docs.syraa.fun";

export function StakingPageHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <nav className="staking-navbar" aria-label="Staking">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2.5 sm:gap-3"
              >
                <NavbarLogo />
                <span className="hidden truncate text-lg font-bold tracking-tight neon-text sm:inline sm:text-xl">
                  SYRA
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <ThemeToggle />
                <WalletButton />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 border-t border-border/50 pt-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:border-0 lg:pt-0">
              <StakingNav />
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <ThemeToggle />
              <a
                href={LANDING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary hidden px-4 py-2 xl:inline-flex"
              >
                Website
              </a>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary hidden px-4 py-2 md:inline-flex"
              >
                Docs
              </a>
              <WalletButton />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
