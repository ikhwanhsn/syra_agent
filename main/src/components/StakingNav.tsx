"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyraSolana } from "@/hooks/useSyraSolana";
import { isAdminWallet } from "@/constants/adminWallet";

const linkClass = (active: boolean) =>
  `inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 touch-manipulation sm:min-h-0 ${
    active
      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  }`;

export function StakingNav() {
  const pathname = usePathname();
  const { connected, publicKey } = useSyraSolana();
  const admin = isAdminWallet(connected, publicKey?.toBase58());

  return (
    <nav
      className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1 sm:gap-2"
      aria-label="Main"
    >
      <Link href="/staking" className={linkClass(pathname === "/staking")}>
        Locks
      </Link>
      {admin ? (
        <Link href="/staking/dashboard" className={linkClass(pathname === "/staking/dashboard")}>
          Stakers
        </Link>
      ) : null}
    </nav>
  );
}
