import { useCallback, useEffect, useState } from "react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { MultiWalletFundBuyPanel } from "@/components/multiwallet/MultiWalletFundBuyPanel";
import { MultiWalletGeneratePanel } from "@/components/multiwallet/MultiWalletGeneratePanel";
import { MultiWalletPageSkeleton } from "@/components/multiwallet/MultiWalletSkeleton";
import { MultiWalletTable } from "@/components/multiwallet/MultiWalletTable";
import { MultiWalletTierBadge } from "@/components/multiwallet/MultiWalletTierBadge";
import { Button } from "@/components/ui/button";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  fetchMultiWalletTier,
  fetchMultiWallets,
  type MultiWalletListResponse,
  type MultiWalletTierSummary,
} from "@/lib/multiWalletApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

export default function MultiWalletPage() {
  const { connected, address } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const { requestSyraAuthForWallet } = useSyraAuth();

  const [tier, setTier] = useState<MultiWalletTierSummary | null>(null);
  const [walletData, setWalletData] = useState<MultiWalletListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [authPending, setAuthPending] = useState(false);

  const ensureSession = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    setAuthPending(true);
    try {
      const result = await requestSyraAuthForWallet(address);
      return Boolean(result?.accessToken);
    } catch (err) {
      notify.error("Sign in required", err instanceof Error ? err.message : "Approve wallet sign-in");
      return false;
    } finally {
      setAuthPending(false);
    }
  }, [address, requestSyraAuthForWallet]);

  const refresh = useCallback(async () => {
    if (!connected || !address) {
      setTier(null);
      setWalletData(null);
      return;
    }
    setLoading(true);
    try {
      const authed = await ensureSession();
      if (!authed) return;
      const [tierRes, walletsRes] = await Promise.all([
        fetchMultiWalletTier(),
        fetchMultiWallets(true),
      ]);
      setTier(tierRes);
      setWalletData(walletsRes);
    } catch (err) {
      notify.error("Load failed", err instanceof Error ? err.message : "Could not load multiwallet data");
    } finally {
      setLoading(false);
    }
  }, [address, connected, ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wallets = walletData?.wallets ?? [];

  return (
    <PillarLayout
      embedded
      title="Multiwallet"
      tagline="Airdrop wallet farm"
      description="Generate many Solana wallets in one click, fund them from your connected wallet, and auto-buy $ANSEM on each. Internal team only."
      actions={connected && tier ? <MultiWalletTierBadge tier={tier} /> : undefined}
    >
      {!connected ? (
        <div className={cn(overviewCardShell, "p-8 text-center")}>
          <p className="text-sm text-muted-foreground">
            Connect the authorized team wallet to generate and manage multiwallets.
          </p>
          <Button className="mt-4" onClick={openConnectModal}>
            Connect wallet
          </Button>
        </div>
      ) : authPending || (loading && !walletData) ? (
        <MultiWalletPageSkeleton />
      ) : (
        <div className="space-y-6">
          <MultiWalletGeneratePanel tier={tier} loading={loading} onGenerated={refresh} />
          <MultiWalletFundBuyPanel wallets={wallets} tier={tier} onComplete={refresh} />
          <MultiWalletTable wallets={wallets} tier={tier} loading={loading} onChanged={refresh} />
        </div>
      )}
    </PillarLayout>
  );
}
