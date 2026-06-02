"use client";

import { Link, useLocation } from "react-router-dom";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { cn } from "@/lib/utils";

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 touch-manipulation sm:min-h-0",
    active
      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  );
}

export function StakingNav() {
  const { pathname } = useLocation();
  const { connected, address } = useWalletContext();
  const admin = isAdminWallet(connected, address ?? undefined);

  return (
    <nav
      className="flex w-full min-w-0 flex-wrap items-center gap-1 sm:gap-2"
      aria-label="Staking"
    >
      <Link to="/staking" className={navLinkClass(pathname === "/staking")}>
        Locks
      </Link>
      {admin ? (
        <Link
          to="/staking/admin"
          className={navLinkClass(pathname.startsWith("/staking/admin"))}
        >
          Admin
        </Link>
      ) : null}
    </nav>
  );
}
