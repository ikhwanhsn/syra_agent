import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProviderFixed } from "@/components/chat/WalletModalProviderFixed";

import "@solana/wallet-adapter-react-ui/styles.css";

import { getPrimarySolanaRpcUrl } from "@/lib/solanaRpc";

const RPC_ENDPOINT = getPrimarySolanaRpcUrl();

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProviderFixed>{children}</WalletModalProviderFixed>
      </WalletProvider>
    </ConnectionProvider>
  );
}
