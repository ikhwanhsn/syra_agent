"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { isAdminWallet } from "@/constants/adminWallet";

const linkClass = (active: boolean) =>
  `rounded-md px-2.5 py-1.5 text-sm font-medium transition hover:bg-muted ${
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

export function StakingNav() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const admin = isAdminWallet(connected, publicKey?.toBase58());

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
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
