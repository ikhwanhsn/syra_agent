import type { ReactNode } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ADMIN_DASHBOARD_WALLET, isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM } from "@/lib/layoutConstants";

type AdminDashboardGateProps = {
  children: ReactNode;
  /** Short label for connect / denied copy (e.g. "Experiment desks"). */
  featureLabel?: string;
};

export function AdminDashboardGate({
  children,
  featureLabel = "This page",
}: AdminDashboardGateProps) {
  const { address, connected, connectSolana } = useWalletContext();
  const allowed = isAdminWallet(connected, address);

  if (!connected) {
    return (
      <div className={DASHBOARD_CONTENT_SHELL}>
        <div className={PAGE_PADDING_TOP_MEDIUM}>
          <Alert className="max-w-xl border-border/80 bg-muted/20">
            <Lock className="h-4 w-4" />
            <AlertTitle>Connect your wallet</AlertTitle>
            <AlertDescription className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground">
                {featureLabel} is for the Syra internal team only. Connect the authorized admin
                wallet to continue.
              </p>
              <Button type="button" size="sm" onClick={() => void connectSolana()}>
                Connect wallet
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className={DASHBOARD_CONTENT_SHELL}>
        <div className={PAGE_PADDING_TOP_MEDIUM}>
          <Alert variant="destructive" className="max-w-xl">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription className="space-y-2 pt-1 text-sm">
              <p>Your wallet is not authorized to view {featureLabel.toLowerCase()}.</p>
              <p className="break-all font-mono text-xs opacity-90">{ADMIN_DASHBOARD_WALLET}</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/overview">Go to overview</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return children;
}
