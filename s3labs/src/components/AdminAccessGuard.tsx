import { useWallet } from "@solana/wallet-adapter-react";
import { Outlet } from "react-router-dom";
import { Loader2, Lock, ShieldAlert } from "lucide-react";

import { NavbarWalletButton } from "@/components/NavbarWalletButton";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { isAdminWallet } from "@/lib/adminWallet";

function AdminGateShell({ children }: { children: React.ReactNode }) {
  return (
    <SitePageShell>
      <div className="container relative z-[1] pt-28 pb-20 max-w-xl">{children}</div>
    </SitePageShell>
  );
}

export function AdminAccessGuard() {
  const { publicKey, connecting } = useWallet();
  const address = publicKey?.toBase58();

  if (connecting) {
    return (
      <AdminGateShell>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Checking wallet…
        </div>
      </AdminGateShell>
    );
  }

  if (!address) {
    return (
      <AdminGateShell>
        <div className="panel-glass rounded-2xl border border-border/60 p-8 text-center space-y-4">
          <Lock className="w-8 h-8 text-primary mx-auto" />
          <h1 className="text-lg font-semibold">Admin access required</h1>
          <p className="text-sm text-muted-foreground">
            Connect the authorized admin wallet to view this page.
          </p>
          <div className="flex justify-center">
            <NavbarWalletButton />
          </div>
        </div>
      </AdminGateShell>
    );
  }

  if (!isAdminWallet(address)) {
    return (
      <AdminGateShell>
        <div className="panel-glass rounded-2xl border border-destructive/30 p-8 text-center space-y-4">
          <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your wallet is not authorized for admin tools.
          </p>
        </div>
      </AdminGateShell>
    );
  }

  return <Outlet />;
}
