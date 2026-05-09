"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { isAdminWallet } from "@/constants/adminWallet";

const linkClass = (active: boolean) =>
  `inline-flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted sm:min-h-0 sm:px-2.5 sm:py-1.5 touch-manipulation ${
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

export function StakingNav() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const admin = isAdminWallet(connected, publicKey?.toBase58());

  return (
    <nav
      className="flex w-max min-w-0 max-w-full flex-wrap items-center gap-1 sm:w-auto"
      aria-label="Main"
    >
      <Link href="/" className={linkClass(pathname === "/")}>
        Locks
      </Link>
      {admin ? (
        <Link href="/dashboard" className={linkClass(pathname === "/dashboard")}>
          Stakers
        </Link>
      ) : null}
    </nav>
  );
}
