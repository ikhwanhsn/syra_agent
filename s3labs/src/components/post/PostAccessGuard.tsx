import { useWallet } from "@solana/wallet-adapter-react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { NavbarWalletButton } from "@/components/NavbarWalletButton";
import { isPostStudioAllowedWallet } from "@/lib/postAccess";

export function PostAccessGuard() {
  const { publicKey, connecting } = useWallet();
  const address = publicKey?.toBase58();

  if (connecting) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(222,47%,4%)]">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[hsl(222,47%,4%)] px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Team access only</p>
        <p className="max-w-sm text-sm text-white/60">Connect your wallet to open Signal Studio.</p>
        <NavbarWalletButton />
      </div>
    );
  }

  if (!isPostStudioAllowedWallet(address)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
